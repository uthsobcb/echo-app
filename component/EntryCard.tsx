import { useStorage } from '@/context/StorageContext';
import { Entry } from '@/types/data';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    const { deleteEntry, appMode } = useStorage();
    if (!entry) {
        return (
            <View style={styles.empty}>
                <Text style={styles.emptyText}>No entries yet. Start writing! ✍️</Text>
            </View>
        );
    }

    const id = entry._id || entry.id || 'default';
    const date = new Date(entry.createdAt);
    const theme = getTheme(id);

    const dateStr =
        date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
        ', ' +
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const title =
        typeof entry.content === 'string' && entry.content.length > 0
            ? entry.content.split('\n')[0].substring(0, 45) +
            (entry.content.split('\n')[0].length > 45 ? '…' : '')
            : 'Start Writing…';

    const handleDelete = () => {
        Alert.alert('Delete Entry', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try { if (id) await deleteEntry(id); } catch (e) { console.error('Failed to delete', e); }
                },
            },
        ]);
    };

    const handleEdit = () => {
        router.push({ pathname: '/(tabs)/create', params: { entryId: id } });
    };

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={handleEdit} style={styles.card}>
            {/* Accent bar */}
            <View style={[styles.accentBar, { backgroundColor: theme.color }]} />

            <View style={styles.inner}>
                {/* Header Row */}
                <View style={styles.row}>
                    <Text style={styles.date}>{dateStr}</Text>
                    {entry.mood ? (
                        <View style={[styles.moodPill, { backgroundColor: theme.bg }]}>
                            <View style={[styles.moodDot, { backgroundColor: theme.color }]} />
                            <Text style={[styles.moodText, { color: theme.color }]}>
                                {entry.score != null ? `${entry.score} ` : ''}{entry.mood}
                            </Text>
                        </View>
                    ) : null}
                </View>

                {/* Title */}
                <Text style={styles.title} numberOfLines={2}>{title}</Text>

                {/* AI Insight */}
                {entry.comment ? (
                    <View style={[styles.insight, { borderLeftColor: theme.color }]}>
                        <View style={styles.insightHeader}>
                            <Ionicons name="sparkles" size={13} color={theme.color} />
                            <Text style={[styles.insightLabel, { color: theme.color }]}>AI INSIGHT</Text>
                        </View>
                        <Text style={styles.insightBody} numberOfLines={2}>{entry.comment}</Text>
                    </View>
                ) : entry.content ? (
                    <Text style={styles.preview} numberOfLines={2}>
                        {entry.content.replace(title.replace('…', ''), '').trim()}
                    </Text>
                ) : null}



                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity onPress={handleDelete} hitSlop={10} style={styles.footerBtn}>
                        <Ionicons name="trash-outline" size={18} color="#B0BAD0" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleEdit} style={styles.readMore}>
                        <Text style={[styles.readMoreText, { color: theme.color }]}>Read more</Text>
                        <Ionicons name="chevron-forward" size={14} color={theme.color} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default EntryCard;

const styles = StyleSheet.create({
    empty: {
        marginTop: 12, backgroundColor: '#fff', borderRadius: 16, padding: 28,
        alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E8F0', borderStyle: 'dashed',
    },
    emptyText: { color: '#B0BAD0', fontSize: 14, fontWeight: '600' },

    card: {
        backgroundColor: '#fff', borderRadius: 20, flexDirection: 'row', overflow: 'hidden',
        shadowColor: '#1A1D2E', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
    },
    accentBar: { width: 4 },
    inner: { flex: 1, padding: 16 },

    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    date: { fontSize: 12, color: '#7A8499', fontWeight: '500' },
    moodPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 5 },
    moodDot: { width: 6, height: 6, borderRadius: 3 },
    moodText: { fontSize: 11, fontWeight: '700' },

    title: { fontSize: 19, fontWeight: '800', color: '#1A1D2E', lineHeight: 25, marginBottom: 10, fontFamily: 'Caveat_700Bold' },

    insight: {
        backgroundColor: '#F8F9FF', borderLeftWidth: 3, borderRadius: 8,
        padding: 10, marginBottom: 12,
    },
    insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
    insightLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    insightBody: { fontSize: 13, color: '#4A5568', lineHeight: 19 },

    preview: { fontSize: 16, color: '#7A8499', lineHeight: 22, marginBottom: 10, fontFamily: 'Caveat_400Regular' },

    todoSection: { backgroundColor: '#F8F9FF', borderRadius: 12, padding: 10, marginBottom: 10 },
    todoHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
    todoHeaderText: { fontSize: 10, fontWeight: '800', color: '#7A8499', letterSpacing: 1 },
    todoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    todoCheck: {
        width: 18, height: 18, borderRadius: 9, borderWidth: 1.5,
        borderColor: '#B0BAD0', alignItems: 'center', justifyContent: 'center',
    },
    todoText: { fontSize: 13, color: '#1A1D2E', flex: 1 },
    todoTextDone: { textDecorationLine: 'line-through', color: '#B0BAD0' },

    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    footerBtn: { padding: 4 },
    readMore: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    readMoreText: { fontSize: 13, fontWeight: '700' },
});
