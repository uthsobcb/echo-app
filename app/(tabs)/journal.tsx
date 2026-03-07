import EntryCard from '@/component/EntryCard';
import Filter from '@/component/Filter';
import { useStorage } from '@/context/StorageContext';
import { api } from '@/service/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Entry } from '../../types/data';

export default function Journal() {
    const { user, entries: ctxEntries, appMode } = useStorage();
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [entries, setEntries] = useState<Entry[]>(ctxEntries);
    const [loading, setLoading] = useState(false);

    // Sync from context when no active search/filter
    useEffect(() => {
        if (!search && selectedFilter === 'All') {
            setEntries(ctxEntries);
        }
    }, [ctxEntries]);

    // Re-fetch / filter when search or mood filter changes
    useEffect(() => {
        const fetchFiltered = async () => {
            if (appMode !== 'api') {
                // Local mode: do client-side filter
                const filtered = ctxEntries.filter((e) => {
                    const moodMatch = selectedFilter === 'All' || e.mood?.toLowerCase().includes(selectedFilter.toLowerCase());
                    const searchMatch = !search || e.content?.toLowerCase().includes(search.toLowerCase());
                    return moodMatch && searchMatch;
                });
                setEntries(filtered);
                return;
            }

            try {
                setLoading(true);
                const data = await api.entries.getAll(search || undefined, selectedFilter);
                setEntries(data);
            } catch (e) {
                console.error('[Journal] Failed to fetch entries', e);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchFiltered, 300); // debounce search
        return () => clearTimeout(timer);
    }, [search, selectedFilter, appMode]);

    return (
        <LinearGradient colors={['#F5F6FA', '#EEF1FF']} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.pageTitle}>My Journal</Text>
                        <Text style={styles.pageSub}>{entries.length} entries</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(chat)')}>
                            <Ionicons name="chatbubble-ellipses" color="#4F6BFF" size={22} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                            {user.image || user.avatar ? (
                                <Image source={{ uri: (user.image || user.avatar) as string }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, { backgroundColor: '#4F6BFF', alignItems: 'center', justifyContent: 'center' }]}>
                                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                                        {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchWrap}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search-outline" size={18} color="#B0BAD0" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search entries..."
                            placeholderTextColor="#B0BAD0"
                            value={search}
                            onChangeText={setSearch}
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch('')}>
                                <Ionicons name="close-circle" size={18} color="#B0BAD0" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Filter */}
                <Filter selected={selectedFilter} onSelect={setSelectedFilter} />

                {/* Entry List */}
                {loading ? (
                    <View style={styles.loaderWrap}>
                        <ActivityIndicator size="large" color="#4F6BFF" />
                    </View>
                ) : (
                    <FlatList
                        data={entries}
                        keyExtractor={(item) => item.id || item._id || Math.random().toString()}
                        renderItem={({ item }) => (
                            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                                <EntryCard entry={item} />
                            </View>
                        )}
                        contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
                        ListEmptyComponent={() => (
                            <View style={styles.empty}>
                                <Text style={styles.emptyEmoji}>
                                    {selectedFilter === 'All' ? '📖' : '🔍'}
                                </Text>
                                <Text style={styles.emptyTitle}>
                                    {selectedFilter === 'All' ? 'No entries yet' : `No "${selectedFilter}" entries`}
                                </Text>
                                <Text style={styles.emptySub}>
                                    {selectedFilter === 'All'
                                        ? 'Start your journaling journey today!'
                                        : 'Try a different mood filter'}
                                </Text>
                                {selectedFilter === 'All' && (
                                    <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/create')}>
                                        <Text style={styles.emptyBtnText}>Write First Entry</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    />
                )}
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
    },
    pageTitle: { fontSize: 26, fontWeight: '800', color: '#1A1D2E' },
    pageSub: { fontSize: 13, color: '#7A8499', marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconBtn: { backgroundColor: '#EEF1FF', borderRadius: 50, padding: 10 },
    avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#4F6BFF' },

    searchWrap: { paddingHorizontal: 16, marginBottom: 10 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 8,
        borderWidth: 1.5, borderColor: '#E5E8F0',
        shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
    },
    searchInput: { flex: 1, fontSize: 14, color: '#1A1D2E' },

    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
    emptyEmoji: { fontSize: 52, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1A1D2E', marginBottom: 8 },
    emptySub: { fontSize: 14, color: '#7A8499', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
    emptyBtn: { backgroundColor: '#4F6BFF', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13 },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});