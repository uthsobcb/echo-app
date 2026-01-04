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
import { ChatInput } from '../../component/ChatInput'
import { ChatMessage } from '../../component/ChatMessage'
import { TypingIndicator } from '../../component/TypingIndicator'
import { Sidebar } from '../../component/Sidebar'
import { ChatDashboard } from '../../component/ChatDashboard'

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
        scrollViewRef.current?.scrollToEnd({ animated: true })
    }, [currentConversation?.messages])

    const generateChatTitle = (firstMessage: string): string => {
        const words = firstMessage.split(' ').slice(0, 5).join(' ')
        return words.length > 30 ? words.substring(0, 30) + '...' : words
    }

    const handleSendMessage = async () => {
        if (!inputText.trim() || !currentConversation) return

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
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

        // Simulate bot response delay
        setTimeout(() => {
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: `I received your message: "${inputText}". How can I assist you further?`,
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

    const handleNewChat = () => {
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
                    {/* Header with Sidebar Toggle */}
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
                        {/* Header Title */}
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

                    {/* Main Content Area */}
                    {!currentConversationId ? (
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
                    ) : currentConversation ? (
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
                                {currentConversation.messages.map(
                                    (message) => (
                                        <TouchableOpacity
                                            key={message.id}
                                        >
                                            <ChatMessage
                                                text={message.text}
                                                sender={message.sender}
                                                timestamp={
                                                    message.timestamp
                                                }
                                            />
                                        </TouchableOpacity>
                                    )
                                )}

                                {isLoading && <TypingIndicator />}
                            </ScrollView>

                            {/* Input Area */}
                            <ChatInput
                                value={inputText}
                                onChangeText={setInputText}
                                onSend={handleSendMessage}
                                isLoading={isLoading}
                            />
                        </>
                    ) : null}
                </View>
            </KeyboardAvoidingView>
        </>
    )
}

export default ChatIndex    