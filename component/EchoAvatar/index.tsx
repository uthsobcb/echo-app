// component/EchoAvatar/index.tsx
import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { ExpressionName, EXPRESSIONS, MOUTH_PATHS } from './expressions';

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
  { x: 26, y: 56 },
  { x: 172, y: 50 },
  { x: 18, y: 98 },
  { x: 176, y: 88 },
  { x: 96, y: 16 },
];

const CLOUD_BODY_PATH = [
  'M 40 126',
  // bottom left bump
  'C 36 138 46 146 62 140',
  // between left and center bottom bumps
  'C 72 135 80 132 88 138',
  // center bottom bump (lowest)
  'C 95 147 108 148 116 138',
  // between center and right bottom bumps
  'C 124 132 132 136 140 140',
  // right bottom bump
  'C 148 146 162 140 165 128',
  // right lower side
  'C 172 116 178 102 178 88',
  // right side going up
  'C 180 74 174 56 164 46',
  // top-right bump
  'C 158 32 148 24 140 24',
  // into 3rd top bump
  'C 134 14 120 8 112 18',
  // center top bump (tallest)
  'C 106 6 94 6 86 16',
  // center-left top bump
  'C 80 6 68 10 62 20',
  // far-left top bump
  'C 56 12 46 18 42 30',
  // left upper side
  'C 34 42 20 58 16 74',
  // left side going down
  'C 14 88 18 108 26 118',
  // close bottom left
  'C 28 124 34 126 40 126',
  'Z',
].join(' ');

function CloudShape({ color, strokeColor }: { color: string; strokeColor: string }) {
  return (
    <G>
      {/* Drop shadow */}
      <Path d={CLOUD_BODY_PATH} fill={strokeColor} transform="translate(8, 8)" />
      {/* Main cloud body */}
      <Path
        d={CLOUD_BODY_PATH}
        fill={color}
        stroke={strokeColor}
        strokeWidth={9}
        strokeLinejoin="round"
      />
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
    eyeScaleY,
    browOffsetY, browRotateLeft, browRotateRight,
    mouthType, blushOpacity,
  } = config;

  const ry = 20 * eyeScaleY;
  const leftEyeX = 72, rightEyeX = 130, eyeBaseY = 83;
  const browBaseY = 56;

  return (
    <G>
      {/* Blush */}
      <Ellipse cx="48"  cy="110" rx="12" ry="7" fill="#FFB6C1" opacity={blushOpacity} />
      <Ellipse cx="154" cy="110" rx="12" ry="7" fill="#FFB6C1" opacity={blushOpacity} />

      {/* Eyes — large solid ovals like the logo */}
      <Ellipse cx={leftEyeX}  cy={eyeBaseY} rx="14" ry={Math.max(ry, 1)} fill={textColor} />
      <Ellipse cx={rightEyeX} cy={eyeBaseY} rx="14" ry={Math.max(ry, 1)} fill={textColor} />

      {/* Subtle eye highlights */}
      <Circle cx={leftEyeX  - 5} cy={eyeBaseY - 7} r="2.5" fill="white" opacity={0.65} />
      <Circle cx={rightEyeX - 5} cy={eyeBaseY - 7} r="2.5" fill="white" opacity={0.65} />

      {/* Eyebrows (hidden for smile expressions, matching logo) */}
      <Path
        d={`M ${leftEyeX - 14} ${browBaseY + browOffsetY} Q ${leftEyeX} ${browBaseY - 8 + browOffsetY} ${leftEyeX + 14} ${browBaseY + browOffsetY}`}
        stroke={textColor}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        opacity={mouthType === 'smile' || mouthType === 'bigSmile' ? 0 : 0.5}
        transform={`rotate(${browRotateLeft}, ${leftEyeX}, ${browBaseY + browOffsetY})`}
      />
      <Path
        d={`M ${rightEyeX - 14} ${browBaseY + browOffsetY} Q ${rightEyeX} ${browBaseY - 8 + browOffsetY} ${rightEyeX + 14} ${browBaseY + browOffsetY}`}
        stroke={textColor}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        opacity={mouthType === 'smile' || mouthType === 'bigSmile' ? 0 : 0.5}
        transform={`rotate(${browRotateRight}, ${rightEyeX}, ${browBaseY + browOffsetY})`}
      />

      {/* Mouth */}
      <Path
        d={MOUTH_PATHS[mouthType]}
        stroke={mouthType === 'open' ? 'none' : textColor}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={mouthType === 'open' ? textColor : 'none'}
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
          withTiming(4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      floatY.value = withTiming(0, { duration: 200 });
    }
  }, [animated, floatY]);

  // Expression crossfade
  useEffect(() => {
    if (prevExpression.current !== expression) {
      faceOpacity.value = withSequence(
        withTiming(0, { duration: 120 }),
        withTiming(1, { duration: 180 }),
      );
      prevExpression.current = expression;
    }
  }, [expression, faceOpacity]);

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
  }, [speaking, speakOpacity]);

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
  const cloudColor = '#FFFFFF';
  const textColor = '#050505';

  return (
    <Animated.View style={[{ width: svgW, height: svgH }, floatStyle]}>
      {/* Cloud + sparkles layer */}
      <Svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        style={StyleSheet.absoluteFill}
      >
        <CloudShape color={cloudColor} strokeColor={textColor} />
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