import { useTheme } from '@/context/ThemeContext'
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
    const { colors, isDark } = useTheme()
    const [content, setContent] = useState(initialContent)
    const [attachedImage, setAttachedImage] = useState<string | null>(null)
    const [voiceRecorded, setVoiceRecorded] = useState<string | boolean>(false)
    const [isSaved, setIsSaved] = useState(false)

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
        // Prompts are only useful for jumpstarting a blank entry, not editing one you already wrote.
        ...(onGetPrompt ? [{
            label: 'Prompt',
            icon: 'lightbulb' as const,
            activeColor: colors.primary,
            onPress: () => onGetPrompt(content, setContent),
            active: false,
        }] : []),
        {
            label: attachedImage ? 'Image ✓' : 'Image',
            icon: 'image' as const,
            activeColor: '#059669',
            onPress: handleAttachImage,
            active: !!attachedImage,
        },
        {
            label: voiceRecorded ? 'Stop' : 'Speech',
            icon: 'mic' as const,
            activeColor: '#DC2626',
            onPress: handleVoiceRecord,
            active: !!voiceRecorded,
        },
        {
            label: 'Scan',
            icon: 'draw' as const,
            activeColor: '#7B3FE4',
            onPress: onScanHandwriting,
            active: false,
        },
    ]

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Page Header */}
                    <View style={styles.pageHeader}>
                        <Text style={[styles.pageTitle, { color: colors.text }]}>New Entry</Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            {isSaved && !isSaving && (
                                <View style={[styles.savedBadge, { backgroundColor: isDark ? '#05966926' : '#ECFDF5' }]}>
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
                                    colors={(!isComplete || isSaving) ? [colors.surfaceSecondary, colors.surfaceSecondary] : ['#4F6BFF', '#7B3FE4']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={styles.saveTopBtn}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator size="small" color={(!isComplete || isSaving) ? colors.textSecondary : '#fff'} />
                                    ) : (
                                        <>
                                            {isComplete && <MaterialIcons name="auto-awesome" size={14} color="#fff" style={{ marginRight: 4 }} />}
                                            <Text style={[styles.saveTopText, (!isComplete || isSaving) && { color: colors.textSecondary }]}>
                                                {actionLabel}
                                            </Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>

                    {/* Date */}
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>

                    {/* Text Area — borderless, writes directly on the page */}
                    <TextInput
                        style={[styles.textInput, { color: colors.text }]}
                        placeholder={placeholder}
                        placeholderTextColor={colors.textSecondary}
                        value={content}
                        onChangeText={setContent}
                        multiline
                        textAlignVertical="top"
                        maxLength={1000}
                        scrollEnabled={false}
                    />

                    {/* Stats Bar */}
                    <View style={styles.statsBar}>
                        <Text style={[styles.statsText, { color: colors.textSecondary }]}>{content.length}/1000 • {wordCount} words</Text>
                        {readingTime > 0 && (
                            <View style={[styles.readingBadge, { backgroundColor: colors.primary + '1A' }]}>
                                <MaterialIcons name="schedule" size={13} color={colors.primary} />
                                <Text style={[styles.readingText, { color: colors.primary }]}>~{readingTime} min read</Text>
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
                        {actions.map((action) => {
                            const tint = action.active ? action.activeColor : colors.textSecondary;
                            return (
                                <Pressable
                                    key={action.label}
                                    onPress={action.onPress}
                                    style={({ pressed }) => [
                                        styles.toolBtn,
                                        {
                                            backgroundColor: action.active ? action.activeColor + '1A' : colors.surfaceSecondary,
                                            opacity: pressed ? 0.85 : 1,
                                            borderColor: action.active ? action.activeColor : colors.border,
                                            borderWidth: 1.5,
                                        },
                                    ]}
                                >
                                    <MaterialIcons name={action.icon} size={18} color={tint} />
                                    <Text style={[styles.toolBtnText, { color: tint }]}>{action.label}</Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },

    pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    pageTitle: { fontSize: 26, fontWeight: '800' },
    savedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
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
    saveTopText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },

    dateText: { fontSize: 16, marginBottom: 20, fontFamily: 'Caveat_400Regular' },

    textInput: {
        fontSize: 22,
        lineHeight: 32,
        minHeight: 300,
        fontFamily: 'Caveat_600SemiBold',
        marginBottom: 10,
        // RN Web renders multiline TextInput as a <textarea>, which gets the
        // browser's default focus outline — suppress it for the borderless look.
        outlineStyle: 'none',
    } as any,

    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    statsText: { fontSize: 12, fontWeight: '600' },
    readingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 4,
    },
    readingText: { fontSize: 11, fontWeight: '700' },

    toolbar: { paddingBottom: 4, gap: 12, flexDirection: 'row', marginBottom: 24, paddingHorizontal: 4 },
    toolBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 100,
    },
    toolBtnText: { fontSize: 13, fontWeight: '700' },
})
