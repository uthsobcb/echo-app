import JournalEntryBox from '@/component/JournalEntryBox';
import { useGamification } from '@/context/GamificationContext';
import { useStorage } from '@/context/StorageContext';
import { logger } from '@/service/logger';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { StreakData } from '@/types/data';

// Safely load expo-speech-recognition (not available in Expo Go)
let ExpoSpeechRecognitionModule: Record<string, Function> | null = null;
let useSpeechRecognitionEvent: (event: string, cb: (e: { results: { transcript: string }[] }) => void) => void = () => { };
try {
    const sr = require('expo-speech-recognition');
    ExpoSpeechRecognitionModule = sr.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = sr.useSpeechRecognitionEvent;
} catch {
    logger.info('[SpeechRecognition] Not available in this environment (Expo Go).');
}

export default function Create() {
    const { addEntry, entries, updateEntry, appMode } = useStorage();
    const { handleEntryCreated, state: gam } = useGamification();
    const { colors } = useTheme();
    const router = useRouter();
    const { entryId } = useLocalSearchParams<{ entryId: string }>();

    const [showMoodModal, setShowMoodModal] = useState(false);
    const [pendingEntryContent, setPendingEntryContent] = useState<string>('');
    const [initialContent, setInitialContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [resultData, setResultData] = useState<{ comment: string; xp: number; streak: number; milestone?: string | null } | null>(null);

    const contentSetterRef = useRef<React.Dispatch<React.SetStateAction<string>> | null>(null);

    useSpeechRecognitionEvent('result', (event) => {
        const transcript = event.results[0]?.transcript;
        if (transcript && contentSetterRef.current) {
            contentSetterRef.current((prev) => prev ? `${prev} ${transcript}` : transcript);
        }
    });

    useEffect(() => {
        if (entryId) {
            const entry = entries.find(e => (e.id === entryId || e._id === entryId));
            if (entry) {
                setInitialContent(typeof entry.content === 'string' ? entry.content : '');
            }
        }
    }, [entryId, entries]);

    const moods = ['Happy', 'Excited', 'Grateful', 'Relaxed', 'Neutral', 'Tired', 'Sad', 'Anxious', 'Angry'];

    const handleSubmit = async (entry: string | { content: string }) => {
        const content = typeof entry === 'string' ? entry : entry.content;

        if (appMode === 'api') {
            try {
                setIsSaving(true);
                if (entryId) {
                    await updateEntry(entryId, { content });
                    router.push('/(tabs)');
                } else {
                    const newEntry = await addEntry({ content, mood: 'AI' });
                    if (newEntry) {
                        // Trigger gamification celebrations
                        const streakData = (newEntry as any).streakData as StreakData | undefined;
                        if (streakData) {
                            handleEntryCreated(streakData);
                        }

                        // Show result modal with AI comment + gamification data
                        setResultData({
                            comment: newEntry.comment || '',
                            xp: streakData?.totalXp ?? gam.totalXp,
                            streak: streakData?.currentStreak ?? gam.currentStreak,
                            milestone: streakData?.milestone,
                        });
                        setShowResultModal(true);
                    } else {
                        router.push('/(tabs)');
                    }
                }
            } catch (error) {
                logger.error("Failed to save entry:", error);
            } finally {
                setIsSaving(false);
            }
        } else {
            setPendingEntryContent(content);
            setShowMoodModal(true);
        }
    };

    const handleSaveWithMood = async (mood: string) => {
        try {
            if (entryId) {
                await updateEntry(entryId, { content: pendingEntryContent, mood });
            } else {
                await addEntry({ content: pendingEntryContent, mood, date: new Date().toISOString() });
            }
            setShowMoodModal(false);
            router.push('/(tabs)');
        } catch (error) {
            logger.error("Failed to save entry:", error);
        }
    };

    const handleGetPrompt = (current: string, setContent: React.Dispatch<React.SetStateAction<string>>) => {
        const prompts = [
            "What are you most grateful for today?",
            "What is a challenge you overcame recently?",
            "Describe a moment that made you smile today.",
            "What is something you want to achieve this week?",
            "What is a thought that keeps returning to your mind?",
            "How are you prioritizing your mental health today?",
            "What is a memory that brought you joy recently?"
        ];
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
        setContent(current ? `${current}\n\n${randomPrompt}` : randomPrompt);
    };

    const handleVoiceRecord = async (isRecording: boolean, setContent: React.Dispatch<React.SetStateAction<string>>) => {
        if (!ExpoSpeechRecognitionModule) {
            Alert.alert('Not Available', 'Voice recording requires a development build, not Expo Go.');
            return false;
        }
        try {
            if (isRecording) {
                ExpoSpeechRecognitionModule.stop();
                return false;
            } else {
                contentSetterRef.current = setContent;
                const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert('Permission needed', 'Speech recognition permission is required.');
                    return false;
                }
                ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: false, maxAlternatives: 1 });
                return true;
            }
        } catch (err) {
            logger.error('Failed to start speech recognition', err);
            Alert.alert('Error', 'Failed to start speech recognition');
            return false;
        }
    };

    const handleAttachImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Sorry, camera roll permissions are required!');
                return undefined;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                return result.assets[0].uri;
            }
        } catch (error) {
            logger.error('Failed to pick image', error);
            Alert.alert('Error', 'Failed to pick image');
        }
        return undefined;
    };

    const handleScanHandwriting = () => {
        Alert.alert('Coming Soon', 'Handwriting OCR scanning will be available in a future update.');
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* XP reward preview */}
            {!entryId && appMode === 'api' && (
                <View style={[s.rewardPreview, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={s.rewardText}> +10 XP</Text>
                    {gam.streakAtRisk && (
                        <Text style={s.riskText}> Streak at risk!</Text>
                    )}
                </View>
            )}

            <JournalEntryBox
                onSubmit={handleSubmit}
                initialContent={initialContent}
                actionLabel={entryId ? "Update" : "Save"}
                onGetPrompt={handleGetPrompt}
                onVoiceRecord={handleVoiceRecord}
                onAttachImage={handleAttachImage}
                onScanHandwriting={handleScanHandwriting}
                isSaving={isSaving}
            />

            {/* Mood Picker (local mode) */}
            <Modal animationType="fade" transparent visible={showMoodModal} onRequestClose={() => setShowMoodModal(false)}>
                <View style={s.modalOverlay}>
                    <View style={[s.modalCard, { backgroundColor: colors.surface }]}>
                        <Text style={[s.modalTitle, { color: colors.text }]}>How are you feeling?</Text>
                        <View style={s.moodGrid}>
                            {moods.map((mood) => (
                                <TouchableOpacity key={mood} onPress={() => handleSaveWithMood(mood)} style={[s.moodChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                                    <Text style={[s.moodChipText, { color: colors.text }]}>{mood}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity onPress={() => setShowMoodModal(false)} style={s.cancelBtn}>
                            <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Gamified Result Modal (API mode) */}
            <Modal
                animationType="fade"
                transparent
                visible={showResultModal}
                onRequestClose={() => { setShowResultModal(false); router.push('/(tabs)'); }}
            >
                <View style={s.modalOverlay}>
                    <View style={[s.resultCard, { backgroundColor: colors.surface }]}>
                        {/* XP Badge */}
                        <View style={s.xpBadge}>
                            <Text style={s.xpBadgeText}>+10 XP</Text>
                        </View>

                        {/* Streak */}
                        <View style={s.streakRow}>
                            <Text style={s.streakEmoji}></Text>
                            <Text style={[s.streakVal, { color: colors.text }]}>{resultData?.streak ?? 0} Day Streak</Text>
                        </View>

                        {/* Milestone */}
                        {resultData?.milestone && (
                            <View style={s.milestoneBanner}>
                                <Text style={s.milestoneText}> {resultData.milestone}</Text>
                            </View>
                        )}

                        {/* AI Comment */}
                        {resultData?.comment ? (
                            <>
                                <View style={s.divider} />
                                <View style={s.commentSection}>
                                    <Text style={[s.commentLabel, { color: colors.textSecondary }]}>Echo's Insight</Text>
                                    <Text style={[s.commentText, { color: colors.text }]}>{resultData.comment}</Text>
                                </View>
                            </>
                        ) : null}

                        <TouchableOpacity
                            onPress={() => { setShowResultModal(false); router.push('/(tabs)'); }}
                            style={s.doneBtn}
                        >
                            <Text style={s.doneBtnText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    rewardPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 16 },
    rewardText: { fontSize: 13, fontWeight: '700', color: '#F59E0B' },
    riskText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },

    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalCard: { margin: 20, padding: 24, borderRadius: 24, width: '90%', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
    moodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
    moodChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1 },
    moodChipText: { fontSize: 15, fontWeight: '600' },
    cancelBtn: { marginTop: 20 },

    resultCard: { margin: 20, padding: 28, borderRadius: 28, width: '90%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
    xpBadge: { backgroundColor: '#FEF3C7', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 10, marginBottom: 16 },
    xpBadgeText: { fontSize: 22, fontWeight: '900', color: '#F59E0B' },
    streakRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    streakEmoji: { fontSize: 28 },
    streakVal: { fontSize: 20, fontWeight: '800' },
    milestoneBanner: { backgroundColor: '#FFF7ED', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, marginBottom: 8 },
    milestoneText: { fontSize: 14, fontWeight: '700', color: '#C2410C', textAlign: 'center' },
    divider: { height: 1, backgroundColor: '#E5E7EB', width: '100%', marginVertical: 16 },
    commentSection: { width: '100%', marginBottom: 16 },
    commentLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
    commentText: { fontSize: 15, lineHeight: 22 },
    doneBtn: { backgroundColor: '#4F6BFF', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
    doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
