import { useStorage } from '@/context/StorageContext';
import { Entry } from '@/types/data';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

const THEMES = [
    { color: '#ee9d2b', bg: '#fff7ed', label: 'Orange' }, // Primary Orange
    { color: '#4f46e5', bg: '#eef2ff', label: 'Indigo' }, // Indigo
    { color: '#059669', bg: '#ecfdf5', label: 'Emerald' }, // Emerald
    { color: '#db2777', bg: '#fdf2f8', label: 'Pink' },   // Pink
];

const getTheme = (id: string) => {
    if (!id) return THEMES[0];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return THEMES[hash % THEMES.length];
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

    const id = entry._id || entry.id || 'default';
    const date = new Date(entry.createdAt);
    const theme = getTheme(id);

    // Format: "Oct 12, 10:30 AM"
    const dateTimeString = date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ", " +
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Simulate a title based on content or fallback to Date
    const title = typeof entry.content === 'string' && entry.content.length > 0
        ? entry.content.split('\n')[0].substring(0, 40) + (entry.content.split('\n')[0].length > 40 ? '...' : '')
        : "Start Writing...";

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
            className="mt-5 bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
            {/* Header: Date | Mood Pill */}
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-gray-500 text-xs font-medium">
                    {dateTimeString}
                </Text>

                <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: theme.bg }}>
                    <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.color }} />
                    <Text style={{ color: theme.color }} className="text-xs font-bold">
                        {entry.score} {entry.mood}
                    </Text>
                </View>
            </View>

            {/* Title */}
            <Text className="text-gray-900 text-[18px] font-bold mb-4 leading-tight">
                {title}
            </Text>

            {/* AI Insight Box */}
            {entry.comment && (
                <View
                    className="rounded-lg p-4 mb-4 border-l-4"
                    style={{
                        backgroundColor: '#eff6ff', // Solid Light Indigo
                        borderColor: '#4338ca', // Solid Deep Indigo
                        borderLeftWidth: 4
                    }}
                >
                    <View className="flex-row items-center gap-2 mb-1.5">
                        <Ionicons name="sparkles" size={14} color="#4338ca" />
                        <Text style={{ color: '#4338ca' }} className="text-[10px] uppercase tracking-wider font-bold">
                            AI Insight
                        </Text>
                    </View>

                    <Text className="text-gray-700 text-sm leading-relaxed" numberOfLines={2}>
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
                    <Text style={{ color: theme.color }} className="text-sm font-bold">
                        Read more
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.color} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default EntryCard;
