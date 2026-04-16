import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

interface StreakFlameProps {
    days: number;
    size?: 'sm' | 'md' | 'lg';
    atRisk?: boolean;
    showLabel?: boolean;
}

const SIZES = {
    sm: { flame: 20, text: 13, label: 10 },
    md: { flame: 32, text: 18, label: 12 },
    lg: { flame: 48, text: 28, label: 14 },
};

export default function StreakFlame({ days, size = 'md', atRisk = false, showLabel = true }: StreakFlameProps) {
    const s = SIZES[size];
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    useEffect(() => {
        // Subtle flickering animation
        scale.value = withRepeat(
            withSequence(
                withTiming(1.15, { duration: 600 }),
                withTiming(1, { duration: 600 }),
            ),
            -1,
            true,
        );
        if (atRisk) {
            opacity.value = withRepeat(
                withSequence(
                    withTiming(0.4, { duration: 800 }),
                    withTiming(1, { duration: 800 }),
                ),
                -1,
                true,
            );
        }
    }, [atRisk]);

    const flameStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <View style={styles.container}>
            <Animated.Text style={[{ fontSize: s.flame }, flameStyle]}>
                {days > 0 ? '' : ''}
            </Animated.Text>
            <Text style={[
                styles.count,
                { fontSize: s.text, color: atRisk ? '#EF4444' : '#F59E0B' }
            ]}>
                {days}
            </Text>
            {showLabel && (
                <Text style={[styles.label, { fontSize: s.label, color: atRisk ? '#EF4444' : '#9CA3AF' }]}>
                    {days === 1 ? 'day' : 'days'}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center' },
    count: { fontWeight: '900', marginTop: -4 },
    label: { fontWeight: '600', marginTop: -2 },
});
