import { useStorage } from '@/context/StorageContext';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ALL_BADGES = [
    { id: 'Echo Sunshine', name: 'Echo Sunshine', icon: 'sun-wireless', description: 'Unlocked at 1 entry. You started your journey!', color: '#FCD34D', required: 1 },
    { id: 'Pen Whisperer', name: 'Pen Whisperer', icon: 'feather', description: 'Unlocked at 7 entries. Your thoughts find their voice.', color: '#60A5FA', required: 7 },
    { id: 'Mindful Scribe', name: 'Mindful Scribe', icon: 'book-open-variant', description: 'Unlocked at 30 entries. A month of deep reflection.', color: '#34D399', required: 30 },
    { id: 'Thought Architect', name: 'Thought Architect', icon: 'オフィス', description: 'Unlocked at 45 entries. Building a fortress of self-awareness.', color: '#A78BFA', required: 45 },
    { id: 'Guardian of Inked Wisdom', name: 'Guardian of Inked Wisdom', icon: 'shield-star', description: 'Unlocked at 60 entries. You are a legendary chronicler.', color: '#F87171', required: 60 },
];

function BadgeDetailModal({ badge, isEarned, onClose, entriesCount }: { badge: typeof ALL_BADGES[0] | null, isEarned: boolean, onClose: () => void, entriesCount: number }) {
    if (!badge) return null;
    const remaining = Math.max(0, badge.required - entriesCount);
    return (
        <Modal animationType="fade" transparent visible={!!badge} onRequestClose={onClose}>
            <View style={s.modalOverlay}>
                <View style={s.modalCard}>
                    <View style={[s.modalIconBg, { backgroundColor: isEarned ? badge.color + '20' : '#F5F6FA' }]}>
                        <MaterialCommunityIcons name={badge.icon as any} size={48} color={isEarned ? badge.color : '#B0BAD0'} />
                    </View>
                    <Text style={s.modalTitle}>{badge.name}</Text>
                    <View style={[s.earnStatus, { backgroundColor: isEarned ? '#ECFDF5' : '#FFF7ED' }]}>
                        <Text style={[s.earnStatusText, { color: isEarned ? '#059669' : '#C2410C' }]}>
                            {isEarned ? 'EARNED' : `LOCKED`}
                        </Text>
                    </View>
                    <Text style={s.modalDesc}>{badge.description}</Text>
                    {!isEarned && (
                        <View style={s.progressRow}>
                            <View style={s.progressBarBase}>
                                <View style={[s.progressBarFill, { width: `${Math.min(100, (entriesCount / badge.required) * 100)}%`, backgroundColor: badge.color }]} />
                            </View>
                            <Text style={s.progressText}>{entriesCount}/{badge.required}</Text>
                        </View>
                    )}
                    <TouchableOpacity style={s.modalClose} onPress={onClose}>
                        <Text style={s.modalCloseText}>Got it</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

function SettingRow({
    icon,
    title,
    subtitle,
    rightElement,
    onPress,
    showArrow = true,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    rightElement?: React.ReactNode;
    onPress?: () => void;
    showArrow?: boolean;
}) {
    return (
        <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.settingIcon}>{icon}</View>
            <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {rightElement}
            {showArrow && !rightElement && <Ionicons name="chevron-forward" size={18} color="#B0BAD0" />}
        </TouchableOpacity>
    );
}

function SectionLabel({ text }: { text: string }) {
    return <Text style={styles.sectionLabel}>{text}</Text>;
}

export default function Profile() {
    const { user, logout, stats, appMode } = useStorage();
    const isLocal = appMode === 'local';
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [reminder, setReminder] = useState(true);
    const [selectedBadge, setSelectedBadge] = useState<typeof ALL_BADGES[0] | null>(null);

    const earnedBadges = user.badge || [];
    const entriesCount = stats.entries || 0;

    const switchProps = (value: boolean, onChange: (v: boolean) => void) => ({
        value,
        onValueChange: onChange,
        trackColor: { false: '#E5E8F0', true: '#A5B4FF' },
        thumbColor: value ? '#4F6BFF' : '#B0BAD0',
    });

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.pageHeader}>
                    <Text style={styles.pageTitle}>Profile</Text>
                </View>

                {/* Local mode banner */}
                {isLocal && (
                    <View style={styles.localBanner}>
                        <Ionicons name="cloud-offline-outline" size={22} color="#4F6BFF" />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.localTitle}>Local Account</Text>
                            <Text style={styles.localSub}>Data is saved on this device only.</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.syncBtn}
                            onPress={() => { logout(); router.replace('/(auth)/signin'); }}
                        >
                            <Text style={styles.syncBtnText}>Sync</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Profile Card */}
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

                    {/* Stats */}
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

                {/* Badge Showcase */}
                <SectionLabel text="BADGE SHOWCASE" />
                <View style={styles.card}>
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
                                        { backgroundColor: isEarned ? badge.color + '20' : '#F5F6FA' }
                                    ]}>
                                        <MaterialCommunityIcons
                                            name={badge.icon as any}
                                            size={28}
                                            color={isEarned ? badge.color : '#B0BAD0'}
                                        />
                                        {!isEarned && (
                                            <View style={styles.lockOverlay}>
                                                <Ionicons name="lock-closed" size={10} color="#fff" />
                                            </View>
                                        )}
                                    </View>
                                    <Text
                                        style={[styles.badgeItemName, !isEarned && { color: '#B0BAD0' }]}
                                        numberOfLines={1}
                                    >
                                        {badge.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Badge Detail Modal */}
                <BadgeDetailModal
                    badge={selectedBadge}
                    isEarned={selectedBadge ? earnedBadges.includes(selectedBadge.id) : false}
                    entriesCount={entriesCount}
                    onClose={() => setSelectedBadge(null)}
                />


                {/* Account */}
                <SectionLabel text="ACCOUNT" />
                <View style={styles.card}>
                    <SettingRow
                        icon={<Ionicons name="person-outline" size={19} color="#4F6BFF" />}
                        title="Edit Profile"
                        subtitle="Update your personal information"
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon={<Ionicons name="shield-checkmark-outline" size={19} color="#4F6BFF" />}
                        title="Privacy & Security"
                        subtitle="Manage your data"
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon={<Ionicons name="card-outline" size={19} color="#4F6BFF" />}
                        title="Subscription"
                        subtitle="Pro Plan · Renews Jan 2027"
                    />
                </View>

                {/* Preferences */}
                <SectionLabel text="PREFERENCES" />
                <View style={styles.card}>
                    <SettingRow
                        icon={<Ionicons name="notifications-outline" size={19} color="#4F6BFF" />}
                        title="Notifications"
                        showArrow={false}
                        rightElement={<Switch {...switchProps(notifications, setNotifications)} />}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon={<MaterialCommunityIcons name="moon-waning-crescent" size={19} color="#4F6BFF" />}
                        title="Dark Mode"
                        showArrow={false}
                        rightElement={<Switch {...switchProps(darkMode, setDarkMode)} />}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon={<Ionicons name="alarm-outline" size={19} color="#4F6BFF" />}
                        title="Daily Reminder"
                        subtitle="Remind me to journal"
                        showArrow={false}
                        rightElement={<Switch {...switchProps(reminder, setReminder)} />}
                    />
                </View>

                {/* Support */}
                <SectionLabel text="SUPPORT" />
                <View style={styles.card}>
                    <SettingRow icon={<Ionicons name="help-circle-outline" size={19} color="#4F6BFF" />} title="Help Center" />
                    <View style={styles.divider} />
                    <SettingRow icon={<Ionicons name="chatbubble-ellipses-outline" size={19} color="#4F6BFF" />} title="Contact Us" />
                    <View style={styles.divider} />
                    <SettingRow icon={<Ionicons name="star-outline" size={19} color="#4F6BFF" />} title="Rate the App" />
                </View>

                {/* Logout */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() => { logout(); router.replace('/(auth)/signin'); }}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.footer}>Made with 💙 by Echo Team · v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F5F6FA' },
    scrollContent: { paddingBottom: 40 },

    pageHeader: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 },
    pageTitle: { fontSize: 26, fontWeight: '800', color: '#1A1D2E' },

    localBanner: {
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: '#EEF1FF',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    localTitle: { fontSize: 14, fontWeight: '700', color: '#4F6BFF' },
    localSub: { fontSize: 12, color: '#7A8499', marginTop: 2 },
    syncBtn: { backgroundColor: '#4F6BFF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
    syncBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    profileCard: {
        marginHorizontal: 16,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarWrap: { position: 'relative', marginBottom: 12 },
    avatarImg: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 14,
        padding: 6,
    },
    profileName: { fontSize: 20, fontWeight: '800', color: '#fff' },
    profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
    subPill: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginTop: 8,
    },
    subPillText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    statsRow: {
        flexDirection: 'row',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
        width: '100%',
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

    badgesRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, marginBottom: 8, gap: 8 },
    badge: { backgroundColor: '#FEF3C7', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
    badgeText: { fontSize: 12, fontWeight: '700', color: '#92400E' },

    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#7A8499',
        letterSpacing: 1.2,
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 8,
    },
    card: {
        marginHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    settingIcon: {
        width: 36,
        height: 36,
        backgroundColor: '#EEF1FF',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    settingText: { flex: 1 },
    settingTitle: { fontSize: 15, fontWeight: '600', color: '#1A1D2E' },
    settingSubtitle: { fontSize: 12, color: '#7A8499', marginTop: 1 },
    divider: { height: 1, backgroundColor: '#F0F2F8', marginLeft: 64 },

    logoutBtn: {
        marginHorizontal: 16,
        marginTop: 24,
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        gap: 8,
    },
    logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },

    footer: { textAlign: 'center', color: '#B0BAD0', fontSize: 12, marginTop: 24 },

    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        gap: 12,
        justifyContent: 'center',
    },
    badgeItem: {
        width: '30%',
        alignItems: 'center',
        marginBottom: 10,
    },
    badgeIconBg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        position: 'relative',
    },
    lockOverlay: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#B0BAD0',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeItemName: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1A1D2E',
        textAlign: 'center',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCard: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
    },
    modalIconBg: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1A1D2E',
        marginBottom: 8,
    },
    earnStatus: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 16,
    },
    earnStatusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    modalDesc: {
        fontSize: 14,
        color: '#7A8499',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    modalClose: {
        backgroundColor: '#1A1D2E',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 16,
    },
    modalCloseText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        marginBottom: 20,
    },
    progressBarBase: {
        flex: 1,
        height: 6,
        backgroundColor: '#F0F2F8',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1A1D2E',
        minWidth: 40,
    },
});

const s = styles;