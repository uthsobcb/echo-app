import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '../../context/ChatContext';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { LocalConversation } from '../../types/data';

export default function ChatListScreen() {
    const { colors } = useTheme();
    const { conversations, isLoading, deleteConversation, createConversation } = useChat();
    const router = useRouter();

    const sortedConversations = useMemo(() => {
        return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
    }, [conversations]);

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
            `Are you sure you want to delete "${title}"?`,
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
        const prefix = lastMsg.sender === 'user' ? 'You: ' : '';
        return prefix + (lastMsg.text.length > 40 ? lastMsg.text.substring(0, 40) + '...' : lastMsg.text);
    };

    const styles = useMemo(() => ({
        container: { flex: 1, backgroundColor: colors.background } as ViewStyle,
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        } as ViewStyle,
        headerTitle: { fontSize: 28, fontWeight: '800', color: colors.text } as TextStyle,
        newChatBtn: {
            backgroundColor: colors.primary,
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
        } as ViewStyle,
        listContent: { paddingVertical: 8, paddingHorizontal: 16 } as ViewStyle,
        convCard: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
        } as ViewStyle,
        avatarContainer: {
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: colors.surfaceSecondary,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
        } as ViewStyle,
        avatarText: { fontSize: 20, fontWeight: '700', color: colors.primary } as TextStyle,
        convContent: { flex: 1 } as ViewStyle,
        convTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 } as TextStyle,
        convPreview: { fontSize: 13, color: colors.textSecondary } as TextStyle,
        convMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 } as ViewStyle,
        convTime: { fontSize: 11, color: colors.textSecondary } as TextStyle,
        convCount: {
            backgroundColor: colors.primary,
            borderRadius: 10,
            paddingHorizontal: 8,
            paddingVertical: 2,
            marginLeft: 8,
        } as ViewStyle,
        convCountText: { fontSize: 11, fontWeight: '600', color: '#fff' } as TextStyle,
        deleteBtn: { padding: 8 } as ViewStyle,
        emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 } as ViewStyle,
        emptyIcon: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: colors.surfaceSecondary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
        } as ViewStyle,
        emptyTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' } as TextStyle,
        emptySubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 } as TextStyle,
        startBtn: {
            backgroundColor: colors.primary,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 14,
            gap: 8,
        } as ViewStyle,
        startBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 } as TextStyle,
    }), [colors]);

    const renderConversation = ({ item }: { item: LocalConversation }) => (
        <TouchableOpacity
            style={styles.convCard}
            onPress={() => handleSelectConversation(item.id)}
            onLongPress={() => handleDeleteConversation(item.id, item.title)}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                    {item.title.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.convContent}>
                <Text style={styles.convTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.convPreview} numberOfLines={1}>{getLastMessage(item)}</Text>
                <View style={styles.convMeta}>
                    <Text style={styles.convTime}>{formatTimestamp(item.updatedAt)}</Text>
                    {item.messages.length > 0 && (
                        <View style={styles.convCount}>
                            <Text style={styles.convCountText}>{item.messages.length}</Text>
                        </View>
                    )}
                </View>
            </View>
            <TouchableOpacity 
                style={styles.deleteBtn}
                onPress={() => handleDeleteConversation(item.id, item.title)}
            >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Chats</Text>
                <TouchableOpacity style={styles.newChatBtn} onPress={handleNewChat}>
                    <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {sortedConversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIcon}>
                        <MaterialCommunityIcons name="chat-outline" size={48} color={colors.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>No Conversations Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Start a new chat to begin your conversation with Echo AI
                    </Text>
                    <TouchableOpacity style={styles.startBtn} onPress={handleNewChat}>
                        <MaterialCommunityIcons name="pencil-plus" size={22} color="#fff" />
                        <Text style={styles.startBtnText}>Start Chatting</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={sortedConversations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderConversation}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}