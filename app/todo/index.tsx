import { useStorage } from '@/context/StorageContext';
import { api } from '@/service/api';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

type TodoItem = {
    _id: string;
    todo: string;
    type?: string;
    status: 'pending' | 'completed';
    moodId?: string;
    createdAt?: string;
};

export default function TodoList() {
    const router = useRouter();
    const { appMode } = useStorage();
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');

    const fetchTodos = async () => {
        if (appMode !== 'api') {
            setLoading(false);
            return;
        }
        try {
            const data = await api.todo.getAll();
            setTodos(data?.todos || []);
        } catch (error) {
            console.error('Failed to fetch todos:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTodos();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTodos();
    };

    const toggleTodo = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';

        // Optimistic update
        setTodos(prev => prev.map(t => t._id === id ? { ...t, status: newStatus as any } : t));

        try {
            await api.todo.updateStatus(id, newStatus);
        } catch (error) {
            console.error('Failed to update todo:', error);
            // Revert on error
            setTodos(prev => prev.map(t => t._id === id ? { ...t, status: currentStatus as any } : t));
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
                            await api.todo.delete(id);
                        } catch (error) {
                            console.error('Failed to delete todo:', error);
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
        <View style={styles.todoCard}>
            <TouchableOpacity
                style={styles.todoContent}
                onPress={() => toggleTodo(item._id, item.status)}
                activeOpacity={0.7}
            >
                <View style={[
                    styles.checkbox,
                    item.status === 'completed' && styles.checkboxChecked
                ]}>
                    {item.status === 'completed' && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <View style={styles.textContainer}>
                    <Text style={[
                        styles.todoText,
                        item.status === 'completed' && styles.todoTextDone
                    ]}>
                        {item.todo}
                    </Text>
                    {item.type && (
                        <View style={styles.typeBadge}>
                            <Text style={styles.typeText}>{item.type}</Text>
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
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#1A1D2E" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tasks</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.tabContainer}>
                {(['pending', 'completed', 'all'] as const).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4F6BFF" />
                </View>
            ) : filteredTodos.length > 0 ? (
                <FlatList
                    data={filteredTodos}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F6BFF']} />
                    }
                />
            ) : (
                <View style={styles.center}>
                    <View style={styles.emptyIconBg}>
                        <MaterialCommunityIcons name="clipboard-check-outline" size={48} color="#B0BAD0" />
                    </View>
                    <Text style={styles.emptyTitle}>No tasks found</Text>
                    <Text style={styles.emptySub}>
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
    safe: { flex: 1, backgroundColor: '#F5F6FA' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F6FA',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1D2E' },

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
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E8F0',
    },
    activeTab: {
        backgroundColor: '#4F6BFF',
        borderColor: '#4F6BFF',
    },
    tabText: { fontSize: 13, fontWeight: '700', color: '#7A8499' },
    activeTabText: { color: '#fff' },

    listContent: { padding: 16, paddingBottom: 40 },
    todoCard: {
        backgroundColor: '#fff',
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
        borderColor: '#E5E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: '#4F6BFF',
        borderColor: '#4F6BFF',
    },
    textContainer: { flex: 1, gap: 4 },
    todoText: { fontSize: 15, color: '#1A1D2E', fontWeight: '600', lineHeight: 22 },
    todoTextDone: { textDecorationLine: 'line-through', color: '#B0BAD0' },
    typeBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#EEF1FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    typeText: { fontSize: 10, fontWeight: '700', color: '#4F6BFF', textTransform: 'uppercase' },
    deleteBtn: {
        padding: 8,
        marginLeft: 8,
    },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1A1D2E', marginBottom: 8 },
    emptySub: { fontSize: 14, color: '#7A8499', textAlign: 'center', lineHeight: 20 },
});
