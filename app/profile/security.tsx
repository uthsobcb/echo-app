import { Toast } from '@/component/Toast';
import { useStorage } from '@/context/StorageContext';
import { useTheme } from '@/context/ThemeContext';
import { logger } from '@/service/logger';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacySecurity() {
    const router = useRouter();
    const { appMode, updateUser } = useStorage();
    const { colors } = useTheme();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);

    const canSubmit = currentPassword.length > 0 && newPassword.length >= 6 && newPassword === confirmPassword;

    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            Toast.warning('New password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Toast.warning('New passwords don\'t match.');
            return;
        }
        setSaving(true);
        try {
            await updateUser({ currentPassword, newPassword });
            Toast.success('Password updated');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (e) {
            logger.error('Failed to change password', e);
            Toast.error(e instanceof Error ? e.message : 'Could not change your password');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy & Security</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name={appMode === 'local' ? 'phone-portrait-outline' : 'cloud-outline'} size={18} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        {appMode === 'local'
                            ? 'You\'re in offline mode — your entries are stored only on this device and never leave it.'
                            : 'Your entries are stored on Echo\'s servers so you can access them from any device, sent over an encrypted connection.'}
                    </Text>
                </View>

                {appMode === 'api' ? (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Change Password</Text>
                        <View style={styles.fieldWrap}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Current Password</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry
                                placeholder="••••••••"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                        <View style={styles.fieldWrap}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>New Password</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                placeholder="At least 6 characters"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                        <View style={styles.fieldWrap}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm New Password</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                placeholder="••••••••"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.saveBtn,
                                { backgroundColor: colors.primary },
                                (!canSubmit || saving) && { opacity: 0.5 },
                            ]}
                            onPress={handleChangePassword}
                            disabled={!canSubmit || saving}
                        >
                            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Update Password</Text>}
                        </TouchableOpacity>
                    </>
                ) : (
                    <Text style={[styles.localNote, { color: colors.textSecondary }]}>
                        Passwords only apply to cloud accounts. Sign in with an account to change one.
                    </Text>
                )}

                <TouchableOpacity
                    style={[styles.supportRow, { borderTopColor: colors.border }]}
                    onPress={() => Toast.info('Email us to delete your account and data — this isn\'t self-serve yet.')}
                >
                    <Text style={[styles.supportRowText, { color: colors.textSecondary }]}>Delete my account</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
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

    content: { paddingHorizontal: 20, paddingBottom: 40 },

    infoCard: {
        flexDirection: 'row', gap: 10, alignItems: 'flex-start',
        borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 8, marginBottom: 24,
    },
    infoText: { flex: 1, fontSize: 13, lineHeight: 19 },

    sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 14 },
    fieldWrap: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
    input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },

    saveBtn: { borderRadius: 16, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    localNote: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8 },

    supportRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 24, marginTop: 32,
    },
    supportRowText: { fontSize: 14, fontWeight: '600' },
});
