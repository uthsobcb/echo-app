import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

interface XpFloaterProps {
    amount: number;
    onComplete?: () => void;
}

export default function XpFloater({ amount, onComplete }: XpFloaterProps) {
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);
    const scale = useSharedValue(0.5);

    useEffect(() => {
        scale.value = withTiming(1, { duration: 300 });
        translateY.value = withDelay(400, withTiming(-80, { duration: 900 }));
        opacity.value = withDelay(800, withTiming(0, { duration: 500 }, () => {
            if (onComplete) runOnJS(onComplete)();
        }));
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }, { scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.container, style]}>
            <Animated.Text style={styles.text}>+{amount} XP</Animated.Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignSelf: 'center',
        top: '40%',
        zIndex: 999,
    },
    text: {
        fontSize: 36,
        fontWeight: '900',
        color: '#F59E0B',
        textShadowColor: 'rgba(0,0,0,0.15)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
});
