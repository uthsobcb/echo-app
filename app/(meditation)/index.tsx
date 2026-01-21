import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.6;
const DURATION = 4000; // 4 seconds per phase

const phases = [
    { text: 'Inhale', scale: 1.5, opacity: 1.0 },
    { text: 'Hold', scale: 1.5, opacity: 0.8 },
    { text: 'Exhale', scale: 1.0, opacity: 0.6 },
    { text: 'Hold', scale: 1.0, opacity: 0.4 },
];

export default function MeditationPage() {
    const router = useRouter();
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.5);
    const [phaseIndex, setPhaseIndex] = useState(0);

    useEffect(() => {
        // Start the breathing cycle
        startBreathing();

        return () => {
            cancelAnimation(scale);
            cancelAnimation(opacity);
        };
    }, []);

    const runPhase = (index: number) => {
        const nextIndex = (index + 1) % phases.length;

        // Haptic feedback at state change
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPhaseIndex(index);

        const currentPhase = phases[index];

        // Animate scale
        scale.value = withTiming(currentPhase.scale, {
            duration: DURATION,
            easing: Easing.inOut(Easing.ease),
        });

        // Animate opacity for a "glow" effect or visual indicator
        opacity.value = withTiming(currentPhase.opacity, {
            duration: DURATION,
            easing: Easing.linear,
        }, (finished) => {
            if (finished) {
                runOnJS(runPhase)(nextIndex);
            }
        });
    };

    const startBreathing = () => {
        runPhase(0);
    };

    const animatedCircleStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
        };
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#e0f2fe', '#f0f9ff', '#fff']}
                style={styles.background}
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.closeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={28} color="#334155" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Text style={styles.title}>Box Breathing</Text>
                    <Text style={styles.subtitle}>Relax your mind and body</Text>

                    <View style={styles.circleContainer}>
                        {/* Background static circles for reference */}
                        <View style={[styles.circleBase, styles.circleStatic]} />

                        {/* Animated breathing circle */}
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

                    <Text style={styles.helperText}>
                        Follow the rhythm of the circle
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
        justifyContent: 'flex-end',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 60,
    },
    circleContainer: {
        width: width,
        height: width,
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
        // Basic style, color handled by Inner LinearGradient or handled via style
        shadowColor: "#3B82F6",
        shadowOffset: {
            width: 0,
            height: 0,
        },
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
    helperText: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 20,
    }
});
