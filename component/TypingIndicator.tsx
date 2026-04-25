import React from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { EchoAvatar } from './EchoAvatar';

export const TypingIndicator: React.FC = () => {
  const bounceY = useSharedValue(0);

  React.useEffect(() => {
    bounceY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 400 }),
        withTiming(0,  { duration: 400 }),
      ),
      -1,
      true,
    );
  }, []);

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceY.value }],
  }));

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignSelf: 'flex-start',
        marginBottom: 12,
      }}
    >
      <Animated.View style={bounceStyle}>
        <EchoAvatar expression="thinking" size={48} animated={false} speaking />
      </Animated.View>
    </View>
  );
};
