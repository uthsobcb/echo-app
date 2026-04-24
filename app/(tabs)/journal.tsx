import EntryCard from '@/component/EntryCard';
import Filter from '@/component/Filter';
import { useStorage } from '@/context/StorageContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export default function Journal() {
    const { entries: ctxEntries } = useStorage();
    const { colors } = useTheme();
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [search, setSearch] = useState('');

    const entries = useMemo(() => {
        if (!search && selectedFilter === 'All') return ctxEntries;
        const filterLower = selectedFilter.toLowerCase();
        return ctxEntries.filter((e) => {
            const moodLower = (e.mood ?? '').toLowerCase();
            // Match filter: "happy" matches "happy", "Happy 😊", etc.
            const moodMatch = selectedFilter === 'All' || moodLower === filterLower || moodLower.startsWith(filterLower);
            const searchMatch = !search || e.content?.toLowerCase().includes(search.toLowerCase());
            return moodMatch && searchMatch;
        });
    }, [ctxEntries, search, selectedFilter]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
                <View>
                    <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text }}>My Journal</Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>{entries.length} entries</Text>
                </View>
                <TouchableOpacity
                    style={{ backgroundColor: colors.surfaceSecondary, borderRadius: 50, padding: 10 }}
                    onPress={() => router.push('/(chat)')}
                >
                    <Ionicons name="chatbubble-ellipses" color={colors.primary} size={22} />
                </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
                <View style={{
                    flexDirection: 'row', alignItems: 'center', borderRadius: 24,
                    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
                    backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1.5,
                }}>
                    <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                    <TextInput
                        style={{ flex: 1, fontSize: 14, color: colors.text }}
                        placeholder="Search entries..."
                        placeholderTextColor={colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <Filter selected={selectedFilter} onSelect={setSelectedFilter} />

            <FlatList
                data={entries}
                keyExtractor={(item) => item._id || item.id || String(Math.random())}
                renderItem={({ item }) => (
                    <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                        <EntryCard entry={item} />
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 20, paddingTop: 4 }}
                ListEmptyComponent={() => (
                    <View style={{ alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 }}>
                        <Text style={{ fontSize: 52, marginBottom: 16 }}>📖</Text>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 }}>No entries yet</Text>
                        <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24 }}>
                            Start your journaling journey today!
                        </Text>
                        <TouchableOpacity
                            style={{ backgroundColor: colors.primary, borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14 }}
                            onPress={() => router.push('/(tabs)/create')}
                        >
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Write First Entry</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}
