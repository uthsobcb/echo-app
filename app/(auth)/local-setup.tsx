import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStorage } from '../../context/StorageContext';

const AVATARS = ['😊', '😎', '🤗', '🎨', '🌙', '🌿', '⚡', '🎭', '🧠', '🌊'];

export default function LocalSetup() {
    const router = useRouter();
    const { loginAsLocal } = useStorage();
    const [name, setName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [focused, setFocused] = useState(false);

    const handleStartJourney = async () => {
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            await loginAsLocal({
                name: name.trim(),
                avatar: selectedAvatar,
            });
            router.replace('/(tabs)');
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={s.safe}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={s.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Hero */}
                    <LinearGradient colors={['#4F6BFF', '#7B3FE4']} style={s.hero}>
                        <View style={s.avatarCircle}>
                            <Text style={s.avatarEmoji}>{selectedAvatar}</Text>
                        </View>
                        <Text style={s.heroTitle}>Hey there! 👋</Text>
                        <Text style={s.heroSub}>Set up your private local journal.</Text>
                        <Text style={s.heroSub}>Your data stays only on this device.</Text>
                    </LinearGradient>

                    <View style={s.card}>
                        {/* Name */}
                        <Text style={s.label}>What should we call you?</Text>
                        <View style={[s.inputWrap, focused && s.inputFocused]}>
                            <MaterialCommunityIcons name="account-outline" size={20} color={focused ? '#4F6BFF' : '#B0BAD0'} />
                            <TextInput
                                style={s.input}
                                placeholder="Your name"
                                placeholderTextColor="#B0BAD0"
                                value={name}
                                onChangeText={setName}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                autoFocus
                                returnKeyType="done"
                            />
                        </View>

                        {/* Avatar picker */}
                        <Text style={[s.label, { marginTop: 24 }]}>Pick your vibe</Text>
                        <View style={s.avatarGrid}>
                            {AVATARS.map((a) => (
                                <TouchableOpacity
                                    key={a}
                                    onPress={() => setSelectedAvatar(a)}
                                    style={[s.avatarBtn, selectedAvatar === a && s.avatarBtnActive]}
                                    activeOpacity={0.7}
                                >
                                    <Text style={s.avatarBtnEmoji}>{a}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* CTA */}
                        <TouchableOpacity
                            onPress={handleStartJourney}
                            disabled={!name.trim() || isLoading}
                            activeOpacity={0.85}
                            style={[s.cta, (!name.trim() || isLoading) && s.ctaDisabled]}
                        >
                            <LinearGradient
                                colors={name.trim() ? ['#4F6BFF', '#7B3FE4'] : ['#E5E8F0', '#E5E8F0']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={s.ctaGradient}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={[s.ctaText, !name.trim() && { color: '#B0BAD0' }]}>Start My Journey</Text>
                                        <MaterialCommunityIcons name="arrow-right" size={20} color={name.trim() ? '#fff' : '#B0BAD0'} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                            <Text style={s.backText}>← Back to Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F5F6FA' },
    scroll: { flexGrow: 1 },

    hero: {
        paddingTop: 50, paddingBottom: 50, paddingHorizontal: 24,
        alignItems: 'center',
    },
    avatarCircle: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarEmoji: { fontSize: 44 },
    heroTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 6 },
    heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 20 },

    card: {
        backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        marginTop: -20, padding: 26, paddingBottom: 40, flex: 1,
    },

    label: { fontSize: 13, fontWeight: '700', color: '#1A1D2E', marginBottom: 10 },

    inputWrap: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#F5F6FA', borderRadius: 14, paddingHorizontal: 14, height: 52,
        borderWidth: 1.5, borderColor: '#E5E8F0',
    },
    inputFocused: { borderColor: '#4F6BFF', backgroundColor: '#F0F3FF' },
    input: { flex: 1, fontSize: 16, color: '#1A1D2E' },

    avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
    avatarBtn: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: '#F5F6FA', alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: 'transparent',
    },
    avatarBtnActive: { borderColor: '#4F6BFF', backgroundColor: '#EEF1FF' },
    avatarBtnEmoji: { fontSize: 28 },

    cta: { borderRadius: 16, overflow: 'hidden', marginTop: 28 },
    ctaDisabled: { opacity: 0.7 },
    ctaGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, gap: 8,
    },
    ctaText: { fontSize: 16, fontWeight: '800', color: '#fff' },

    backBtn: { marginTop: 18, alignItems: 'center' },
    backText: { fontSize: 14, color: '#7A8499', fontWeight: '600' },
});
