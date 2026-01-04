import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface ChatHistoryItemProps {
    id: string
    title: string
    timestamp: Date
    messageCount: number
    onPress: () => void
    onDelete: () => void
}

export const ChatHistoryItem: React.FC<ChatHistoryItemProps> = ({
    title,
    timestamp,
    messageCount,
    onPress,
    onDelete,
}) => {
    const isToday = new Date().toDateString() === timestamp.toDateString()
    const timeString = isToday
        ? timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
          })
        : timestamp.toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
          })

    return (
        <TouchableOpacity
            onPress={onPress}
            className="mb-2 flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
        >
            <View className="flex-1">
                <View className="flex flex-row items-center gap-2">
                    <MaterialCommunityIcons
                        name="message-outline"
                        size={16}
                        color="#3b82f6"
                    />
                    <Text className="flex-1 text-sm font-semibold text-slate-900">
                        {title}
                    </Text>
                </View>
                <View className="mt-1 flex flex-row items-center gap-3">
                    <Text className="text-xs text-slate-500">{timeString}</Text>
                    <Text className="text-xs text-slate-400">
                        {messageCount} messages
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                onPress={onDelete}
                className="ml-2 p-2"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={18}
                    color="#ef4444"
                />
            </TouchableOpacity>
        </TouchableOpacity>
    )
}
