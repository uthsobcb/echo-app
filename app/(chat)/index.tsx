import { EchoAvatar } from '@/component/EchoAvatar';
import { Toast } from '@/component/Toast';
import { useChat } from '@/context/ChatContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalConversation } from '../../types/data';

const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1)  return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (date.toDateString() === now.toDateString())
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getLastMessage = (conv: LocalConversation) => {
    const msg = conv.messages[conv.messages.length - 1];
    if (!msg) return 'No messages yet';
    const prefix = msg.sender === 'user' ? 'You: ' : 'Echo: ';
    return prefix + (msg.text.length > 55 ? msg.text.slice(0, 55) + '…' : msg.text);
};

export default function ChatListScreen() {
    const { colors, isDark } = useTheme();
    const { conversations, deleteConversation, createConversation, isLoading } = useChat();
    const router  = useRouter();
    const insets  = useSafeAreaInsets();
    const [search, setSearch] = useState('');

    const sorted = useMemo(() => {
        const list = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
        if (!search.trim()) return list;
        const q = search.toLowerCase();
        return list.filter(c =>
            c.title.toLowerCase().includes(q) ||
            c.messages.some(m => m.text.toLowerCase().includes(q))
        );
    }, [conversations, search]);

    const handleOpen  = useCallback((id: string) => router.push(`/(chat)/chat?id=${id}`), [router]);
    const handleNew   = useCallback(() => {
        const id = createConversation();
        router.push(`/(chat)/chat?id=${id}`);
    }, [createConversation, router]);

    const handleDelete = useCallback((id: string, title: string) => {
        Toast.show(
            `"${title}" deleted`,
            'info',
        );
        deleteConversation(id);
    }, [deleteConversation]);

    const renderItem = ({ item }: { item: LocalConversation }) => {
        const lastMsg = item.messages[item.messages.length - 1];
        const isEcho  = lastMsg?.sender === 'bot';
        return (
            <TouchableOpacity
                style={[styles.convRow, { borderBottomColor: colors.border }]}
                onPress={() => handleOpen(item.id)}
                onLongPress={() => handleDelete(item.id, item.title)}
                activeOpacity={0.65}
            >
                {/* Echo avatar bubble */}
                <View style={styles.convAvatarWrap}>
                    <EchoAvatar expression="calm" size={44} animated={false} />
                </View>

                <View style={styles.convContent}>
                    <View style={styles.convTopRow}>
                        <Text style={[styles.convTitle, { color: colors.text }]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={[styles.convTime, { color: colors.textSecondary }]}>
                            {formatTimestamp(item.updatedAt)}
                        </Text>
                    </View>
                    <Text style={[styles.convSnippet, { color: colors.textSecondary }]} numberOfLines={1}>
                        {getLastMessage(item)}
                    </Text>
                </View>

                <Ionicons name="chevron-forward" size={16} color={colors.border} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.headerBack, { backgroundColor: colors.surfaceSecondary }]}
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
                >
                    <Ionicons name="chevron-back" size={20} color={colors.text} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>

                <TouchableOpacity style={styles.headerNew} onPress={handleNew}>
                    <LinearGradient colors={['#4F6BFF', '#7B3FE4']} style={styles.headerNewGradient}>
                        <Ionicons name="create-outline" size={18} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <View style={[styles.searchBar, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <Ionicons name="search-outline" size={17} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search conversations…"
                        placeholderTextColor={colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={17} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content */}
            {isLoading ? (
                <View style={styles.centred}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.emptyHint, { color: colors.textSecondary, marginTop: 12 }]}>Loading…</Text>
                </View>
            ) : sorted.length === 0 ? (
                <View style={styles.centred}>
                    {search.trim() ? (
                        <>
                            <Ionicons name="search" size={44} color={colors.textSecondary} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>No results</Text>
                            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                                Nothing matched "{search}"
                            </Text>
                        </>
                    ) : (
                        <>
                            <View style={styles.emptyAvatarWrap}>
                                <EchoAvatar expression="happy" size={100} animated />
                            </View>
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>Chat with Echo</Text>
                            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                                Your AI journaling companion. Reflect, explore, or just talk.
                            </Text>
                            <TouchableOpacity onPress={handleNew} activeOpacity={0.85} style={styles.emptyBtn}>
                                <LinearGradient colors={['#4F6BFF', '#7B3FE4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyBtnGradient}>
                                    <Ionicons name="chatbubbles" size={18} color="#fff" />
                                    <Text style={styles.emptyBtnText}>Start a Conversation</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            ) : (
                <FlatList
                    data={sorted}
                    keyExtractor={i => i.id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
                />
            )}

            {/* FAB */}
            {sorted.length > 0 && (
                <TouchableOpacity
                    onPress={handleNew}
                    activeOpacity={0.85}
                    style={[styles.fab, { bottom: insets.bottom + 20 }]}
                >
                    <LinearGradient colors={['#4F6BFF', '#7B3FE4']} style={styles.fabGradient}>
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.fabText}>New Chat</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerBack: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', textAlign: 'center' },
    headerNew: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden' },
    headerNewGradient: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

    // Search
    searchWrap: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderRadius: 12, paddingHorizontal: 12, height: 40, borderWidth: 1,
    },
    searchInput: { flex: 1, fontSize: 14 },

    // Conversation row
    convRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    convAvatarWrap: { width: 44, height: 36, marginRight: 12 },
    convContent: { flex: 1 },
    convTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
    convTitle: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
    convTime: { fontSize: 11, fontWeight: '500' },
    convSnippet: { fontSize: 13 },

    // Empty / loading
    centred: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
    emptyAvatarWrap: { marginBottom: 16 },
    emptyTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
    emptyHint: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
    emptyBtn: { borderRadius: 14, overflow: 'hidden' },
    emptyBtnGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 24 },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    // FAB
    fab: { position: 'absolute', right: 20, borderRadius: 28, overflow: 'hidden', elevation: 8, shadowColor: '#4F6BFF', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    fabGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 20, gap: 6 },
    fabText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
