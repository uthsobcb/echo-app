import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../service/api';
import { logger } from '../service/logger';
import { Chat, LocalConversation, LocalMessage } from '../types/data';

const STORAGE_KEY = 'chat_conversations';

interface ChatContextType {
    conversations: LocalConversation[];
    currentConversation: LocalConversation | null;
    isLoading: boolean;
    isSending: boolean;
    error: string | null;
    loadConversations: () => Promise<void>;
    sendMessage: (text: string, conversationId?: string) => Promise<void>;
    createConversation: () => string;
    deleteConversation: (id: string) => Promise<void>;
    updateConversationTitle: (id: string, title: string) => Promise<void>;
    selectConversation: (id: string) => void;
    clearCurrentConversation: () => void;
    retryMessage: (messageId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [conversations, setConversations] = useState<LocalConversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentConversation = conversations.find(c => c.id === currentConversationId) || null;

    const loadConversations = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                setConversations(JSON.parse(stored));
            }
        } catch (err) {
            logger.error('Failed to load conversations', err);
            setError('Failed to load conversations');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveConversations = useCallback(async (convs: LocalConversation[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
        } catch (err) {
            logger.error('Failed to save conversations', err);
        }
    }, []);

    const loadFromAPI = useCallback(async () => {
        try {
            const history = await api.chat.getHistory();
            const formatted: LocalConversation[] = history.map((h: Chat) => ({
                id: h._id,
                title: h.threadSummary || 'New Conversation',
                messages: h.messages.map((m, idx: number) => ({
                    id: `${h._id}-${idx}`,
                    text: m.text,
                    sender: m.role === 'ai' ? 'bot' : 'user',
                    timestamp: new Date(m.timestamp).getTime(),
                    status: 'sent' as const,
                })),
                createdAt: new Date(h.createdAt).getTime(),
                updatedAt: h.updatedAt ? new Date(h.updatedAt).getTime() : new Date(h.createdAt).getTime(),
            }));
            setConversations(formatted);
            await saveConversations(formatted);
        } catch (err) {
            logger.error('Failed to load from API', err);
        }
    }, [saveConversations]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    const createConversation = useCallback((): string => {
        const newId = Date.now().toString();
        const newConversation: LocalConversation = {
            id: newId,
            title: 'New Conversation',
            messages: [
                {
                    id: `${newId}-welcome`,
                    text: 'Hi there! 👋 How can I help you today?',
                    sender: 'bot',
                    timestamp: Date.now(),
                    status: 'sent',
                },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        
        const updated = [newConversation, ...conversations];
        setConversations(updated);
        saveConversations(updated);
        setCurrentConversationId(newId);
        
        return newId;
    }, [conversations, saveConversations]);

    const deleteConversation = useCallback(async (id: string) => {
        const updated = conversations.filter(c => c.id !== id);
        setConversations(updated);
        saveConversations(updated);
        
        if (currentConversationId === id) {
            setCurrentConversationId(null);
        }
    }, [conversations, currentConversationId, saveConversations]);

    const updateConversationTitle = useCallback(async (id: string, title: string) => {
        const updated = conversations.map(c => 
            c.id === id ? { ...c, title, updatedAt: Date.now() } : c
        );
        setConversations(updated);
        saveConversations(updated);
    }, [conversations, saveConversations]);

    const selectConversation = useCallback((id: string) => {
        setCurrentConversationId(id);
    }, []);

    const clearCurrentConversation = useCallback(() => {
        setCurrentConversationId(null);
    }, []);

    // Check if a local ID is a temporary one (not a real backend ID)
    const isLocalId = (id: string) => /^\d+$/.test(id);

    const sendMessage = useCallback(async (text: string, conversationId?: string) => {
        const targetId = conversationId || currentConversationId;
        if (!targetId) {
            const newId = createConversation();
            await sendMessage(text, newId);
            return;
        }

        const userMessage: LocalMessage = {
            id: `${targetId}-${Date.now()}`,
            text,
            sender: 'user',
            timestamp: Date.now(),
            status: 'sending',
        };

        // Add user message immediately
        setConversations(prev => prev.map(c =>
            c.id === targetId
                ? { ...c, messages: [...c.messages, userMessage], updatedAt: Date.now() }
                : c
        ));

        setIsSending(true);
        setError(null);

        try {
            // Don't send local temp IDs to the API — let the backend create a new chat
            const apiChatId = isLocalId(targetId) ? undefined : targetId;
            const result = await api.chat.sendMessage(text, apiChatId);

            const botMessage: LocalMessage = {
                id: `${targetId}-${Date.now()}-bot`,
                text: result.message,
                sender: 'bot',
                timestamp: Date.now(),
                status: 'sent',
            };

            // If backend returned a real chatId, update the local conversation ID
            const realId = result.chatId || targetId;
            const isNewConversation = isLocalId(targetId);

            // Generate title from first user message if new
            let newTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;

            setConversations(prev => {
                const finalUpdated = prev.map(c => {
                    if (c.id !== targetId) return c;

                    const existingTitle = c.title;
                    const shouldUpdateTitle = existingTitle === 'New Conversation' || isNewConversation;

                    return {
                        ...c,
                        id: realId, // swap temp ID for real backend ID
                        messages: [
                            ...c.messages.map(m => m.id === userMessage.id ? { ...m, status: 'sent' as const } : m),
                            botMessage,
                        ],
                        title: shouldUpdateTitle ? newTitle : existingTitle,
                        updatedAt: Date.now(),
                    };
                });
                saveConversations(finalUpdated);
                return finalUpdated;
            });

            // Update current conversation ID if it changed
            if (currentConversationId === targetId && realId !== targetId) {
                setCurrentConversationId(realId);
            }
        } catch (err) {
            logger.error('Failed to send message', err);

            // Mark message as error
            setConversations(prev => prev.map(c =>
                c.id === targetId
                    ? {
                        ...c,
                        messages: c.messages.map(m =>
                            m.id === userMessage.id ? { ...m, status: 'error' as const } : m
                        ),
                    }
                    : c
            ));
            setError('Failed to send message. Tap to retry.');
        } finally {
            setIsSending(false);
        }
    }, [conversations, currentConversationId, createConversation, saveConversations]);

    const retryMessage = useCallback(async (messageId: string) => {
        const conv = conversations.find(c => c.id === currentConversationId);
        if (!conv) return;

        const message = conv.messages.find(m => m.id === messageId);
        if (!message || message.sender !== 'user') return;

        const retryText = message.text;
        const targetId = currentConversationId!;

        // Remove the failed message first, then send fresh
        setConversations(prev => prev.map(c =>
            c.id === targetId
                ? { ...c, messages: c.messages.filter(m => m.id !== messageId) }
                : c
        ));

        // Small delay to let state settle, then re-send
        await new Promise(resolve => setTimeout(resolve, 50));
        await sendMessage(retryText, targetId);
    }, [conversations, currentConversationId, sendMessage]);

    return (
        <ChatContext.Provider
            value={{
                conversations,
                currentConversation,
                isLoading,
                isSending,
                error,
                loadConversations,
                sendMessage,
                createConversation,
                deleteConversation,
                updateConversationTitle,
                selectConversation,
                clearCurrentConversation,
                retryMessage,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};