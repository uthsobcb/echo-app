import EntryCard from '@/component/EntryCard';
import Filter from '@/component/Filter';
import { useStorage } from '@/context/StorageContext';
import { api } from '@/service/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Entry } from '../../types/data';
import { useTheme } from '../../context/ThemeContext';

export default function Journal() {
    const { user, entries: ctxEntries, appMode } = useStorage();
    const { colors, isDark } = useTheme();
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [entries, setEntries] = useState<Entry[]>(ctxEntries);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!search && selectedFilter === 'All') {
            setEntries(ctxEntries);
        }
    }, [ctxEntries]);

    useEffect(() => {
        const fetchFiltered = async () => {
            if (appMode !== 'api') {
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

        const timer = setTimeout(fetchFiltered, 300);
        return () => clearTimeout(timer);
    }, [search, selectedFilter, appMode]);

    return (
        <LinearGradient colors={isDark ? ['#0F1117', '#1A1D2E'] : ['#F5F6FA', '#EEF1FF']} className="flex-1">
            <SafeAreaView className="flex-1">
                <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
                    <View>
                        <Text className="text-[26px] font-extrabold" style={{ color: colors.text }}>My Journal</Text>
                        <Text className="text-[13px] mt-0.5" style={{ color: colors.textSecondary }}>{entries.length} entries</Text>
                    </View>
                    <View className="flex-row items-center gap-2.5">
                        <TouchableOpacity 
                            className="rounded-[50] p-2.5"
                            style={{ backgroundColor: colors.surfaceSecondary }}
                            onPress={() => router.push('/(chat)')}
                        >
                            <Ionicons name="chatbubble-ellipses" color={colors.primary} size={22} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                            {user.image || user.avatar ? (
                                <Image source={{ uri: (user.image || user.avatar) as string }} className="w-11 h-11 rounded-[22] border-2" style={{ borderColor: colors.primary }} />
                            ) : (
                                <View className="w-11 h-11 rounded-[22] border-2 items-center justify-center" style={{ backgroundColor: colors.primary, borderColor: colors.primary }}>
                                    <Text className="text-white font-extrabold text-base">
                                        {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="px-4 mb-2.5">
                    <View 
                        className="flex-row items-center rounded-3xl px-3.5 py-2.5 gap-2"
                        style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1.5 }}
                    >
                        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                        <TextInput
                            className="flex-1 text-sm"
                            style={{ color: colors.text }}
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

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={entries}
                        keyExtractor={(item) => item.id || item._id || Math.random().toString()}
                        renderItem={({ item }) => (
                            <View className="px-4 mb-3">
                                <EntryCard entry={item} />
                            </View>
                        )}
                        contentContainerStyle={{ paddingBottom: 6, paddingTop: 2 }}
                        ListEmptyComponent={() => (
                            <View className="items-center pt-16 px-8">
                                <Text className="text-[52px] mb-4">
                                    {selectedFilter === 'All' ? '📖' : '🔍'}
                                </Text>
                                <Text className="text-xl font-extrabold mb-2" style={{ color: colors.text }}>
                                    {selectedFilter === 'All' ? 'No entries yet' : `No "${selectedFilter}" entries`}
                                </Text>
                                <Text className="text-sm text-center leading-[21px] mb-6" style={{ color: colors.textSecondary }}>
                                    {selectedFilter === 'All'
                                        ? 'Start your journaling journey today!'
                                        : 'Try a different mood filter'}
                                </Text>
                                {selectedFilter === 'All' && (
                                    <TouchableOpacity 
                                        className="rounded-2xl px-7 py-3.5"
                                        style={{ backgroundColor: colors.primary }}
                                        onPress={() => router.push('/(tabs)/create')}
                                    >
                                        <Text className="text-white font-bold text-[15px]">Write First Entry</Text>
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
