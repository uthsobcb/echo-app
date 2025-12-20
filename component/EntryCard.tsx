import React from 'react'
import { Text, View } from 'react-native'

const EntryCard = () => {
    return (

        <View
            className="mt-2 bg-white rounded-2xl p-5"
            style={{
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
                elevation: 3,
            }}
        >
            <View className="flex-row items-center justify-between">
                <Text className="text-[11px] tracking-widest text-gray-400 font-semibold">
                    TODAY, 8:30 PM
                </Text>

                <View className="flex-row items-center bg-purple-100 px-3 py-1 rounded-full">
                    <Text className="text-purple-700 text-xs font-semibold">
                        😰 Anxious
                    </Text>
                </View>
            </View>
            <Text className="mt-2 text-gray-900 text-base font-extrabold">
                Reflecting on the meeting
            </Text>
            <Text
                className="mt-2 text-gray-500 text-sm leading-5"
                numberOfLines={3}
                ellipsizeMode="tail"
            >
                I had a tough meeting today where I felt unheard. It started when I tried to
                present my idea about the new project timeline, but the conversation quickly
                shifted and I couldn’t get a word in...
            </Text>
        </View>
    )
}

export default EntryCard