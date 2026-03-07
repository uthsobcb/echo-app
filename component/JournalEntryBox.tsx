import { MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
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
    isSaving?: boolean
}

export default function JournalEntryBox({
    onSubmit,
    onGetPrompt,
    onVoiceRecord,
    onAttachImage,
    onScanHandwriting,
    placeholder = "What's on your mind today?",
    initialContent = '',
    actionLabel = 'Save',
    isSaving = false
}: JournalEntryBoxProps) {
    const [content, setContent] = useState(initialContent)
    const [attachedImage, setAttachedImage] = useState<string | null>(null)
    const [voiceRecorded, setVoiceRecorded] = useState<string | boolean>(false)
    const [isSaved, setIsSaved] = useState(false)
    const [focusedInput, setFocusedInput] = useState<boolean>(false)

    useEffect(() => {
        if (initialContent) setContent(initialContent)
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
            if (result !== undefined && result !== null) setVoiceRecorded(result);
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

    const actions = [
        {
            label: 'Prompt',
            icon: 'lightbulb' as const,
            color: '#4F6BFF',
            bg: '#EEF1FF',
            onPress: () => onGetPrompt?.(content, setContent),
            active: false,
        },
        {
            label: attachedImage ? 'Image ✓' : 'Image',
            icon: 'image' as const,
            color: attachedImage ? '#059669' : '#7A8499',
            bg: attachedImage ? '#ECFDF5' : '#F5F6FA',
            onPress: handleAttachImage,
            active: !!attachedImage,
        },
        {
            label: voiceRecorded ? 'Stop' : 'Speech',
            icon: 'mic' as const,
            color: voiceRecorded ? '#DC2626' : '#7A8499',
            bg: voiceRecorded ? '#FEF2F2' : '#F5F6FA',
            onPress: handleVoiceRecord,
            active: !!voiceRecorded,
        },
        {
            label: 'Scan',
            icon: 'draw' as const,
            color: '#7B3FE4',
            bg: '#F5F0FF',
            onPress: onScanHandwriting,
            active: false,
        },
    ]

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Page Header */}
                    <View style={styles.pageHeader}>
                        <Text style={styles.pageTitle}>New Entry</Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            {isSaved && !isSaving && (
                                <View style={styles.savedBadge}>
                                    <MaterialIcons name="check-circle" size={14} color="#059669" />
                                    <Text style={styles.savedText}>Saved</Text>
                                </View>
                            )}
                            <Pressable
                                onPress={handleSubmit}
                                disabled={!isComplete || isSaving}
                                style={({ pressed }) => [
                                    { opacity: pressed && isComplete && !isSaving ? 0.8 : 1 }
                                ]}
                            >
                                <LinearGradient
                                    colors={(!isComplete || isSaving) ? ['#E5E8F0', '#E5E8F0'] : ['#4F6BFF', '#7B3FE4']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.saveTopBtn}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator size="small" color={(!isComplete || isSaving) ? '#AAB4C8' : '#fff'} />
                                    ) : (
                                        <>
                                            {isComplete && <MaterialIcons name="auto-awesome" size={14} color="#fff" style={{ marginRight: 4 }} />}
                                            <Text style={[styles.saveTopText, (!isComplete || isSaving) && styles.saveTopTextDisabled]}>
                                                {actionLabel}
                                            </Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>

                    {/* Date */}
                    <Text style={styles.dateText}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>

                    {/* Text Area */}
                    <View style={[styles.inputCard, focusedInput && styles.inputCardFocused]}>
                        <TextInput
                            style={styles.textInput}
                            placeholder={placeholder}
                            placeholderTextColor="#B0BAD0"
                            value={content}
                            onChangeText={setContent}
                            onFocus={() => setFocusedInput(true)}
                            onBlur={() => setFocusedInput(false)}
                            multiline
                            textAlignVertical="top"
                            maxLength={1000}
                            scrollEnabled={false}
                        />
                    </View>

                    {/* Stats Bar */}
                    <View style={styles.statsBar}>
                        <Text style={styles.statsText}>{content.length}/1000 • {wordCount} words</Text>
                        {readingTime > 0 && (
                            <View style={styles.readingBadge}>
                                <MaterialIcons name="schedule" size={13} color="#4F6BFF" />
                                <Text style={styles.readingText}>~{readingTime} min read</Text>
                            </View>
                        )}
                    </View>

                    {/* Action Toolbar */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.toolbar}
                        keyboardShouldPersistTaps="handled"
                    >
                        {actions.map((action) => (
                            <Pressable
                                key={action.label}
                                onPress={action.onPress}
                                style={({ pressed }) => [
                                    styles.toolBtn,
                                    {
                                        backgroundColor: action.bg,
                                        opacity: pressed ? 0.85 : 1,
                                        borderColor: action.active ? action.color : '#E5E8F0',
                                        borderWidth: 1.5,
                                    },
                                ]}
                            >
                                <MaterialIcons name={action.icon} size={18} color={action.color} />
                                <Text style={[styles.toolBtnText, { color: action.color }]}>{action.label}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F5F6FA' },
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },

    pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    pageTitle: { fontSize: 26, fontWeight: '800', color: '#1A1D2E' },
    savedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 4,
    },
    savedText: { fontSize: 12, fontWeight: '700', color: '#059669' },

    saveTopBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 70,
        shadowColor: '#4F6BFF',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    saveTopBtnDisabled: {
        backgroundColor: '#E5E8F0',
    },
    saveTopText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    saveTopTextDisabled: {
        color: '#AAB4C8',
    },

    dateText: { fontSize: 16, color: '#7A8499', marginBottom: 20, fontFamily: 'Caveat_400Regular' },

    inputCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1.5,
        borderColor: '#E5E8F0',
        shadowColor: '#4F6BFF',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
        marginBottom: 10,
    },
    inputCardFocused: {
        borderColor: '#4F6BFF',
        shadowOpacity: 0.12,
    },
    textInput: {
        fontSize: 20,
        color: '#1A1D2E',
        lineHeight: 30,
        minHeight: 260,
        fontFamily: 'Caveat_600SemiBold',
    },

    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    statsText: { fontSize: 12, color: '#7A8499', fontWeight: '600' },
    readingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF1FF',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 4,
    },
    readingText: { fontSize: 11, color: '#4F6BFF', fontWeight: '700' },

    toolbar: { paddingBottom: 4, gap: 12, flexDirection: 'row', marginBottom: 24, paddingHorizontal: 4 },
    toolBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 100,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    toolBtnText: { fontSize: 13, fontWeight: '700' },

    submitBtn: {
        backgroundColor: '#4F6BFF',
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    submitBtnDisabled: { backgroundColor: '#E5E8F0' },
    submitText: { color: '#fff', fontWeight: '800', fontSize: 16, fontFamily: 'Caveat_700Bold' },
    submitTextDisabled: { color: '#AAB4C8' },

    stickyFooter: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E8F0',
    },
})
