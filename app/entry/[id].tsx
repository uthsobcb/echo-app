import { EchoAvatar, ExpressionName } from '@/component/EchoAvatar';
import { useStorage } from '@/context/StorageContext';
import { useTheme } from '@/context/ThemeContext';
import { logger } from '@/service/logger';
import { moodToExpression } from '@/service/mood';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Where the finger would come to rest if it kept decelerating (Apple's
// exponential-decay projection) — used so a fast short swipe commits a page
// change and a slow long one doesn't.
function project(velocity: number, decelerationRate = 0.998) {
    'worklet';
    return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

const MOOD_GRADIENT: Record<ExpressionName, { light: [string, string]; dark: [string, string] }> = {
    happy: { light: ['#FDE68A', '#FCD34D'], dark: ['#78350F', '#B45309'] },
    excited: { light: ['#FBCFE8', '#F472B6'], dark: ['#831843', '#BE185D'] },
    calm: { light: ['#BAE6FD', '#38BDF8'], dark: ['#0C4A6E', '#0369A1'] },
    curious: { light: ['#DDD6FE', '#A78BFA'], dark: ['#4C1D95', '#6D28D9'] },
    proud: { light: ['#A7F3D0', '#34D399'], dark: ['#064E3B', '#059669'] },
    sad: { light: ['#E2E8F0', '#94A3B8'], dark: ['#1E293B', '#334155'] },
    sleepy: { light: ['#C7D2FE', '#818CF8'], dark: ['#312E81', '#4338CA'] },
    thinking: { light: ['#E9D5FF', '#A855F7'], dark: ['#2E1065', '#6D28D9'] },
};

function weekdayLabel(date: Date): string {
    const now = new Date();
    const isToday = date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate();
    return isToday ? 'Today' : date.toLocaleDateString([], { weekday: 'long' });
}

export default function EntryDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { entries, deleteEntry } = useStorage();
    const { colors, isDark } = useTheme();

    const initialIndex = Math.max(0, entries.findIndex(e => (e._id || e.id) === id));
    const [index, setIndex] = useState(initialIndex);
    const [direction, setDirection] = useState<1 | -1>(1);

    const entry = entries[index];
    const canGoNext = index < entries.length - 1; // next = older entry
    const canGoPrev = index > 0; // prev = newer entry

    const goNext = () => {
        if (index >= entries.length - 1) return;
        setDirection(1);
        setIndex(i => i + 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };
    const goPrev = () => {
        if (index <= 0) return;
        setDirection(-1);
        setIndex(i => i - 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // Swipe-to-commit: the gesture decides by velocity + distance projection,
    // not live-tracked drag — the page swap itself is a directional slide
    // (below), not a finger-followed transform.
    const pan = useMemo(() => Gesture.Pan()
        .activeOffsetX([-10, 10])
        .onEnd((e) => {
            const projected = e.translationX + project(e.velocityX);
            if (projected < -80 && canGoNext) scheduleOnRN(goNext);
            else if (projected > 80 && canGoPrev) scheduleOnRN(goPrev);
        }), [canGoNext, canGoPrev]);

    if (!entry) {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.center}>
                    <Text style={{ color: colors.textSecondary }}>Entry not found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const date = new Date(entry.createdAt);
    const expression = moodToExpression(entry.mood ?? '');
    const gradient = MOOD_GRADIENT[expression][isDark ? 'dark' : 'light'];
    const textOnGradient = isDark ? '#F8FAFC' : '#1F2937';

    const content = typeof entry.content === 'string' ? entry.content : '';
    const firstLine = content.split('\n')[0] || '';
    const title = firstLine.length > 60 ? firstLine.slice(0, 60) + '…' : firstLine;
    const body = content.slice(firstLine.length).trim() || content;

    const entryId = entry._id || entry.id || '';

    const handleEdit = () => {
        router.push({ pathname: '/(tabs)/create', params: { entryId } });
    };

    const handleDelete = () => {
        Alert.alert('Delete Entry', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await deleteEntry(entryId);
                        router.back();
                    } catch (e) {
                        logger.error('Failed to delete', e);
                    }
                }
            },
        ]);
    };

    const ENTER = direction === 1 ? SlideInRight.duration(220) : SlideInLeft.duration(220);
    const EXIT = direction === 1 ? SlideOutLeft.duration(180) : SlideOutRight.duration(180);

    return (
        <GestureDetector gesture={pan}>
            <View style={[styles.safe, { backgroundColor: colors.background }]}>
                <SafeAreaView style={styles.safe}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                            <Ionicons name="chevron-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerCounter, { color: colors.textSecondary }]}>
                            {index + 1} of {entries.length}
                        </Text>
                        <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
                            <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Animated.View key={index} entering={ENTER} exiting={EXIT} style={styles.pageWrap}>
                        <LinearGradient
                            colors={gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.card}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.dateBadge, { backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.6)' }]}>
                                    <Text style={[styles.dateDay, { color: textOnGradient }]}>{date.getDate()}</Text>
                                    <Text style={[styles.dateMonth, { color: textOnGradient }]}>
                                        {date.toLocaleDateString([], { month: 'short' })}
                                    </Text>
                                </View>
                                <Text style={[styles.weekday, { color: textOnGradient }]}>{weekdayLabel(date)}</Text>
                            </View>

                            <View style={styles.avatarWrap}>
                                <EchoAvatar expression={expression} size={110} animated />
                                {entry.mood ? (
                                    <View style={[styles.moodPill, { backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.7)' }]}>
                                        <Text style={[styles.moodPillText, { color: textOnGradient }]}>{entry.mood}</Text>
                                    </View>
                                ) : null}
                            </View>

                            <ScrollView style={styles.textScroll} showsVerticalScrollIndicator={false}>
                                {title ? <Text style={[styles.title, { color: textOnGradient }]}>{title}</Text> : null}
                                <Text style={[styles.body, { color: textOnGradient }]}>{body}</Text>
                            </ScrollView>
                        </LinearGradient>
                    </Animated.View>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={goPrev} disabled={!canGoPrev} style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}>
                            <Ionicons name="chevron-back" size={18} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleEdit} style={[styles.editBtn, { backgroundColor: colors.primary }]}>
                            <Ionicons name="create-outline" size={16} color="#fff" />
                            <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={goNext} disabled={!canGoNext} style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}>
                            <Ionicons name="chevron-forward" size={18} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 12, paddingVertical: 8,
    },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerCounter: { fontSize: 13, fontWeight: '700' },

    pageWrap: { flex: 1, paddingHorizontal: 16 },
    card: { flex: 1, borderRadius: 28, padding: 20, overflow: 'hidden' },

    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    dateBadge: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
    dateDay: { fontSize: 20, fontWeight: '900', lineHeight: 22 },
    dateMonth: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    weekday: { fontSize: 15, fontWeight: '800' },

    avatarWrap: { alignItems: 'center', marginBottom: 16, gap: 8 },
    moodPill: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5 },
    moodPillText: { fontSize: 12, fontWeight: '800' },

    textScroll: { flex: 1 },
    title: { fontSize: 22, fontWeight: '800', marginBottom: 12, lineHeight: 28 },
    body: { fontSize: 16, lineHeight: 24, paddingBottom: 24 },

    footer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16,
        paddingHorizontal: 20, paddingVertical: 16,
    },
    navBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    navBtnDisabled: { opacity: 0.25 },
    editBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderRadius: 20, paddingHorizontal: 20, paddingVertical: 11,
    },
    editBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
