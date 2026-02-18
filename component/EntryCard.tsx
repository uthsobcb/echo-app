import { useStorage } from '@/context/StorageContext';
import { Entry } from '@/types/data';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

const getMoodConfig = (mood: string) => {
    switch (mood) {
        case 'Happy':
            return { color: '#16a34a', bg: '#dcfce7', label: 'Happy' };
        case 'Sad':
            return { color: '#2563eb', bg: '#dbeafe', label: 'Sad' };
        case 'Angry':
            return { color: '#dc2626', bg: '#fee2e2', label: 'Angry' };
        case 'Excited':
            return { color: '#ca8a04', bg: '#fef9c3', label: 'Excited' };
        default:
            return { color: '#9333ea', bg: '#f3e8ff', label: mood };
    }
};

const EntryCard = ({ entry }: { entry?: Entry }) => {
    const { deleteEntry } = useStorage();

    if (!entry) {
        return (
            <View className="mt-4 bg-white rounded-2xl p-6 items-center justify-center border border-gray-100">
                <Text className="text-gray-400 text-sm">No entries yet.</Text>
            </View>
        );
    }

    const id = entry._id || entry.id;
    const date = new Date(entry.createdAt);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Simulate a title based on content or fallback to Date
    const title = typeof entry.content === 'string' && entry.content.length > 0
        ? entry.content.split('\n')[0].substring(0, 30) + (entry.content.split('\n')[0].length > 30 ? '...' : '')
        : date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

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
            activeOpacity={0.8}
            onPress={handleEdit}
            className="mt-4 bg-white rounded-2xl p-5 border border-gray-100"
            style={{
                shadowColor: "#000",
                shadowOpacity: 0.04,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 2,
            }}
        >
            {/* Header: Time | Mood Pill */}
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-gray-400 text-xs font-medium uppercase tracking-wide">
                    {timeString}
                </Text>

                <View className="flex-row items-center gap-2 px-2.5 py-1 rounded-full" style={{ backgroundColor: moodConfig.bg }}>
                    <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: moodConfig.color }} />
                    <Text style={{ color: moodConfig.color }} className="text-[10px] font-bold uppercase tracking-wide">
                        {entry.mood} {entry.score ? `• ${entry.score}` : ''}
                    </Text>
                </View>
            </View>

            {/* Content Body */}
            <View className="mb-4">
                <Text className="text-gray-900 text-[18px] font-bold mb-1 leading-tight">
                    {title}
                </Text>
                <Text
                    className="text-gray-500 text-[15px] leading-[24px]"
                    numberOfLines={2}
                >
                    {typeof entry.content === 'string' ? entry.content.replace(title, '').trim() : ''}
                </Text>
            </View>

            {/* Footer: Icons | Read More */}
            <View className="flex-row justify-between items-center pt-2">
                <View className="flex-row gap-3">
                    {entry.imgUrl && <Ionicons name="image-outline" size={16} color="#9ca3af" />}
                    {entry.comment && <Ionicons name="chatbubble-ellipses-outline" size={16} color="#9ca3af" />}
                    <TouchableOpacity onPress={handleDelete} hitSlop={10}>
                        <Ionicons name="trash-outline" size={16} color="#ef4444" style={{ opacity: 0.5 }} />
                    </TouchableOpacity>
                </View>

                <View className="flex-row items-center gap-1">
                    <Text style={{ color: moodConfig.color }} className="text-xs font-bold">
                        Read more
                    </Text>
                    <Ionicons name="arrow-forward" size={12} color={moodConfig.color} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default EntryCard;
