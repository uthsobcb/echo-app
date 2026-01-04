import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Badge } from './Badge'

interface ChatHeaderProps {
    title: string
    isLoading?: boolean
    hasUnread?: number
    onMenuPress: () => void
    onNewChatPress: () => void
    onMorePress?: () => void
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    title,
    isLoading = false,
    hasUnread = 0,
    onMenuPress,
    onNewChatPress,
    onMorePress,
}) => {
    return (
        <View className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
            <View className="flex flex-row items-center justify-between">
                {/* Left Section - Menu */}
                <TouchableOpacity
                    onPress={onMenuPress}
                    className="rounded-lg p-2 active:bg-slate-100"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <MaterialCommunityIcons
                        name="menu"
                        size={28}
                        color="#3b82f6"
                    />
                </TouchableOpacity>

                {/* Center Section - Title */}
                <View className="flex-1 items-center px-4">
                    <Text
                        numberOfLines={1}
                        className="text-lg font-bold text-slate-900"
                    >
                        {title}
                    </Text>
                    {isLoading && (
                        <View className="mt-1 flex flex-row items-center gap-1">
                            <MaterialCommunityIcons
                                name="dots-horizontal"
                                size={14}
                                color="#3b82f6"
                            />
                            <Text className="text-xs text-slate-500">
                                Thinking...
                            </Text>
                        </View>
                    )}
                </View>

                {/* Right Section - Actions */}
                <View className="flex flex-row items-center gap-2">
                    {hasUnread > 0 && <Badge count={hasUnread} />}
                    <TouchableOpacity
                        onPress={onNewChatPress}
                        className="rounded-lg p-2 active:bg-slate-100"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MaterialCommunityIcons
                            name="plus-circle"
                            size={28}
                            color="#3b82f6"
                        />
                    </TouchableOpacity>
                    {onMorePress && (
                        <TouchableOpacity
                            onPress={onMorePress}
                            className="rounded-lg p-2 active:bg-slate-100"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <MaterialCommunityIcons
                                name="dots-vertical"
                                size={28}
                                color="#3b82f6"
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    )
}
