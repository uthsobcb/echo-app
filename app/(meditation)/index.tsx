import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    withRepeat,
    withSequence,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.65;

const DURATIONS = [
    { label: '3 min', seconds: 180 },
    { label: '5 min', seconds: 300 },
    { label: '10 min', seconds: 600 },
    { label: '15 min', seconds: 900 },
];

const phases = [
    { text: 'Inhale', scale: 1.5, opacity: 1.0, duration: 4000 },
    { text: 'Hold', scale: 1.5, opacity: 0.8, duration: 4000 },
    { text: 'Exhale', scale: 1.0, opacity: 0.6, duration: 4000 },
    { text: 'Hold', scale: 1.0, opacity: 0.4, duration: 4000 },
];

export default function MeditationPage() {
    const router = useRouter();
    const { colors } = useTheme();
    
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.5);
    const progress = useSharedValue(0);
    
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSetup, setIsSetup] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [selectedDuration, setSelectedDuration] = useState(300);
    const [timeRemaining, setTimeRemaining] = useState(300);
    const [showDurationPicker, setShowDurationPicker] = useState(true);
    const [showSummary, setShowSummary] = useState(false);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const phaseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const breathCyclesRef = useRef(0);

    useEffect(() => {
        setupAudio();
        return () => {
            cleanup();
        };
    }, []);

    const cleanup = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (phaseRef.current) clearTimeout(phaseRef.current);
        cancelAnimation(scale);
        cancelAnimation(opacity);
        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
        }
    };

    const setupAudio = async () => {
        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
            });
            setIsSetup(true);
        } catch (e) {
            console.error('Failed to setup audio', e);
        }
    };

    const triggerPhaseHaptic = (phase: number) => {
        if (phase === 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (phase === 2) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const runPhase = (index: number) => {
        const currentPhase = phases[index];
        
        setPhaseIndex(index);
        triggerPhaseHaptic(index);
        
        const duration = currentPhase.duration;
        
        scale.value = withTiming(currentPhase.scale, {
            duration,
            easing: Easing.inOut(Easing.ease),
        });
        
        opacity.value = withTiming(currentPhase.opacity, {
            duration,
            easing: Easing.linear,
        });

        const nextIndex = (index + 1) % phases.length;
        
        if (index === 3) {
            breathCyclesRef.current += 1;
        }

        phaseRef.current = setTimeout(() => {
            runPhase(nextIndex);
        }, duration);
    };

    const startSession = async () => {
        setShowDurationPicker(false);
        setTimeRemaining(selectedDuration);
        breathCyclesRef.current = 0;
        
        if (sound && isPlaying) {
            await sound.setPositionAsync(0);
        }
        
        runPhase(0);
        
        timerRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    completeSession();
                    return 0;
                }
                return prev - 1;
            });
            
            progress.value = withTiming(1 - ((timeRemaining - 1) / selectedDuration), {
                duration: 1000,
                easing: Easing.linear,
            });
        }, 1000);
        
        setIsPlaying(true);
    };

    const completeSession = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (phaseRef.current) clearTimeout(phaseRef.current);
        
        cancelAnimation(scale);
        cancelAnimation(opacity);
        
        if (sound) {
            await sound.stopAsync();
        }
        
        scale.value = withTiming(1.5, { duration: 500 });
        opacity.value = withTiming(1, { duration: 500 });
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        setSessionsCompleted(prev => prev + 1);
        setIsPlaying(false);
        setShowSummary(true);
    };

    const toggleMusic = async () => {
        if (!isSetup) return;
        
        try {
            if (sound) {
                const status = await sound.getStatusAsync();
                if (status.isLoaded) {
                    if (status.isPlaying) {
                        await sound.pauseAsync();
                        setIsPlaying(false);
                    } else {
                        await sound.playAsync();
                        setIsPlaying(true);
                    }
                }
            } else {
                const { sound: newSound } = await Audio.Sound.createAsync(
                    require('../../assets/bgm.mp3'),
                    { isLooping: true, volume: 0.4 }
                );
                setSound(newSound);
                await newSound.playAsync();
                setIsPlaying(true);
            }
        } catch (e) {
            console.error('Failed to toggle music', e);
        }
    };

    const handleClose = async () => {
        await cleanup();
        router.back();
    };

    const startNewSession = () => {
        setShowDurationPicker(true);
        setShowSummary(false);
        setTimeRemaining(selectedDuration);
        progress.value = 0;
        scale.value = 1;
        opacity.value = 0.5;
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const animatedCircleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const animatedProgressStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${progress.value * 360}deg` }],
    }));

    if (showSummary) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryIcon}>
                            <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
                        </View>
                        <Text style={[styles.summaryTitle, { color: colors.text }]}>
                            Session Complete!
                        </Text>
                        <Text style={[styles.summarySubtitle, { color: colors.textSecondary }]}>
                            You completed a {Math.floor(selectedDuration / 60)} minute meditation
                        </Text>
                        
                        <View style={styles.statsRow}>
                            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                                <Ionicons name="leaf" size={24} color={colors.primary} />
                                <Text style={[styles.statValue, { color: colors.text }]}>
                                    {breathCyclesRef.current}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                    Breath Cycles
                                </Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                                <Ionicons name="timer" size={24} color={colors.primary} />
                                <Text style={[styles.statValue, { color: colors.text }]}>
                                    {formatTime(selectedDuration)}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                    Duration
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.summaryButton, { backgroundColor: colors.primary }]}
                            onPress={handleClose}
                        >
                            <Text style={styles.summaryButtonText}>Done</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.summaryButton, styles.summaryButtonSecondary, { borderColor: colors.border }]}
                            onPress={startNewSession}
                        >
                            <Text style={[styles.summaryButtonTextSecondary, { color: colors.text }]}>
                                Meditate Again
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    if (showDurationPicker) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <LinearGradient
                    colors={['#e0f2fe', '#f0f9ff', '#fff']}
                    style={styles.background}
                />
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color="#334155" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.setupContainer}>
                        <Text style={styles.setupTitle}>Box Breathing</Text>
                        <Text style={styles.setupSubtitle}>Select your session length</Text>
                        
                        <View style={styles.durationGrid}>
                            {DURATIONS.map((dur) => (
                                <TouchableOpacity
                                    key={dur.seconds}
                                    style={[
                                        styles.durationCard,
                                        selectedDuration === dur.seconds && styles.durationCardSelected,
                                        { backgroundColor: colors.surface }
                                    ]}
                                    onPress={() => setSelectedDuration(dur.seconds)}
                                >
                                    <Text style={[
                                        styles.durationLabel,
                                        { color: selectedDuration === dur.seconds ? '#fff' : colors.text }
                                    ]}>
                                        {dur.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        
                        <TouchableOpacity
                            style={[styles.startButton, { backgroundColor: colors.primary }]}
                            onPress={startSession}
                        >
                            <Ionicons name="play" size={24} color="#fff" />
                            <Text style={styles.startButtonText}>Start Session</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#e0f2fe', '#f0f9ff', '#fff']}
                style={styles.background}
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={handleClose} 
                        style={styles.closeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={28} color="#334155" />
                    </TouchableOpacity>
                    <View style={styles.timerContainer}>
                        <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={toggleMusic}
                        style={styles.musicButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons 
                            name={isPlaying ? "musical-notes" : "musical-notes-outline"} 
                            size={24} 
                            color={isPlaying ? "#3B82F6" : "#334155"} 
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.circleContainer}>
                        <View style={[styles.circleBase, styles.circleStatic]} />
                        
                        <Animated.View style={[styles.circleBase, styles.circleAnimated, animatedCircleStyle]}>
                            <LinearGradient
                                colors={['#60A5FA', '#3B82F6']}
                                style={styles.circleGradient}
                            />
                        </Animated.View>

                        <View style={styles.textContainer}>
                            <Text style={styles.phaseText}>{phases[phaseIndex].text}</Text>
                        </View>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                            <View 
                                style={[
                                    styles.progressFill, 
                                    { 
                                        backgroundColor: colors.primary,
                                        width: `${((selectedDuration - timeRemaining) / selectedDuration) * 100}%` 
                                    }
                                ]} 
                            />
                        </View>
                    </View>

                    <Text style={styles.helperText}>
                        Follow the rhythm • {breathCyclesRef.current} cycles
                    </Text>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    musicButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    timerContainer: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    timerText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#334155',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    circleContainer: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    circleBase: {
        position: 'absolute',
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
    },
    circleStatic: {
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
    },
    circleAnimated: {
        shadowColor: "#3B82F6",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    circleGradient: {
        flex: 1,
        borderRadius: CIRCLE_SIZE / 2,
    },
    textContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    phaseText: {
        fontSize: 32,
        fontWeight: '600',
        color: '#1e3a8a',
        letterSpacing: 1,
    },
    progressContainer: {
        width: '80%',
        marginBottom: 20,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    helperText: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 20,
    },
    setupContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    setupTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 8,
    },
    setupSubtitle: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 40,
    },
    durationGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 40,
    },
    durationCard: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    durationCardSelected: {
        backgroundColor: '#3B82F6',
    },
    durationLabel: {
        fontSize: 18,
        fontWeight: '600',
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 30,
        gap: 8,
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    summaryContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    summaryIcon: {
        marginBottom: 24,
    },
    summaryTitle: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    summarySubtitle: {
        fontSize: 16,
        marginBottom: 40,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 40,
    },
    statCard: {
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        minWidth: 120,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 14,
        marginTop: 4,
    },
    summaryButton: {
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 30,
        marginBottom: 12,
    },
    summaryButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    summaryButtonSecondary: {
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 30,
        borderWidth: 2,
    },
    summaryButtonTextSecondary: {
        fontSize: 18,
        fontWeight: '600',
    },
});
