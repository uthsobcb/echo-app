import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useState } from 'react'
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Animated,
} from 'react-native'
import { SettingsModal } from './SettingsModal'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
    conversations: Array<{
        id: string
        title: string
        timestamp: Date
        messageCount: number
    }>
    onSelectConversation: (id: string) => void
    onDeleteConversation: (id: string) => void
    onNewChat: () => void
    currentConversationId: string
}

export const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onClose,
    conversations,
    onSelectConversation,
    onDeleteConversation,
    onNewChat,
    currentConversationId,
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [showSettings, setShowSettings] = useState(false)

    if (!isOpen) return null

    const handleSelectConversation = (id: string) => {
        onSelectConversation(id)
        onClose()
    }

    const handleDeleteConversation = (id: string) => {
        onDeleteConversation(id)
        if (id === currentConversationId) {
            onClose()
        }
    }

    return (
        <View className="absolute bottom-0 left-0 right-0 top-0 z-50 flex flex-row">
            {/* Sidebar Panel */}
            <View className="w-72 flex-1 flex flex-col bg-slate-900">
                {/* Sidebar Header */}
                <View className="border-b border-slate-700 px-6 py-5">
                    <View className="flex flex-row items-center justify-between">
                        <View className="flex flex-row items-center gap-3">
                            <View className="rounded-lg bg-blue-500 p-2">
                                <MaterialCommunityIcons
                                    name="chat"
                                    size={24}
                                    color="white"
                                />
                            </View>
                            <Text className="text-xl font-bold text-white">
                                Conversations
                            </Text>
                        </View>
                    </View>
                </View>

                {/* New Chat Button */}
                <TouchableOpacity
                    onPress={() => {
                        onNewChat()
                        onClose()
                    }}
                    className="m-4 flex flex-row items-center justify-center gap-2 rounded-lg bg-blue-500 py-3"
                >
                    <MaterialCommunityIcons
                        name="plus"
                        size={22}
                        color="white"
                    />
                    <Text className="font-semibold text-white">New Chat</Text>
                </TouchableOpacity>

                {/* Conversations List */}
                {conversations.length === 0 ? (
                    <View className="flex-1 items-center justify-center px-4">
                        <MaterialCommunityIcons
                            name="chat-outline"
                            size={48}
                            color="#64748b"
                        />
                        <Text className="mt-4 text-center text-sm text-slate-400">
                            No conversations yet. Start a new chat!
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={conversations}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => {
                            const isToday =
                                new Date().toDateString() ===
                                item.timestamp.toDateString()
                            const timeString = isToday
                                ? item.timestamp.toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                  })
                                : item.timestamp.toLocaleDateString([], {
                                      month: 'short',
                                      day: 'numeric',
                                  })

                            const isActive =
                                item.id === currentConversationId

                            return (
                                <View key={item.id} className="px-3">
                                    <TouchableOpacity
                                        onPress={() =>
                                            handleSelectConversation(item.id)
                                        }
                                        onLongPress={() =>
                                            setExpandedId(
                                                expandedId === item.id
                                                    ? null
                                                    : item.id
                                            )
                                        }
                                        className={`mb-2 flex flex-row items-start gap-3 rounded-lg px-3 py-3 ${
                                            isActive
                                                ? 'bg-blue-500/20 border-l-4 border-blue-500'
                                                : 'bg-slate-800'
                                        }`}
                                    >
                                        <MaterialCommunityIcons
                                            name={
                                                isActive
                                                    ? 'chat'
                                                    : 'message-outline'
                                            }
                                            size={18}
                                            color={
                                                isActive
                                                    ? '#3b82f6'
                                                    : '#94a3b8'
                                            }
                                        />
                                        <View className="flex-1">
                                            <Text
                                                numberOfLines={1}
                                                className="text-sm font-semibold text-white"
                                            >
                                                {item.title}
                                            </Text>
                                            <View className="mt-1 flex flex-row items-center gap-2">
                                                <Text className="text-xs text-slate-400">
                                                    {timeString}
                                                </Text>
                                                <Text className="text-xs text-slate-500">
                                                    •{' '}
                                                    {item.messageCount}
                                                </Text>
                                            </View>
                                        </View>
                                        {expandedId === item.id && (
                                            <TouchableOpacity
                                                onPress={() =>
                                                    handleDeleteConversation(
                                                        item.id
                                                    )
                                                }
                                                className="p-2"
                                            >
                                                <MaterialCommunityIcons
                                                    name="trash-can-outline"
                                                    size={18}
                                                    color="#ef4444"
                                                />
                                            </TouchableOpacity>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )
                        }}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {/* Sidebar Footer */}
                <View className="border-t border-slate-700 px-4 py-4">
                    <TouchableOpacity
                        onPress={() => setShowSettings(true)}
                        className="mb-3 flex flex-row items-center gap-3 rounded-lg px-3 py-2"
                    >
                        <MaterialCommunityIcons
                            name="cog-outline"
                            size={20}
                            color="#94a3b8"
                        />
                        <Text className="text-sm text-slate-300">
                            Settings
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Settings Modal */}
                <SettingsModal
                    isVisible={showSettings}
                    onClose={() => setShowSettings(false)}
                />
            </View>

            {/* Overlay to close sidebar */}
            <TouchableOpacity
                onPress={onClose}
                className="flex-1 bg-black/50"
                activeOpacity={1}
            />
        </View>
    )
}
