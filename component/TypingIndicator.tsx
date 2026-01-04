import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { View } from 'react-native'

export const TypingIndicator: React.FC = () => {
    return (
        <View className="mb-4 flex flex-row justify-start">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                <MaterialCommunityIcons
                    name="robot"
                    size={18}
                    color="white"
                />
            </View>
            <View className="items-center justify-center rounded-2xl bg-slate-200 px-4 py-3">
                <View className="flex flex-row gap-1">
                    <View className="h-2 w-2 rounded-full bg-slate-600" />
                    <View className="h-2 w-2 rounded-full bg-slate-600" />
                    <View className="h-2 w-2 rounded-full bg-slate-600" />
                </View>
            </View>
        </View>
    )
}
