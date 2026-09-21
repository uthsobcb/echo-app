import { useStorage } from '@/context/StorageContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PLAN_INFO: Record<string, { label: string; blurb: string; features: string[] }> = {
    free: {
        label: 'Free',
        blurb: 'Everything you need to start journaling with Echo.',
        features: ['Unlimited journal entries', 'AI mood insights', 'Streaks, XP & badges', 'Box breathing sessions'],
    },
    plus: {
        label: 'Plus',
        blurb: 'The full Echo experience.',
        features: ['Everything in Free', 'Priority AI responses', 'Extended insights history', 'Weekly report emails'],
    },
    admin: {
        label: 'Admin',
        blurb: 'Internal team access.',
        features: ['Everything in Plus', 'Admin dashboard access', 'Community moderation tools'],
    },
};

export default function Subscription() {
    const router = useRouter();
    const { user } = useStorage();
    const { colors } = useTheme();

    const tier = user.subscription ?? 'free';
    const plan = PLAN_INFO[tier] ?? PLAN_INFO.free;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Subscription</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.planBadge, { backgroundColor: colors.primary + '1A' }]}>
                        <Text style={[styles.planBadgeText, { color: colors.primary }]}>{plan.label} Plan</Text>
                    </View>
                    <Text style={[styles.planBlurb, { color: colors.textSecondary }]}>{plan.blurb}</Text>

                    <View style={styles.featureList}>
                        {plan.features.map((f) => (
                            <View key={f} style={styles.featureRow}>
                                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                                <Text style={[styles.featureText, { color: colors.text }]}>{f}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <Text style={[styles.note, { color: colors.textSecondary }]}>
                    Plan management and billing aren't available in the app yet — reach out to support if you'd like to change your plan.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        paddingHorizontal: 16, paddingVertical: 12,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '800' },

    content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },

    planCard: { borderWidth: 1, borderRadius: 20, padding: 20, marginBottom: 20 },
    planBadge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 10 },
    planBadgeText: { fontSize: 13, fontWeight: '800' },
    planBlurb: { fontSize: 14, lineHeight: 20, marginBottom: 18 },

    featureList: { gap: 12 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    featureText: { fontSize: 14, fontWeight: '600' },

    note: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
