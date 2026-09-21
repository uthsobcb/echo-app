import { Toast } from '@/component/Toast';
import { useStorage } from '@/context/StorageContext';
import { useTheme } from '@/context/ThemeContext';
import { logger } from '@/service/logger';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfile() {
    const router = useRouter();
    const { user, appMode, updateUser } = useStorage();
    const { colors } = useTheme();

    const [name, setName] = useState(user.name ?? '');
    const [avatarUri, setAvatarUri] = useState<string | undefined>(user.image || user.avatar);
    const [avatarBase64, setAvatarBase64] = useState<string | undefined>(undefined);
    const [wantsWeeklyReport, setWantsWeeklyReport] = useState(!!user.wantsWeeklyReport);
    const [saving, setSaving] = useState(false);

    const handlePickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Toast.warning('Photo library permission is required to change your avatar.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: appMode === 'api',
        });
        if (!result.canceled && result.assets?.[0]) {
            setAvatarUri(result.assets[0].uri);
            if (result.assets[0].base64) {
                setAvatarBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
            }
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Toast.warning('Name can\'t be empty.');
            return;
        }
        setSaving(true);
        try {
            if (appMode === 'api') {
                await updateUser({
                    name: name.trim(),
                    wantsWeeklyReport,
                    ...(avatarBase64 ? { image: avatarBase64 } : {}),
                });
            } else {
                await updateUser({
                    name: name.trim(),
                    wantsWeeklyReport,
                    ...(avatarUri ? { avatar: avatarUri } : {}),
                });
            }
            Toast.success('Profile updated');
            router.back();
        } catch (e) {
            logger.error('Failed to update profile', e);
            Toast.error(e instanceof Error ? e.message : 'Could not save your profile');
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
                <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrap} activeOpacity={0.8}>
                    {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarFallback, { backgroundColor: colors.surfaceSecondary }]}>
                            <Text style={[styles.avatarFallbackText, { color: colors.primary }]}>
                                {name?.charAt(0)?.toUpperCase() ?? '?'}
                            </Text>
                        </View>
                    )}
                    <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                        <Ionicons name="camera" size={14} color="#fff" />
                    </View>
                </TouchableOpacity>

                <View style={styles.fieldWrap}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Your name"
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                {appMode === 'api' && (
                    <View style={styles.fieldWrap}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
                        <View style={[styles.input, styles.inputDisabled, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                            <Text style={{ color: colors.textSecondary }}>{user.email}</Text>
                        </View>
                    </View>
                )}

                <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.rowTitle, { color: colors.text }]}>Weekly Report</Text>
                        <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Get a summary email each week</Text>
                    </View>
                    <Switch
                        value={wantsWeeklyReport}
                        onValueChange={setWantsWeeklyReport}
                        trackColor={{ false: colors.border, true: colors.primary + '80' as any }}
                        thumbColor={wantsWeeklyReport ? colors.primary : colors.textSecondary}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
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

    content: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },

    avatarWrap: { marginTop: 12, marginBottom: 28 },
    avatar: { width: 96, height: 96, borderRadius: 48 },
    avatarFallback: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
    avatarFallbackText: { fontSize: 32, fontWeight: '800' },
    avatarEditBadge: {
        position: 'absolute', bottom: 0, right: 0,
        width: 30, height: 30, borderRadius: 15, borderWidth: 3,
        alignItems: 'center', justifyContent: 'center',
    },

    fieldWrap: { width: '100%', marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
    input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
    inputDisabled: { justifyContent: 'center' },

    row: {
        width: '100%', flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderRadius: 14, padding: 16, marginTop: 4, marginBottom: 24,
    },
    rowTitle: { fontSize: 15, fontWeight: '700' },
    rowSub: { fontSize: 12, marginTop: 2 },

    saveBtn: { width: '100%', borderRadius: 16, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
