# Echo Identity System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Echo app to feature Echo (a cloud-shaped AI character) as the central identity across onboarding, chat, and meditation, with TTS support and a sky-themed palette.

**Architecture:** Foundation-first — build the `EchoAvatar` SVG component and sky palette first, then integrate into onboarding (new), chat (revamp), and meditation (revamp). Float animations via Reanimated v4, SVG face via react-native-svg.

**Tech Stack:** React Native / Expo, react-native-svg (already installed), react-native-reanimated v4 (already installed), expo-speech (new install), expo-router, AsyncStorage, ThemeContext, StorageContext, ChatContext.

---

## File Map

**Create:**
- `component/EchoAvatar/expressions.ts` — expression parameter configs for all 8 states
- `component/EchoAvatar/index.tsx` — programmatic SVG cloud character component
- `hooks/useTTSPrefs.ts` — shared AsyncStorage hook for TTS enabled/rate
- `app/(onboarding)/_layout.tsx` — onboarding route layout
- `app/(onboarding)/index.tsx` — 5-step onboarding screen

**Modify:**
- `context/ThemeContext.tsx` — add `accent` + `echoCloud` tokens, update day/night palettes
- `tailwind.config.js` — add new color tokens
- `context/StorageContext.tsx` — add `userName`, `onboardingGoals`, `onboardingComplete`, `completeOnboarding()`
- `app/index.tsx` — check `onboardingComplete` before routing to tabs
- `context/ChatContext.tsx` — Echo welcome message + system prompt in API call + expose `lastBotText`
- `component/TypingIndicator.tsx` — replace dot animation with EchoAvatar
- `component/ChatInput.tsx` — add disabled STT mic icon
- `component/SettingsModal.tsx` — add TTS toggle + speed picker
- `app/(chat)/chat.tsx` — Echo avatar in header + TTS trigger + mood derivation
- `app/(meditation)/index.tsx` — replace breathing circle with EchoAvatar + TTS cues

---

## Task 1: EchoAvatar Expressions Map

**Files:**
- Create: `component/EchoAvatar/expressions.ts`

- [ ] **Step 1: Create expressions.ts with full ExpressionConfig type and all 8 states**

```ts
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
  bigSmile: 'M 72 110 Q 100 134 128 110',
  smile:    'M 78 112 Q 100 126 122 112',
  neutral:  'M 82 115 Q 100 117 118 115',
  frown:    'M 76 118 Q 100 104 124 118',
  open:     'M 86 110 Q 100 126 114 110 Q 113 124 100 126 Q 87 124 86 110 Z',
  smirk:    'M 84 114 Q 96 121 116 110',
};
```

- [ ] **Step 2: Commit**

```bash
git add component/EchoAvatar/expressions.ts
git commit -m "feat: add EchoAvatar expression configs and mouth path map"
```

---

## Task 2: EchoAvatar Component

**Files:**
- Create: `component/EchoAvatar/index.tsx`

- [ ] **Step 1: Create EchoAvatar component**

```tsx
// component/EchoAvatar/index.tsx
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
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
  const STAR = 'M 0 -4 L 1 -1 L 4 0 L 1 1 L 0 4 L -1 1 L -4 0 L -1 -1 Z';
  const positions = [
    { x: 32, y: 52 },
    { x: 168, y: 48 },
    { x: 24, y: 92 },
    { x: 176, y: 86 },
    { x: 100, y: 22 },
  ];
  return (
    <G opacity={opacity}>
      {positions.map((pos, i) => (
        <Path
          key={i}
          d={STAR}
          fill="#FFD700"
          transform={`translate(${pos.x}, ${pos.y})`}
        />
      ))}
    </G>
  );
}

interface FaceProps {
  config: ReturnType<typeof EXPRESSIONS[ExpressionName]>;
  textColor: string;
}

function Face({ config, textColor }: { config: ReturnType<typeof (() => typeof EXPRESSIONS['happy'])>; textColor: string }) {
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
  const cloudColor = colors.echoCloud;
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
```

- [ ] **Step 2: Fix the Face component's TypeScript type for config prop**

Replace the `Face` component signature with the correct type:

```tsx
function Face({ config, textColor }: { config: typeof EXPRESSIONS[ExpressionName]; textColor: string }) {
```

- [ ] **Step 3: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | grep -i "EchoAvatar\|expressions" | head -20
```

Expected: no errors related to EchoAvatar files.

- [ ] **Step 4: Commit**

```bash
git add component/EchoAvatar/index.tsx
git commit -m "feat: add EchoAvatar programmatic SVG cloud character component"
```

---

## Task 3: Theme Palette Update

**Files:**
- Modify: `context/ThemeContext.tsx`

- [ ] **Step 1: Add `accent` and `echoCloud` to ThemeColors interface**

In `context/ThemeContext.tsx`, find the `ThemeColors` interface and add two fields:

```ts
// Before:
export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
  borderSecondary: string;
}

// After:
export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  primary: string;
  accent: string;
  border: string;
  borderSecondary: string;
  echoCloud: string;
}
```

- [ ] **Step 2: Replace lightColors with day sky palette**

```ts
const lightColors: ThemeColors = {
  background:      '#EEF6FF',
  surface:         '#FFFFFF',
  surfaceSecondary:'#F0F7FF',
  text:            '#1A2A4A',
  textSecondary:   '#6B8CAE',
  primary:         '#5B9BF8',
  accent:          '#FFB347',
  border:          '#C8DFF5',
  borderSecondary: '#E0EFFF',
  echoCloud:       '#D6EAFF',
};
```

- [ ] **Step 3: Replace darkColors with night sky palette**

```ts
const darkColors: ThemeColors = {
  background:      '#0A0E1A',
  surface:         '#131929',
  surfaceSecondary:'#1C2540',
  text:            '#E8F0FF',
  textSecondary:   '#7A94C0',
  primary:         '#7EB8FF',
  accent:          '#C084FC',
  border:          '#2A3A5C',
  borderSecondary: '#1C2540',
  echoCloud:       '#1E2D50',
};
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "ThemeColors\|themeColors\|colors\." | head -20
```

Expected: no errors. Fix any component using `colors` that breaks due to missing property.

- [ ] **Step 5: Commit**

```bash
git add context/ThemeContext.tsx
git commit -m "feat: update theme palette to sky/cloud day-night design system"
```

---

## Task 4: Tailwind Config

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: Add Echo color tokens to Tailwind theme**

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./component/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        sky: {
          cloud:  '#D6EAFF',
          mist:   '#F0F7FF',
          day:    '#EEF6FF',
          blue:   '#5B9BF8',
          sun:    '#FFB347',
          navy:   '#1A2A4A',
          faded:  '#6B8CAE',
          edge:   '#C8DFF5',
        },
        night: {
          cloud:  '#1E2D50',
          space:  '#0A0E1A',
          mid:    '#131929',
          deep:   '#1C2540',
          moon:   '#7EB8FF',
          purple: '#C084FC',
          star:   '#E8F0FF',
          dim:    '#7A94C0',
          border: '#2A3A5C',
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Commit**

```bash
git add tailwind.config.js
git commit -m "feat: add sky/night Tailwind color tokens for Echo theme"
```

---

## Task 5: StorageContext — Onboarding Fields

**Files:**
- Modify: `context/StorageContext.tsx`

- [ ] **Step 1: Add onboarding types and keys to StorageContext**

After the imports block, add the AsyncStorage keys:

```ts
// After: const STORAGE_KEY = ... (or near top constants)
const ONBOARDING_KEY = 'onboardingComplete';
const USERNAME_KEY = 'userName';
const ONBOARDING_GOALS_KEY = 'onboardingGoals';
```

- [ ] **Step 2: Add onboarding fields to StorageContextType interface**

```ts
// Add to StorageContextType interface:
  userName: string;
  onboardingGoals: string[];
  onboardingComplete: boolean;
  completeOnboarding: (data: { userName: string; onboardingGoals: string[] }) => Promise<void>;
```

- [ ] **Step 3: Add state variables inside StorageProvider**

After the existing `const [appMode, setAppMode] = useState<AppMode>('local');` line:

```ts
const [userName, setUserName] = useState('');
const [onboardingGoals, setOnboardingGoals] = useState<string[]>([]);
const [onboardingComplete, setOnboardingComplete] = useState(false);
```

- [ ] **Step 4: Load onboarding state in the `init` function**

Inside the `init` async function, after `setAppMode(mode)`:

```ts
const [storedName, storedGoals, storedOnboarding] = await Promise.all([
    AsyncStorage.getItem(USERNAME_KEY),
    AsyncStorage.getItem(ONBOARDING_GOALS_KEY),
    AsyncStorage.getItem(ONBOARDING_KEY),
]);
if (storedName) setUserName(storedName);
if (storedGoals) setOnboardingGoals(JSON.parse(storedGoals));
if (storedOnboarding) setOnboardingComplete(storedOnboarding === 'true');
```

- [ ] **Step 5: Add completeOnboarding function**

After the `init` function definition:

```ts
const completeOnboarding = async (data: { userName: string; onboardingGoals: string[] }) => {
    setUserName(data.userName);
    setOnboardingGoals(data.onboardingGoals);
    setOnboardingComplete(true);
    await Promise.all([
        AsyncStorage.setItem(USERNAME_KEY, data.userName),
        AsyncStorage.setItem(ONBOARDING_GOALS_KEY, JSON.stringify(data.onboardingGoals)),
        AsyncStorage.setItem(ONBOARDING_KEY, 'true'),
    ]);
};
```

- [ ] **Step 6: Add new fields to the context Provider value**

In the `<StorageContext.Provider value={{...}}>` JSX, add:

```ts
userName,
onboardingGoals,
onboardingComplete,
completeOnboarding,
```

- [ ] **Step 7: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "StorageContext\|completeOnboarding" | head -10
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add context/StorageContext.tsx
git commit -m "feat: add userName, onboardingGoals, onboardingComplete to StorageContext"
```

---

## Task 6: App Index — Onboarding Routing

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Update index.tsx to check onboardingComplete before routing to tabs**

```tsx
// app/index.tsx
import { useStorage } from "@/context/StorageContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isAuthenticated, isLoading, onboardingComplete } = useStorage();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5B9BF8" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/signin" />;
  }

  if (!onboardingComplete) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)" />;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/index.tsx
git commit -m "feat: route to onboarding on first launch if onboarding not complete"
```

---

## Task 7: Onboarding Layout

**Files:**
- Create: `app/(onboarding)/_layout.tsx`

- [ ] **Step 1: Create onboarding layout**

```tsx
// app/(onboarding)/_layout.tsx
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(onboarding)/_layout.tsx"
git commit -m "feat: add onboarding route layout"
```

---

## Task 8: Onboarding Screen

**Files:**
- Create: `app/(onboarding)/index.tsx`

- [ ] **Step 1: Create the 5-step onboarding screen**

```tsx
// app/(onboarding)/index.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { EchoAvatar, ExpressionName } from '../../component/EchoAvatar';
import { useStorage } from '../../context/StorageContext';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const GOALS = [
  'I need someone to talk to',
  'I want to build better habits',
  'I want to meditate more',
  "I'm just exploring",
];

const STEP_EXPRESSIONS: ExpressionName[] = [
  'sleepy', 'curious', 'happy', 'calm', 'excited',
];

const STEP_4_RESPONSES: Record<string, string> = {
  'I need someone to talk to':      "I'm here. Always.",
  'I want to build better habits':  "Let's build something solid together.",
  'I want to meditate more':        "Let's find your calm.",
  "I'm just exploring":             'Wander with me.',
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { completeOnboarding } = useStorage();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [displayedText, setDisplayedText] = useState('');
  const [echoExpression, setEchoExpression] = useState<ExpressionName>('sleepy');
  const [echoSpeaking, setEchoSpeaking] = useState(false);

  // Slide animation between steps
  const slideX = useSharedValue(0);
  const contentOpacity = useSharedValue(1);

  // Cloud particles for step 4
  const particles = useRef(
    Array.from({ length: 6 }, () => ({
      x: Math.random() * (width - 40) + 20,
      anim: new RNAnimated.Value(0),
    }))
  ).current;

  const STEP_TEXTS = [
    "Hey... I'm Echo.",
    'What should I call you?',
    name ? `What brought you to me, ${name}?` : 'What brought you here?',
    getStep4Text(),
    'Ready?',
  ];

  function getStep4Text() {
    if (selectedGoals.length === 0) return 'I hear you.';
    return STEP_4_RESPONSES[selectedGoals[0]] ?? "Let's go.";
  }

  const gradientColors = isDark
    ? (['#0A0E1A', '#131929', '#1C2540'] as const)
    : (['#C9E8FF', '#EEF6FF', '#FFFFFF'] as const);

  // Typewriter effect
  useEffect(() => {
    const target = STEP_TEXTS[step] ?? '';
    setDisplayedText('');
    setEchoSpeaking(true);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedText(target.slice(0, i));
      if (i >= target.length) {
        clearInterval(interval);
        setEchoSpeaking(false);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [step]);

  // Expression per step
  useEffect(() => {
    if (step === 0) {
      setEchoExpression('sleepy');
      const t = setTimeout(() => setEchoExpression('happy'), 1200);
      return () => clearTimeout(t);
    }
    setEchoExpression(STEP_EXPRESSIONS[step] ?? 'calm');
  }, [step]);

  // Step 4 particles
  useEffect(() => {
    if (step === 3) {
      particles.forEach((p, i) => {
        p.anim.setValue(0);
        RNAnimated.delay(
          i * 120,
          RNAnimated.timing(p.anim, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: true,
            easing: (t) => t,
          }),
        ).start();
      });
    }
  }, [step]);

  const slideStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateX: slideX.value }],
  }));

  const advanceStep = () => {
    contentOpacity.value = withSequence(
      withTiming(0, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 200, easing: Easing.in(Easing.ease) }),
    );
    setTimeout(() => setStep((s) => Math.min(s + 1, 4)), 150);
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  };

  const handleFinish = async () => {
    await completeOnboarding({ userName: name.trim() || 'Friend', onboardingGoals: selectedGoals });
    router.replace('/(tabs)');
  };

  const canAdvance = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return selectedGoals.length > 0;
    return true;
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          {/* Step dots */}
          <View style={styles.dots}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i === step ? colors.primary : colors.border },
                ]}
              />
            ))}
          </View>

          {/* Echo avatar */}
          <View style={styles.avatarContainer}>
            <EchoAvatar
              expression={echoExpression}
              size={step === 4 ? 180 : 140}
              animated
              speaking={echoSpeaking}
            />
          </View>

          {/* Step 4 particles */}
          {step === 3 &&
            particles.map((p, i) => (
              <RNAnimated.View
                key={i}
                style={[
                  styles.particle,
                  {
                    left: p.x,
                    opacity: p.anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.8, 0] }),
                    transform: [
                      {
                        translateY: p.anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -120],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}

          {/* Content area */}
          <Animated.View style={[styles.content, slideStyle]}>
            {/* Typewriter text */}
            <Text style={[styles.mainText, { color: colors.text }]}>{displayedText}</Text>

            {/* Step 1: Name input */}
            {step === 1 && (
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name..."
                placeholderTextColor={colors.textSecondary}
                style={[styles.nameInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => name.trim() && advanceStep()}
              />
            )}

            {/* Step 2: Goal chips */}
            {step === 2 && (
              <View style={styles.chipsContainer}>
                {GOALS.map((goal) => {
                  const selected = selectedGoals.includes(goal);
                  return (
                    <TouchableOpacity
                      key={goal}
                      onPress={() => toggleGoal(goal)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? colors.primary : colors.surface,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: selected ? '#fff' : colors.text }]}>
                        {goal}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Animated.View>

          {/* CTA */}
          <View style={styles.ctaContainer}>
            {step < 4 ? (
              <TouchableOpacity
                onPress={advanceStep}
                disabled={!canAdvance()}
                style={[
                  styles.ctaButton,
                  { backgroundColor: canAdvance() ? colors.primary : colors.border },
                ]}
              >
                <Text style={styles.ctaText}>
                  {step === 0 ? 'Hello, Echo' : 'Continue'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleFinish}
                style={[styles.ctaButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.ctaText}>Let's go</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1 },
  safe:           { flex: 1 },
  kav:            { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 24 },
  dots:           { flexDirection: 'row', gap: 8, marginTop: 8 },
  dot:            { width: 8, height: 8, borderRadius: 4 },
  avatarContainer:{ alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  particle:       { position: 'absolute', bottom: 200, width: 12, height: 12, borderRadius: 6, backgroundColor: '#D6EAFF' },
  content:        { width: '100%', paddingHorizontal: 32, alignItems: 'center', minHeight: 180 },
  mainText:       { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 24, lineHeight: 36 },
  nameInput: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 18,
    textAlign: 'center',
  },
  chipsContainer: { width: '100%', gap: 12 },
  chip:           { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12 },
  chipText:       { fontSize: 15, fontWeight: '500', textAlign: 'center' },
  ctaContainer:   { width: '100%', paddingHorizontal: 32 },
  ctaButton:      { borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  ctaText:        { color: '#fff', fontSize: 17, fontWeight: '700' },
});
```

- [ ] **Step 2: Verify the onboarding screen has no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | grep "onboarding" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(onboarding)/index.tsx"
git commit -m "feat: implement 5-step Echo onboarding flow with typewriter and goal selection"
```

---

## Task 9: Install expo-speech

- [ ] **Step 1: Install expo-speech**

```bash
npx expo install expo-speech
```

Expected output contains: `+ expo-speech@...`

- [ ] **Step 2: Commit lockfile update**

```bash
git add package.json package-lock.json
git commit -m "chore: install expo-speech for Echo TTS"
```

---

## Task 10: TTS Prefs Hook

**Files:**
- Create: `hooks/useTTSPrefs.ts`

- [ ] **Step 1: Create the hook**

```ts
// hooks/useTTSPrefs.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export const TTS_ENABLED_KEY = 'echo_tts_enabled';
export const TTS_RATE_KEY = 'echo_tts_rate';

export type TTSRate = 0.8 | 1.0 | 1.3;

export function useTTSPrefs() {
  const [enabled, setEnabledState] = useState(false);
  const [rate, setRateState] = useState<TTSRate>(1.0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([TTS_ENABLED_KEY, TTS_RATE_KEY]).then(([[, en], [, rt]]) => {
      if (en !== null) setEnabledState(en === 'true');
      if (rt !== null) setRateState(parseFloat(rt) as TTSRate);
      setLoaded(true);
    });
  }, []);

  const setEnabled = async (val: boolean) => {
    setEnabledState(val);
    await AsyncStorage.setItem(TTS_ENABLED_KEY, val.toString());
  };

  const setRate = async (val: TTSRate) => {
    setRateState(val);
    await AsyncStorage.setItem(TTS_RATE_KEY, val.toString());
  };

  return { enabled, rate, setEnabled, setRate, loaded };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useTTSPrefs.ts
git commit -m "feat: add useTTSPrefs hook for shared TTS enabled/rate state"
```

---

## Task 11: SettingsModal — TTS Section

**Files:**
- Modify: `component/SettingsModal.tsx`

- [ ] **Step 1: Add useTTSPrefs import and TTS section to SettingsModal**

At the top of `component/SettingsModal.tsx`, add the import:

```ts
import { useTTSPrefs, TTSRate } from '../hooks/useTTSPrefs';
```

- [ ] **Step 2: Inside `SettingsModal` component, add hook call**

After `const [notifications, setNotifications] = useState(true)`:

```ts
const { enabled: ttsEnabled, rate: ttsRate, setEnabled: setTtsEnabled, setRate: setTtsRate } = useTTSPrefs();
```

- [ ] **Step 3: Add TTS section to the ScrollView, after existing settings**

Find the closing `</ScrollView>` tag and insert before it:

```tsx
{/* TTS Setting */}
<View style={{ marginBottom: 24 }}>
    <Text style={{ marginBottom: 12, fontSize: 14, fontWeight: '600', color: '#0f172a' }}>
        Echo Voice
    </Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 14, color: '#334155' }}>Let Echo speak</Text>
        <TouchableOpacity
            onPress={() => setTtsEnabled(!ttsEnabled)}
            style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                backgroundColor: ttsEnabled ? '#5B9BF8' : '#CBD5E1',
                justifyContent: 'center',
                paddingHorizontal: 3,
            }}
        >
            <View style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: '#fff',
                alignSelf: ttsEnabled ? 'flex-end' : 'flex-start',
            }} />
        </TouchableOpacity>
    </View>
    {ttsEnabled && (
        <View>
            <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Speed</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
                {([0.8, 1.0, 1.3] as TTSRate[]).map((r) => (
                    <TouchableOpacity
                        key={r}
                        onPress={() => setTtsRate(r)}
                        style={{
                            flex: 1,
                            paddingVertical: 8,
                            borderRadius: 10,
                            alignItems: 'center',
                            backgroundColor: ttsRate === r ? '#5B9BF8' : '#F1F5F9',
                            borderWidth: 1,
                            borderColor: ttsRate === r ? '#5B9BF8' : '#E2E8F0',
                        }}
                    >
                        <Text style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: ttsRate === r ? '#fff' : '#334155',
                        }}>
                            {r === 0.8 ? 'Slow' : r === 1.0 ? 'Normal' : 'Fast'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    )}
</View>
```

- [ ] **Step 4: Commit**

```bash
git add component/SettingsModal.tsx
git commit -m "feat: add TTS toggle and speed picker to SettingsModal"
```

---

## Task 12: ChatContext — Echo Persona

**Files:**
- Modify: `context/ChatContext.tsx`

- [ ] **Step 1: Update welcome message to Echo's voice**

In `createConversation`, replace the welcome message text:

```ts
// Before:
text: 'Hi there! 👋 How can I help you today?',

// After:
text: "Hey... I'm Echo. ☁️ I'm here — what's on your mind?",
```

- [ ] **Step 2: Add systemPrompt to API call in sendMessage**

In the `sendMessage` function, find `const result = await api.chat.sendMessage(text, apiChatId);` and replace:

```ts
const ECHO_SYSTEM_PROMPT =
  'You are Echo, a gentle cloud spirit who listens deeply and responds with warmth. ' +
  'Adapt your tone: playful when the user is light, calm when they need grounding, ' +
  'wise when they ask deep questions. Always speak as Echo, never break character. ' +
  'Keep responses concise — you speak, not lecture.';

const result = await api.chat.sendMessage(text, apiChatId, ECHO_SYSTEM_PROMPT);
```

- [ ] **Step 3: Update api.ts to accept optional systemPrompt**

In `service/api.ts`, find the `sendMessage` function and update:

```ts
sendMessage: async (message: string, chatId?: string, systemPrompt?: string) => {
    const response = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ message, chatId, systemPrompt }),
    });
    return handleResponse(response) as Promise<ChatSendResponse>;
},
```

- [ ] **Step 4: Add lastBotText to ChatContext**

In `ChatContextType` interface, add:

```ts
lastBotText: string;
```

In the `ChatProvider` component, add:

```ts
const lastBotText = useMemo(() => {
    if (!currentConversation) return '';
    const botMessages = currentConversation.messages.filter(m => m.sender === 'bot');
    return botMessages[botMessages.length - 1]?.text ?? '';
}, [currentConversation]);
```

Add `useMemo` to the imports from React.

In the Provider value, add:

```ts
lastBotText,
```

- [ ] **Step 5: Commit**

```bash
git add context/ChatContext.tsx service/api.ts
git commit -m "feat: inject Echo persona into chat and expose lastBotText for mood derivation"
```

---

## Task 13: TypingIndicator — Echo Replacement

**Files:**
- Modify: `component/TypingIndicator.tsx`

- [ ] **Step 1: Replace dot animation with EchoAvatar**

```tsx
// component/TypingIndicator.tsx
import React from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ThemeColors } from '../context/ThemeContext';
import { EchoAvatar } from './EchoAvatar';

interface TypingIndicatorProps {
  colors: ThemeColors;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ colors }) => {
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
```

- [ ] **Step 2: Commit**

```bash
git add component/TypingIndicator.tsx
git commit -m "feat: replace dot typing indicator with EchoAvatar thinking expression"
```

---

## Task 14: ChatInput — STT Placeholder

**Files:**
- Modify: `component/ChatInput.tsx`

- [ ] **Step 1: Add disabled mic icon to ChatInput**

```tsx
// component/ChatInput.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'

interface ChatInputProps {
    value: string
    onChangeText: (text: string) => void
    onSend: () => void
    isLoading: boolean
}

export const ChatInput: React.FC<ChatInputProps> = ({
    value,
    onChangeText,
    onSend,
    isLoading,
}) => {
    return (
        <View className="border-t border-slate-200 bg-white px-4 py-4">
            <View className="flex flex-row items-center gap-2">
                {/* Disabled STT mic — coming soon */}
                <TouchableOpacity
                    disabled
                    style={{ opacity: 0.35 }}
                    accessibilityLabel="Voice input coming soon"
                >
                    <MaterialCommunityIcons name="microphone-outline" size={24} color="#6B8CAE" />
                </TouchableOpacity>

                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder="Talk to Echo..."
                    placeholderTextColor="#94a3b8"
                    editable={!isLoading}
                    multiline
                    maxLength={500}
                    className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
                />
                <TouchableOpacity
                    onPress={onSend}
                    disabled={!value.trim() || isLoading}
                    className={`h-10 w-10 items-center justify-center rounded-full ${
                        value.trim() && !isLoading
                            ? 'bg-blue-500'
                            : 'bg-slate-300'
                    }`}
                >
                    <MaterialCommunityIcons
                        name="send"
                        size={20}
                        color="white"
                    />
                </TouchableOpacity>
            </View>
            <Text className="mt-2 text-xs text-slate-500">
                {value.length}/500
            </Text>
        </View>
    )
}
```

- [ ] **Step 2: Commit**

```bash
git add component/ChatInput.tsx
git commit -m "feat: add disabled STT mic placeholder to ChatInput"
```

---

## Task 15: Chat Screen — Echo Header + TTS

**Files:**
- Modify: `app/(chat)/chat.tsx`

- [ ] **Step 1: Add imports for EchoAvatar, expo-speech, useTTSPrefs, and mood helper**

At the top of `app/(chat)/chat.tsx`, add these imports after existing ones:

```ts
import * as Speech from 'expo-speech';
import { EchoAvatar, ExpressionName } from '../../component/EchoAvatar';
import { useTTSPrefs } from '../../hooks/useTTSPrefs';
```

- [ ] **Step 2: Add echoMood helper and state inside ChatDetailScreen**

After `const [showScrollDown, setShowScrollDown] = useState(false);`, add:

```ts
const { enabled: ttsEnabled, rate: ttsRate } = useTTSPrefs();
const [echoMood, setEchoMood] = useState<ExpressionName>('calm');
const [echoSpeaking, setEchoSpeaking] = useState(false);

const { lastBotText } = useChat();

// Derive Echo mood from last bot message text
useEffect(() => {
    const t = lastBotText.toLowerCase();
    if (!t) { setEchoMood('happy'); return; }
    if (/\b(sad|stress|anxious|tired|alone|lost|hurt|cry)\b/.test(t)) {
        setEchoMood('sad');
    } else if (/\b(achieved|milestone|proud|did it|congrats|great job)\b/.test(t)) {
        setEchoMood('excited');
    } else if (/\b(why|wonder|mean|purpose|reflect|meaning)\b/.test(t)) {
        setEchoMood('curious');
    } else {
        setEchoMood('calm');
    }
}, [lastBotText]);

// TTS: speak when new bot message arrives
const prevLastBotText = useRef('');
useEffect(() => {
    if (!ttsEnabled || !lastBotText || lastBotText === prevLastBotText.current) return;
    prevLastBotText.current = lastBotText;
    Speech.stop();
    setEchoSpeaking(true);
    Speech.speak(lastBotText, {
        rate: ttsRate,
        onDone: () => setEchoSpeaking(false),
        onError: () => setEchoSpeaking(false),
    });
}, [lastBotText, ttsEnabled, ttsRate]);

// Cleanup speech on unmount
useEffect(() => {
    return () => { Speech.stop(); };
}, []);

const handleEchoAvatarTap = () => {
    if (!ttsEnabled || !lastBotText) return;
    Speech.stop();
    setEchoSpeaking(true);
    Speech.speak(lastBotText, {
        rate: ttsRate,
        onDone: () => setEchoSpeaking(false),
        onError: () => setEchoSpeaking(false),
    });
};
```

Also add `useRef` to the React import and import `useEffect` if not already imported.

- [ ] **Step 3: Replace bot avatar in header with EchoAvatar**

Find this block in the chat screen header:

```tsx
{/* Bot info */}
<View style={{
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginLeft: 4,
}}>
    <LinearGradient
        colors={['#4F6BFF', '#7B3FE4']}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
        <MaterialCommunityIcons name="robot" size={18} color="#fff" />
    </LinearGradient>
</View>
```

Replace it with:

```tsx
{/* Echo avatar in header */}
<TouchableOpacity onPress={handleEchoAvatarTap} style={{ marginLeft: 4 }}>
    <EchoAvatar
        expression={isSending ? 'thinking' : echoMood}
        size={44}
        animated={false}
        speaking={echoSpeaking}
    />
</TouchableOpacity>
```

- [ ] **Step 4: Update the subtitle text to use "Echo" branding**

Find:
```tsx
<Text style={{ fontSize: 12, color: isSending ? '#10B981' : colors.textSecondary }}>
    {isSending ? 'Echo is typing...' : 'Echo AI'}
</Text>
```

Replace with:
```tsx
<Text style={{ fontSize: 12, color: isSending ? colors.primary : colors.textSecondary }}>
    {isSending ? 'Echo is listening...' : `Echo • ${ttsEnabled ? '🔊' : '☁️'}`}
</Text>
```

- [ ] **Step 5: Replace bot message avatar (robot icon) in renderMessage with EchoAvatar**

Find this block in `renderMessage`:

```tsx
<LinearGradient
    colors={['#4F6BFF', '#7B3FE4']}
    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
>
    <MaterialCommunityIcons name="robot" size={16} color="#fff" />
</LinearGradient>
```

Replace with:

```tsx
<EchoAvatar expression="calm" size={32} animated={false} />
```

Also update the wrapping View to remove overflow/borderRadius (EchoAvatar handles its own shape):

```tsx
{!isUser && (
    <View style={{ width: 36, marginRight: 6 }}>
        {lastInGroup && (
            <EchoAvatar expression="calm" size={36} animated={false} />
        )}
    </View>
)}
```

- [ ] **Step 6: Commit**

```bash
git add "app/(chat)/chat.tsx"
git commit -m "feat: add Echo avatar to chat header, derive mood from messages, wire TTS playback"
```

---

## Task 16: Meditation Revamp

**Files:**
- Modify: `app/(meditation)/index.tsx`

- [ ] **Step 1: Add EchoAvatar and expo-speech imports**

At the top of `app/(meditation)/index.tsx`, add:

```ts
import * as Speech from 'expo-speech';
import { EchoAvatar, ExpressionName } from '../../component/EchoAvatar';
import { useTTSPrefs } from '../../hooks/useTTSPrefs';
```

- [ ] **Step 2: Add Echo state variables inside MeditationPage**

After `const [sessionsCompleted, setSessionsCompleted] = useState(0);`:

```ts
const [echoExpression, setEchoExpression] = useState<ExpressionName>('calm');
const [echoSpeaking, setEchoSpeaking] = useState(false);
const [echoScale, setEchoScale] = useState(1.0);
const { enabled: ttsEnabled } = useTTSPrefs();
```

- [ ] **Step 3: Add Echo-specific behavior to runPhase**

Inside `runPhase`, after `triggerPhaseHaptic(index)`:

```ts
// Echo expression and scale per breath phase
const PHASE_CONFIGS: Array<{ expression: ExpressionName; cue: string }> = [
    { expression: 'calm',   cue: 'Breathe in... slowly.' },   // inhale
    { expression: 'calm',   cue: 'Hold... gently.' },           // hold
    { expression: 'sleepy', cue: 'Breathe out... let it go.' }, // exhale
    { expression: 'calm',   cue: '' },                           // hold
];
const phaseConfig = PHASE_CONFIGS[index];
setEchoExpression(phaseConfig.expression);

// Scale Echo with breath (1.0 → 1.15 on inhale, back on exhale)
if (index === 0) setEchoScale(1.15);
else if (index === 2) setEchoScale(1.0);

// TTS breath cue
if (ttsEnabled && phaseConfig.cue) {
    Speech.stop();
    setEchoSpeaking(true);
    Speech.speak(phaseConfig.cue, {
        rate: 0.75,
        onDone: () => setEchoSpeaking(false),
        onError: () => setEchoSpeaking(false),
    });
}
```

- [ ] **Step 4: Update completeSession to use Echo proud→happy transition**

Inside `completeSession`, after `Haptics.notificationAsync(...)`:

```ts
setEchoExpression('proud');
setEchoScale(1.0);
Speech.stop();
if (ttsEnabled) {
    setEchoSpeaking(true);
    Speech.speak("You did it. I'm so proud of you.", {
        rate: 0.85,
        onDone: () => setEchoSpeaking(false),
        onError: () => setEchoSpeaking(false),
    });
}
setTimeout(() => setEchoExpression('happy'), 1800);
```

- [ ] **Step 5: Add cleanup for speech in existing cleanup function**

Inside `cleanup`:

```ts
Speech.stop();
```

(Add this line before or after the sound cleanup.)

- [ ] **Step 6: Replace the breathing circle in the main render with EchoAvatar**

Find this block in the main return (not `showDurationPicker` / `showSummary`):

```tsx
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
```

Replace with:

```tsx
<View style={styles.circleContainer}>
    {/* Breathing ring behind Echo */}
    <Animated.View
        style={[
            styles.breathRing,
            animatedCircleStyle,
            { borderColor: colors.primary },
        ]}
    />

    {/* Echo avatar — scales with breath via echoScale state */}
    <Animated.View style={{ transform: [{ scale: echoScale }], alignItems: 'center' }}>
        <EchoAvatar
            expression={echoExpression}
            size={CIRCLE_SIZE * 0.85}
            animated
            speaking={echoSpeaking}
        />
    </Animated.View>

    {/* Phase label */}
    <View style={styles.textContainer}>
        <Text style={[styles.phaseText, { color: colors.text }]}>
            {phases[phaseIndex].text}
        </Text>
    </View>
</View>
```

- [ ] **Step 7: Add breathRing style and update existing styles**

In the `StyleSheet.create` at the bottom, add:

```ts
breathRing: {
    position: 'absolute',
    width: CIRCLE_SIZE * 0.95,
    height: CIRCLE_SIZE * 0.95,
    borderRadius: CIRCLE_SIZE * 0.475,
    borderWidth: 2,
    opacity: 0.3,
},
```

- [ ] **Step 8: Update gradient colors in showDurationPicker and main render to use sky palette**

Find all occurrences of `colors={['#e0f2fe', '#f0f9ff', '#fff']}` in meditation screen and replace with:

```tsx
colors={isDark ? ['#0A0E1A', '#131929', '#1C2540'] : ['#C9E8FF', '#EEF6FF', '#FFFFFF']}
```

Also add `isDark` to the `useTheme()` destructure:

```ts
const { colors, isDark } = useTheme();
```

- [ ] **Step 9: Commit**

```bash
git add "app/(meditation)/index.tsx"
git commit -m "feat: replace meditation breathing circle with Echo avatar and add TTS breath cues"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ EchoAvatar 8 expressions — Task 1 + 2
- ✅ Sky day/night palette — Task 3 + 4
- ✅ Onboarding 5 steps — Task 5 + 6 + 7 + 8
- ✅ StorageContext onboarding fields — Task 5
- ✅ Chat Echo persona system prompt — Task 12
- ✅ Chat Echo avatar header + mood mapping — Task 15
- ✅ Chat TTS + settings — Task 9 + 10 + 11 + 15
- ✅ Chat STT placeholder — Task 14
- ✅ Meditation Echo breathing guide — Task 16
- ✅ Meditation TTS cues — Task 16

**Type consistency:**
- `ExpressionName` defined in `expressions.ts`, exported from `EchoAvatar/index.tsx` — used consistently
- `completeOnboarding` signature matches in StorageContext interface and implementation
- `lastBotText` added to ChatContextType and Provider value
- `useTTSPrefs` returns `{ enabled, rate, setEnabled, setRate, loaded }` — used consistently in Task 11 and 15

**Caveats:**
- The `echoScale` state in meditation drives a React state-based scale (not Reanimated shared value). For smoother animation, a follow-up could convert to `useSharedValue + withTiming`. Current approach is functional.
- `ECHO_SYSTEM_PROMPT` constant in ChatContext is defined inside `sendMessage` callback. Move it outside the component to avoid re-creation on every call.
