// component/EchoAvatar/index.tsx
import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path, G } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { EXPRESSIONS, MOUTH_PATHS, ExpressionName } from './expressions';

export type { ExpressionName };

interface EchoAvatarProps {
  expression?: ExpressionName;
  size?: number;
  animated?: boolean;
  speaking?: boolean;
}

const VIEWBOX_W = 200;
const VIEWBOX_H = 160;

const SPARKLE_STAR = 'M 0 -4 L 1 -1 L 4 0 L 1 1 L 0 4 L -1 1 L -4 0 L -1 -1 Z';
const SPARKLE_POSITIONS = [
  { x: 32, y: 52 },
  { x: 168, y: 48 },
  { x: 24, y: 92 },
  { x: 176, y: 86 },
  { x: 100, y: 22 },
];

function CloudShape({ color }: { color: string }) {
  return (
    <G>
      <Circle cx="100" cy="108" r="52" fill={color} />
      <Circle cx="65"  cy="82"  r="30" fill={color} />
      <Circle cx="103" cy="66"  r="36" fill={color} />
      <Circle cx="142" cy="80"  r="26" fill={color} />
      <Circle cx="44"  cy="108" r="21" fill={color} />
      <Circle cx="158" cy="106" r="20" fill={color} />
    </G>
  );
}

function Sparkles({ opacity }: { opacity: number }) {
  return (
    <G opacity={opacity}>
      {SPARKLE_POSITIONS.map((pos, i) => (
        <Path
          key={i}
          d={SPARKLE_STAR}
          fill="#FFD700"
          transform={`translate(${pos.x}, ${pos.y})`}
        />
      ))}
    </G>
  );
}

function Face({ config, textColor }: { config: typeof EXPRESSIONS[ExpressionName]; textColor: string }) {
  const {
    eyeScaleY, pupilOffsetX, pupilOffsetY,
    browOffsetY, browRotateLeft, browRotateRight,
    mouthType, blushOpacity,
  } = config;

  const ry = 8 * eyeScaleY;
  const leftEyeX = 80, rightEyeX = 120, eyeBaseY = 100;
  const browBaseY = 88;

  return (
    <G>
      {/* Blush */}
      <Ellipse cx="60"  cy="108" rx="12" ry="7" fill="#FFB6C1" opacity={blushOpacity} />
      <Ellipse cx="140" cy="108" rx="12" ry="7" fill="#FFB6C1" opacity={blushOpacity} />

      {/* Eyes */}
      <Ellipse cx={leftEyeX}  cy={eyeBaseY} rx="8" ry={Math.max(ry, 1)} fill={textColor} />
      <Ellipse cx={rightEyeX} cy={eyeBaseY} rx="8" ry={Math.max(ry, 1)} fill={textColor} />

      {/* Pupils */}
      <Circle cx={leftEyeX  + pupilOffsetX} cy={eyeBaseY + pupilOffsetY} r="4" fill={textColor} />
      <Circle cx={rightEyeX + pupilOffsetX} cy={eyeBaseY + pupilOffsetY} r="4" fill={textColor} />

      {/* Eye highlights */}
      <Circle cx={leftEyeX  + pupilOffsetX - 2} cy={eyeBaseY + pupilOffsetY - 2} r="2" fill="white" />
      <Circle cx={rightEyeX + pupilOffsetX - 2} cy={eyeBaseY + pupilOffsetY - 2} r="2" fill="white" />

      {/* Eyebrows */}
      <Path
        d={`M 66 ${browBaseY + browOffsetY} Q 80 ${browBaseY - 4 + browOffsetY} 94 ${browBaseY + browOffsetY}`}
        stroke={textColor}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        transform={`rotate(${browRotateLeft}, 80, ${browBaseY + browOffsetY})`}
      />
      <Path
        d={`M 106 ${browBaseY + browOffsetY} Q 120 ${browBaseY - 4 + browOffsetY} 134 ${browBaseY + browOffsetY}`}
        stroke={textColor}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        transform={`rotate(${browRotateRight}, 120, ${browBaseY + browOffsetY})`}
      />

      {/* Mouth */}
      <Path
        d={MOUTH_PATHS[mouthType]}
        stroke={mouthType === 'open' ? 'none' : textColor}
        strokeWidth="3"
        strokeLinecap="round"
        fill={mouthType === 'open' ? textColor : 'none'}
        opacity={0.85}
      />
    </G>
  );
}

export const EchoAvatar: React.FC<EchoAvatarProps> = ({
  expression = 'calm',
  size = 120,
  animated = true,
  speaking = false,
}) => {
  const { colors } = useTheme();
  const floatY = useSharedValue(0);
  const faceOpacity = useSharedValue(1);
  const speakOpacity = useSharedValue(0);
  const prevExpression = useRef<ExpressionName>(expression);

  // Idle float
  useEffect(() => {
    if (animated) {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(4,  { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      floatY.value = withTiming(0, { duration: 200 });
    }
  }, [animated]);

  // Expression crossfade
  useEffect(() => {
    if (prevExpression.current !== expression) {
      faceOpacity.value = withSequence(
        withTiming(0, { duration: 120 }),
        withTiming(1, { duration: 180 }),
      );
      prevExpression.current = expression;
    }
  }, [expression]);

  // Speaking mouth pulse
  useEffect(() => {
    if (speaking) {
      speakOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 220 }),
          withTiming(0, { duration: 220 }),
        ),
        -1,
        true,
      );
    } else {
      speakOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [speaking]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const faceStyle = useAnimatedStyle(() => ({
    opacity: faceOpacity.value,
  }));

  const speakStyle = useAnimatedStyle(() => ({
    opacity: speakOpacity.value,
  }));

  const svgW = size;
  const svgH = (VIEWBOX_H / VIEWBOX_W) * size;
  const config = EXPRESSIONS[expression];
  // TODO: colors.echoCloud will be added in Task 3 (ThemeContext update).
  // Using type assertion here to avoid blocking this component on that task.
  const cloudColor = (colors as any).echoCloud ?? '#D6EAFF';
  const textColor = colors.text;

  return (
    <Animated.View style={[{ width: svgW, height: svgH }, floatStyle]}>
      {/* Cloud + sparkles layer */}
      <Svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        style={StyleSheet.absoluteFill}
      >
        <CloudShape color={cloudColor} />
        <Sparkles opacity={config.sparkleOpacity} />
      </Svg>

      {/* Face layer with crossfade */}
      <Animated.View style={[StyleSheet.absoluteFill, faceStyle]}>
        <Svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        >
          <Face config={config} textColor={textColor} />
        </Svg>
      </Animated.View>

      {/* Speaking mouth overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, speakStyle]}>
        <Svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        >
          <Path
            d={MOUTH_PATHS.open}
            fill={textColor}
            opacity={0.85}
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
};
