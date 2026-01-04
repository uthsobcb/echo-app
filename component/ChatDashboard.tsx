import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import {
    View,
    Text,
    TouchableOpacity,
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
    if (recentChats.length > 0) {
        return (
            <ScrollView
                className="flex-1 bg-white px-4 py-6"
                showsVerticalScrollIndicator={false}
            >
                <Text className="mb-4 text-lg font-semibold text-slate-900">
                    Conversations
                </Text>
                <View className="gap-3">
                    {recentChats.map((chat) => (
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
            </ScrollView>
        )
    }

    return (
        <ScrollView
            className="flex-1 bg-white px-4 py-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ justifyContent: 'center', flex: 1 }}
        >
            <View className="items-center gap-6">
                <View className="rounded-full bg-blue-100 p-6">
                    <MaterialCommunityIcons
                        name="chat-outline"
                        size={48}
                        color="#3b82f6"
                    />
                </View>
                <View className="items-center gap-2">
                    <Text className="text-2xl font-bold text-slate-900">
                        No Conversations Yet
                    </Text>
                    <Text className="text-center text-sm text-slate-500">
                        Start a new chat to begin
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={onNewChat}
                    className="flex flex-row items-center justify-center gap-3 rounded-xl bg-blue-500 px-8 py-4"
                >
                    <MaterialCommunityIcons
                        name="pencil-plus"
                        size={24}
                        color="white"
                    />
                    <Text className="text-lg font-semibold text-white">
                        New Chat
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    )
}
