import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '../../context/ChatContext';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
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
        updateConversationTitle,
    } = useChat();
    const router = useRouter();
    
    const [inputText, setInputText] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);

    const conversation = conversations.find(c => c.id === id);

    useEffect(() => {
        if (id) {
            selectConversation(id);
        }
        return () => {
            clearCurrentConversation();
        };
    }, [id, selectConversation, clearCurrentConversation]);

    useEffect(() => {
        if (conversation?.messages) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [conversation?.messages.length]);

    const handleSend = useCallback(async () => {
        const text = inputText.trim();
        if (!text || !id) return;
        
        setInputText('');
        await sendMessage(text, id);
    }, [inputText, id, sendMessage]);

    const handleDelete = useCallback(() => {
        if (!id || !conversation) return;
        
        Alert.alert(
            'Delete Conversation',
            `Are you sure you want to delete "${conversation.title}"?`,
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

    const handleRetry = useCallback(async (messageId: string) => {
        const msg = conversation?.messages.find(m => m.id === messageId);
        if (msg && msg.sender === 'user' && msg.status === 'error') {
            await sendMessage(msg.text, id);
        }
    }, [conversation, id, sendMessage]);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const styles = useMemo(() => ({
        container: { flex: 1, backgroundColor: colors.background } as ViewStyle,
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 8,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
        } as ViewStyle,
        headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 } as ViewStyle,
        backBtn: { padding: 8 } as ViewStyle,
        headerTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginLeft: 4 } as TextStyle,
        headerRight: { flexDirection: 'row', alignItems: 'center' } as ViewStyle,
        menuBtn: { padding: 8 } as ViewStyle,
        messagesContainer: { flex: 1, paddingHorizontal: 16, paddingVertical: 16 } as ViewStyle,
        messageWrapper: {
            flexDirection: 'row',
            marginBottom: 16,
            alignItems: 'flex-end',
        } as ViewStyle,
        messageWrapperUser: { justifyContent: 'flex-end' } as ViewStyle,
        messageWrapperBot: { justifyContent: 'flex-start' } as ViewStyle,
        botAvatar: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
        } as ViewStyle,
        userAvatar: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.textSecondary,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
        } as ViewStyle,
        messageBubble: {
            maxWidth: '75%',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 18,
        } as ViewStyle,
        userBubble: {
            backgroundColor: colors.primary,
            borderBottomRightRadius: 4,
        } as ViewStyle,
        botBubble: {
            backgroundColor: colors.surfaceSecondary,
            borderBottomLeftRadius: 4,
        } as ViewStyle,
        errorBubble: {
            backgroundColor: '#FEE2E2',
            borderWidth: 1,
            borderColor: '#EF4444',
        } as ViewStyle,
        messageText: { fontSize: 15, lineHeight: 21 } as TextStyle,
        userText: { color: '#fff' } as TextStyle,
        botText: { color: colors.text } as TextStyle,
        messageTime: { 
            fontSize: 10, 
            color: colors.textSecondary, 
            marginTop: 4 
        } as TextStyle,
        userTime: { color: 'rgba(255,255,255,0.7)' } as TextStyle,
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
        } as ViewStyle,
        inputWrapper: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceSecondary,
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: colors.border,
        } as ViewStyle,
        input: {
            flex: 1,
            fontSize: 15,
            color: colors.text,
            maxHeight: 100,
        } as TextStyle,
        sendBtn: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
        } as ViewStyle,
        sendBtnDisabled: { backgroundColor: colors.border } as ViewStyle,
        typingIndicator: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: colors.surfaceSecondary,
            borderRadius: 18,
            borderBottomLeftRadius: 4,
            marginBottom: 16,
            alignSelf: 'flex-start',
        } as ViewStyle,
        typingDot: {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.textSecondary,
            marginHorizontal: 2,
        } as ViewStyle,
        emptyContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40,
        } as ViewStyle,
        emptyText: {
            fontSize: 16,
            color: colors.textSecondary,
            textAlign: 'center',
        } as TextStyle,
        retryBtn: {
            marginTop: 4,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        } as ViewStyle,
        retryText: { fontSize: 12, color: '#EF4444' } as TextStyle,
    }), [colors]);

    if (!conversation) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerLeft} onPress={() => router.back()}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                        <Text style={styles.headerTitle}>Chat</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Conversation not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen 
                options={{
                    headerShown: false,
                }} 
            />
            
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {conversation.title}
                    </Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.menuBtn} onPress={handleDelete}>
                        <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={{ paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => {
                    scrollViewRef.current?.scrollToEnd({ animated: false });
                }}
            >
                {conversation.messages.map((message) => (
                    <View
                        key={message.id}
                        style={[
                            styles.messageWrapper,
                            message.sender === 'user' ? styles.messageWrapperUser : styles.messageWrapperBot,
                        ]}
                    >
                        {message.sender === 'bot' && (
                            <View style={styles.botAvatar}>
                                <MaterialCommunityIcons name="robot" size={16} color="#fff" />
                            </View>
                        )}
                        
                        <View
                            style={[
                                styles.messageBubble,
                                message.sender === 'user' ? styles.userBubble : styles.botBubble,
                                message.status === 'error' && styles.errorBubble,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.messageText,
                                    message.sender === 'user' ? styles.userText : styles.botText,
                                ]}
                            >
                                {message.text}
                            </Text>
                            <Text
                                style={[
                                    styles.messageTime,
                                    message.sender === 'user' && styles.userTime,
                                ]}
                            >
                                {formatTime(message.timestamp)}
                                {message.status === 'sending' && ' • Sending...'}
                                {message.status === 'error' && ' • Failed'}
                            </Text>
                            {message.status === 'error' && (
                                <TouchableOpacity 
                                    style={styles.retryBtn}
                                    onPress={() => handleRetry(message.id)}
                                >
                                    <MaterialCommunityIcons name="refresh" size={12} color="#EF4444" />
                                    <Text style={styles.retryText}>Tap to retry</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {message.sender === 'user' && (
                            <View style={styles.userAvatar}>
                                <MaterialCommunityIcons name="account" size={18} color="#fff" />
                            </View>
                        )}
                    </View>
                ))}

                {isSending && (
                    <View style={styles.typingIndicator}>
                        <View style={styles.typingDot} />
                        <View style={[styles.typingDot, { marginLeft: 4 }]} />
                        <View style={[styles.typingDot, { marginLeft: 4 }]} />
                    </View>
                )}
            </ScrollView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Type a message..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            maxLength={500}
                            editable={!isSending}
                        />
                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                            {inputText.length}/500
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.sendBtn,
                            (!inputText.trim() || isSending) && styles.sendBtnDisabled,
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || isSending}
                    >
                        <MaterialCommunityIcons 
                            name="send" 
                            size={20} 
                            color={inputText.trim() && !isSending ? '#fff' : colors.textSecondary} 
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}