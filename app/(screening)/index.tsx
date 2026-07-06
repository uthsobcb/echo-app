import { Toast } from '@/component/Toast';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/service/api';
import { logger } from '@/service/logger';
import { ScreeningHistoryEntry, ScreeningResult, ScreeningSeverity, ScreeningType } from '@/types/data';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const INSTRUMENTS: Record<ScreeningType, { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; questions: string[] }> = {
    phq9: {
        title: 'Depression Check',
        subtitle: 'PHQ-9 · 9 questions',
        icon: 'partly-sunny-outline',
        questions: [
            'Little interest or pleasure in doing things',
            'Feeling down, depressed, or hopeless',
            'Trouble falling or staying asleep, or sleeping too much',
            'Feeling tired or having little energy',
            'Poor appetite or overeating',
            'Feeling bad about yourself — or that you are a failure, or have let yourself or your family down',
            'Trouble concentrating on things, such as reading or watching television',
            'Moving or speaking so slowly that other people could have noticed — or the opposite, being so fidgety or restless that you have been moving around a lot more than usual',
            'Thoughts that you would be better off dead, or of hurting yourself in some way',
        ],
    },
    gad7: {
        title: 'Anxiety Check',
        subtitle: 'GAD-7 · 7 questions',
        icon: 'pulse-outline',
        questions: [
            'Feeling nervous, anxious, or on edge',
            'Not being able to stop or control worrying',
            'Worrying too much about different things',
            'Trouble relaxing',
            'Being so restless that it is hard to sit still',
            'Becoming easily annoyed or irritable',
            'Feeling afraid, as if something awful might happen',
        ],
    },
};

const SELF_HARM_QUESTION_INDEX = 8; // PHQ-9 item 9, 0-indexed

const ANSWER_OPTIONS = [
    { value: 0, label: 'Not at all' },
    { value: 1, label: 'Several days' },
    { value: 2, label: 'More than half the days' },
    { value: 3, label: 'Nearly every day' },
];

const SEVERITY_COLOR: Record<ScreeningSeverity, string> = {
    minimal: '#10B981',
    mild: '#84CC16',
    moderate: '#F59E0B',
    'moderately-severe': '#F97316',
    severe: '#EF4444',
};

function severityLabel(s: ScreeningSeverity) {
    return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

type Screen = 'menu' | 'form' | 'result';

export default function ScreeningPage() {
    const router = useRouter();
    const { colors } = useTheme();

    const [screen, setScreen] = useState<Screen>('menu');
    const [activeType, setActiveType] = useState<ScreeningType | null>(null);
    const [answers, setAnswers] = useState<number[]>([]);
    const [qIndex, setQIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<ScreeningResult | null>(null);

    const [history, setHistory] = useState<ScreeningHistoryEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    const fetchHistory = async () => {
        try {
            const data = await api.screening.getHistory();
            setHistory(data);
        } catch (e) {
            logger.error('[Screening] Failed to load history', e);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const startForm = (type: ScreeningType) => {
        setActiveType(type);
        setAnswers(new Array(INSTRUMENTS[type].questions.length).fill(-1));
        setQIndex(0);
        setResult(null);
        setScreen('form');
    };

    const backToMenu = () => {
        setScreen('menu');
        setActiveType(null);
        setQIndex(0);
    };

    const questions = activeType ? INSTRUMENTS[activeType].questions : [];
    const totalQuestions = questions.length;
    const currentAnswer = answers[qIndex];
    const canContinue = currentAnswer !== undefined && currentAnswer >= 0;
    const isLastQuestion = qIndex === totalQuestions - 1;

    const submit = async (finalAnswers: number[]) => {
        if (!activeType) return;
        setSubmitting(true);
        try {
            const res = await api.screening.submit(activeType, finalAnswers);
            setResult(res);
            setScreen('result');
            fetchHistory();
        } catch (e: any) {
            Toast.error(e?.message || 'Could not submit your check-in');
        } finally {
            setSubmitting(false);
        }
    };

    const handleContinue = () => {
        if (!canContinue) return;
        if (isLastQuestion) {
            submit(answers);
        } else {
            setQIndex(i => i + 1);
        }
    };

    const handleFormBack = () => {
        if (qIndex === 0) backToMenu();
        else setQIndex(i => i - 1);
    };

    const flaggedSelfHarm = activeType === 'phq9' && answers[SELF_HARM_QUESTION_INDEX] > 0;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (screen === 'form') handleFormBack();
                        else if (screen === 'result') backToMenu();
                        else router.back();
                    }}
                    style={styles.backBtn}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {screen === 'form' && activeType ? INSTRUMENTS[activeType].title : 'Wellness Check-In'}
                </Text>
                <View style={styles.qCounterWrap}>
                    {screen === 'form' && (
                        <Text style={[styles.qCounter, { color: colors.textSecondary }]}>{qIndex + 1}/{totalQuestions}</Text>
                    )}
                </View>
            </View>

            {screen === 'form' && (
                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                    <View
                        style={[
                            styles.progressFill,
                            { backgroundColor: colors.primary, width: `${((qIndex + 1) / totalQuestions) * 100}%` },
                        ]}
                    />
                </View>
            )}

            {screen === 'menu' && (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
                        Standard, validated self-report screening tools. These are not a diagnosis —
                        just a way to check in with yourself over time.
                    </Text>

                    {(Object.keys(INSTRUMENTS) as ScreeningType[]).map((type) => {
                        const info = INSTRUMENTS[type];
                        const last = history.find(h => h.type === type);
                        return (
                            <TouchableOpacity
                                key={type}
                                style={[styles.instrumentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                onPress={() => startForm(type)}
                                activeOpacity={0.85}
                            >
                                <View style={[styles.instrumentIcon, { backgroundColor: colors.surfaceSecondary }]}>
                                    <Ionicons name={info.icon} size={22} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.instrumentTitle, { color: colors.text }]}>{info.title}</Text>
                                    <Text style={[styles.instrumentSubtitle, { color: colors.textSecondary }]}>{info.subtitle}</Text>
                                </View>
                                {last && (
                                    <View style={[styles.lastBadge, { backgroundColor: SEVERITY_COLOR[last.severity] + '22' }]}>
                                        <Text style={[styles.lastBadgeText, { color: SEVERITY_COLOR[last.severity] }]}>
                                            {severityLabel(last.severity)}
                                        </Text>
                                    </View>
                                )}
                                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        );
                    })}

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>History</Text>
                    {historyLoading ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : history.length === 0 ? (
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No check-ins yet.</Text>
                    ) : (
                        <View style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            {history.map((h, i) => (
                                <View
                                    key={`${h.type}-${h.createdAt}-${i}`}
                                    style={[
                                        styles.historyRow,
                                        i < history.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                                    ]}
                                >
                                    <View style={[styles.historyDot, { backgroundColor: SEVERITY_COLOR[h.severity] }]} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.historyType, { color: colors.text }]}>
                                            {INSTRUMENTS[h.type].title} · {severityLabel(h.severity)}
                                        </Text>
                                        <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                                            {new Date(h.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <Text style={[styles.historyScore, { color: colors.textSecondary }]}>{h.totalScore}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}

            {screen === 'form' && activeType && (
                <View style={styles.formWrap}>
                    <ScrollView contentContainerStyle={styles.formScrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <Text style={[styles.formIntro, { color: colors.textSecondary }]}>
                            Over the last 2 weeks, how often have you been bothered by:
                        </Text>
                        <Text style={[styles.questionBig, { color: colors.text }]}>{questions[qIndex]}</Text>

                        <View style={styles.answerList}>
                            {ANSWER_OPTIONS.map(opt => {
                                const selected = currentAnswer === opt.value;
                                return (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[
                                            styles.answerRow,
                                            { backgroundColor: colors.surface, borderColor: colors.border },
                                            selected && { borderColor: colors.primary, backgroundColor: colors.primary + '14' },
                                        ]}
                                        onPress={() => setAnswers(prev => prev.map((a, i) => i === qIndex ? opt.value : a))}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.radioOuter, { borderColor: selected ? colors.primary : colors.border }]}>
                                            {selected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                                        </View>
                                        <Text style={[styles.answerText, { color: selected ? colors.primary : colors.text }]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>

                    <View style={styles.formFooter}>
                        <TouchableOpacity
                            style={[styles.submitBtn, { backgroundColor: colors.primary }, !canContinue && styles.submitBtnDisabled]}
                            onPress={handleContinue}
                            disabled={!canContinue || submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitBtnText}>{isLastQuestion ? 'Submit' : 'Continue'}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {screen === 'result' && result && (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.resultHeading, { color: colors.text }]}>Check-in complete</Text>
                    <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={[styles.resultBadge, { backgroundColor: SEVERITY_COLOR[result.severity] + '22' }]}>
                            <Text style={[styles.resultBadgeText, { color: SEVERITY_COLOR[result.severity] }]}>
                                {severityLabel(result.severity)}
                            </Text>
                        </View>
                        <Text style={[styles.resultScore, { color: colors.text }]}>{result.totalScore}</Text>
                        <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                            {INSTRUMENTS[result.type].title} score
                        </Text>
                    </View>

                    {flaggedSelfHarm && (
                        <View style={[styles.supportCard, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
                            <Ionicons name="heart-outline" size={18} color="#DC2626" />
                            <Text style={styles.supportText}>
                                It sounds like things have been really hard lately. Please consider reaching out
                                to someone you trust or a mental health professional.
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                        onPress={backToMenu}
                    >
                        <Text style={styles.submitBtnText}>Done</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '800' },
    qCounterWrap: { width: 40, alignItems: 'flex-end' },
    qCounter: { fontSize: 12, fontWeight: '700' },

    progressTrack: { height: 4, marginHorizontal: 20, borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 2 },

    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    disclaimer: { fontSize: 12, lineHeight: 18, marginBottom: 18 },

    instrumentCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 12,
    },
    instrumentIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    instrumentTitle: { fontSize: 15, fontWeight: '700' },
    instrumentSubtitle: { fontSize: 12, marginTop: 2 },
    lastBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
    lastBadgeText: { fontSize: 10, fontWeight: '800' },

    sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 12, marginBottom: 10 },
    emptyText: { fontSize: 13 },
    historyCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
    historyDot: { width: 8, height: 8, borderRadius: 4 },
    historyType: { fontSize: 13, fontWeight: '700' },
    historyDate: { fontSize: 11, marginTop: 2 },
    historyScore: { fontSize: 14, fontWeight: '800' },

    formWrap: { flex: 1 },
    formScrollContent: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24 },
    formIntro: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
    questionBig: { fontSize: 22, fontWeight: '800', lineHeight: 30, marginBottom: 28 },

    answerList: { gap: 10 },
    answerRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 16,
    },
    radioOuter: {
        width: 22, height: 22, borderRadius: 11, borderWidth: 2,
        alignItems: 'center', justifyContent: 'center',
    },
    radioInner: { width: 11, height: 11, borderRadius: 5.5 },
    answerText: { fontSize: 15, fontWeight: '600', flex: 1 },

    formFooter: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },

    submitBtn: { borderRadius: 16, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    submitBtnDisabled: { opacity: 0.4 },
    submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    resultHeading: { fontSize: 22, fontWeight: '800', marginBottom: 16, marginTop: 4 },
    resultCard: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: 'center', marginBottom: 16 },
    resultBadge: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14 },
    resultBadgeText: { fontSize: 13, fontWeight: '800' },
    resultScore: { fontSize: 40, fontWeight: '900' },
    resultLabel: { fontSize: 13, marginTop: 4 },

    supportCard: {
        flexDirection: 'row', gap: 10, alignItems: 'flex-start',
        borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16,
    },
    supportText: { flex: 1, color: '#991B1B', fontSize: 13, lineHeight: 19 },
});
