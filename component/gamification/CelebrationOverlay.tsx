import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useGamification } from '../../context/GamificationContext';
import { CelebrationType } from '../../types/data';

const { width, height } = Dimensions.get('window');

let ConfettiCannon: any = null;
try {
    ConfettiCannon = require('react-native-confetti-cannon').default;
} catch {
    // Not available
}

export default function CelebrationOverlay() {
    const { celebrations, consumeCelebration } = useGamification();
    const [current, setCurrent] = useState<CelebrationType | null>(null);
    const processing = useRef(false);
    const confettiRef = useRef<any>(null);

    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.5);
    const translateY = useSharedValue(30);

    const dismiss = useCallback(() => {
        opacity.value = withTiming(0, { duration: 300 }, () => {
            runOnJS(setCurrent)(null);
            runOnJS(() => { processing.current = false; })();
        });
    }, []);

    const showAnimation = useCallback((duration: number) => {
        opacity.value = withTiming(1, { duration: 200 });
        scale.value = withSpring(1, { damping: 12, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15 });

        // Auto-dismiss after duration
        opacity.value = withDelay(duration,
            withTiming(0, { duration: 400 }, () => {
                runOnJS(setCurrent)(null);
                runOnJS(() => { processing.current = false; })();
            })
        );
    }, []);

    useEffect(() => {
        if (celebrations.length === 0 || processing.current) return;

        processing.current = true;
        const next = consumeCelebration();
        if (!next) {
            processing.current = false;
            return;
        }

        // Reset animation values
        scale.value = 0.5;
        translateY.value = 30;
        opacity.value = 0;

        setCurrent(next);

        const duration = next.type === 'streak_milestone' || next.type === 'level_up' || next.type === 'badge_unlock'
            ? 2500
            : 1800;

        showAnimation(duration);

        // Fire confetti for big celebrations
        if (next.type === 'streak_milestone' || next.type === 'level_up' || next.type === 'badge_unlock') {
            setTimeout(() => confettiRef.current?.start(), 200);
        }
    }, [celebrations.length]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }, { translateY: translateY.value }],
    }));

    if (!current) return null;

    return (
        <View style={styles.overlay} pointerEvents="none">
            <Animated.View style={[styles.card, containerStyle]}>
                {renderCelebration(current)}
            </Animated.View>
            {ConfettiCannon && (current.type === 'streak_milestone' || current.type === 'level_up' || current.type === 'badge_unlock') && (
                <ConfettiCannon
                    ref={confettiRef}
                    count={80}
                    origin={{ x: width / 2, y: -10 }}
                    autoStart={false}
                    fadeOut
                    fallSpeed={2500}
                    explosionSpeed={300}
                />
            )}
        </View>
    );
}

function renderCelebration(c: CelebrationType) {
    switch (c.type) {
        case 'xp_gain':
            return (
                <View style={styles.content}>
                    <Text style={styles.emoji}></Text>
                    <Text style={[styles.title, { color: '#F59E0B' }]}>+{c.amount} XP</Text>
                    <Text style={styles.subtitle}>Keep journaling!</Text>
                </View>
            );
        case 'streak_update':
            return (
                <View style={styles.content}>
                    <Text style={styles.emoji}></Text>
                    <Text style={[styles.title, { color: '#F97316' }]}>{c.days} Day Streak!</Text>
                    <Text style={styles.subtitle}>You're on fire!</Text>
                </View>
            );
        case 'streak_milestone':
            return (
                <View style={styles.content}>
                    <Text style={styles.bigEmoji}></Text>
                    <Text style={[styles.bigTitle, { color: '#F97316' }]}>{c.days} Day Streak!</Text>
                    <Text style={styles.milestoneText}>{c.milestone}</Text>
                </View>
            );
        case 'badge_unlock':
            return (
                <View style={styles.content}>
                    <Text style={styles.bigEmoji}></Text>
                    <Text style={[styles.bigTitle, { color: '#8B5CF6' }]}>Badge Unlocked!</Text>
                    <Text style={styles.badgeName}>{c.badge}</Text>
                </View>
            );
        case 'level_up':
            return (
                <View style={styles.content}>
                    <Text style={styles.bigEmoji}></Text>
                    <Text style={[styles.bigTitle, { color: '#4F6BFF' }]}>Level Up!</Text>
                    <Text style={styles.levelText}>Level {c.previousLevel}  Level {c.newLevel}</Text>
                </View>
            );
        case 'daily_goal_complete':
            return (
                <View style={styles.content}>
                    <Text style={styles.emoji}></Text>
                    <Text style={[styles.title, { color: '#22C55E' }]}>Daily Goal Complete!</Text>
                    <Text style={styles.subtitle}>Great work today!</Text>
                </View>
            );
    }
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderRadius: 28,
        paddingHorizontal: 36,
        paddingVertical: 28,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
        minWidth: 240,
    },
    content: { alignItems: 'center' },
    emoji: { fontSize: 40, marginBottom: 8 },
    bigEmoji: { fontSize: 56, marginBottom: 12 },
    title: { fontSize: 24, fontWeight: '900' },
    bigTitle: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginTop: 4 },
    milestoneText: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginTop: 4, textAlign: 'center' },
    badgeName: { fontSize: 18, fontWeight: '800', color: '#374151', marginTop: 4 },
    levelText: { fontSize: 18, fontWeight: '700', color: '#6B7280', marginTop: 4 },
});
