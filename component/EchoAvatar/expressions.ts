// component/EchoAvatar/expressions.ts

export type ExpressionName =
  | 'happy'
  | 'calm'
  | 'thinking'
  | 'excited'
  | 'sad'
  | 'curious'
  | 'proud'
  | 'sleepy';

export interface ExpressionConfig {
  eyeScaleY: number;       // 1.0 = fully open, 0.15 = nearly closed
  pupilOffsetX: number;    // px: negative = left, positive = right
  pupilOffsetY: number;    // px: negative = up, positive = down
  browOffsetY: number;     // px: negative = raised, positive = furrowed
  browRotateLeft: number;  // degrees on left brow (inner end)
  browRotateRight: number; // degrees on right brow (inner end)
  mouthType: 'bigSmile' | 'smile' | 'neutral' | 'frown' | 'open' | 'smirk';
  blushOpacity: number;    // 0–1
  sparkleOpacity: number;  // 0–1
}

export const EXPRESSIONS: Record<ExpressionName, ExpressionConfig> = {
  happy: {
    eyeScaleY: 0.85,
    pupilOffsetX: 0,
    pupilOffsetY: -1,
    browOffsetY: -6,
    browRotateLeft: -5,
    browRotateRight: 5,
    mouthType: 'bigSmile',
    blushOpacity: 0.5,
    sparkleOpacity: 0,
  },
  calm: {
    eyeScaleY: 0.7,
    pupilOffsetX: 0,
    pupilOffsetY: 0,
    browOffsetY: 0,
    browRotateLeft: 0,
    browRotateRight: 0,
    mouthType: 'smile',
    blushOpacity: 0,
    sparkleOpacity: 0,
  },
  thinking: {
    eyeScaleY: 1.0,
    pupilOffsetX: 3,
    pupilOffsetY: -2,
    browOffsetY: -3,
    browRotateLeft: 8,
    browRotateRight: -4,
    mouthType: 'smirk',
    blushOpacity: 0,
    sparkleOpacity: 0,
  },
  excited: {
    eyeScaleY: 1.0,
    pupilOffsetX: 0,
    pupilOffsetY: -2,
    browOffsetY: -8,
    browRotateLeft: -8,
    browRotateRight: 8,
    mouthType: 'open',
    blushOpacity: 0.7,
    sparkleOpacity: 1.0,
  },
  sad: {
    eyeScaleY: 0.75,
    pupilOffsetX: 0,
    pupilOffsetY: 2,
    browOffsetY: 4,
    browRotateLeft: 10,
    browRotateRight: -10,
    mouthType: 'frown',
    blushOpacity: 0,
    sparkleOpacity: 0,
  },
  curious: {
    eyeScaleY: 1.0,
    pupilOffsetX: 2,
    pupilOffsetY: -1,
    browOffsetY: -5,
    browRotateLeft: 12,
    browRotateRight: 0,
    mouthType: 'smirk',
    blushOpacity: 0,
    sparkleOpacity: 0,
  },
  proud: {
    eyeScaleY: 0.7,
    pupilOffsetX: 0,
    pupilOffsetY: -1,
    browOffsetY: -4,
    browRotateLeft: -4,
    browRotateRight: 4,
    mouthType: 'smile',
    blushOpacity: 0.3,
    sparkleOpacity: 1.0,
  },
  sleepy: {
    eyeScaleY: 0.15,
    pupilOffsetX: 0,
    pupilOffsetY: 2,
    browOffsetY: 2,
    browRotateLeft: 0,
    browRotateRight: 0,
    mouthType: 'neutral',
    blushOpacity: 0.2,
    sparkleOpacity: 0,
  },
};

export const MOUTH_PATHS: Record<ExpressionConfig['mouthType'], string> = {
  bigSmile: 'M 80 108 C 88 126 114 126 122 108',
  smile:    'M 82 110 C 90 124 112 124 120 110',
  neutral:  'M 88 118 C 96 118 106 118 120 118',
  frown:    'M 82 122 C 90 107 112 107 120 122',
  open:     'M 84 107 C 90 128 112 130 118 108 C 114 125 88 124 84 107 Z',
  smirk:    'M 88 114 C 98 128 112 126 120 112',
};
