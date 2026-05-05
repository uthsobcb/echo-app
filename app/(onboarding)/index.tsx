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
  { text: 'I need someone to talk to',     emoji: '💬' },
  { text: 'I want to build better habits', emoji: '✨' },
  { text: 'I want to meditate more',       emoji: '🧘' },
  { text: "I'm just exploring",            emoji: '🗺️' },
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

  const contentOpacity = useSharedValue(1);
  const contentSlideX = useSharedValue(0);

  const particles = useRef(
    Array.from({ length: 8 }, () => ({
      x: Math.random() * (width - 60) + 30,
      anim: new RNAnimated.Value(0),
    }))
  ).current;

  function getStep4Text() {
    if (selectedGoals.length === 0) return 'I hear you.';
    return STEP_4_RESPONSES[selectedGoals[0]] ?? "Let's go.";
  }

  const STEP_TEXTS = [
    "Hey... I'm Echo.",
    'What should I call you?',
    name ? `What brought you to me, ${name}?` : 'What brought you here?',
    getStep4Text(),
    'Ready?',
  ];

  const gradientColors = isDark
    ? (['#060A14', '#0D1526', '#182038'] as const)
    : (['#B8DEFF', '#E8F4FF', '#FFFFFF'] as const);

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
    }, 38);
    return () => clearInterval(interval);
  }, [step]);

  // Expression per step
  useEffect(() => {
    if (step === 0) {
      setEchoExpression('sleepy');
      const t = setTimeout(() => setEchoExpression('happy'), 1000);
      return () => clearTimeout(t);
    }
    setEchoExpression(STEP_EXPRESSIONS[step] ?? 'calm');
  }, [step]);

  // Step 3 particles
  useEffect(() => {
    if (step === 3) {
      particles.forEach((p, i) => {
        p.anim.setValue(0);
        RNAnimated.sequence([
          RNAnimated.delay(i * 100),
          RNAnimated.timing(p.anim, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [step]);

  const slideStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateX: contentSlideX.value }],
  }));

  const advanceStep = () => {
    // Slide out left, then slide in from right
    contentOpacity.value = withSequence(
      withTiming(0, { duration: 120, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) }),
    );
    contentSlideX.value = withSequence(
      withTiming(-20, { duration: 120, easing: Easing.out(Easing.ease) }),
      withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) }),
    );
    setTimeout(() => setStep((s) => Math.min(s + 1, 4)), 120);
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

  const avatarSize = step === 0 ? 200 : step === 4 ? 180 : 140;

  return (
    <View style={styles.root}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />

      {/* Ambient glow behind avatar */}
      <View
        style={[
          styles.avatarGlow,
          { backgroundColor: colors.primary, opacity: isDark ? 0.12 : 0.08 },
        ]}
      />

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
                  i === step
                    ? [styles.dotActive, { backgroundColor: colors.primary }]
                    : { backgroundColor: colors.border },
                ]}
              />
            ))}
          </View>

          {/* Echo avatar */}
          <View style={[styles.avatarContainer, { minHeight: step === 0 ? 240 : 190 }]}>
            <EchoAvatar
              expression={echoExpression}
              size={avatarSize}
              animated
              speaking={echoSpeaking}
            />
          </View>

          {/* Step 3 particles */}
          {step === 3 &&
            particles.map((p, i) => (
              <RNAnimated.View
                key={i}
                style={[
                  styles.particle,
                  {
                    left: p.x,
                    backgroundColor: i % 2 === 0 ? colors.primary : '#FCD34D',
                    opacity: p.anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.9, 0] }),
                    transform: [
                      { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -160] }) },
                      { scale: p.anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.4] }) },
                    ],
                  },
                ]}
              />
            ))}

          {/* Content area */}
          <Animated.View style={[styles.content, slideStyle]}>
            <Text style={[styles.mainText, { color: colors.text, fontFamily: 'Caveat_700Bold' }]}>
              {displayedText}
            </Text>

            {step === 1 && (
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name..."
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.nameInput,
                  { color: colors.text, borderColor: colors.primary, backgroundColor: colors.surface },
                ]}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => name.trim() && advanceStep()}
              />
            )}

            {step === 2 && (
              <View style={styles.chipsContainer}>
                {GOALS.map((goal) => {
                  const selected = selectedGoals.includes(goal.text);
                  return (
                    <TouchableOpacity
                      key={goal.text}
                      onPress={() => toggleGoal(goal.text)}
                      activeOpacity={0.75}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? colors.primary : colors.surface,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={styles.chipEmoji}>{goal.emoji}</Text>
                      <Text style={[styles.chipText, { color: selected ? '#fff' : colors.text }]}>
                        {goal.text}
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
                activeOpacity={0.85}
                style={[
                  styles.ctaButton,
                  { backgroundColor: canAdvance() ? colors.primary : colors.border },
                ]}
              >
                <Text style={styles.ctaText}>
                  {step === 0 ? 'Hello, Echo 👋' : 'Continue'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleFinish}
                activeOpacity={0.85}
                style={[styles.ctaButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.ctaText}>Let's go ✨</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1 },
  safe:         { flex: 1 },
  kav:          { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 24 },

  avatarGlow: {
    position: 'absolute',
    top: '15%',
    alignSelf: 'center',
    width: 260,
    height: 260,
    borderRadius: 130,
  },

  dots: { flexDirection: 'row', gap: 6, marginTop: 8 },
  dot:  { height: 8, borderRadius: 4, width: 8 },
  dotActive: { width: 24 },

  avatarContainer: { alignItems: 'center', justifyContent: 'center' },

  particle: {
    position: 'absolute',
    bottom: 220,
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  content:  { width: '100%', paddingHorizontal: 32, alignItems: 'center', minHeight: 190 },
  mainText: { fontSize: 32, textAlign: 'center', marginBottom: 28, lineHeight: 42 },

  nameInput: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 18,
    textAlign: 'center',
  },

  chipsContainer: { width: '100%', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 13,
    gap: 10,
  },
  chipEmoji: { fontSize: 18 },
  chipText:  { fontSize: 15, fontWeight: '600', flex: 1 },

  ctaContainer: { width: '100%', paddingHorizontal: 32 },
  ctaButton: {
    borderRadius: 28,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#4F6BFF',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
});
