import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
} from 'react-native'

interface ChatDashboardProps {
    onNewChat: () => void
    recentChats: Array<{
        id: string
        title: string
        preview: string
    }>
    onSelectChat: (id: string) => void
}

export const ChatDashboard: React.FC<ChatDashboardProps> = ({
    onNewChat,
    recentChats,
    onSelectChat,
}) => {
    const [searchQuery, setSearchQuery] = React.useState('')

    const quickActions = [
        { icon: 'lightbulb-outline', label: 'Ideas', color: '#f59e0b' },
        { icon: 'clipboard-text-outline', label: 'Summary', color: '#8b5cf6' },
        { icon: 'help-circle-outline', label: 'FAQ', color: '#10b981' },
        { icon: 'code-braces', label: 'Code', color: '#ef4444' },
    ]

    return (
        <ScrollView
            className="flex-1 bg-white px-4 py-6"
            showsVerticalScrollIndicator={false}
        >
            {/* Welcome Section */}
            <View className="mb-8">
                <Text className="text-3xl font-bold text-slate-900">
                    Welcome! 👋
                </Text>
                <Text className="mt-2 text-sm text-slate-500">
                    Start a new conversation or continue an existing one
                </Text>
            </View>

            {/* Search Bar */}
            <View className="mb-8 flex flex-row items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3">
                <MaterialCommunityIcons
                    name="magnify"
                    size={20}
                    color="#94a3b8"
                />
                <TextInput
                    placeholder="Search conversations..."
                    placeholderTextColor="#cbd5e1"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="flex-1 text-base text-slate-900"
                />
            </View>

            {/* Quick Actions */}
            <View className="mb-8">
                <Text className="mb-4 text-lg font-semibold text-slate-900">
                    Quick Actions
                </Text>
                <View className="flex flex-row flex-wrap gap-3">
                    {quickActions.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            className="flex-1 flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-4"
                            style={{ minWidth: '45%' }}
                        >
                            <View
                                className="rounded-lg p-3"
                                style={{
                                    backgroundColor:
                                        action.color + '20',
                                }}
                            >
                                <MaterialCommunityIcons
                                    name={
                                        action.icon as any
                                    }
                                    size={24}
                                    color={action.color}
                                />
                            </View>
                            <Text className="text-xs font-medium text-slate-900">
                                {action.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* New Chat CTA */}
            <TouchableOpacity
                onPress={onNewChat}
                className="mb-8 flex flex-row items-center justify-center gap-3 rounded-xl bg-blue-500 px-6 py-4"
            >
                <MaterialCommunityIcons
                    name="pencil-plus"
                    size={24}
                    color="white"
                />
                <Text className="text-center text-lg font-semibold text-white">
                    Start New Chat
                </Text>
            </TouchableOpacity>

            {/* Recent Chats */}
            {recentChats.length > 0 && (
                <View>
                    <Text className="mb-4 text-lg font-semibold text-slate-900">
                        Recent Conversations
                    </Text>
                    <View className="gap-3">
                        {recentChats.slice(0, 3).map((chat) => (
                            <TouchableOpacity
                                key={chat.id}
                                onPress={() => onSelectChat(chat.id)}
                                className="flex flex-row items-start gap-4 rounded-xl border border-slate-200 bg-white p-4"
                            >
                                <View className="rounded-lg bg-blue-100 p-3">
                                    <MaterialCommunityIcons
                                        name="chat-outline"
                                        size={20}
                                        color="#3b82f6"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-semibold text-slate-900">
                                        {chat.title}
                                    </Text>
                                    <Text
                                        numberOfLines={2}
                                        className="mt-1 text-sm text-slate-500"
                                    >
                                        {chat.preview}
                                    </Text>
                                </View>
                                <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={20}
                                    color="#cbd5e1"
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </ScrollView>
    )
}
