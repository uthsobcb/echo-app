import JournalEntryBox from '@/component/JournalEntryBox';
import React, { useEffect, useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

import { useStorage } from '@/context/StorageContext';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function Create() {
    const { addEntry, entries, updateEntry } = useStorage();
    const router = useRouter();
    const { entryId } = useLocalSearchParams<{ entryId: string }>();

    const [showMoodModal, setShowMoodModal] = useState(false);
    const [pendingEntryContent, setPendingEntryContent] = useState<string>('');
    const [initialContent, setInitialContent] = useState('');

    useEffect(() => {
        if (entryId) {
            const entry = entries.find(e => e.id === entryId);
            if (entry) {
                setInitialContent(typeof entry.content === 'string' ? entry.content : '');
            }
        }
    }, [entryId, entries]);

    const moods = ['Happy 😊', 'Excited 🤩', 'Grateful 😇', 'Relaxed 😌', 'Neutral 😐', 'Tired 😴', 'Sad 😔', 'Anxious 😰', 'Angry 😠'];

    const handleSubmit = (entry: any) => {
        // Intercept submit to show mood modal
        const content = typeof entry === 'string' ? entry : entry.content;
        setPendingEntryContent(content);
        setShowMoodModal(true);
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
            console.error("Failed to save entry:", error);
        }
    };

    const handleGetPrompt = () => {
        console.log('Get prompt')
    }

    const handleVoiceRecord = () => {
        console.log('Start voice recording')
    }

    const handleAttachImage = () => {
        console.log('Attach image')
    }

    const handleScanHandwriting = () => {
        console.log('Scan handwriting')
    }

    return (
        <View className="flex-1 bg-white">
            <JournalEntryBox
                onSubmit={handleSubmit}
                initialContent={initialContent}
                actionLabel={entryId ? "Update Entry" : "Save Entry"}
                onGetPrompt={handleGetPrompt}
                onVoiceRecord={handleVoiceRecord}
                onAttachImage={handleAttachImage}
                onScanHandwriting={handleScanHandwriting}
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
        </View>
    )
}