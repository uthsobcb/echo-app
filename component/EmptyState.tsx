import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { View, Text, TouchableOpacity, FlatList, Modal } from 'react-native'

interface EmptyStateProps {
    onNewChat: () => void
    title?: string
    description?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    onNewChat,
    title = 'No conversations yet',
    description = 'Start your first conversation to get started',
}) => {
    return (
        <View className="flex-1 items-center justify-center bg-gradient-to-b from-slate-50 to-white px-6">
            <View className="rounded-full bg-blue-100 p-6">
                <MaterialCommunityIcons
                    name="chat-outline"
                    size={48}
                    color="#3b82f6"
                />
            </View>
            <Text className="mt-6 text-2xl font-bold text-slate-900">
                {title}
            </Text>
            <Text className="mt-2 text-center text-sm text-slate-500">
                {description}
            </Text>
            <TouchableOpacity
                onPress={onNewChat}
                className="mt-8 flex flex-row items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3"
            >
                <MaterialCommunityIcons
                    name="plus"
                    size={20}
                    color="white"
                />
                <Text className="font-semibold text-white">
                    Start Chat
                </Text>
            </TouchableOpacity>
        </View>
    )
}
