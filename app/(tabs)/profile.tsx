import { useStorage } from '@/context/StorageContext';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Switch, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ALL_BADGES = [
    { id: 'Echo Sunshine', name: 'Echo Sunshine', icon: 'sun-wireless', description: 'Unlocked at 1 entry. You started your journey!', color: '#FCD34D', required: 1 },
    { id: 'Pen Whisperer', name: 'Pen Whisperer', icon: 'feather', description: 'Unlocked at 7 entries. Your thoughts find their voice.', color: '#60A5FA', required: 7 },
    { id: 'Mindful Scribe', name: 'Mindful Scribe', icon: 'book-open-variant', description: 'Unlocked at 30 entries. A month of deep reflection.', color: '#34D399', required: 30 },
    { id: 'Thought Architect', name: 'Thought Architect', icon: 'オフィス', description: 'Unlocked at 45 entries. Building a fortress of self-awareness.', color: '#A78BFA', required: 45 },
    { id: 'Guardian of Inked Wisdom', name: 'Guardian of Inked Wisdom', icon: 'shield-star', description: 'Unlocked at 60 entries. You are a legendary chronicler.', color: '#F87171', required: 60 },
];

function BadgeDetailModal({ badge, isEarned, onClose, entriesCount, colors }: { badge: typeof ALL_BADGES[0] | null, isEarned: boolean, onClose: () => void, entriesCount: number, colors: ThemeColors }) {
    if (!badge) return null;
    return (
        <Modal animationType="fade" transparent visible={!!badge} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                    <View style={[styles.modalIconBg, { backgroundColor: isEarned ? badge.color + '20' : colors.surfaceSecondary }]}>
                        <MaterialCommunityIcons name={badge.icon as any} size={48} color={isEarned ? badge.color : colors.textSecondary} />
                    </View>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{badge.name}</Text>
                    <View style={[styles.earnStatus, { backgroundColor: isEarned ? '#ECFDF5' : '#FFF7ED' }]}>
                        <Text style={[styles.earnStatusText, { color: isEarned ? '#059669' : '#C2410C' }]}>
                            {isEarned ? 'EARNED' : `LOCKED`}
                        </Text>
                    </View>
                    <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>{badge.description}</Text>
                    {!isEarned && (
                        <View style={styles.progressRow}>
                            <View style={[styles.progressBarBase, { backgroundColor: colors.borderSecondary }]}>
                                <View style={[styles.progressBarFill, { width: `${Math.min(100, (entriesCount / badge.required) * 100)}%`, backgroundColor: badge.color }]} />
                            </View>
                            <Text style={[styles.progressText, { color: colors.text }]}>{entriesCount}/{badge.required}</Text>
                        </View>
                    )}
                    <TouchableOpacity style={[styles.modalClose, { backgroundColor: colors.primary }]} onPress={onClose}>
                        <Text style={styles.modalCloseText}>Got it</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

export default function Profile() {
    const { user, logout, stats, appMode } = useStorage();
    const { colors, isDark, setDarkMode } = useTheme();
    const isLocal = appMode === 'local';
    const [notifications, setNotifications] = useState(true);
    const [reminder, setReminder] = useState(true);
    const [selectedBadge, setSelectedBadge] = useState<typeof ALL_BADGES[0] | null>(null);

    const earnedBadges = user.badge || [];
    const entriesCount = stats.entries || 0;

    const switchProps = (value: boolean, onChange: (v: boolean) => void) => ({
        value,
        onValueChange: onChange,
        trackColor: { false: colors.border, true: colors.primary + '80' as any },
        thumbColor: value ? colors.primary : colors.textSecondary,
    });

    const dynamicStyles = useMemo(() => {
        const safe: ViewStyle = { flex: 1, backgroundColor: colors.background };
        const pageTitle: TextStyle = { fontSize: 26, fontWeight: '800', color: colors.text };
        const localBanner: ViewStyle = {
            marginHorizontal: 16,
            marginBottom: 12,
            backgroundColor: colors.surfaceSecondary,
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
            padding: 14,
        };
        const localTitle: TextStyle = { fontSize: 14, fontWeight: '700', color: colors.primary };
        const localSub: TextStyle = { fontSize: 12, color: colors.textSecondary, marginTop: 2 };
        const sectionLabel: TextStyle = {
            fontSize: 11,
            fontWeight: '700',
            color: colors.textSecondary,
            letterSpacing: 1.2,
            marginHorizontal: 20,
            marginTop: 20,
            marginBottom: 8,
        };
        const card: ViewStyle = {
            marginHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 18,
            overflow: 'hidden' as const,
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 1,
            borderWidth: 1,
            borderColor: colors.border,
        };
        const settingRow: ViewStyle = {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
        };
        const settingIcon: ViewStyle = {
            width: 36,
            height: 36,
            backgroundColor: colors.surfaceSecondary,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
        };
        const settingTitle: TextStyle = { fontSize: 15, fontWeight: '600', color: colors.text };
        const settingSubtitle: TextStyle = { fontSize: 12, color: colors.textSecondary, marginTop: 1 };
        const divider: ViewStyle = { height: 1, backgroundColor: colors.borderSecondary, marginLeft: 64 };
        const footer: TextStyle = { textAlign: 'center' as const, color: colors.textSecondary, fontSize: 12, marginTop: 24 };
        const badgeItemName: TextStyle = {
            fontSize: 11,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center' as const,
        };
        return { safe, pageTitle, localBanner, localTitle, localSub, sectionLabel, card, settingRow, settingIcon, settingTitle, settingSubtitle, divider, footer, badgeItemName };
    }, [colors]);

    return (
        <SafeAreaView style={dynamicStyles.safe}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.pageHeader}>
                    <Text style={dynamicStyles.pageTitle}>Profile</Text>
                </View>

                {isLocal && (
                    <View style={dynamicStyles.localBanner}>
                        <Ionicons name="cloud-offline-outline" size={22} color={colors.primary} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={dynamicStyles.localTitle}>Local Account</Text>
                            <Text style={dynamicStyles.localSub}>Data is saved on this device only.</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.syncBtn, { backgroundColor: colors.primary }]}
                            onPress={() => { logout(); router.replace('/(auth)/signin'); }}
                        >
                            <Text style={styles.syncBtnText}>Sync</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <LinearGradient colors={['#4F6BFF', '#7B3FE4']} style={styles.profileCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <View style={styles.avatarWrap}>
                        <Image
                            source={user.image ? { uri: user.image } : user.avatar ? { uri: user.avatar } : require('../../assets/images/avatar.png')}
                            style={styles.avatarImg}
                        />
                        <TouchableOpacity style={styles.cameraBadge}>
                            <Feather name="camera" size={13} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.profileName}>{user.name}</Text>
                    <Text style={styles.profileEmail}>{isLocal ? 'Offline Mode' : (user.email || 'Cloud Member')}</Text>

                    {!isLocal && user.subscription && (
                        <View style={styles.subPill}>
                            <Text style={styles.subPillText}>{user.subscription.toUpperCase()} MEMBER</Text>
                        </View>
                    )}

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{entriesCount}</Text>
                            <Text style={styles.statLabel}>Entries</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.streak}</Text>
                            <Text style={styles.statLabel}>Streak</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{earnedBadges.length}</Text>
                            <Text style={styles.statLabel}>Awards</Text>
                        </View>
                    </View>
                </LinearGradient>

                <Text style={dynamicStyles.sectionLabel}>BADGE SHOWCASE</Text>
                <View style={dynamicStyles.card}>
                    <View style={styles.badgeGrid}>
                        {ALL_BADGES.map((badge) => {
                            const isEarned = earnedBadges.includes(badge.id);
                            return (
                                <TouchableOpacity
                                    key={badge.id}
                                    style={styles.badgeItem}
                                    onPress={() => setSelectedBadge(badge)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[
                                        styles.badgeIconBg,
                                        { backgroundColor: isEarned ? badge.color + '20' : colors.surfaceSecondary }
                                    ]}>
                                        <MaterialCommunityIcons
                                            name={badge.icon as any}
                                            size={28}
                                            color={isEarned ? badge.color : colors.textSecondary}
                                        />
                                        {!isEarned && (
                                            <View style={styles.lockOverlay}>
                                                <Ionicons name="lock-closed" size={10} color="#fff" />
                                            </View>
                                        )}
                                    </View>
                                    <Text
                                        style={[styles.badgeItemName, dynamicStyles.badgeItemName, !isEarned && { color: colors.textSecondary }]}
                                        numberOfLines={1}
                                    >
                                        {badge.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <BadgeDetailModal
                    badge={selectedBadge}
                    isEarned={selectedBadge ? earnedBadges.includes(selectedBadge.id) : false}
                    entriesCount={entriesCount}
                    onClose={() => setSelectedBadge(null)}
                    colors={colors}
                />

                <Text style={dynamicStyles.sectionLabel}>ACCOUNT</Text>
                <View style={dynamicStyles.card}>
                    <View style={dynamicStyles.settingRow}>
                        <View style={dynamicStyles.settingIcon}><Ionicons name="person-outline" size={19} color={colors.primary} /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={dynamicStyles.settingTitle}>Edit Profile</Text>
                            <Text style={dynamicStyles.settingSubtitle}>Update your personal information</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </View>
                    <View style={dynamicStyles.divider} />
                    <View style={dynamicStyles.settingRow}>
                        <View style={dynamicStyles.settingIcon}><Ionicons name="shield-checkmark-outline" size={19} color={colors.primary} /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={dynamicStyles.settingTitle}>Privacy & Security</Text>
                            <Text style={dynamicStyles.settingSubtitle}>Manage your data</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </View>
                    <View style={dynamicStyles.divider} />
                    <View style={dynamicStyles.settingRow}>
                        <View style={dynamicStyles.settingIcon}><Ionicons name="card-outline" size={19} color={colors.primary} /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={dynamicStyles.settingTitle}>Subscription</Text>
                            <Text style={dynamicStyles.settingSubtitle}>Pro Plan · Renews Jan 2027</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </View>
                </View>

                <Text style={dynamicStyles.sectionLabel}>PREFERENCES</Text>
                <View style={dynamicStyles.card}>
                    <View style={dynamicStyles.settingRow}>
                        <View style={dynamicStyles.settingIcon}><Ionicons name="notifications-outline" size={19} color={colors.primary} /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={dynamicStyles.settingTitle}>Notifications</Text>
                        </View>
                        <Switch {...switchProps(notifications, setNotifications)} />
                    </View>
                    <View style={dynamicStyles.divider} />
                    <View style={dynamicStyles.settingRow}>
                        <View style={dynamicStyles.settingIcon}><MaterialCommunityIcons name="moon-waning-crescent" size={19} color={colors.primary} /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={dynamicStyles.settingTitle}>Dark Mode</Text>
                        </View>
                        <Switch {...switchProps(isDark, setDarkMode)} />
                    </View>
                    <View style={dynamicStyles.divider} />
                    <View style={dynamicStyles.settingRow}>
                        <View style={dynamicStyles.settingIcon}><Ionicons name="alarm-outline" size={19} color={colors.primary} /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={dynamicStyles.settingTitle}>Daily Reminder</Text>
                            <Text style={dynamicStyles.settingSubtitle}>Remind me to journal</Text>
                        </View>
                        <Switch {...switchProps(reminder, setReminder)} />
                    </View>
                </View>

                <Text style={dynamicStyles.sectionLabel}>SUPPORT</Text>
                <View style={dynamicStyles.card}>
                    <View style={dynamicStyles.settingRow}>
                        <View style={dynamicStyles.settingIcon}><Ionicons name="help-circle-outline" size={19} color={colors.primary} /></View>
                        <View style={{ flex: 1 }}><Text style={dynamicStyles.settingTitle}>Help Center</Text></View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </View>
                    <View style={dynamicStyles.divider} />
                    <View style={dynamicStyles.settingRow}>
                        <View style={dynamicStyles.settingIcon}><Ionicons name="chatbubble-ellipses-outline" size={19} color={colors.primary} /></View>
                        <View style={{ flex: 1 }}><Text style={dynamicStyles.settingTitle}>Contact Us</Text></View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </View>
                    <View style={dynamicStyles.divider} />
                    <View style={dynamicStyles.settingRow}>
                        <View style={dynamicStyles.settingIcon}><Ionicons name="star-outline" size={19} color={colors.primary} /></View>
                        <View style={{ flex: 1 }}><Text style={dynamicStyles.settingTitle}>Rate the App</Text></View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() => { logout(); router.replace('/(auth)/signin'); }}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={dynamicStyles.footer}>Made with 💙 by Echo Team · v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollContent: { paddingBottom: 40 },
    pageHeader: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 },
    syncBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
    syncBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    profileCard: { marginHorizontal: 16, borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 8 },
    avatarWrap: { position: 'relative', marginBottom: 12 },
    avatarImg: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
    cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 14, padding: 6 },
    profileName: { fontSize: 20, fontWeight: '800', color: '#fff' },
    profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
    subPill: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
    subPillText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    statsRow: { flexDirection: 'row', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', width: '100%' },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 12, justifyContent: 'center' },
    badgeItem: { width: '30%', alignItems: 'center', marginBottom: 10 },
    badgeIconBg: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 8, position: 'relative' },
    lockOverlay: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#B0BAD0', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
    badgeItemName: { textAlign: 'center' },
    logoutBtn: { marginHorizontal: 16, marginTop: 24, backgroundColor: '#FEF2F2', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 8 },
    logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
    modalCard: { width: '80%', borderRadius: 24, padding: 24, alignItems: 'center' },
    modalIconBg: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
    earnStatus: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 16 },
    earnStatusText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    modalDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    modalClose: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 16 },
    modalCloseText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', marginBottom: 20 },
    progressBarBase: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },
    progressText: { fontSize: 12, fontWeight: '700', minWidth: 40 },
});