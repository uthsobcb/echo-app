import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TypingIndicator } from '../../component/TypingIndicator';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { LocalMessage } from '../../types/data';

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors } = useTheme();
    const {
        conversations,
        selectConversation,
        clearCurrentConversation,
        sendMessage,
        isSending,
        deleteConversation,
        retryMessage,
    } = useChat();
    const router = useRouter();

    const [inputText, setInputText] = useState('');
    const [showScrollDown, setShowScrollDown] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const conversation = conversations.find(c => c.id === id);

    useEffect(() => {
        if (id) selectConversation(id);
        return () => clearCurrentConversation();
    }, [id, selectConversation, clearCurrentConversation]);

    // Auto-scroll on new messages
    useEffect(() => {
        if (conversation?.messages) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 150);
        }
    }, [conversation?.messages.length]);

    const handleSend = useCallback(async () => {
        const text = inputText.trim();
        if (!text || !id) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setInputText('');
        await sendMessage(text, id);
    }, [inputText, id, sendMessage]);

    const handleRetry = useCallback(async (messageId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await retryMessage(messageId);
    }, [retryMessage]);

    const handleDelete = useCallback(() => {
        if (!id || !conversation) return;
        Alert.alert(
            'Delete Conversation',
            `Delete "${conversation.title}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteConversation(id);
                        router.back();
                    },
                },
            ]
        );
    }, [id, conversation, deleteConversation, router]);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDateSeparator = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) return 'Today';
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const shouldShowDateSeparator = (messages: LocalMessage[], index: number) => {
        if (index === 0) return true;
        const current = new Date(messages[index].timestamp).toDateString();
        const prev = new Date(messages[index - 1].timestamp).toDateString();
        return current !== prev;
    };

    const isFirstInGroup = (messages: LocalMessage[], index: number) => {
        if (index === 0) return true;
        return messages[index].sender !== messages[index - 1].sender;
    };

    const isLastInGroup = (messages: LocalMessage[], index: number) => {
        if (index === messages.length - 1) return true;
        return messages[index].sender !== messages[index + 1].sender;
    };

    const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
        setShowScrollDown(distanceFromBottom > 200);
    }, []);

    const scrollToBottom = useCallback(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, []);

    // Not found state
    if (!conversation) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, marginLeft: 4 }}>Chat</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
                    <MaterialCommunityIcons name="chat-remove-outline" size={48} color={colors.textSecondary} />
                    <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
                        Conversation not found
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const messages = conversation.messages;

    const renderMessage = ({ item, index }: { item: LocalMessage; index: number }) => {
        const isUser = item.sender === 'user';
        const isError = item.status === 'error';
        const isSendingMsg = item.status === 'sending';
        const firstInGroup = isFirstInGroup(messages, index);
        const lastInGroup = isLastInGroup(messages, index);
        const showDate = shouldShowDateSeparator(messages, index);

        return (
            <>
                {showDate && (
                    <View style={{ alignItems: 'center', marginVertical: 16 }}>
                        <View style={{
                            backgroundColor: colors.surfaceSecondary,
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            paddingVertical: 5,
                        }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>
                                {formatDateSeparator(item.timestamp)}
                            </Text>
                        </View>
                    </View>
                )}
                <Animated.View
                    entering={index === messages.length - 1 ? FadeInDown.duration(250) : undefined}
                    style={{
                        flexDirection: 'row',
                        justifyContent: isUser ? 'flex-end' : 'flex-start',
                        alignItems: 'flex-end',
                        marginBottom: lastInGroup ? 12 : 3,
                        paddingHorizontal: 12,
                    }}
                >
                    {/* Bot avatar — only on last message in group */}
                    {!isUser && (
                        <View style={{ width: 32, marginRight: 8 }}>
                            {lastInGroup && (
                                <View style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                }}>
                                    <LinearGradient
                                        colors={['#4F6BFF', '#7B3FE4']}
                                        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <MaterialCommunityIcons name="robot" size={16} color="#fff" />
                                    </LinearGradient>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Bubble */}
                    <View style={{
                        maxWidth: '78%',
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 20,
                        // Tail corners
                        ...(isUser ? {
                            borderTopRightRadius: firstInGroup ? 20 : 6,
                            borderBottomRightRadius: lastInGroup ? 4 : 6,
                        } : {
                            borderTopLeftRadius: firstInGroup ? 20 : 6,
                            borderBottomLeftRadius: lastInGroup ? 4 : 6,
                        }),
                        backgroundColor: isUser
                            ? (isError ? '#FEE2E2' : colors.primary)
                            : colors.surfaceSecondary,
                        borderWidth: isError ? 1 : 0,
                        borderColor: isError ? '#F87171' : 'transparent',
                    }}>
                        <Text style={{
                            fontSize: 15,
                            lineHeight: 21,
                            color: isUser
                                ? (isError ? '#991B1B' : '#fff')
                                : colors.text,
                        }}>
                            {item.text}
                        </Text>

                        {/* Timestamp + status — only on last in group */}
                        {lastInGroup && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                                <Text style={{
                                    fontSize: 11,
                                    color: isUser
                                        ? (isError ? '#DC2626' : 'rgba(255,255,255,0.6)')
                                        : colors.textSecondary,
                                }}>
                                    {formatTime(item.timestamp)}
                                </Text>
                                {isSendingMsg && (
                                    <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.6)" />
                                )}
                                {item.status === 'sent' && isUser && (
                                    <Ionicons name="checkmark-done" size={13} color="rgba(255,255,255,0.6)" />
                                )}
                                {isError && (
                                    <Ionicons name="alert-circle" size={13} color="#DC2626" />
                                )}
                            </View>
                        )}

                        {/* Retry button */}
                        {isError && (
                            <TouchableOpacity
                                onPress={() => handleRetry(item.id)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 6,
                                    backgroundColor: '#FEF2F2',
                                    borderRadius: 8,
                                    paddingVertical: 4,
                                    paddingHorizontal: 8,
                                    alignSelf: 'flex-start',
                                }}
                            >
                                <Ionicons name="refresh" size={13} color="#DC2626" />
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#DC2626', marginLeft: 4 }}>
                                    Tap to retry
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* User spacer for alignment (no avatar for user) */}
                    {isUser && <View style={{ width: 8 }} />}
                </Animated.View>
            </>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 8,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                backgroundColor: colors.surface,
            }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ padding: 8 }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>

                {/* Bot info */}
                <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    overflow: 'hidden',
                    marginLeft: 4,
                }}>
                    <LinearGradient
                        colors={['#4F6BFF', '#7B3FE4']}
                        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <MaterialCommunityIcons name="robot" size={18} color="#fff" />
                    </LinearGradient>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                        {conversation.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: isSending ? '#10B981' : colors.textSecondary }}>
                        {isSending ? 'Echo is typing...' : 'Echo AI'}
                    </Text>
                </View>

                <TouchableOpacity onPress={handleDelete} style={{ padding: 8, marginRight: 4 }}>
                    <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={100}
                    onContentSizeChange={() => {
                        flatListRef.current?.scrollToEnd({ animated: false });
                    }}
                    ListFooterComponent={
                        isSending ? (
                            <View style={{ paddingHorizontal: 12, marginLeft: 40 }}>
                                <TypingIndicator />
                            </View>
                        ) : null
                    }
                />

                {/* Scroll to bottom FAB */}
                {showScrollDown && (
                    <Animated.View entering={FadeIn.duration(200)} style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 16,
                    }}>
                        <TouchableOpacity
                            onPress={scrollToBottom}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: colors.surface,
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: '#000',
                                shadowOpacity: 0.15,
                                shadowRadius: 8,
                                shadowOffset: { width: 0, height: 2 },
                                elevation: 4,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}
                        >
                            <Ionicons name="chevron-down" size={20} color={colors.text} />
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Input area */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    backgroundColor: colors.surface,
                }}>
                    <View style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'flex-end',
                        backgroundColor: colors.surfaceSecondary,
                        borderRadius: 22,
                        paddingHorizontal: 16,
                        paddingVertical: Platform.OS === 'ios' ? 10 : 4,
                        borderWidth: 1,
                        borderColor: colors.border,
                        minHeight: 44,
                    }}>
                        <TextInput
                            style={{
                                flex: 1,
                                fontSize: 15,
                                color: colors.text,
                                maxHeight: 120,
                                lineHeight: 20,
                                paddingTop: Platform.OS === 'ios' ? 0 : 8,
                                paddingBottom: Platform.OS === 'ios' ? 0 : 8,
                            }}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Message Echo..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            maxLength={500}
                            editable={!isSending}
                            returnKeyType="default"
                        />
                    </View>
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!inputText.trim() || isSending}
                        activeOpacity={0.7}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: 8,
                            overflow: 'hidden',
                        }}
                    >
                        {inputText.trim() && !isSending ? (
                            <LinearGradient
                                colors={['#4F6BFF', '#7B3FE4']}
                                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Ionicons name="send" size={18} color="#fff" />
                            </LinearGradient>
                        ) : (
                            <View style={{
                                width: 44,
                                height: 44,
                                backgroundColor: colors.border,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 22,
                            }}>
                                <Ionicons name="send" size={18} color={colors.textSecondary} />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
