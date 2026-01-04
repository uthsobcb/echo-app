import { MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

interface EnhancedChatMessageProps {
    text: string
    sender: 'user' | 'bot'
    timestamp: Date
    isExpanded?: boolean
    onPress?: () => void
    onReact?: (emoji: string) => void
    reactions?: Record<string, number>
}

const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥']

export const EnhancedChatMessage: React.FC<EnhancedChatMessageProps> = ({
    text,
    sender,
    timestamp,
    isExpanded = false,
    onPress,
    onReact,
    reactions = {},
}) => {
    const [showReactions, setShowReactions] = useState(false)

    return (
        <View
            className={`mb-4 flex flex-row ${
                sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
        >
            {sender === 'bot' && (
                <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                    <MaterialCommunityIcons
                        name="robot"
                        size={18}
                        color="white"
                    />
                </View>
            )}

            <TouchableOpacity
                onPress={onPress}
                className={`max-w-xs rounded-2xl px-4 py-3 ${
                    sender === 'user' ? 'bg-blue-500' : 'bg-slate-200'
                }`}
            >
                <Text
                    className={`text-base ${
                        sender === 'user'
                            ? 'text-white'
                            : 'text-slate-900'
                    }`}
                >
                    {text}
                </Text>
                <Text
                    className={`mt-1 text-xs ${
                        sender === 'user'
                            ? 'text-blue-100'
                            : 'text-slate-600'
                    }`}
                >
                    {timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </Text>

                {/* Reactions Display */}
                {Object.keys(reactions).length > 0 && (
                    <View className="mt-2 flex flex-row flex-wrap gap-1">
                        {Object.entries(reactions).map(([emoji, count]) => (
                            <TouchableOpacity
                                key={emoji}
                                className="flex flex-row items-center gap-1 rounded-full bg-black/10 px-2 py-1"
                                onPress={() => {
                                    if (onReact) onReact(emoji)
                                }}
                            >
                                <Text className="text-sm">{emoji}</Text>
                                {count > 1 && (
                                    <Text className="text-xs font-semibold text-slate-700">
                                        {count}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </TouchableOpacity>

            {/* Reaction Button */}
            {isExpanded && (
                <TouchableOpacity
                    onPress={() => setShowReactions(!showReactions)}
                    className="ml-2 items-center justify-center"
                >
                    <MaterialCommunityIcons
                        name="emoticon-outline"
                        size={20}
                        color="#94a3b8"
                    />
                    {showReactions && (
                        <View className="absolute bottom-10 left-0 flex flex-row gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-md">
                            {reactionEmojis.map((emoji) => (
                                <TouchableOpacity
                                    key={emoji}
                                    onPress={() => {
                                        if (onReact) onReact(emoji)
                                        setShowReactions(false)
                                    }}
                                    className="p-1 hover:bg-slate-100"
                                >
                                    <Text className="text-lg">{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </TouchableOpacity>
            )}

            {sender === 'user' && (
                <View className="ml-3 h-8 w-8 items-center justify-center rounded-full bg-slate-400">
                    <MaterialCommunityIcons
                        name="account-circle"
                        size={24}
                        color="white"
                    />
                </View>
            )}
        </View>
    )
}
