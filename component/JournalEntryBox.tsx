import { MaterialIcons } from '@expo/vector-icons'
import React, { useEffect, useMemo, useState } from 'react'
import {
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface JournalEntryBoxProps {
    onSubmit?: (entry: {
        title: string
        content: string
        image?: string
        voice?: string
    }) => void
    onGetPrompt?: (content: string, setContent: React.Dispatch<React.SetStateAction<string>>) => void;
    onVoiceRecord?: (isRecording: boolean, setContent: React.Dispatch<React.SetStateAction<string>>) => Promise<string | null | undefined | boolean>;
    onAttachImage?: () => Promise<string | null | undefined>;
    onScanHandwriting?: () => void;
    placeholder?: string
    initialContent?: string
    actionLabel?: string
}

export default function JournalEntryBox({
    onSubmit,
    onGetPrompt,
    onVoiceRecord,
    onAttachImage,
    onScanHandwriting,
    placeholder = "What's on your mind today?",
    initialContent = '',
    actionLabel = 'Save Entry'
}: JournalEntryBoxProps) {
    const [content, setContent] = useState(initialContent)
    const [attachedImage, setAttachedImage] = useState<string | null>(null)
    const [voiceRecorded, setVoiceRecorded] = useState<string | boolean>(false)
    const [isSaved, setIsSaved] = useState(false)
    const [focusedInput, setFocusedInput] = useState<boolean>(false)

    useEffect(() => {
        if (initialContent) {
            setContent(initialContent)
        }
    }, [initialContent])

    useEffect(() => {
        if (content) {
            const timer = setTimeout(() => {
                setIsSaved(true)
                setTimeout(() => setIsSaved(false), 1800)
            }, 900)
            return () => clearTimeout(timer)
        }
    }, [content])

    const handleSubmit = () => {
        if (!content.trim()) return

        onSubmit?.({
            title: 'Entry',
            content: content.trim(),
            image: typeof attachedImage === 'string' ? attachedImage : undefined,
            voice: typeof voiceRecorded === 'string' ? voiceRecorded : voiceRecorded ? 'recorded' : undefined,
        })

        setContent('')
        setAttachedImage(null)
        setVoiceRecorded(false)
    }

    const handleVoiceRecord = async () => {
        if (onVoiceRecord) {
            const result = await onVoiceRecord(!!voiceRecorded, setContent);
            if (result !== undefined && result !== null) {
                setVoiceRecorded(result);
            }
        } else {
            setVoiceRecorded(!voiceRecorded);
        }
    }

    const handleAttachImage = async () => {
        if (onAttachImage) {
            const result = await onAttachImage();
            if (result) setAttachedImage(result);
        } else {
            setAttachedImage('image-attached');
        }
    }

    const isComplete = !!content.trim()

    const { wordCount, readingTime } = useMemo(() => {
        const trimmed = content.trim()
        const wc = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0
        return { wordCount: wc, readingTime: wc ? Math.max(1, Math.ceil(wc / 200)) : 0 }
    }, [content])

    return (
        <SafeAreaView className="flex-1">
            <View className="flex-1">
                <ScrollView contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
                    <View className="px-4 pt-4">
                        <View
                            className="bg-white rounded-[28px] overflow-hidden mb-4"
                            style={{
                                shadowColor: '#0F172A',
                                shadowOpacity: 0.12,
                                shadowRadius: 30,
                                shadowOffset: { width: 0, height: 14 },
                                elevation: 8,
                            }}
                        >
                            {/* Top accent */}
                            <View className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                            {/* Main */}
                            <View className="p-7">
                                {/* Saved chip (no layout jump) */}
                                <View className="h-9 mb-4 justify-center">
                                    <View
                                        className={`self-start flex-row items-center px-3.5 py-2 rounded-full gap-2 ${isSaved ? 'bg-emerald-50' : 'bg-transparent'
                                            }`}
                                        style={{ opacity: isSaved ? 1 : 0 }}
                                    >
                                        <MaterialIcons name="check-circle" size={16} color="#10B981" />
                                        <Text className="text-xs text-emerald-700 font-bold">Saved</Text>
                                    </View>
                                </View>

                                {/* Input (bigger + cleaner) */}
                                <View
                                    className={`rounded-3xl px-5 py-5 mb-5 ${focusedInput ? 'bg-blue-50' : 'bg-slate-50'
                                        }`}
                                    style={{
                                        borderWidth: 1,
                                        borderColor: focusedInput
                                            ? 'rgba(59,130,246,0.30)'
                                            : 'rgba(148,163,184,0.30)',
                                    }}
                                >
                                    <TextInput
                                        className="text-[17px] text-slate-900 leading-8"
                                        style={{
                                            minHeight: 280, // 🔑 THIS is what actually increases size
                                        }}
                                        placeholder={placeholder}
                                        placeholderTextColor="#94A3B8"
                                        value={content}
                                        onChangeText={setContent}
                                        onFocus={() => setFocusedInput(true)}
                                        onBlur={() => setFocusedInput(false)}
                                        multiline
                                        textAlignVertical="top"
                                        maxLength={1000}
                                        scrollEnabled={false} // Let parent scroll handle it
                                    />
                                </View>


                                {/* Stats */}
                                <View className="flex-row items-center justify-between mb-6 px-1">
                                    <Text className="text-xs text-slate-500 font-semibold">
                                        {content.length}/1000 • {wordCount} words
                                    </Text>

                                    {readingTime > 0 && (
                                        <View
                                            className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
                                            style={{
                                                backgroundColor: 'rgba(2,132,199,0.10)',
                                                borderWidth: 1,
                                                borderColor: 'rgba(2,132,199,0.18)',
                                            }}
                                        >
                                            <MaterialIcons name="schedule" size={14} color="#0284C7" />
                                            <Text className="text-xs text-slate-700 font-bold">~{readingTime} min</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Buttons */}
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    className="mb-5"
                                    contentContainerStyle={{ paddingRight: 8 }}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    <View className="flex-row gap-3">
                                        <Pressable onPress={() => onGetPrompt?.(content, setContent)} className="rounded-2xl overflow-hidden">
                                            {({ pressed }) => (
                                                <View
                                                    className="flex-row items-center justify-center py-3.5 px-5 gap-2"
                                                    style={{
                                                        backgroundColor: 'rgba(37,99,235,0.10)',
                                                        borderWidth: 1,
                                                        borderColor: 'rgba(37,99,235,0.18)',
                                                        opacity: pressed ? 0.9 : 1,
                                                    }}
                                                >
                                                    <MaterialIcons name="lightbulb" size={18} color="#1E40AF" />
                                                    <Text className="text-xs font-bold text-blue-900">Prompt</Text>
                                                </View>
                                            )}
                                        </Pressable>

                                        <Pressable onPress={handleAttachImage} className="rounded-2xl overflow-hidden">
                                            {({ pressed }) => (
                                                <View
                                                    className="flex-row items-center justify-center py-3.5 px-5 gap-2"
                                                    style={{
                                                        backgroundColor: attachedImage
                                                            ? 'rgba(16,185,129,0.12)'
                                                            : 'rgba(15,23,42,0.06)',
                                                        borderWidth: 1,
                                                        borderColor: attachedImage
                                                            ? 'rgba(16,185,129,0.20)'
                                                            : 'rgba(148,163,184,0.25)',
                                                        opacity: pressed ? 0.9 : 1,
                                                    }}
                                                >
                                                    <MaterialIcons
                                                        name="image"
                                                        size={18}
                                                        color={attachedImage ? '#059669' : '#64748B'}
                                                    />
                                                    <Text
                                                        className={`text-xs font-bold ${attachedImage ? 'text-emerald-900' : 'text-slate-700'
                                                            }`}
                                                    >
                                                        Image
                                                    </Text>
                                                </View>
                                            )}
                                        </Pressable>

                                        <Pressable onPress={handleVoiceRecord} className="rounded-2xl overflow-hidden">
                                            {({ pressed }) => (
                                                <View
                                                    className="flex-row items-center justify-center py-3.5 px-5 gap-2"
                                                    style={{
                                                        backgroundColor: voiceRecorded
                                                            ? 'rgba(239,68,68,0.12)'
                                                            : 'rgba(15,23,42,0.06)',
                                                        borderWidth: 1,
                                                        borderColor: voiceRecorded
                                                            ? 'rgba(239,68,68,0.20)'
                                                            : 'rgba(148,163,184,0.25)',
                                                        opacity: pressed ? 0.9 : 1,
                                                    }}
                                                >
                                                    <MaterialIcons name="mic" size={18} color={voiceRecorded ? '#DC2626' : '#64748B'} />
                                                    <Text
                                                        className={`text-xs font-bold ${voiceRecorded ? 'text-red-900' : 'text-slate-700'
                                                            }`}
                                                    >
                                                        Speech
                                                    </Text>
                                                </View>
                                            )}
                                        </Pressable>

                                        <Pressable onPress={onScanHandwriting} className="rounded-2xl overflow-hidden">
                                            {({ pressed }) => (
                                                <View
                                                    className="flex-row items-center justify-center py-3.5 px-5 gap-2"
                                                    style={{
                                                        backgroundColor: 'rgba(124,58,237,0.10)',
                                                        borderWidth: 1,
                                                        borderColor: 'rgba(124,58,237,0.18)',
                                                        opacity: pressed ? 0.9 : 1,
                                                    }}
                                                >
                                                    <MaterialIcons name="draw" size={18} color="#7C3AED" />
                                                    <Text className="text-xs font-bold text-purple-900">Scan</Text>
                                                </View>
                                            )}
                                        </Pressable>
                                    </View>
                                </ScrollView>

                                {/* Submit */}
                                <Pressable onPress={handleSubmit} disabled={!isComplete} className="rounded-2xl overflow-hidden">
                                    {({ pressed }) => (
                                        <View
                                            className={`py-4.5 flex items-center justify-center flex-row gap-2 ${isComplete ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-slate-300'
                                                }`}
                                            style={{ opacity: pressed && isComplete ? 0.92 : 1 }}
                                        >
                                            <MaterialIcons
                                                name={isComplete ? 'check-circle' : 'edit'}
                                                size={20}
                                                color={isComplete ? '#FFFFFF' : '#94A3B8'}
                                            />
                                            <Text className={`font-bold text-base ${isComplete ? 'text-white' : 'text-slate-500'}`}>
                                                {actionLabel}
                                            </Text>
                                        </View>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}
