import EntryCard from '@/component/EntryCard';
import Filter, { FilterOption } from '@/component/Filter';
import { useStorage } from '@/context/StorageContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

function normalizeMood(raw: string): string {
  // "Happy 😊" → "Happy", "happy" → "Happy"
  const base = raw.trim().split(/\s/)[0];
  return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
}

export default function Journal() {
  const { entries: ctxEntries } = useStorage();
  const { colors } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Build filter options dynamically from actual entry moods
  const filterOptions: FilterOption[] = useMemo(() => {
    const counts: Record<string, number> = {};
    ctxEntries.forEach((e) => {
      const raw = (e.mood ?? '').trim();
      if (!raw) return;
      const normalized = normalizeMood(raw);
      counts[normalized] = (counts[normalized] || 0) + 1;
    });

    const moodOptions = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([label, count]) => ({ label, count }));

    return [{ label: 'All', count: ctxEntries.length }, ...moodOptions];
  }, [ctxEntries]);

  const filteredEntries = useMemo(() => {
    if (!search && selectedFilter === 'All') return ctxEntries;
    return ctxEntries.filter((e) => {
      const moodNorm = normalizeMood(e.mood ?? '');
      const moodMatch = selectedFilter === 'All' || moodNorm === selectedFilter;
      const searchMatch = !search || e.content?.toLowerCase().includes(search.toLowerCase());
      return moodMatch && searchMatch;
    });
  }, [ctxEntries, search, selectedFilter]);

  const resultCount = filteredEntries.length;
  const isFiltered = selectedFilter !== 'All' || search.length > 0;

  return (
    <View style={styles.root}>
      <LinearGradient colors={colors.backgroundGradient} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>My Journal</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isFiltered
                ? `${resultCount} of ${ctxEntries.length} entries`
                : `${ctxEntries.length} ${ctxEntries.length === 1 ? 'entry' : 'entries'}`}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.chatBtn, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => router.push('/(chat)')}
          >
            <Ionicons name="chatbubble-ellipses" color={colors.primary} size={22} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
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

        {/* Dynamic mood filter */}
        <Filter
          options={filterOptions}
          selected={selectedFilter}
          onSelect={(f) => {
            setSelectedFilter(f);
          }}
        />

        {/* Entry list */}
        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          renderItem={({ item }) => (
            <View style={styles.entryWrap}>
              <EntryCard entry={item} />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>
                {isFiltered ? '🔍' : '📖'}
              </Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {isFiltered ? 'No matching entries' : 'No entries yet'}
              </Text>
              <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
                {isFiltered
                  ? 'Try a different mood or clear your search.'
                  : 'Start your journaling journey today!'}
              </Text>
              {!isFiltered && (
                <TouchableOpacity
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/(tabs)/create')}
                >
                  <Text style={styles.emptyBtnText}>Write First Entry</Text>
                </TouchableOpacity>
              )}
              {isFiltered && (
                <TouchableOpacity
                  onPress={() => { setSelectedFilter('All'); setSearch(''); }}
                >
                  <Text style={[styles.clearLink, { color: colors.primary }]}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  safe:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title:       { fontSize: 26, fontWeight: '800' },
  subtitle:    { fontSize: 13, marginTop: 2 },
  chatBtn:     { borderRadius: 50, padding: 10 },
  searchWrap:  { paddingHorizontal: 16, marginBottom: 10 },
  searchBar:   { flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10, gap: 8, borderWidth: 1.5 },
  searchInput: { flex: 1, fontSize: 14 },
  entryWrap:   { paddingHorizontal: 16, marginBottom: 12 },
  listContent: { paddingBottom: 24, paddingTop: 4 },
  empty:       { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  emptyIcon:   { fontSize: 52, marginBottom: 16 },
  emptyTitle:  { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptyBody:   { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  emptyBtn:    { borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14 },
  emptyBtnText:{ color: '#fff', fontWeight: '700', fontSize: 15 },
  clearLink:   { fontSize: 15, fontWeight: '600' },
});
