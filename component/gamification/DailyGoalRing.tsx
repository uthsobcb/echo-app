import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGamification } from '../../context/GamificationContext';
import ProgressRing from './ProgressRing';
import StreakFlame from './StreakFlame';

interface DailyGoalRingProps {
    size?: number;
    compact?: boolean;
}

export default function DailyGoalRing({ size = 120, compact = false }: DailyGoalRingProps) {
    const { state } = useGamification();
    const done = state.dailyGoalMet;

    return (
        <View style={styles.container}>
            <ProgressRing
                progress={done ? 1 : 0}
                size={size}
                strokeWidth={size * 0.08}
                color={done ? '#22C55E' : '#4F6BFF'}
                bgColor="rgba(79,107,255,0.15)"
            >
                {done ? (
                    <Text style={{ fontSize: size * 0.35 }}></Text>
                ) : (
                    <Text style={[styles.goalText, { fontSize: size * 0.18 }]}>0/1</Text>
                )}
            </ProgressRing>

            {!compact && (
                <View style={styles.statsRow}>
                    <StreakFlame days={state.currentStreak} size="sm" atRisk={state.streakAtRisk} />
                    <View style={styles.statPill}>
                        <Text style={styles.statValue}>{state.totalXp}</Text>
                        <Text style={styles.statLabel}>XP</Text>
                    </View>
                    <View style={styles.statPill}>
                        <Text style={styles.statValue}>Lv.{state.currentLevel}</Text>
                        <Text style={styles.statLabel}>Level</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center' },
    goalText: { fontWeight: '800', color: '#4F6BFF' },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 16 },
    statPill: { alignItems: 'center' },
    statValue: { fontSize: 16, fontWeight: '800', color: '#374151' },
    statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
});
