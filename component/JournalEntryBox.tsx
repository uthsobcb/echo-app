import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

interface JournalEntryBoxProps {
    onSubmit?: (entry: { title: string; content: string; image?: string; voice?: string }) => void
    onGetPrompt?: () => void
    onVoiceRecord?: () => void
    onAttachImage?: () => void
    onScanHandwriting?: () => void
    placeholder?: string
}

export default function JournalEntryBox({
    onSubmit,
    onGetPrompt,
    onVoiceRecord,
    onAttachImage,
    onScanHandwriting,
    placeholder = "What's on your mind today?",
}: JournalEntryBoxProps) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [attachedImage, setAttachedImage] = useState<string | null>(null)
    const [voiceRecorded, setVoiceRecorded] = useState<boolean>(false)

    const handleSubmit = () => {
        if (!title.trim() || !content.trim()) {
            return
        }

        onSubmit?.({
            title: title.trim(),
            content: content.trim(),
            image: attachedImage || undefined,
            voice: voiceRecorded ? 'recorded' : undefined,
        })

        // Reset form
        setTitle('')
        setContent('')
        setAttachedImage(null)
        setVoiceRecorded(false)
    }

    const handleVoiceRecord = () => {
        onVoiceRecord?.()
        setVoiceRecorded(true)
    }

    const handleAttachImage = () => {
        onAttachImage?.()
        setAttachedImage('image-attached')
    }

    const isComplete = title.trim() && content.trim()

    return (
        <View className="bg-white rounded-2xl p-5 mb-4" style={{
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
        }}>
            {/* Title Input */}
            <TextInput
                className="text-lg font-bold text-gray-900 mb-3"
                placeholder="Entry title"
                placeholderTextColor="#D1D5DB"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
            />

            {/* Content Input */}
            <TextInput
                className="text-sm text-gray-700 mb-4 leading-5"
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={1000}
            />

            {/* Character Count */}
            <Text className="text-xs text-gray-400 mb-4 text-right">
                {content.length}/1000
            </Text>

            {/* Feature Buttons */}
            <View className="flex-row gap-2 mb-4">
                {/* Get Prompt Button */}
                <Pressable
                    onPress={onGetPrompt}
                    className="flex-1 flex-row items-center justify-center bg-blue-100 py-3 rounded-xl gap-2"
                >
                    <MaterialIcons name="lightbulb" size={18} color="#1E40AF" />
                    <Text className="text-xs font-semibold text-blue-900">Prompt</Text>
                </Pressable>

                {/* Attach Image Button */}
                <Pressable
                    onPress={handleAttachImage}
                    className={`flex-1 flex-row items-center justify-center py-3 rounded-xl gap-2 ${attachedImage ? 'bg-green-100' : 'bg-gray-100'
                        }`}
                >
                    <MaterialIcons
                        name="image"
                        size={18}
                        color={attachedImage ? '#166534' : '#6B7280'}
                    />
                    <Text
                        className={`text-xs font-semibold ${attachedImage ? 'text-green-900' : 'text-gray-700'
                            }`}
                    >
                        Image
                    </Text>
                </Pressable>

                {/* Voice Record Button */}
                <Pressable
                    onPress={handleVoiceRecord}
                    className={`flex-1 flex-row items-center justify-center py-3 rounded-xl gap-2 ${voiceRecorded ? 'bg-red-100' : 'bg-gray-100'
                        }`}
                >
                    <MaterialIcons
                        name="mic"
                        size={18}
                        color={voiceRecorded ? '#991B1B' : '#6B7280'}
                    />
                    <Text
                        className={`text-xs font-semibold ${voiceRecorded ? 'text-red-900' : 'text-gray-700'
                            }`}
                    >
                        Voice
                    </Text>
                </Pressable>

                {/* Scan Handwriting Button */}
                <Pressable
                    onPress={onScanHandwriting}
                    className="flex-1 flex-row items-center justify-center bg-purple-100 py-3 rounded-xl gap-2"
                >
                    <MaterialIcons name="draw" size={18} color="#5B21B6" />
                    <Text className="text-xs font-semibold text-purple-900">Scan</Text>
                </Pressable>
            </View>

            {/* Submit Button */}
            <Pressable
                onPress={handleSubmit}
                disabled={!isComplete}
                className={`py-3 rounded-xl flex items-center justify-center ${isComplete ? 'bg-gray-900' : 'bg-gray-300'
                    }`}
            >
                <Text className={`font-bold ${isComplete ? 'text-white' : 'text-gray-500'
                    }`}>
                    Save Entry
                </Text>
            </Pressable>
        </View>
    )
}
