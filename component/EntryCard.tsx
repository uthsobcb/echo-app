import { useStorage } from '@/context/StorageContext';
import { Entry } from '@/types/data';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const THEMES = [
    { color: '#4F6BFF', bg: '#EEF1FF' },
    { color: '#7B3FE4', bg: '#F5F0FF' },
    { color: '#059669', bg: '#ECFDF5' },
    { color: '#DB2777', bg: '#FDF2F8' },
];

const getTheme = (id: string) => {
    if (!id) return THEMES[0];
    const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return THEMES[hash % THEMES.length];
};

const EntryCard = ({ entry }: { entry?: Entry }) => {
    const { deleteEntry } = useStorage();
    const { colors, isDark } = useTheme();

    if (!entry) {
        return (
            <View className="mt-3 rounded-2xl p-7 items-center border border-dashed border-2" style={{ borderColor: colors.border }}>
                <Text className="text-[14px] font-semibold" style={{ color: colors.textSecondary }}>No entries yet. Start writing! ✍️</Text>
            </View>
        );
    }

    const id = entry._id || entry.id || 'default';
    const date = new Date(entry.createdAt);
    const theme = getTheme(id);

    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const title = typeof entry.content === 'string' && entry.content.length > 0
        ? entry.content.split('\n')[0].substring(0, 45) + (entry.content.split('\n')[0].length > 45 ? '…' : '')
        : 'Start Writing…';

    const handleDelete = () => {
        Alert.alert('Delete Entry', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { try { if (id) await deleteEntry(id); } catch (e) { console.error('Failed to delete', e); } } },
        ]);
    };

    const handleEdit = () => {
        router.push({ pathname: '/(tabs)/create', params: { entryId: id } });
    };

    const adjustedBg = isDark ? theme.bg + '40' : theme.bg;

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={handleEdit} className="rounded-[20px] flex-row overflow-hidden" style={{ backgroundColor: colors.surface }}>
            <View className="w-1" style={{ backgroundColor: theme.color }} />
            <View className="flex-1 p-4">
                <View className="flex-row justify-between items-center mb-2.5">
                    <Text className="text-[12px] font-medium" style={{ color: colors.textSecondary }}>{dateStr}</Text>
                    {entry.mood ? (
                        <View className="flex-row items-center rounded-full px-2.5 py-1 gap-1.5" style={{ backgroundColor: adjustedBg }}>
                            <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.color }} />
                            <Text className="text-[11px] font-bold" style={{ color: theme.color }}>
                                {entry.score != null ? `${entry.score} ` : ''}{entry.mood}
                            </Text>
                        </View>
                    ) : null}
                </View>
                <Text className="text-[19px] font-extrabold leading-[25px] mb-2.5" style={{ color: colors.text }} numberOfLines={2}>{title}</Text>
                {entry.comment ? (
                    <View className="rounded-2xl p-2.5 mb-3" style={{ borderLeftWidth: 3, borderLeftColor: theme.color, backgroundColor: adjustedBg }}>
                        <View className="flex-row items-center gap-1.5 mb-1">
                            <Ionicons name="sparkles" size={13} color={theme.color} />
                            <Text className="text-[10px] font-extrabold tracking-wider" style={{ color: theme.color }}>AI INSIGHT</Text>
                        </View>
                        <Text className="text-[13px] leading-[19px]" style={{ color: colors.textSecondary }} numberOfLines={2}>{entry.comment}</Text>
                    </View>
                ) : entry.content ? (
                    <Text className="text-[16px] leading-[22px] mb-2.5" style={{ color: colors.textSecondary }} numberOfLines={2}>
                        {entry.content.replace(title.replace('…', ''), '').trim()}
                    </Text>
                ) : null}
                <View className="flex-row justify-between items-center mt-1">
                    <TouchableOpacity onPress={handleDelete} hitSlop={10} className="p-1">
                        <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleEdit} className="flex-row items-center gap-0.5">
                        <Text className="text-[13px] font-bold" style={{ color: theme.color }}>Read more</Text>
                        <Ionicons name="chevron-forward" size={14} color={theme.color} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default EntryCard;
