import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';

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

    if (!conversation) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
                <View className="flex-row items-center px-2 py-3 border-b" style={{ borderBottomColor: colors.border, backgroundColor: colors.surface }}>
                    <TouchableOpacity
                        className="flex-row items-center flex-1"
                        onPress={() => router.back()}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                        <Text className="text-base font-semibold ml-1" style={{ color: colors.text }}>Chat</Text>
                    </TouchableOpacity>
                </View>
                <View className="flex-1 items-center justify-center px-10">
                    <Text className="text-base text-center" style={{ color: colors.textSecondary }}>Conversation not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            
            <View className="flex-row items-center justify-between px-2 py-3 border-b" style={{ borderBottomColor: colors.border, backgroundColor: colors.surface }}>
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity className="p-2" onPress={() => router.back()}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text className="text-base font-semibold" style={{ color: colors.text }} numberOfLines={1}>
                        {conversation.title}
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <TouchableOpacity className="p-2" onPress={handleDelete}>
                        <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                className="flex-1 px-4 py-4"
                contentContainerStyle={{ paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => {
                    scrollViewRef.current?.scrollToEnd({ animated: false });
                }}
            >
                {conversation.messages.map((message) => (
                    <View
                        key={message.id}
                        className={`flex-row mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'} items-end`}
                    >
                        {message.sender === 'bot' && (
                            <View
                                className="w-8 h-8 rounded-full items-center justify-center mr-2"
                                style={{ backgroundColor: colors.primary }}
                            >
                                <MaterialCommunityIcons name="robot" size={16} color="#fff" />
                            </View>
                        )}
                        
                        <View
                            className={`max-w-[75%] px-3.5 py-2.5 rounded-[18px] ${
                                message.sender === 'user' ? 'rounded-br-[4px]' : 'rounded-bl-[4px]'
                            }`}
                            style={{
                                backgroundColor: message.sender === 'user' 
                                    ? colors.primary 
                                    : message.status === 'error'
                                        ? '#FEE2E2'
                                        : colors.surfaceSecondary,
                                borderColor: message.status === 'error' ? '#EF4444' : 'transparent',
                                borderWidth: message.status === 'error' ? 1 : 0,
                            }}
                        >
                            <Text
                                className="text-sm leading-5"
                                style={{
                                    color: message.sender === 'user' ? '#fff' : colors.text,
                                }}
                            >
                                {message.text}
                            </Text>
                            <Text
                                className="text-[10px] mt-1"
                                style={{
                                    color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
                                }}
                            >
                                {formatTime(message.timestamp)}
                                {message.status === 'sending' && ' • Sending...'}
                                {message.status === 'error' && ' • Failed'}
                            </Text>
                            {message.status === 'error' && (
                                <TouchableOpacity 
                                    className="flex-row items-center mt-1"
                                    onPress={() => handleRetry(message.id)}
                                >
                                    <MaterialCommunityIcons name="refresh" size={12} color="#EF4444" />
                                    <Text className="text-xs ml-1" style={{ color: '#EF4444' }}>Tap to retry</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {message.sender === 'user' && (
                            <View
                                className="w-8 h-8 rounded-full items-center justify-center ml-2"
                                style={{ backgroundColor: colors.textSecondary }}
                            >
                                <MaterialCommunityIcons name="account" size={18} color="#fff" />
                            </View>
                        )}
                    </View>
                ))}

                {isSending && (
                    <View 
                        className="flex-row items-center px-3.5 py-2.5 rounded-[18px] rounded-bl-[4px] mb-4 self-start"
                        style={{ backgroundColor: colors.surfaceSecondary }}
                    >
                        <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.textSecondary }} />
                        <View className="w-1.5 h-1.5 rounded-full ml-1" style={{ backgroundColor: colors.textSecondary }} />
                        <View className="w-1.5 h-1.5 rounded-full ml-1" style={{ backgroundColor: colors.textSecondary }} />
                    </View>
                )}
            </ScrollView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <View className="flex-row items-center px-4 py-3 border-t" style={{ borderTopColor: colors.border, backgroundColor: colors.surface }}>
                    <View 
                        className="flex-1 flex-row items-center rounded-full px-4 py-2"
                        style={{ backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderWidth: 1 }}
                    >
                        <TextInput
                            className="flex-1 text-sm"
                            style={{ color: colors.text, maxHeight: 100 }}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Type a message..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            maxLength={500}
                            editable={!isSending}
                        />
                        <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
                            {inputText.length}/500
                        </Text>
                    </View>
                    <TouchableOpacity
                        className="w-11 h-11 rounded-full items-center justify-center ml-2"
                        style={{
                            backgroundColor: (!inputText.trim() || isSending) ? colors.border : colors.primary,
                        }}
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
