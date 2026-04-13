import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { ThemeColors } from '../context/ThemeContext';

interface TypingIndicatorProps {
    colors: ThemeColors;
}

const Dot = ({ delay, colors }: { delay: number; colors: ThemeColors }) => {
    const translateY = useSharedValue(0);

    useEffect(() => {
        translateY.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(-6, { duration: 300, easing: Easing.out(Easing.ease) }),
                    withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) }),
                ),
                -1,
                false,
            ),
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View
            style={[
                {
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: colors.textSecondary,
                    marginHorizontal: 2,
                },
                animatedStyle,
            ]}
        />
    );
};

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ colors }) => {
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 18,
                borderBottomLeftRadius: 4,
                backgroundColor: colors.surfaceSecondary,
                alignSelf: 'flex-start',
                marginBottom: 12,
            }}
        >
            <Dot delay={0} colors={colors} />
            <Dot delay={150} colors={colors} />
            <Dot delay={300} colors={colors} />
        </View>
    );
};
