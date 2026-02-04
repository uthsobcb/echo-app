import { useStorage } from '@/context/StorageContext';
import { Entry } from '@/types/data';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

const EntryCard = ({ entry }: { entry?: Entry }) => {
    const { deleteEntry } = useStorage();
    const router = useRouter();

    if (!entry) {
        return (
            <View
                className="mt-2 bg-white rounded-2xl p-5"
                style={{
                    shadowColor: "#000",
                    shadowOpacity: 0.06,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 3,
                }}
            >
                <Text className="text-gray-500 text-center italic">No entries yet. Start writing!</Text>
            </View>
        );
    }

    const id = entry._id || entry.id;
    const date = new Date(entry.createdAt);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

    const handleDelete = () => {
        Alert.alert(
            "Delete Entry",
            "Are you sure you want to delete this entry?",
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
        <View
            className="mt-2 bg-white rounded-2xl p-5"
            style={{
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
                elevation: 3,
            }}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-1">
                    <Text className="text-[11px] tracking-widest text-gray-400 font-semibold uppercase">
                        {dateString}, {timeString}
                    </Text>
                    <View className="flex-row items-center mt-1 gap-2">
                        <View className="bg-purple-100 px-2.5 py-0.5 rounded-full self-start">
                            <Text className="text-purple-700 text-[10px] font-semibold">
                                {entry.mood}
                            </Text>
                        </View>
                        {entry.score && (
                            <View className="bg-blue-100 px-2.5 py-0.5 rounded-full self-start">
                                <Text className="text-blue-700 text-[10px] font-semibold">
                                    Score: {entry.score}/10
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View className="flex-row items-center gap-2">
                    <TouchableOpacity onPress={handleEdit} className="p-1.5 bg-gray-50 rounded-full">
                        <Ionicons name="pencil" size={16} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} className="p-1.5 bg-red-50 rounded-full">
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
            <Text className="mt-3 text-gray-900 text-base font-extrabold" numberOfLines={1}>
                {typeof entry.content === 'string' ? entry.content.split('\n')[0] : "New Entry"}
            </Text>
            <Text
                className="mt-2 text-gray-500 text-sm leading-5"
                numberOfLines={3}
                ellipsizeMode="tail"
            >
                {typeof entry.content === 'string' ? entry.content : ''}
            </Text>
            {entry.comment && (
                <View className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100/30">
                    <Text className="text-blue-800 text-xs italic leading-4">
                        <Ionicons name="sparkles" size={12} color="#1E3A8A" /> "{entry.comment}"
                    </Text>
                </View>
            )}
        </View>
    );
};

export default EntryCard