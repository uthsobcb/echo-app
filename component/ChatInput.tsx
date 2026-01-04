import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'

interface ChatInputProps {
    value: string
    onChangeText: (text: string) => void
    onSend: () => void
    isLoading: boolean
}

export const ChatInput: React.FC<ChatInputProps> = ({
    value,
    onChangeText,
    onSend,
    isLoading,
}) => {
    return (
        <View className="border-t border-slate-200 bg-white px-4 py-4">
            <View className="flex flex-row items-center gap-2">
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder="Type your message..."
                    placeholderTextColor="#94a3b8"
                    editable={!isLoading}
                    multiline
                    maxLength={500}
                    className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
                />
                <TouchableOpacity
                    onPress={onSend}
                    disabled={!value.trim() || isLoading}
                    className={`h-10 w-10 items-center justify-center rounded-full ${
                        value.trim() && !isLoading
                            ? 'bg-blue-500'
                            : 'bg-slate-300'
                    }`}
                >
                    <MaterialCommunityIcons
                        name="send"
                        size={20}
                        color="white"
                    />
                </TouchableOpacity>
            </View>
            <Text className="mt-2 text-xs text-slate-500">
                {value.length}/500
            </Text>
        </View>
    )
}
