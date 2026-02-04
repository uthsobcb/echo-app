import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useEffect, useRef, useState } from 'react'
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { ChatDashboard } from '../../component/ChatDashboard'
import { ChatInput } from '../../component/ChatInput'
import { ChatMessage } from '../../component/ChatMessage'
import { Sidebar } from '../../component/Sidebar'
import { TypingIndicator } from '../../component/TypingIndicator'

import { useStorage } from '../../context/StorageContext'
import { api } from '../../service/api'

interface Message {
    id: string
    text: string
    sender: 'user' | 'bot'
    timestamp: Date
}

interface Conversation {
    id: string
    title: string
    timestamp: Date
    messages: Message[]
}

const ChatIndex = () => {
    const { appMode } = useStorage()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [inputText, setInputText] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const scrollViewRef = useRef<ScrollView>(null)

    const currentConversation = conversations.find(
        (c) => c.id === currentConversationId
    )

    useEffect(() => {
        if (appMode === 'api') {
            loadChatHistory()
        }
    }, [appMode])

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
    }, [currentConversation?.messages])

    const loadChatHistory = async () => {
        try {
            const history = await api.chat.getHistory()
            const formatted = history.map((h: any) => ({
                id: h._id,
                title: h.threadSummary || 'Conversation',
                timestamp: new Date(h.createdAt),
                messages: h.messages.map((m: any, idx: number) => ({
                    id: `${h._id}-${idx}`,
                    text: m.text,
                    sender: m.role === 'ai' ? 'bot' : 'user',
                    timestamp: new Date(m.timestamp)
                }))
            }))
            setConversations(formatted)
        } catch (error) {
            console.error('Failed to load chat history', error)
        }
    }

    const handleSendMessage = async () => {
        const messageText = inputText.trim()
        if (!messageText) return

        if (appMode === 'api') {
            const chatID = currentConversationId || undefined

            setInputText('')
            setIsLoading(true)

            try {
                const result = await api.chat.sendMessage(messageText, chatID)

                if (!currentConversationId) {
                    setCurrentConversationId(result.chatId)
                }

                await loadChatHistory()
                setCurrentConversationId(result.chatId)
            } catch (error) {
                console.error('Failed to send message', error)
            } finally {
                setIsLoading(false)
            }
        } else {
            if (!currentConversation) return

            const userMessage: Message = {
                id: Date.now().toString(),
                text: messageText,
                sender: 'user',
                timestamp: new Date(),
            }

            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === currentConversationId
                        ? { ...conv, messages: [...conv.messages, userMessage] }
                        : conv
                )
            )
            setInputText('')
            setIsLoading(true)

            setTimeout(() => {
                const botMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text: `I received your message: "${messageText}". How can I assist you further?`,
                    sender: 'bot',
                    timestamp: new Date(),
                }
                setConversations((prev) =>
                    prev.map((conv) =>
                        conv.id === currentConversationId
                            ? { ...conv, messages: [...conv.messages, botMessage] }
                            : conv
                    )
                )
                setIsLoading(false)
            }, 500)
        }
    }

    const handleNewChat = () => {
        if (appMode === 'api') {
            setCurrentConversationId(null)
            setIsHistoryOpen(false)
        } else {
            const newId = Date.now().toString()
            const newConversation: Conversation = {
                id: newId,
                title: 'New Chat',
                timestamp: new Date(),
                messages: [
                    {
                        id: '1',
                        text: 'Hi there! 👋 How can I help you today?',
                        sender: 'bot',
                        timestamp: new Date(),
                    },
                ],
            }
            setConversations((prev) => [newConversation, ...prev])
            setCurrentConversationId(newId)
            setIsHistoryOpen(false)
        }
    }

    const handleSelectConversation = (id: string) => {
        setCurrentConversationId(id)
        setIsHistoryOpen(false)
    }

    const handleDeleteConversation = (id: string) => {
        setConversations((prev) => prev.filter((c) => c.id !== id))
        if (currentConversationId === id) {
            const remaining = conversations.filter((c) => c.id !== id)
            setCurrentConversationId(remaining[0]?.id || null)
        }
    }

    const sidebarConversations = conversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        timestamp: conv.timestamp,
        messageCount: conv.messages.length,
    }))

    return (
        <>
            <Sidebar
                conversations={sidebarConversations}
                onSelectConversation={handleSelectConversation}
                onDeleteConversation={handleDeleteConversation}
                onNewChat={handleNewChat}
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                currentConversationId={currentConversationId || ''}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 bg-white"
            >
                <View className="flex-1">
                    <View className="flex flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                        <TouchableOpacity
                            onPress={() => setIsHistoryOpen(!isHistoryOpen)}
                            className="rounded-lg p-2"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <MaterialCommunityIcons
                                name={isHistoryOpen ? 'menu-close' : 'menu'}
                                size={28}
                                color="#3b82f6"
                            />
                        </TouchableOpacity>
                        <View className="flex-1 items-center">
                            <Text className="text-lg font-bold text-slate-900">
                                {currentConversation?.title || 'Chat'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleNewChat}
                            className="rounded-lg p-2"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <MaterialCommunityIcons
                                name="plus-circle"
                                size={28}
                                color="#3b82f6"
                            />
                        </TouchableOpacity>
                    </View>

                    {!currentConversationId && appMode === 'api' ? (
                        <View className="flex-1">
                            <ScrollView
                                ref={scrollViewRef}
                                className="flex-1 px-4 py-4"
                                showsVerticalScrollIndicator={false}
                            >
                                <View className="items-center justify-center mt-20">
                                    <View className="h-20 w-20 rounded-full bg-blue-50 items-center justify-center mb-6">
                                        <MaterialCommunityIcons name="robot" size={40} color="#3b82f6" />
                                    </View>
                                    <Text className="text-xl font-bold text-slate-900 mb-2">Echo AI</Text>
                                    <Text className="text-slate-500 text-center px-10">Start a new conversation or select one from the history.</Text>
                                </View>
                            </ScrollView>
                            <ChatInput
                                value={inputText}
                                onChangeText={setInputText}
                                onSend={handleSendMessage}
                                isLoading={isLoading}
                            />
                        </View>
                    ) : !currentConversationId ? (
                        <ChatDashboard
                            onNewChat={handleNewChat}
                            recentChats={conversations.map((conv) => ({
                                id: conv.id,
                                title: conv.title,
                                preview:
                                    conv.messages[1]?.text ||
                                    conv.messages[0]?.text ||
                                    'No messages yet',
                            }))}
                            onSelectChat={handleSelectConversation}
                        />
                    ) : (
                        <>
                            <ScrollView
                                ref={scrollViewRef}
                                className="flex-1 px-4 py-4"
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{
                                    paddingBottom: 16,
                                }}
                                onContentSizeChange={() =>
                                    scrollViewRef.current?.scrollToEnd({
                                        animated: true,
                                    })
                                }
                            >
                                {currentConversation?.messages.map(
                                    (message) => (
                                        <View
                                            key={message.id}
                                        >
                                            <ChatMessage
                                                text={message.text}
                                                sender={message.sender}
                                                timestamp={
                                                    message.timestamp
                                                }
                                            />
                                        </View>
                                    )
                                )}

                                {isLoading && <TypingIndicator />}
                            </ScrollView>

                            <ChatInput
                                value={inputText}
                                onChangeText={setInputText}
                                onSend={handleSendMessage}
                                isLoading={isLoading}
                            />
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </>
    )
}

export default ChatIndex