import { useStorage } from '@/context/StorageContext';
import { Entry } from '@/types/data';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

const getMoodConfig = (mood: string) => {
    switch (mood) {
        case 'Happy':
            return { color: '#ee9d2b', bg: '#fff7ed', label: 'Happy', emoji: '😊' }; // Primary Orange
        case 'Sad':
            return { color: '#3b82f6', bg: '#dbeafe', label: 'Sad', emoji: '😔' }; // Blue (Keep standard)
        case 'Angry':
            return { color: '#ef4444', bg: '#fee2e2', label: 'Angry', emoji: '😠' }; // Red (Keep standard)
        case 'Excited':
            return { color: '#8b5cf6', bg: '#f3e8ff', label: 'Excited', emoji: '🤩' }; // Purple (Keep standard)
        case 'Calm':
            return { color: '#10b981', bg: '#d1fae5', label: 'Calm', emoji: '😌' }; // Emerald (Keep standard)
        default:
            return { color: '#6b7280', bg: '#f3f4f6', label: mood, emoji: '😐' }; // Gray
    }
};

const EntryCard = ({ entry }: { entry?: Entry }) => {
    const { deleteEntry } = useStorage();

    if (!entry) {
        return (
            <View className="mt-4 bg-white rounded-xl p-8 items-center justify-center border border-zinc-100 border-dashed">
                <Text className="text-gray-400 text-sm font-medium">No entries yet.</Text>
            </View>
        );
    }

    const id = entry._id || entry.id;
    const date = new Date(entry.createdAt);

    // Format: "Oct 12, 10:30 AM"
    const dateTimeString = date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ", " +
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Simulate a title based on content or fallback to Date
    const title = typeof entry.content === 'string' && entry.content.length > 0
        ? entry.content.split('\n')[0].substring(0, 40) + (entry.content.split('\n')[0].length > 40 ? '...' : '')
        : "Start Writing...";

    const moodConfig = getMoodConfig(entry.mood);

    const handleDelete = () => {
        Alert.alert(
            "Delete Entry",
            "Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (id) await deleteEntry(id);
                        } catch (error) {
                            console.error("Failed to delete", error);
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = () => {
        router.push({
            pathname: '/(tabs)/create',
            params: { entryId: id }
        });
    };

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleEdit}
            className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100"
        >
            {/* Header: Date | Mood Pill */}
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-gray-500 text-xs font-medium">
                    {dateTimeString}
                </Text>

                <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: moodConfig.bg }}>
                    <Text style={{ color: moodConfig.color }} className="text-[14px]">
                        {moodConfig.emoji}
                    </Text>
                    <Text style={{ color: moodConfig.color }} className="text-xs font-bold">
                        {entry.score} {moodConfig.label}
                    </Text>
                </View>
            </View>

            {/* Title */}
            <Text className="text-gray-900 text-[18px] font-bold mb-3 leading-tight">
                {title}
            </Text>

            {/* AI Insight Box */}
            {entry.comment && (
                <View className="bg-[#e0e7ff]/30 rounded-lg p-3 mb-3 border-l-4 border-[#4338ca]/40">
                    <View className="flex-row items-center gap-2 mb-1">
                        <Ionicons name="sparkles" size={14} color="#4338ca" />
                        <Text className="text-[#4338ca] text-[10px] uppercase tracking-wider font-bold">
                            AI Insight
                        </Text>
                    </View>

                    <Text className="text-gray-700 text-sm leading-relaxed" numberOfLines={4}>
                        {entry.comment}
                    </Text>
                </View>
            )}

            {!entry.comment && entry.content && (
                <Text className="text-gray-600 text-[14px] leading-[22px] mb-3" numberOfLines={2}>
                    {entry.content.replace(title, '').trim()}
                </Text>
            )}

            {/* Footer: Icons | Read More */}
            <View className="flex-row justify-between items-center pt-1 mt-1">
                <View className="flex-row gap-2">
                    <TouchableOpacity className="p-1">
                        <Ionicons name="chatbubble-outline" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} hitSlop={10} className="p-1">
                        <Ionicons name="trash-outline" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                </View>

                <View className="flex-row items-center gap-0.5">
                    <Text className="text-[#ee9d2b] text-sm font-bold">
                        Read more
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#ee9d2b" />
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default EntryCard;
