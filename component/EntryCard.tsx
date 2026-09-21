import { useStorage } from '@/context/StorageContext';
import { Entry } from '@/types/data';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { logger } from '@/service/logger';
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
            <View className="mt-3 rounded-2xl p-7 items-center border-2 border-dashed" style={{ borderColor: colors.border }}>
                <Text className="text-[14px] font-semibold" style={{ color: colors.textSecondary }}>No entries yet. Start writing! ✍️</Text>
            </View>
        );
    }

    const id = entry._id || entry.id || 'default';
    const date = new Date(entry.createdAt);
    const theme = getTheme(id);

    const dateStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const title = typeof entry.content === 'string' && entry.content.length > 0
        ? entry.content.split('\n')[0].substring(0, 45) + (entry.content.split('\n')[0].length > 45 ? '…' : '')
        : 'Start Writing…';

    const handleDelete = () => {
        Alert.alert('Delete Entry', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { try { if (id) await deleteEntry(id); } catch (e) { logger.error('Failed to delete', e); } } },
        ]);
    };

    const handleEdit = () => {
        router.push({ pathname: '/(tabs)/create', params: { entryId: id } });
    };

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleEdit}
            className="rounded-[20px] p-4"
            style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOpacity: isDark ? 0 : 0.06,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: isDark ? 0 : 2,
            }}
        >
            {entry.mood ? (
                <View
                    className="flex-row items-center self-start rounded-full px-2.5 py-1 gap-1.5 mb-2.5"
                    style={{ backgroundColor: isDark ? theme.color + 'D9' : theme.bg }}
                >
                    <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isDark ? '#fff' : theme.color }} />
                    <Text className="text-[11px] font-bold" style={{ color: isDark ? '#fff' : theme.color }}>
                        {entry.score != null ? `${entry.score} ` : ''}{entry.mood}
                    </Text>
                </View>
            ) : null}
            <Text className="text-[19px] font-extrabold leading-[25px]" style={{ color: colors.text }} numberOfLines={2}>{title}</Text>
            <Text className="text-[12px] font-medium mb-2.5" style={{ color: colors.textSecondary }}>{dateStr}</Text>
            {entry.comment ? (
                <View
                    className="flex-row items-center self-start rounded-full px-2 py-1 gap-1 mb-3"
                    style={{ backgroundColor: theme.color + '15', borderWidth: 1, borderColor: theme.color + '35' }}
                >
                    <Ionicons name="sparkles" size={10} color={theme.color} />
                    <Text className="text-[10px] font-bold" style={{ color: theme.color }}>AI Insight</Text>
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
        </TouchableOpacity>
    );
};

export default EntryCard;
