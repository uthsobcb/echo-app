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
  { x: 20, y: 58 },   // left side
  { x: 170, y: 44 },  // upper-right bump
  { x: 10, y: 96 },   // left edge mid
  { x: 182, y: 88 },  // right edge mid
  { x: 125, y: 12 },  // top of right bump
];

// Cloud body path derived from the actual character outline (viewBox 1890×1890),
// scaled to 200×160 via bounding-box normalisation (uniform scale 0.1343,
// offset +5 x / +15 y), then smoothed with the midpoint quadratic-bezier
// technique: start at mid(P39,P0), then Q Pi mid(Pi,Pi+1) for each vertex.
const CLOUD_BODY_PATH = [
  'M 195 89',
  'Q 194 82 193 78',
  'Q 191 73 188 69',
  'Q 185 64 180 60',
  'Q 175 55 170 53',
  'Q 164 50 161 43',
  'Q 157 36 153 31',
  'Q 148 26 140 22',
  'Q 132 17 123 16',
  'Q 113 15 105 17',
  'Q 97 19 90 24',
  'Q 83 28 78 26',
  'Q 72 24 68 24',
  'Q 63 24 58 25',
  'Q 52 26 48 29',
  'Q 43 31 38 37',
  'Q 33 42 30 49',
  'Q 27 56 23 59',
  'Q 18 62 15 67',
  'Q 11 71 9 76',
  'Q 6 81 6 88',
  'Q 5 94 6 100',
  'Q 7 105 9 109',
  'Q 11 113 15 117',
  'Q 18 120 22 123',
  'Q 25 126 34 128',
  'Q 42 130 50 129',
  'Q 58 128 63 132',
  'Q 67 136 72 139',
  'Q 76 141 83 143',
  'Q 90 145 96 145',
  'Q 101 145 110 143',
  'Q 119 141 127 136',
  'Q 135 131 141 133',
  'Q 146 134 152 134',
  'Q 157 134 162 133',
  'Q 167 131 172 129',
  'Q 177 126 181 123',
  'Q 185 119 189 113',
  'Q 192 107 194 101',
  'Q 195 95 195 89',
  'Z',
].join(' ');

function CloudShape({ color, strokeColor }: { color: string; strokeColor: string }) {
  return (
    <G>
      {/* Drop shadow offset */}
      <Path d={CLOUD_BODY_PATH} fill={strokeColor} transform="translate(9, 9)" />
      {/* Main body */}
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

  // Face positions tuned to match logo proportions
  const leftEyeX  = 70;
  const rightEyeX = 132;
  const eyeBaseY  = 87;
  const browBaseY = 62;

  return (
    <G>
      {/* Blush */}
      <Ellipse cx="46"  cy="112" rx="12" ry="7" fill="#FFB6C1" opacity={blushOpacity} />
      <Ellipse cx="156" cy="112" rx="12" ry="7" fill="#FFB6C1" opacity={blushOpacity} />

      {/* Eyes — large vertical ovals matching the logo */}
      <Ellipse cx={leftEyeX}  cy={eyeBaseY} rx="13" ry={Math.max(ry, 1)} fill={textColor} />
      <Ellipse cx={rightEyeX} cy={eyeBaseY} rx="13" ry={Math.max(ry, 1)} fill={textColor} />

      {/* Eye highlights */}
      <Circle cx={leftEyeX  - 4} cy={eyeBaseY - 7} r="2.5" fill="white" opacity={0.65} />
      <Circle cx={rightEyeX - 4} cy={eyeBaseY - 7} r="2.5" fill="white" opacity={0.65} />

      {/* Eyebrows */}
      <Path
        d={`M ${leftEyeX - 13} ${browBaseY + browOffsetY} Q ${leftEyeX} ${browBaseY - 8 + browOffsetY} ${leftEyeX + 13} ${browBaseY + browOffsetY}`}
        stroke={textColor}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        opacity={mouthType === 'smile' || mouthType === 'bigSmile' ? 0 : 0.5}
        transform={`rotate(${browRotateLeft}, ${leftEyeX}, ${browBaseY + browOffsetY})`}
      />
      <Path
        d={`M ${rightEyeX - 13} ${browBaseY + browOffsetY} Q ${rightEyeX} ${browBaseY - 8 + browOffsetY} ${rightEyeX + 13} ${browBaseY + browOffsetY}`}
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
  const floatY       = useSharedValue(0);
  const faceOpacity  = useSharedValue(1);
  const speakOpacity = useSharedValue(0);
  const prevExpression = useRef<ExpressionName>(expression);

  useEffect(() => {
    if (animated) {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming( 4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      floatY.value = withTiming(0, { duration: 200 });
    }
  }, [animated, floatY]);

  useEffect(() => {
    if (prevExpression.current !== expression) {
      faceOpacity.value = withSequence(
        withTiming(0, { duration: 120 }),
        withTiming(1, { duration: 180 }),
      );
      prevExpression.current = expression;
    }
  }, [expression, faceOpacity]);

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

  const svgW   = size;
  const svgH   = (VIEWBOX_H / VIEWBOX_W) * size;
  const config = EXPRESSIONS[expression];
  const cloudColor = '#FFFFFF';
  const textColor  = '#050505';
  const vb = `0 0 ${VIEWBOX_W} ${VIEWBOX_H}`;

  return (
    <Animated.View style={[{ width: svgW, height: svgH }, floatStyle]}>
      {/* Cloud body + sparkles */}
      <Svg width={svgW} height={svgH} viewBox={vb} style={StyleSheet.absoluteFill}>
        <CloudShape color={cloudColor} strokeColor={textColor} />
        <Sparkles opacity={config.sparkleOpacity} />
      </Svg>

      {/* Face — crossfades on expression change */}
      <Animated.View style={[StyleSheet.absoluteFill, faceStyle]}>
        <Svg width={svgW} height={svgH} viewBox={vb}>
          <Face config={config} textColor={textColor} />
        </Svg>
      </Animated.View>

      {/* Speaking mouth pulse */}
      <Animated.View style={[StyleSheet.absoluteFill, speakStyle]}>
        <Svg width={svgW} height={svgH} viewBox={vb}>
          <Path d={MOUTH_PATHS.open} fill={textColor} opacity={0.85} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
};
