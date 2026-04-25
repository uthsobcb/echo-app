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

  const contentOpacity = useSharedValue(1);

  const particles = useRef(
    Array.from({ length: 6 }, () => ({
      x: Math.random() * (width - 40) + 20,
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
        RNAnimated.sequence([
          RNAnimated.delay(i * 120),
          RNAnimated.timing(p.anim, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [step]);

  const slideStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
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
            <Text style={[styles.mainText, { color: colors.text }]}>{displayedText}</Text>

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
  root:            { flex: 1 },
  safe:            { flex: 1 },
  kav:             { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 24 },
  dots:            { flexDirection: 'row', gap: 8, marginTop: 8 },
  dot:             { width: 8, height: 8, borderRadius: 4 },
  avatarContainer: { alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  particle:        { position: 'absolute', bottom: 200, width: 12, height: 12, borderRadius: 6, backgroundColor: '#D6EAFF' },
  content:         { width: '100%', paddingHorizontal: 32, alignItems: 'center', minHeight: 180 },
  mainText:        { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 24, lineHeight: 36 },
  nameInput: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 18,
    textAlign: 'center',
  },
  chipsContainer:  { width: '100%', gap: 12 },
  chip:            { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12 },
  chipText:        { fontSize: 15, fontWeight: '500', textAlign: 'center' },
  ctaContainer:    { width: '100%', paddingHorizontal: 32 },
  ctaButton:       { borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  ctaText:         { color: '#fff', fontSize: 17, fontWeight: '700' },
});
