import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { Text, View } from 'react-native'

interface ChatMessageProps {
    text: string
    sender: 'user' | 'bot'
    timestamp: Date
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
    text,
    sender,
    timestamp,
}) => {
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

            <View
                className={`max-w-xs rounded-2xl px-4 py-3 ${
                    sender === 'user' ? 'bg-blue-500' : 'bg-slate-200'
                }`}
            >
                <Text
                    className={`text-base ${
                        sender === 'user' ? 'text-white' : 'text-slate-900'
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
            </View>

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
