import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { LocalConversation } from '../../types/data';

const AVATAR_COLORS = ['#4F6BFF', '#7B3FE4', '#059669', '#DB2777', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6'];

const getAvatarColor = (id: string) => {
    const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export default function ChatListScreen() {
    const { colors } = useTheme();
    const { conversations, deleteConversation, createConversation, isLoading } = useChat();
    const router = useRouter();
    const [search, setSearch] = useState('');

    const sortedConversations = useMemo(() => {
        const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
        if (!search.trim()) return sorted;
        const q = search.toLowerCase();
        return sorted.filter(c =>
            c.title.toLowerCase().includes(q) ||
            c.messages.some(m => m.text.toLowerCase().includes(q))
        );
    }, [conversations, search]);

    const handleSelectConversation = useCallback((id: string) => {
        router.push(`/(chat)/chat?id=${id}`);
    }, [router]);

    const handleNewChat = useCallback(() => {
        const newId = createConversation();
        router.push(`/(chat)/chat?id=${newId}`);
    }, [createConversation, router]);

    const handleDeleteConversation = useCallback((id: string, title: string) => {
        Alert.alert(
            'Delete Conversation',
            `Delete "${title}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteConversation(id),
                },
            ]
        );
    }, [deleteConversation]);

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;

        const isToday = date.toDateString() === now.toDateString();
        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }

        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const getLastMessage = (conv: LocalConversation) => {
        const lastMsg = conv.messages[conv.messages.length - 1];
        if (!lastMsg) return 'No messages yet';
        const prefix = lastMsg.sender === 'user' ? 'You: ' : 'Echo: ';
        const text = lastMsg.text.length > 50 ? lastMsg.text.substring(0, 50) + '...' : lastMsg.text;
        return prefix + text;
    };

    const renderConversation = ({ item }: { item: LocalConversation }) => {
        const avatarColor = getAvatarColor(item.id);
        const messageCount = item.messages.filter(m => m.sender === 'bot').length;

        return (
            <TouchableOpacity
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                }}
                onPress={() => handleSelectConversation(item.id)}
                onLongPress={() => handleDeleteConversation(item.id, item.title)}
                activeOpacity={0.6}
            >
                {/* Avatar */}
                <View
                    style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: avatarColor + '18',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 14,
                    }}
                >
                    <MaterialCommunityIcons name="robot-outline" size={24} color={avatarColor} />
                </View>

                {/* Content */}
                <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text
                            style={{ fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 }}
                            numberOfLines={1}
                        >
                            {item.title}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                            {formatTimestamp(item.updatedAt)}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text
                            style={{ fontSize: 14, color: colors.textSecondary, flex: 1 }}
                            numberOfLines={1}
                        >
                            {getLastMessage(item)}
                        </Text>
                        {messageCount > 0 && (
                            <View
                                style={{
                                    backgroundColor: colors.primary + '20',
                                    borderRadius: 10,
                                    paddingHorizontal: 7,
                                    paddingVertical: 2,
                                    marginLeft: 8,
                                }}
                            >
                                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                    {messageCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
            {/* Header */}
            <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <TouchableOpacity
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: colors.surfaceSecondary,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
                    >
                        <Ionicons name="chevron-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>
                        Conversations
                    </Text>
                    <TouchableOpacity
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: colors.primary,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onPress={handleNewChat}
                    >
                        <Ionicons name="create-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Search bar */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.surfaceSecondary,
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        height: 44,
                        borderWidth: 1,
                        borderColor: colors.border,
                    }}
                >
                    <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                    <TextInput
                        style={{ flex: 1, fontSize: 15, color: colors.text, marginLeft: 10 }}
                        placeholder="Search conversations..."
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

            {/* Content */}
            {isLoading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 12 }}>Loading chats...</Text>
                </View>
            ) : sortedConversations.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
                    {search.trim() ? (
                        <>
                            <Ionicons name="search" size={48} color={colors.textSecondary} />
                            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 16, textAlign: 'center' }}>
                                No results for "{search}"
                            </Text>
                            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                                Try a different search term
                            </Text>
                        </>
                    ) : (
                        <>
                            <View
                                style={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: 50,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 20,
                                    overflow: 'hidden',
                                }}
                            >
                                <LinearGradient
                                    colors={['#4F6BFF', '#7B3FE4']}
                                    style={{ width: 100, height: 100, alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <MaterialCommunityIcons name="chat-processing-outline" size={44} color="#fff" />
                                </LinearGradient>
                            </View>
                            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
                                Chat with Echo
                            </Text>
                            <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 }}>
                                Echo is your AI journaling companion. Ask questions, reflect on your entries, or just talk.
                            </Text>
                            <TouchableOpacity
                                onPress={handleNewChat}
                                activeOpacity={0.85}
                                style={{ borderRadius: 16, overflow: 'hidden' }}
                            >
                                <LinearGradient
                                    colors={['#4F6BFF', '#7B3FE4']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        paddingVertical: 14,
                                        paddingHorizontal: 28,
                                        gap: 8,
                                    }}
                                >
                                    <Ionicons name="chatbubbles" size={20} color="#fff" />
                                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Start a Conversation</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            ) : (
                <FlatList
                    data={sortedConversations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderConversation}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 80 }}
                />
            )}

            {/* Floating new chat button when list has items */}
            {sortedConversations.length > 0 && (
                <TouchableOpacity
                    onPress={handleNewChat}
                    activeOpacity={0.85}
                    style={{
                        position: 'absolute',
                        bottom: 24,
                        right: 20,
                        borderRadius: 28,
                        overflow: 'hidden',
                        shadowColor: '#4F6BFF',
                        shadowOpacity: 0.35,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 8,
                    }}
                >
                    <LinearGradient
                        colors={['#4F6BFF', '#7B3FE4']}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 14,
                            paddingHorizontal: 22,
                            gap: 8,
                        }}
                    >
                        <Ionicons name="add" size={22} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>New Chat</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}
