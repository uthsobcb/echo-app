import { Toast } from '@/component/Toast';
import { useStorage } from '@/context/StorageContext';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/service/api';
import { logger } from '@/service/logger';
import { SpaceDrawStatus, SpaceLeaderboardEntry, SpaceMessage } from '@/types/data';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
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

const MIN_MESSAGE_LENGTH = 5;
const MEDALS = ['🥇', '🥈', '🥉'];

function timeAgo(iso: string) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
}

export default function SpacePage() {
    const router = useRouter();
    const { appMode } = useStorage();
    const { colors, isDark } = useTheme();

    const [status, setStatus] = useState<SpaceDrawStatus | null>(null);
    const [statusLoading, setStatusLoading] = useState(true);
    const [drawing, setDrawing] = useState(false);
    const [drawnMessage, setDrawnMessage] = useState<SpaceMessage | null | undefined>(undefined);

    const [composeText, setComposeText] = useState('');
    const [posting, setPosting] = useState(false);

    const [leaderboard, setLeaderboard] = useState<SpaceLeaderboardEntry[]>([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(true);

    const revealAnim = useRef(new Animated.Value(0)).current;

    const fetchStatus = useCallback(async () => {
        try {
            const data = await api.space.getDrawStatus();
            setStatus(data);
        } catch (e) {
            logger.error('[Space] Failed to load draw status', e);
        } finally {
            setStatusLoading(false);
        }
    }, []);

    const fetchLeaderboard = useCallback(async () => {
        try {
            const data = await api.space.getLeaderboard();
            setLeaderboard(data);
        } catch (e) {
            logger.error('[Space] Failed to load leaderboard', e);
        } finally {
            setLeaderboardLoading(false);
        }
    }, []);

    useEffect(() => {
        if (appMode !== 'api') {
            setStatusLoading(false);
            setLeaderboardLoading(false);
            return;
        }
        fetchStatus();
        fetchLeaderboard();
    }, [appMode, fetchStatus, fetchLeaderboard]);

    const handleDraw = async () => {
        setDrawing(true);
        try {
            await api.space.recordDraw();
            const msg = await api.space.getMessage();
            setDrawnMessage(msg);
            revealAnim.setValue(0);
            Animated.spring(revealAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }).start();
        } catch (e: any) {
            Toast.error(e?.message || 'Could not draw right now');
        } finally {
            setDrawing(false);
            fetchStatus();
        }
    };

    const handlePost = async () => {
        const content = composeText.trim();
        if (content.length < MIN_MESSAGE_LENGTH) return;
        setPosting(true);
        try {
            await api.space.postMessage(content);
            setComposeText('');
            setDrawnMessage(undefined);
            Toast.success('Shared with the community');
            fetchStatus();
            fetchLeaderboard();
        } catch (e: any) {
            Toast.error(e?.message || 'Could not post your message');
        } finally {
            setPosting(false);
        }
    };

    if (appMode !== 'api') {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Space</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.center}>
                    <Ionicons name="planet-outline" size={40} color={colors.textSecondary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        Space is a community feature — sign in with a cloud account to join.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Space</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={80}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Draw an anonymous thought from someone in the community, then share one of your own.
                    </Text>

                    {/* ── Drawn message reveal ─────────────────────────── */}
                    {drawnMessage !== undefined && (
                        <Animated.View
                            style={{
                                opacity: revealAnim,
                                transform: [
                                    { scale: revealAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                                ],
                            }}
                        >
                            <LinearGradient
                                colors={isDark ? ['#1C1060', '#0F0C35'] : ['#A855F7', '#7B3FE4']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.messageCard}
                            >
                                <Ionicons name="sparkles" size={18} color="rgba(255,255,255,0.85)" />
                                {drawnMessage ? (
                                    <>
                                        <Text style={styles.messageText}>"{drawnMessage.content}"</Text>
                                        <Text style={styles.messageMeta}>
                                            from the community · {timeAgo(drawnMessage.createdAt)}
                                        </Text>
                                    </>
                                ) : (
                                    <Text style={styles.messageText}>
                                        No messages from others yet — be the first to share one below.
                                    </Text>
                                )}
                            </LinearGradient>
                        </Animated.View>
                    )}

                    {/* ── Primary action ───────────────────────────────── */}
                    {statusLoading ? (
                        <View style={styles.center}>
                            <ActivityIndicator color={colors.primary} />
                        </View>
                    ) : status?.canDraw ? (
                        <TouchableOpacity
                            style={[styles.drawBtn, { backgroundColor: colors.primary }]}
                            onPress={handleDraw}
                            disabled={drawing}
                            activeOpacity={0.85}
                        >
                            {drawing ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="shuffle" size={18} color="#fff" />
                                    <Text style={styles.drawBtnText}>Draw a message</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    ) : status?.requiresMessage ? (
                        <View style={[styles.composeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.composeLabel, { color: colors.text }]}>
                                Share something to draw again
                            </Text>
                            <TextInput
                                style={[styles.composeInput, { color: colors.text, borderColor: colors.border }]}
                                placeholder="Write an anonymous thought…"
                                placeholderTextColor={colors.textSecondary}
                                value={composeText}
                                onChangeText={setComposeText}
                                multiline
                                maxLength={500}
                            />
                            <View style={styles.composeFooter}>
                                <Text style={[styles.composeCount, { color: colors.textSecondary }]}>
                                    {composeText.trim().length}/{MIN_MESSAGE_LENGTH} min
                                </Text>
                                <TouchableOpacity
                                    style={[
                                        styles.postBtn,
                                        { backgroundColor: colors.primary },
                                        composeText.trim().length < MIN_MESSAGE_LENGTH && styles.postBtnDisabled,
                                    ]}
                                    onPress={handlePost}
                                    disabled={posting || composeText.trim().length < MIN_MESSAGE_LENGTH}
                                >
                                    {posting ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.postBtnText}>Share</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.cooldownCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                            <Text style={[styles.cooldownText, { color: colors.textSecondary }]}>
                                {status?.nextAvailableAt
                                    ? `Next draw available ${new Date(status.nextAvailableAt).toLocaleString()}`
                                    : 'Come back later for your next draw'}
                            </Text>
                        </View>
                    )}

                    {/* ── Leaderboard ───────────────────────────────────── */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Contributors</Text>
                    </View>

                    {leaderboardLoading ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : leaderboard.length === 0 ? (
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No contributors yet.
                        </Text>
                    ) : (
                        <View style={[styles.leaderboardCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            {leaderboard.map((entry, i) => (
                                <View
                                    key={entry._id}
                                    style={[
                                        styles.leaderRow,
                                        i < leaderboard.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                                    ]}
                                >
                                    {MEDALS[i] ? (
                                        <Text style={styles.leaderMedal}>{MEDALS[i]}</Text>
                                    ) : (
                                        <Text style={[styles.leaderRank, { color: colors.textSecondary }]}>{i + 1}</Text>
                                    )}
                                    {entry.image ? (
                                        <Image source={{ uri: entry.image }} style={styles.leaderAvatar} />
                                    ) : (
                                        <View style={[styles.leaderAvatarFallback, { backgroundColor: colors.surfaceSecondary }]}>
                                            <Text style={[styles.leaderAvatarText, { color: colors.primary }]}>
                                                {entry.name?.charAt(0)?.toUpperCase() ?? '?'}
                                            </Text>
                                        </View>
                                    )}
                                    <Text style={[styles.leaderName, { color: colors.text }]} numberOfLines={1}>
                                        {entry.name}
                                    </Text>
                                    <Text style={[styles.leaderCount, { color: colors.textSecondary }]}>
                                        {entry.count}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '800' },

    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    subtitle: { fontSize: 13, lineHeight: 19, marginBottom: 18 },

    center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 10 },
    emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },

    messageCard: {
        borderRadius: 20, padding: 20, marginBottom: 18, gap: 10,
    },
    messageText: { color: '#fff', fontSize: 16, fontStyle: 'italic', lineHeight: 23, fontWeight: '500' },
    messageMeta: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '600' },

    drawBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderRadius: 16, paddingVertical: 15, marginBottom: 24,
    },
    drawBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    composeCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 24, gap: 10 },
    composeLabel: { fontSize: 14, fontWeight: '700' },
    composeInput: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 80, fontSize: 14, textAlignVertical: 'top' },
    composeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    composeCount: { fontSize: 11, fontWeight: '600' },
    postBtn: { borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9 },
    postBtnDisabled: { opacity: 0.4 },
    postBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    cooldownCard: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24,
    },
    cooldownText: { fontSize: 13, flex: 1, lineHeight: 18 },

    sectionHeader: { marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800' },

    leaderboardCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
    leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
    leaderRank: { width: 20, fontSize: 14, fontWeight: '800', textAlign: 'center' },
    leaderMedal: { width: 20, fontSize: 16, textAlign: 'center' },
    leaderAvatar: { width: 34, height: 34, borderRadius: 17 },
    leaderAvatarFallback: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    leaderAvatarText: { fontSize: 13, fontWeight: '800' },
    leaderName: { flex: 1, fontSize: 14, fontWeight: '600' },
    leaderCount: { fontSize: 13, fontWeight: '700' },
});
