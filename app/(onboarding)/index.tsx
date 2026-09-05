import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  Image,
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
const TOTAL_STEPS = 5;

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEELINGS = [
  { text: "I've been feeling overwhelmed", emoji: '🌊', sub: 'Too much all at once'       },
  { text: 'My mind won\'t slow down',      emoji: '💭', sub: 'Anxious & overthinking'      },
  { text: 'I feel disconnected lately',    emoji: '🌫️', sub: 'Lost touch with myself'      },
  { text: 'I\'m good — ready to grow',     emoji: '🌱', sub: 'Doing well, want to be more' },
];

const FOCUS_AREAS = [
  { text: 'Make sense of my emotions', emoji: '💙', sub: 'Understand what I feel and why'   },
  { text: 'Build better daily habits', emoji: '✨', sub: 'Small steps, lasting change'       },
  { text: 'Find calm & stillness',     emoji: '🧘', sub: 'Breathe through the chaos'         },
  { text: 'Track my personal growth',  emoji: '📈', sub: 'See my journey over time'          },
];

// Echo's expression reflects the user's emotional state
const FEELING_EXPRESSIONS: Record<string, ExpressionName> = {
  "I've been feeling overwhelmed": 'sad',
  "My mind won't slow down":       'thinking',
  'I feel disconnected lately':    'sad',
  "I'm good — ready to grow":     'calm',
};

// Echo empathises on step 3 (after feeling selected)
const FEELING_RESPONSES: Record<string, string> = {
  "I've been feeling overwhelmed": "That's a lot to carry.\nYou don't have to do it alone.",
  "My mind won't slow down":       "Let's slow that spiral —\none breath at a time.",
  'I feel disconnected lately':    "You reached out.\nThat's where it begins.",
  "I'm good — ready to grow":     "That openness is beautiful.\nLet's make it count.",
};

// Echo's closing message on step 4 (after focus selected)
const FOCUS_RESPONSES: Record<string, string> = {
  'Make sense of my emotions': "I'll always listen.\nNo judgment, ever.",
  'Build better daily habits': "Every small step here matters.\nLet's build something real.",
  'Find calm & stillness':     "Peace lives here.\nLet's find it together.",
  'Track my personal growth':  "Every entry tells your story.\nReady to write it?",
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { completeOnboarding } = useStorage();

  const [step, setStep]                     = useState(0);
  const [name, setName]                     = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState('');
  const [selectedFocus, setSelectedFocus]   = useState('');
  const [displayedText, setDisplayedText]   = useState('');
  const [echoExpression, setEchoExpression] = useState<ExpressionName>('sleepy');
  const [echoSpeaking, setEchoSpeaking]     = useState(false);

  const contentOpacity = useSharedValue(1);
  const contentSlideX  = useSharedValue(0);

  const particles = useRef(
    Array.from({ length: 10 }, () => ({
      x:    Math.random() * (width - 60) + 30,
      anim: new RNAnimated.Value(0),
    }))
  ).current;

  // ── Step text (Echo's voice) ─────────────────────────────────────────────
  const stepText = (): string => {
    switch (step) {
      case 0: return "Hey… I'm Echo.";
      case 1: return 'What should I call you?';
      case 2: return name
        ? `How have you been\nfeeling lately, ${name}?`
        : 'How have you been\nfeeling lately?';
      case 3: return selectedFeeling
        ? (FEELING_RESPONSES[selectedFeeling] ?? 'I hear you.')
        : 'What would you like\nto focus on?';
      case 4: return selectedFocus
        ? (FOCUS_RESPONSES[selectedFocus] ?? "Let's go.")
        : 'Ready to begin?';
      default: return '';
    }
  };

  // Subtitle shown beneath Echo's text on step 3 (leads into focus selection)
  const stepSubtitle = (): string => {
    if (step === 3 && selectedFeeling) return 'What would you like to focus on?';
    return '';
  };

  const gradientColors = isDark
    ? (['#060A14', '#0D1526', '#182038'] as const)
    : (['#B8DEFF', '#E8F4FF', '#FFFFFF'] as const);

  // ── Typewriter ───────────────────────────────────────────────────────────
  useEffect(() => {
    const target = stepText();
    setDisplayedText('');
    setEchoSpeaking(true);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayedText(target.slice(0, i));
      if (i >= target.length) { clearInterval(iv); setEchoSpeaking(false); }
    }, 36);
    return () => clearInterval(iv);
    // name/selectedFeeling/selectedFocus are only read by stepText() on later
    // steps, after they're already final (no back button) — depending on them
    // here would replay the typewriter on every keystroke of the name input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Expression per step ──────────────────────────────────────────────────
  useEffect(() => {
    if (step === 0) {
      setEchoExpression('sleepy');
      const t = setTimeout(() => setEchoExpression('happy'), 900);
      return () => clearTimeout(t);
    }
    if (step === 1) { setEchoExpression('curious');  return; }
    if (step === 2) { setEchoExpression('calm');     return; }
    if (step === 3) {
      setEchoExpression(
        selectedFeeling ? (FEELING_EXPRESSIONS[selectedFeeling] ?? 'calm') : 'calm'
      );
      return;
    }
    if (step === 4) { setEchoExpression('excited');  return; }
  }, [step]);

  // ── Particles on final step ──────────────────────────────────────────────
  useEffect(() => {
    if (step === 4) {
      particles.forEach((p, i) => {
        p.anim.setValue(0);
        RNAnimated.sequence([
          RNAnimated.delay(i * 80),
          RNAnimated.timing(p.anim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        ]).start();
      });
    }
  }, [step]);

  // ── Animation helpers ────────────────────────────────────────────────────
  const slideStyle = useAnimatedStyle(() => ({
    opacity:   contentOpacity.value,
    transform: [{ translateX: contentSlideX.value }],
  }));

  const advanceStep = () => {
    contentOpacity.value = withSequence(
      withTiming(0,   { duration: 110, easing: Easing.out(Easing.ease) }),
      withTiming(1,   { duration: 200, easing: Easing.out(Easing.ease) }),
    );
    contentSlideX.value = withSequence(
      withTiming(-24, { duration: 110, easing: Easing.out(Easing.ease) }),
      withTiming(0,   { duration: 200, easing: Easing.out(Easing.ease) }),
    );
    setTimeout(() => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1)), 110);
  };

  const canAdvance = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return selectedFeeling.length > 0;
    if (step === 3) return selectedFocus.length > 0;
    return true;
  };

  const handleFinish = async () => {
    await completeOnboarding({
      userName:        name.trim() || 'Friend',
      onboardingGoals: [selectedFeeling, selectedFocus].filter(Boolean),
    });
    router.replace('/(auth)/signin');
  };

  // ── Chip renderer ────────────────────────────────────────────────────────
  const renderChips = (
    items: { text: string; emoji: string; sub: string }[],
    selected: string,
    onSelect: (text: string) => void,
  ) => (
    <View style={styles.chipsContainer}>
      {items.map((item) => {
        const active = selected === item.text;
        return (
          <TouchableOpacity
            key={item.text}
            onPress={() => onSelect(item.text)}
            activeOpacity={0.75}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor:     active ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={styles.chipEmoji}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>
                {item.text}
              </Text>
              <Text style={[styles.chipSub, { color: active ? 'rgba(255,255,255,0.75)' : colors.textSecondary }]}>
                {item.sub}
              </Text>
            </View>
            {active && <Text style={styles.chipCheck}>✓</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const avatarSize = step === 0 ? 200 : step === 4 ? 180 : 130;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />

      {/* Ambient glow */}
      <View style={[styles.avatarGlow, { backgroundColor: colors.primary, opacity: isDark ? 0.12 : 0.08 }]} />

      {/* Meditate illustration — welcome & final steps */}
      {(step === 0 || step === 4) && (
        <View style={styles.meditateGlow} pointerEvents="none">
          <Image
            source={require('../../assets/images/echo-meditate.png')}
            style={styles.meditateGlowImg}
            resizeMode="cover"
          />
        </View>
      )}

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>

          {/* Progress dots */}
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === step
                    ? [styles.dotActive, { backgroundColor: colors.primary }]
                    : i < step
                      ? { backgroundColor: colors.primary, opacity: 0.4 }
                      : { backgroundColor: colors.border },
                ]}
              />
            ))}
          </View>

          {/* Echo avatar */}
          <View style={[styles.avatarContainer, { minHeight: step === 0 ? 240 : 180 }]}>
            <EchoAvatar expression={echoExpression} size={avatarSize} animated speaking={echoSpeaking} />
          </View>

          {/* Celebration particles on final step */}
          {step === 4 && particles.map((p, i) => (
            <RNAnimated.View
              key={i}
              style={[
                styles.particle,
                {
                  left: p.x,
                  backgroundColor: i % 3 === 0 ? colors.primary : i % 3 === 1 ? '#FCD34D' : '#F472B6',
                  opacity: p.anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
                  transform: [
                    { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -200] }) },
                    { scale:     p.anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.2, 0.3] }) },
                  ],
                },
              ]}
            />
          ))}

          {/* Content area */}
          <Animated.View style={[styles.content, slideStyle]}>
            {/* Echo's spoken text */}
            <Text style={[styles.mainText, { color: colors.text, fontFamily: 'Caveat_700Bold' }]}>
              {displayedText}
            </Text>

            {/* Subtitle (step 3 — bridges empathy → focus selection) */}
            {stepSubtitle() ? (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {stepSubtitle()}
              </Text>
            ) : null}

            {/* Step 1 — name input */}
            {step === 1 && (
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name…"
                placeholderTextColor={colors.textSecondary}
                style={[styles.nameInput, { color: colors.text, borderColor: colors.primary, backgroundColor: colors.surface }]}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => name.trim() && advanceStep()}
              />
            )}

            {/* Step 2 — feeling selection */}
            {step === 2 && renderChips(FEELINGS, selectedFeeling, setSelectedFeeling)}

            {/* Step 3 — focus selection */}
            {step === 3 && renderChips(FOCUS_AREAS, selectedFocus, setSelectedFocus)}
          </Animated.View>

          {/* CTA button */}
          <View style={styles.ctaContainer}>
            {step < TOTAL_STEPS - 1 ? (
              <TouchableOpacity
                onPress={advanceStep}
                disabled={!canAdvance()}
                activeOpacity={0.85}
                style={[styles.ctaButton, { backgroundColor: canAdvance() ? colors.primary : colors.border }]}
              >
                <Text style={styles.ctaText}>
                  {step === 0 ? 'Hello, Echo 👋' : step === 1 ? `Nice to meet you →` : 'Continue'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleFinish}
                activeOpacity={0.85}
                style={[styles.ctaButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.ctaText}>Let's begin ✨</Text>
              </TouchableOpacity>
            )}
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  kav:  { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },

  avatarGlow: {
    position: 'absolute', top: '15%', alignSelf: 'center',
    width: 260, height: 260, borderRadius: 130,
  },
  // ponytail: same white-canvas asset issue as the meditation screen — crop to
  // a circle scaled up ~1.7x to hide the baked-in white background.
  meditateGlow: {
    position: 'absolute', top: '10%', alignSelf: 'center',
    width: 300, height: 300, borderRadius: 150, overflow: 'hidden',
    opacity: 0.38, alignItems: 'center', justifyContent: 'center',
  },
  meditateGlowImg: {
    width: 300 * 1.7, height: 300 * 1.7,
  },

  dots:      { flexDirection: 'row', gap: 6, marginTop: 8 },
  dot:       { height: 8, borderRadius: 4, width: 8 },
  dotActive: { width: 28 },

  avatarContainer: { alignItems: 'center', justifyContent: 'center' },

  particle: {
    position: 'absolute', bottom: 200,
    width: 10, height: 10, borderRadius: 5,
  },

  content:  { width: '100%', paddingHorizontal: 28, alignItems: 'center', minHeight: 200 },
  mainText: { fontSize: 30, textAlign: 'center', marginBottom: 8, lineHeight: 40 },
  subtitle: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 16, letterSpacing: 0.2 },

  nameInput: {
    width: '100%', marginTop: 12,
    borderWidth: 2, borderRadius: 18,
    paddingHorizontal: 20, paddingVertical: 14,
    fontSize: 18, textAlign: 'center',
  },

  chipsContainer: { width: '100%', gap: 8, marginTop: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  chipEmoji: { fontSize: 20 },
  chipText:  { fontSize: 14, fontWeight: '700' },
  chipSub:   { fontSize: 12, marginTop: 1 },
  chipCheck: { fontSize: 14, color: '#fff', fontWeight: '800' },

  ctaContainer: { width: '100%', paddingHorizontal: 28 },
  ctaButton: {
    borderRadius: 28, paddingVertical: 17, alignItems: 'center',
    shadowColor: '#4F6BFF', shadowOpacity: 0.3, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
});
