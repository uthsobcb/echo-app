import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { LocalConversation } from '../../types/data';

export default function ChatListScreen() {
    const { colors } = useTheme();
    const { conversations, deleteConversation, createConversation } = useChat();
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

    const renderConversation = ({ item }: { item: LocalConversation }) => (
        <TouchableOpacity
            className="flex-row items-center rounded-2xl p-4 mb-3 border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            onPress={() => handleSelectConversation(item.id)}
            onLongPress={() => handleDeleteConversation(item.id, item.title)}
            activeOpacity={0.7}
        >
            <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3.5"
                style={{ backgroundColor: colors.surfaceSecondary }}
            >
                <Text className="text-xl font-bold" style={{ color: colors.primary }}>
                    {item.title.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View className="flex-1">
                <Text className="text-base font-semibold mb-1" style={{ color: colors.text }} numberOfLines={1}>
                    {item.title}
                </Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }} numberOfLines={1}>
                    {getLastMessage(item)}
                </Text>
                <View className="flex-row items-center mt-1.5">
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                        {formatTimestamp(item.updatedAt)}
                    </Text>
                    {item.messages.length > 0 && (
                        <View
                            className="rounded-full px-2 py-0.5 ml-2"
                            style={{ backgroundColor: colors.primary }}
                        >
                            <Text className="text-xs font-semibold text-white">
                                {item.messages.length}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
            <TouchableOpacity
                className="p-2"
                onPress={() => handleDeleteConversation(item.id, item.title)}
            >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={['top']}>
            <View className="flex-row items-center justify-between px-4 py-4 border-b" style={{ borderBottomColor: colors.border }}>
                <TouchableOpacity
                    className="p-2"
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text className="text-[28px] font-extrabold" style={{ color: colors.text }}>
                    Chats
                </Text>
                <TouchableOpacity
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                    onPress={handleNewChat}
                >
                    <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {sortedConversations.length === 0 ? (
                <View className="flex-1 items-center justify-center px-10">
                    <View
                        className="w-24 h-24 rounded-full items-center justify-center mb-5"
                        style={{ backgroundColor: colors.surfaceSecondary }}
                    >
                        <MaterialCommunityIcons name="chat-outline" size={48} color={colors.primary} />
                    </View>
                    <Text className="text-[22px] font-bold mb-2 text-center" style={{ color: colors.text }}>
                        No Conversations Yet
                    </Text>
                    <Text className="text-base text-center mb-6 leading-6" style={{ color: colors.textSecondary }}>
                        Start a new chat to begin your conversation with Echo AI
                    </Text>
                    <TouchableOpacity
                        className="flex-row items-center px-6 py-3.5 rounded-2xl gap-2"
                        style={{ backgroundColor: colors.primary }}
                        onPress={handleNewChat}
                    >
                        <MaterialCommunityIcons name="pencil-plus" size={22} color="#fff" />
                        <Text className="text-white font-bold text-base">Start Chatting</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={sortedConversations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderConversation}
                    className="py-2 px-4"
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}
