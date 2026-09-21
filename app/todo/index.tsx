import { useStorage } from '@/context/StorageContext';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/service/api';
import { scheduleTodoDailyReminder } from '@/service/NotificationService';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logger } from '@/service/logger';

type TodoItem = {
    _id: string;
    todo: string;
    type?: string;
    status: 'pending' | 'in progress' | 'completed';
    moodId?: string;
    createdAt?: string;
};

export default function TodoList() {
    const router = useRouter();
    const { appMode } = useStorage();
    const { colors } = useTheme();
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');

    const fetchTodos = useCallback(async () => {
        if (appMode !== 'api') {
            setLoading(false);
            return;
        }
        try {
            const data = await api.todo.getAll();
            const fetched: TodoItem[] = data?.todos || [];
            setTodos(fetched);

            const pending = fetched.filter(t => t.status === 'pending');
            scheduleTodoDailyReminder(pending.length, pending[0]?.todo).catch(() => {});
        } catch (error) {
            logger.error('Failed to fetch todos:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [appMode]);

    // Refetch every time this screen regains focus — not just on first mount —
    // so todos the AI just extracted from a new entry actually show up.
    useFocusEffect(
        useCallback(() => {
            fetchTodos();
        }, [fetchTodos])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchTodos();
    };

    const toggleTodo = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';

        // Optimistic update
        setTodos(prev => prev.map(t => t._id === id ? { ...t, status: newStatus as TodoItem['status'] } : t));

        try {
            await api.todo.update(id, { status: newStatus as 'pending' | 'completed' });
        } catch (error) {
            logger.error('Failed to update todo:', error);
            // Revert on error
            setTodos(prev => prev.map(t => t._id === id ? { ...t, status: currentStatus as TodoItem['status'] } : t));
            Alert.alert('Error', 'Failed to update task status.');
        }
    };

    const deleteTodo = async (id: string) => {
        Alert.alert(
            'Delete Task',
            'Are you sure you want to remove this task?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setTodos(prev => prev.filter(t => t._id !== id));
                        try {
                            const todo = todos.find(t => t._id === id);
                            await api.todo.delete(id, todo?.todo ?? '');
                        } catch (error) {
                            logger.error('Failed to delete todo:', error);
                            fetchTodos(); // Reload
                            Alert.alert('Error', 'Failed to delete task.');
                        }
                    }
                }
            ]
        );
    };

    const filteredTodos = todos.filter(t => {
        if (activeTab === 'all') return true;
        return t.status === activeTab;
    });

    const renderItem = ({ item }: { item: TodoItem }) => (
        <View style={[styles.todoCard, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
                style={styles.todoContent}
                onPress={() => toggleTodo(item._id, item.status)}
                activeOpacity={0.7}
            >
                <View style={[
                    styles.checkbox,
                    { borderColor: colors.border },
                    item.status === 'completed' && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}>
                    {item.status === 'completed' && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <View style={styles.textContainer}>
                    <Text style={[
                        styles.todoText,
                        { color: colors.text },
                        item.status === 'completed' && { textDecorationLine: 'line-through', color: colors.textSecondary },
                    ]}>
                        {item.todo}
                    </Text>
                    {item.type && (
                        <View style={[styles.typeBadge, { backgroundColor: colors.surfaceSecondary }]}>
                            <Text style={[styles.typeText, { color: colors.primary }]}>{item.type}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteTodo(item._id)}
            >
                <Feather name="trash-2" size={18} color="#EF4444" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Tasks</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.tabContainer}>
                {(['pending', 'completed', 'all'] as const).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[
                            styles.tab,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                            activeTab === tab && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: colors.textSecondary },
                            activeTab === tab && { color: '#fff' },
                        ]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : filteredTodos.length > 0 ? (
                <FlatList
                    data={filteredTodos}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
                    }
                />
            ) : (
                <View style={styles.center}>
                    <View style={[styles.emptyIconBg, { backgroundColor: colors.surface }]}>
                        <MaterialCommunityIcons name="clipboard-check-outline" size={48} color={colors.textSecondary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No tasks found</Text>
                    <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                        {activeTab === 'pending'
                            ? "You're all caught up! AI extracts tasks from your journals."
                            : "Your completed tasks will appear here."}
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '800' },

    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    tabText: { fontSize: 13, fontWeight: '700' },

    listContent: { padding: 16, paddingBottom: 40 },
    todoCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    todoContent: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    textContainer: { flex: 1, gap: 4 },
    todoText: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
    typeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    typeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    deleteBtn: {
        padding: 8,
        marginLeft: 8,
    },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
    emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
