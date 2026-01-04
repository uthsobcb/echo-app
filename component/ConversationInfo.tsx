import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
} from 'react-native'

interface ConversationInfoProps {
    isVisible: boolean
    onClose: () => void
    title: string
    messageCount: number
    createdAt: Date
    lastMessageAt: Date
    onClearHistory?: () => void
    onArchive?: () => void
}

export const ConversationInfo: React.FC<ConversationInfoProps> = ({
    isVisible,
    onClose,
    title,
    messageCount,
    createdAt,
    lastMessageAt,
    onClearHistory,
    onArchive,
}) => {
    if (!isVisible) return null

    const daysSinceCreated = Math.floor(
        (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    const stats = [
        {
            icon: 'message-multiple-outline',
            label: 'Messages',
            value: messageCount.toString(),
            color: '#3b82f6',
        },
        {
            icon: 'calendar-outline',
            label: 'Created',
            value:
                daysSinceCreated === 0
                    ? 'Today'
                    : daysSinceCreated === 1
                      ? 'Yesterday'
                      : `${daysSinceCreated} days ago`,
            color: '#8b5cf6',
        },
        {
            icon: 'clock-outline',
            label: 'Last Message',
            value: lastMessageAt.toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
            color: '#10b981',
        },
    ]

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50">
                <View className="mt-auto flex flex-col rounded-t-3xl bg-white">
                    {/* Header */}
                    <View className="border-b border-slate-200 px-6 py-4">
                        <View className="flex flex-row items-center justify-between">
                            <Text className="text-xl font-bold text-slate-900">
                                Conversation Info
                            </Text>
                            <TouchableOpacity
                                onPress={onClose}
                                className="rounded-full p-2 active:bg-slate-100"
                            >
                                <MaterialCommunityIcons
                                    name="close"
                                    size={24}
                                    color="#64748b"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Content */}
                    <ScrollView className="max-h-96 px-6 py-6">
                        {/* Title */}
                        <View className="mb-6">
                            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Title
                            </Text>
                            <Text className="mt-2 text-lg font-semibold text-slate-900">
                                {title}
                            </Text>
                        </View>

                        {/* Stats Grid */}
                        <View className="mb-8 gap-3">
                            {stats.map((stat, index) => (
                                <View
                                    key={index}
                                    className="flex flex-row items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                                >
                                    <View
                                        className="rounded-lg p-2"
                                        style={{
                                            backgroundColor: stat.color + '20',
                                        }}
                                    >
                                        <MaterialCommunityIcons
                                            name={stat.icon as any}
                                            size={20}
                                            color={stat.color}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-xs text-slate-500">
                                            {stat.label}
                                        </Text>
                                        <Text className="mt-1 font-semibold text-slate-900">
                                            {stat.value}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Actions */}
                        <View className="gap-2">
                            {onArchive && (
                                <TouchableOpacity className="flex flex-row items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 active:bg-slate-50">
                                    <MaterialCommunityIcons
                                        name="archive-outline"
                                        size={20}
                                        color="#3b82f6"
                                    />
                                    <Text className="text-sm font-medium text-slate-900">
                                        Archive Conversation
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {onClearHistory && (
                                <TouchableOpacity
                                    onPress={onClearHistory}
                                    className="flex flex-row items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 active:bg-red-100"
                                >
                                    <MaterialCommunityIcons
                                        name="trash-can-outline"
                                        size={20}
                                        color="#ef4444"
                                    />
                                    <Text className="text-sm font-medium text-red-600">
                                        Clear History
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>

                    {/* Close Button */}
                    <View className="border-t border-slate-200 px-6 py-4">
                        <TouchableOpacity
                            onPress={onClose}
                            className="rounded-lg bg-slate-100 py-3"
                        >
                            <Text className="text-center font-semibold text-slate-900">
                                Done
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}
