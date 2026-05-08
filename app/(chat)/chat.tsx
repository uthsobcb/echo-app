import { EchoAvatar, ExpressionName } from '@/component/EchoAvatar';
import { TypingIndicator } from '@/component/TypingIndicator';
import { Toast } from '@/component/Toast';
import { useChat } from '@/context/ChatContext';
import { useTheme } from '@/context/ThemeContext';
import { useTTSPrefs } from '@/hooks/useTTSPrefs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalMessage } from '../../types/data';

export default function ChatDetailScreen() {
    const { id }  = useLocalSearchParams<{ id: string }>();
    const { colors, isDark } = useTheme();
    const insets  = useSafeAreaInsets();
    const router  = useRouter();

    const {
        conversations, selectConversation, clearCurrentConversation,
        sendMessage, isSending, deleteConversation, retryMessage, lastBotText,
    } = useChat();

    const [inputText, setInputText]         = useState('');
    const [showScrollDown, setShowScrollDown] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const { enabled: ttsEnabled, rate: ttsRate } = useTTSPrefs();
    const [echoMood, setEchoMood]       = useState<ExpressionName>('calm');
    const [echoSpeaking, setEchoSpeaking] = useState(false);

    // Echo mood from last bot message
    useEffect(() => {
        const t = lastBotText.toLowerCase();
        if (!t) { setEchoMood('happy'); return; }
        if (/\b(sad|stress|anxious|tired|alone|lost|hurt|cry)\b/.test(t))          setEchoMood('sad');
        else if (/\b(achieved|milestone|proud|did it|congrats|great job)\b/.test(t)) setEchoMood('excited');
        else if (/\b(why|wonder|mean|purpose|reflect|meaning)\b/.test(t))            setEchoMood('curious');
        else setEchoMood('calm');
    }, [lastBotText]);

    // TTS on new bot message
    const prevBotText = useRef('');
    useEffect(() => {
        if (!ttsEnabled || !lastBotText || lastBotText === prevBotText.current) return;
        prevBotText.current = lastBotText;
        Speech.stop();
        setEchoSpeaking(true);
        Speech.speak(lastBotText, {
            rate: ttsRate,
            onDone:  () => setEchoSpeaking(false),
            onError: () => setEchoSpeaking(false),
        });
    }, [lastBotText, ttsEnabled, ttsRate]);

    useEffect(() => () => { Speech.stop(); }, []);

    const replayTTS = () => {
        if (!ttsEnabled || !lastBotText) return;
        Speech.stop();
        setEchoSpeaking(true);
        Speech.speak(lastBotText, {
            rate: ttsRate,
            onDone:  () => setEchoSpeaking(false),
            onError: () => setEchoSpeaking(false),
        });
    };

    const conversation = conversations.find(c => c.id === id);

    useEffect(() => {
        if (id) selectConversation(id);
        return () => clearCurrentConversation();
    }, [id]);

    useEffect(() => {
        if (conversation?.messages?.length) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
        }
    }, [conversation?.messages.length]);

    const handleSend = useCallback(async () => {
        const text = inputText.trim();
        if (!text || !id) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setInputText('');
        await sendMessage(text, id);
    }, [inputText, id, sendMessage]);

    const handleRetry = useCallback(async (msgId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await retryMessage(msgId);
    }, [retryMessage]);

    const handleDelete = useCallback(() => {
        if (!id || !conversation) return;
        Toast.show(`"${conversation.title}" deleted`, 'info');
        deleteConversation(id);
        router.back();
    }, [id, conversation, deleteConversation, router]);

    const formatTime = (ts: number) =>
        new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const formatDateSep = (ts: number) => {
        const d = new Date(ts), now = new Date();
        if (d.toDateString() === now.toDateString()) return 'Today';
        const yest = new Date(now); yest.setDate(yest.getDate() - 1);
        if (d.toDateString() === yest.toDateString()) return 'Yesterday';
        return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    };

    if (!conversation) {
        return (
            <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={[styles.notFoundHeader, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Chat</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.centred}>
                    <Ionicons name="chatbubble-outline" size={48} color={colors.textSecondary} />
                    <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>Conversation not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const messages = conversation.messages;

    const isFirstInGroup = (i: number) => i === 0 || messages[i].sender !== messages[i - 1].sender;
    const isLastInGroup  = (i: number) => i === messages.length - 1 || messages[i].sender !== messages[i + 1].sender;
    const showDate       = (i: number) => {
        if (i === 0) return true;
        return new Date(messages[i].timestamp).toDateString() !==
               new Date(messages[i - 1].timestamp).toDateString();
    };

    const renderMessage = ({ item, index }: { item: LocalMessage; index: number }) => {
        const isUser    = item.sender === 'user';
        const isError   = item.status === 'error';
        const isSendMe  = item.status === 'sending';
        const first     = isFirstInGroup(index);
        const last      = isLastInGroup(index);

        const userRadius = {
            borderTopRightRadius:    first ? 20 : 6,
            borderBottomRightRadius: last  ?  6 : 6,
            borderTopLeftRadius:     20,
            borderBottomLeftRadius:  20,
        };
        const botRadius = {
            borderTopLeftRadius:     first ? 20 : 6,
            borderBottomLeftRadius:  last  ?  6 : 6,
            borderTopRightRadius:    20,
            borderBottomRightRadius: 20,
        };

        return (
            <>
                {showDate(index) && (
                    <View style={styles.dateSepWrap}>
                        <View style={[styles.dateSepPill, { backgroundColor: colors.surfaceSecondary }]}>
                            <Text style={[styles.dateSepText, { color: colors.textSecondary }]}>
                                {formatDateSep(item.timestamp)}
                            </Text>
                        </View>
                    </View>
                )}

                <Animated.View
                    entering={index === messages.length - 1 ? FadeInDown.duration(220) : undefined}
                    style={[
                        styles.msgRow,
                        isUser ? styles.msgRowUser : styles.msgRowBot,
                        { marginBottom: last ? 10 : 2 },
                    ]}
                >
                    {/* Bot avatar placeholder — keeps alignment when no avatar shown */}
                    {!isUser && (
                        <View style={styles.botAvatarCol}>
                            {last && (
                                <View style={styles.botAvatarBubble}>
                                    <EchoAvatar expression="calm" size={28} animated={false} />
                                </View>
                            )}
                        </View>
                    )}

                    {/* Bubble */}
                    <View style={{ maxWidth: '78%' }}>
                        {isUser ? (
                            <LinearGradient
                                colors={isError ? ['#FEE2E2', '#FEE2E2'] : ['#4F6BFF', '#7B3FE4']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.bubble, userRadius, isError && styles.bubbleError]}
                            >
                                <Text style={[styles.bubbleText, { color: isError ? '#991B1B' : '#fff' }]}>
                                    {item.text}
                                </Text>
                                {last && (
                                    <View style={styles.metaRow}>
                                        <Text style={[styles.metaTime, { color: isError ? '#DC2626' : 'rgba(255,255,255,0.6)' }]}>
                                            {formatTime(item.timestamp)}
                                        </Text>
                                        {isSendMe && <Ionicons name="time-outline"    size={11} color="rgba(255,255,255,0.6)" />}
                                        {item.status === 'sent' && <Ionicons name="checkmark-done" size={13} color="rgba(255,255,255,0.6)" />}
                                        {isError   && <Ionicons name="alert-circle"   size={13} color="#DC2626" />}
                                    </View>
                                )}
                                {isError && (
                                    <TouchableOpacity onPress={() => handleRetry(item.id)} style={styles.retryBtn}>
                                        <Ionicons name="refresh" size={12} color="#DC2626" />
                                        <Text style={styles.retryText}>Tap to retry</Text>
                                    </TouchableOpacity>
                                )}
                            </LinearGradient>
                        ) : (
                            <View style={[styles.bubble, botRadius, { backgroundColor: colors.surfaceSecondary }]}>
                                <Text style={[styles.bubbleText, { color: colors.text }]}>{item.text}</Text>
                                {last && (
                                    <Text style={[styles.metaTime, { color: colors.textSecondary, marginTop: 4 }]}>
                                        {formatTime(item.timestamp)}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                </Animated.View>
            </>
        );
    };

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* ── Header ── */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={22} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity onPress={replayTTS} style={styles.headerEchoWrap} activeOpacity={0.8}>
                    <EchoAvatar
                        expression={isSending ? 'thinking' : echoMood}
                        size={46}
                        animated={false}
                        speaking={echoSpeaking}
                    />
                    {isSending && (
                        <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                    )}
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                        {conversation.title}
                    </Text>
                    <Text style={[styles.headerSub, { color: isSending ? colors.primary : colors.textSecondary }]}>
                        {isSending ? 'Echo is thinking…' : `Echo · ${ttsEnabled ? '🔊 Voice on' : 'tap to replay'}`}
                    </Text>
                </View>

                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={19} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* ── Messages + Input ── */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
                keyboardVerticalOffset={insets.top + 60}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={m => m.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.msgList}
                    showsVerticalScrollIndicator={false}
                    onScroll={({ nativeEvent: { contentOffset, contentSize, layoutMeasurement } }) => {
                        setShowScrollDown(contentSize.height - contentOffset.y - layoutMeasurement.height > 200);
                    }}
                    scrollEventThrottle={100}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    ListEmptyComponent={
                        <View style={styles.emptyChat}>
                            <EchoAvatar expression="happy" size={80} animated />
                            <Text style={[styles.emptyChatTitle, { color: colors.text }]}>
                                Say hello to Echo!
                            </Text>
                            <Text style={[styles.emptyChatHint, { color: colors.textSecondary }]}>
                                Ask anything, reflect on your day, or just talk.
                            </Text>
                        </View>
                    }
                    ListFooterComponent={
                        isSending ? (
                            <View style={styles.typingWrap}>
                                <View style={styles.botAvatarCol}>
                                    <View style={styles.botAvatarBubble}>
                                        <EchoAvatar expression="thinking" size={28} animated />
                                    </View>
                                </View>
                                <View style={[styles.typingBubble, { backgroundColor: colors.surfaceSecondary }]}>
                                    <TypingIndicator />
                                </View>
                            </View>
                        ) : null
                    }
                />

                {/* Scroll to bottom */}
                {showScrollDown && (
                    <Animated.View entering={FadeIn.duration(180)} style={styles.scrollFab}>
                        <TouchableOpacity
                            onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            style={[styles.scrollFabBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        >
                            <Ionicons name="chevron-down" size={18} color={colors.text} />
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* ── Input bar ── */}
                <View style={[
                    styles.inputBar,
                    {
                        backgroundColor: colors.surface,
                        borderTopColor:  colors.border,
                        paddingBottom:   insets.bottom > 0 ? insets.bottom : 12,
                    },
                ]}>
                    <View style={[styles.inputWrap, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Message Echo…"
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            maxLength={500}
                            editable={!isSending}
                            returnKeyType="default"
                        />
                        {inputText.length > 400 && (
                            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                                {500 - inputText.length}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!inputText.trim() || isSending}
                        activeOpacity={0.8}
                        style={styles.sendBtn}
                    >
                        <LinearGradient
                            colors={inputText.trim() && !isSending ? ['#4F6BFF', '#7B3FE4'] : [colors.border, colors.border]}
                            style={styles.sendBtnGradient}
                        >
                            <Ionicons
                                name="send"
                                size={17}
                                color={inputText.trim() && !isSending ? '#fff' : colors.textSecondary}
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root:  { flex: 1 },
    flex:  { flex: 1 },
    centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    // Not-found
    notFoundHeader: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    notFoundText: { fontSize: 15, marginTop: 12 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 4,
    },
    backBtn:  { padding: 8 },
    deleteBtn: { padding: 8, marginLeft: 4 },
    headerEchoWrap: { position: 'relative', width: 46, height: 37, marginLeft: 2 },
    statusDot: {
        position: 'absolute', bottom: 0, right: 0,
        width: 10, height: 10, borderRadius: 5,
        borderWidth: 2, borderColor: '#fff',
    },
    headerInfo: { flex: 1, marginLeft: 8 },
    headerTitle: { fontSize: 15, fontWeight: '700' },
    headerSub:   { fontSize: 11, marginTop: 1 },

    // Messages
    msgList: { paddingVertical: 12, paddingHorizontal: 8 },
    msgRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 4 },
    msgRowUser: { justifyContent: 'flex-end' },
    msgRowBot:  { justifyContent: 'flex-start' },

    botAvatarCol:    { width: 36, marginRight: 4, alignItems: 'center' },
    botAvatarBubble: { width: 28, height: 23, overflow: 'hidden' },

    bubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
    },
    bubbleError: { borderWidth: 1, borderColor: '#FCA5A5' },
    bubbleText: { fontSize: 15, lineHeight: 22 },

    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    metaTime: { fontSize: 11 },

    retryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        marginTop: 6, backgroundColor: '#FEF2F2',
        borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8,
        alignSelf: 'flex-start',
    },
    retryText: { fontSize: 11, fontWeight: '600', color: '#DC2626' },

    dateSepWrap: { alignItems: 'center', marginVertical: 12 },
    dateSepPill: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
    dateSepText: { fontSize: 11, fontWeight: '600' },

    // Typing
    typingWrap: {
        flexDirection: 'row', alignItems: 'flex-end',
        paddingHorizontal: 12, marginBottom: 8,
    },
    typingBubble: {
        borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
        borderTopLeftRadius: 6,
    },

    // Empty chat state
    emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 60 },
    emptyChatTitle: { fontSize: 20, fontWeight: '800', marginTop: 16, marginBottom: 8, textAlign: 'center' },
    emptyChatHint:  { fontSize: 14, lineHeight: 20, textAlign: 'center' },

    // Scroll FAB
    scrollFab:    { position: 'absolute', bottom: 76, right: 16 },
    scrollFabBtn: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, elevation: 4,
        shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    },

    // Input
    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end',
        paddingHorizontal: 12, paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth, gap: 8,
    },
    inputWrap: {
        flex: 1, flexDirection: 'row', alignItems: 'flex-end',
        borderRadius: 22, paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 10 : 6,
        borderWidth: 1, minHeight: 44,
    },
    input: { flex: 1, fontSize: 15, maxHeight: 120, lineHeight: 20 },
    charCount: { fontSize: 11, paddingBottom: 2 },

    sendBtn:         { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
    sendBtnGradient: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
