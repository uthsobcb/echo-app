import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import { ChatHistoryItem } from './ChatHistoryItem'

export interface ChatConversation {
    id: string
    title: string
    timestamp: Date
    messageCount: number
}

interface ChatHistoryPanelProps {
    conversations: ChatConversation[]
    onSelectConversation: (id: string) => void
    onDeleteConversation: (id: string) => void
    onNewChat: () => void
    isOpen: boolean
}

export const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
    conversations,
    onSelectConversation,
    onDeleteConversation,
    onNewChat,
    isOpen,
}) => {
    if (!isOpen) return null

    return (
        <View className="absolute bottom-0 left-0 right-0 top-0 z-50 flex flex-col bg-white">
            {/* Header */}
            <View className="border-b border-slate-200 px-4 py-4">
                <Text className="text-xl font-bold text-slate-900">
                    Chat History
                </Text>
            </View>

            {/* New Chat Button */}
            <TouchableOpacity
                onPress={onNewChat}
                className="m-4 flex flex-row items-center justify-center gap-2 rounded-lg bg-blue-500 py-3"
            >
                <MaterialCommunityIcons
                    name="plus"
                    size={20}
                    color="white"
                />
                <Text className="font-semibold text-white">New Chat</Text>
            </TouchableOpacity>

            {/* Chat List */}
            {conversations.length === 0 ? (
                <View className="flex-1 items-center justify-center px-4">
                    <MaterialCommunityIcons
                        name="chat-outline"
                        size={48}
                        color="#cbd5e1"
                    />
                    <Text className="mt-4 text-center text-sm text-slate-500">
                        No conversations yet. Start a new chat!
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View className="px-4">
                            <ChatHistoryItem
                                id={item.id}
                                title={item.title}
                                timestamp={item.timestamp}
                                messageCount={item.messageCount}
                                onPress={() =>
                                    onSelectConversation(item.id)
                                }
                                onDelete={() =>
                                    onDeleteConversation(item.id)
                                }
                            />
                        </View>
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    )
}
