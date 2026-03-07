import { api } from '@/service/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DrawStatus {
    drawCount: number;
    canDraw: boolean;
    requiresMessage: boolean;
    nextAvailableAt?: string;
}

interface SpaceMessage {
    _id: string;
    content: string;
    userId?: string;
    createdAt?: string;
}

export default function Space() {
    const [drawStatus, setDrawStatus] = useState<DrawStatus | null>(null);
    const [messages, setMessages] = useState<SpaceMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [drawing, setDrawing] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [posting, setPosting] = useState(false);
    const [drawnMessage, setDrawnMessage] = useState<string | null>(null);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const revealAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadData();
    }, []);

    // Pulse animation for draw button
    useEffect(() => {
        if (drawStatus?.canDraw) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                ])
            ).start();
        }
    }, [drawStatus?.canDraw]);

    const loadData = async () => {
        try {
            const [status, msgs] = await Promise.all([
                api.space.getDrawStatus(),
                api.space.getMessage(),
            ]);
            setDrawStatus(status);
            setMessages(Array.isArray(msgs) ? msgs : msgs.messages || [msgs]);
        } catch (e) {
            console.error('[Space] loadData failed', e);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleDraw = async () => {
        if (!drawStatus?.canDraw || drawing) return;
        setDrawing(true);
        try {
            const result = await api.space.recordDraw();
            const msg = result?.message?.content || result?.content || 'A message from the universe 🌟';
            setDrawnMessage(msg);
            // Reveal animation
            Animated.timing(revealAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
            await loadData();
        } catch (e: any) {
            Alert.alert('Draw Error', e.message || 'Could not draw right now');
        } finally {
            setDrawing(false);
        }
    };

    const handlePostMessage = async () => {
        if (!newMessage.trim()) return;
        setPosting(true);
        try {
            await api.space.postMessage(newMessage.trim());
            setNewMessage('');
            await loadData();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Could not post message');
        } finally {
            setPosting(false);
        }
    };

    const getCountdown = () => {
        if (!drawStatus?.nextAvailableAt) return '';
        const diff = new Date(drawStatus.nextAvailableAt).getTime() - Date.now();
        if (diff <= 0) return '';
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={22} color="#4F6BFF" />
                        </TouchableOpacity>
                        <Text style={styles.pageTitle}>Space</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Hero Draw Card */}
                    <LinearGradient colors={['#1A1D2E', '#2D3561', '#4F6BFF']} style={styles.heroCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <View style={styles.starsRow}>
                            {['✦', '✧', '✦', '✧', '✦'].map((s, i) => (
                                <Text key={i} style={[styles.star, { opacity: 0.3 + i * 0.15 }]}>{s}</Text>
                            ))}
                        </View>

                        <Text style={styles.heroTitle}>Your Daily Draw</Text>
                        <Text style={styles.heroSub}>Draw a message from the journaling community</Text>

                        {drawnMessage ? (
                            <Animated.View style={[styles.drawnCard, { opacity: revealAnim }]}>
                                <Text style={styles.drawnEmoji}>💌</Text>
                                <Text style={styles.drawnText}>{drawnMessage}</Text>
                            </Animated.View>
                        ) : (
                            <Animated.View style={{ transform: [{ scale: drawStatus?.canDraw ? pulseAnim : 1 }] }}>
                                <TouchableOpacity
                                    style={[styles.drawBtn, !drawStatus?.canDraw && styles.drawBtnDisabled]}
                                    onPress={handleDraw}
                                    disabled={!drawStatus?.canDraw || drawing}
                                    activeOpacity={0.85}
                                >
                                    {drawing ? (
                                        <ActivityIndicator color="#4F6BFF" />
                                    ) : (
                                        <>
                                            <Text style={styles.drawBtnIcon}>🎴</Text>
                                            <Text style={styles.drawBtnText}>
                                                {drawStatus?.canDraw ? 'Draw Card' : `Next draw in ${getCountdown()}`}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        )}

                        <Text style={styles.drawCount}>
                            {drawStatus ? `${drawStatus.drawCount} cards drawn` : 'Loading…'}
                        </Text>
                    </LinearGradient>

                    {/* Post a Message */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Share with the Community</Text>
                        <View style={styles.postBox}>
                            <TextInput
                                style={styles.postInput}
                                placeholder="Write something inspiring..."
                                placeholderTextColor="#B0BAD0"
                                value={newMessage}
                                onChangeText={setNewMessage}
                                multiline
                                maxLength={280}
                            />
                            <View style={styles.postFooter}>
                                <Text style={styles.postCount}>{newMessage.length}/280</Text>
                                <TouchableOpacity
                                    style={[styles.postBtn, !newMessage.trim() && styles.postBtnDisabled]}
                                    onPress={handlePostMessage}
                                    disabled={posting || !newMessage.trim()}
                                    activeOpacity={0.85}
                                >
                                    {posting ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.postBtnText}>Share ✨</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Community Messages */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Community Thoughts</Text>
                        {loadingMessages ? (
                            <ActivityIndicator color="#4F6BFF" style={{ marginTop: 20 }} />
                        ) : messages.length === 0 ? (
                            <View style={styles.emptyMsg}>
                                <Text style={styles.emptyMsgText}>No messages yet. Be the first! 🌟</Text>
                            </View>
                        ) : (
                            messages.slice(0, 10).map((msg, i) => (
                                <View key={msg._id || i} style={styles.msgCard}>
                                    <View style={styles.msgAvatar}>
                                        <MaterialCommunityIcons name="account-circle" size={32} color="#4F6BFF" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.msgText}>{msg.content}</Text>
                                        {msg.createdAt && (
                                            <Text style={styles.msgTime}>
                                                {new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))
                        )}
                    </View>

                    <View style={{ height: 32 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F5F6FA' },
    scroll: { paddingBottom: 20 },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16,
    },
    backBtn: { width: 40, height: 40, backgroundColor: '#EEF1FF', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    pageTitle: { fontSize: 20, fontWeight: '800', color: '#1A1D2E' },

    heroCard: {
        marginHorizontal: 16, borderRadius: 28, padding: 28,
        alignItems: 'center', marginBottom: 20,
    },
    starsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    star: { fontSize: 18, color: '#fff' },
    heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8 },
    heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 24, lineHeight: 20 },

    drawBtn: {
        backgroundColor: '#fff', borderRadius: 20, paddingVertical: 16, paddingHorizontal: 36,
        flexDirection: 'row', alignItems: 'center', gap: 10,
        shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
    },
    drawBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.4)' },
    drawBtnIcon: { fontSize: 24 },
    drawBtnText: { fontSize: 16, fontWeight: '800', color: '#4F6BFF' },

    drawnCard: {
        backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
        padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    drawnEmoji: { fontSize: 32, marginBottom: 10 },
    drawnText: { fontSize: 15, color: '#fff', textAlign: 'center', lineHeight: 22, fontStyle: 'italic' },

    drawCount: { marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.5)' },

    section: { paddingHorizontal: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1D2E', marginBottom: 12 },

    postBox: {
        backgroundColor: '#fff', borderRadius: 20, padding: 16,
        borderWidth: 1.5, borderColor: '#E5E8F0',
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    },
    postInput: { fontSize: 15, color: '#1A1D2E', minHeight: 70, lineHeight: 22 },
    postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    postCount: { fontSize: 12, color: '#B0BAD0' },
    postBtn: { backgroundColor: '#4F6BFF', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 9 },
    postBtnDisabled: { backgroundColor: '#E5E8F0' },
    postBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    emptyMsg: { alignItems: 'center', paddingVertical: 24 },
    emptyMsgText: { fontSize: 14, color: '#7A8499' },
    msgCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: '#E5E8F0',
    },
    msgAvatar: { marginTop: 2 },
    msgText: { fontSize: 14, color: '#1A1D2E', lineHeight: 20 },
    msgTime: { fontSize: 11, color: '#B0BAD0', marginTop: 4 },
});
