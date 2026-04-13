import JournalEntryBox from '@/component/JournalEntryBox';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Text, TouchableOpacity, View } from 'react-native';

import { useStorage } from '@/context/StorageContext';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { logger } from '@/service/logger';

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
    const router = useRouter();
    const { entryId } = useLocalSearchParams<{ entryId: string }>();

    const [showMoodModal, setShowMoodModal] = useState(false);
    const [pendingEntryContent, setPendingEntryContent] = useState<string>('');
    const [initialContent, setInitialContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [aiCommentModal, setAiCommentModal] = useState<string | null>(null);

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

    const moods = ['Happy 😊', 'Excited 🤩', 'Grateful 😇', 'Relaxed 😌', 'Neutral 😐', 'Tired 😴', 'Sad 😔', 'Anxious 😰', 'Angry 😠'];

    const handleSubmit = async (entry: string | { content: string }) => {
        const content = typeof entry === 'string' ? entry : entry.content;

        if (appMode === 'api') {
            try {
                setIsSaving(true);
                if (entryId) {
                    await updateEntry(entryId, { content });
                    router.push('/(tabs)');
                } else {
                    const newEntry = await addEntry({ content, mood: 'AI' }); // Mood is handled by backend
                    if (newEntry && newEntry.comment) {
                        setAiCommentModal(newEntry.comment);
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
                await updateEntry(entryId, {
                    content: pendingEntryContent,
                    mood: mood,
                });
            } else {
                await addEntry({
                    content: pendingEntryContent,
                    mood: mood,
                    date: new Date().toISOString()
                });
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

                ExpoSpeechRecognitionModule.start({
                    lang: 'en-US',
                    interimResults: false,
                    maxAlternatives: 1,
                });

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
        <View className="flex-1 bg-white">
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

            <Modal
                animationType="fade"
                transparent={true}
                visible={showMoodModal}
                onRequestClose={() => setShowMoodModal(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-white m-5 p-6 rounded-3xl w-[90%] shadow-xl">
                        <Text className="text-xl font-bold text-center mb-6 text-gray-900">How are you feeling?</Text>

                        <View className="flex-row flex-wrap justify-center gap-3">
                            {moods.map((mood) => (
                                <TouchableOpacity
                                    key={mood}
                                    onPress={() => handleSaveWithMood(mood)}
                                    className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl mb-2"
                                >
                                    <Text className="text-base">{mood}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowMoodModal(false)}
                            className="mt-6 self-center"
                        >
                            <Text className="text-gray-500 font-medium">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* AI Comment Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={!!aiCommentModal}
                onRequestClose={() => {
                    setAiCommentModal(null);
                    router.push('/(tabs)');
                }}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-white m-5 p-6 rounded-3xl w-[90%] shadow-xl items-center">
                        <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-4">
                            <Text className="text-3xl">✨</Text>
                        </View>
                        <Text className="text-xl font-bold text-center mb-2 text-gray-900">Echo's Insight</Text>
                        <Text className="text-base text-gray-600 text-center mb-6 leading-6">
                            {aiCommentModal}
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                setAiCommentModal(null);
                                router.push('/(tabs)');
                            }}
                            className="bg-blue-600 px-6 py-3 rounded-2xl w-full items-center"
                        >
                            <Text className="text-white font-bold text-base">Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    )
}