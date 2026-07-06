import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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
import { Toast } from '../../component/Toast';
import { checkServer, getServerUrl, isCustomServer, setServerUrl } from '../../service/api';
import { normalizeServerUrl } from '../../service/serverUrl';

export default function ServerSetup() {
    const router = useRouter();
    // A server link (my-echo://connect?server=…) lands here so the user confirms it.
    const { server } = useLocalSearchParams<{ server?: string }>();
    const [url, setUrl] = useState(server || (isCustomServer() ? getServerUrl() : ''));
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);

    const handleConnect = async () => {
        const apiBase = normalizeServerUrl(url);
        if (!apiBase) { Toast.warning('Enter your server address'); return; }
        setLoading(true);
        try {
            await checkServer(apiBase);
            await setServerUrl(apiBase);
            Toast.success(apiBase.replace(/\/api$/, ''), 'Connected to your server');
            router.replace('/(auth)/signin');
        } catch (error) {
            Toast.error(error instanceof Error ? error.message : 'Unknown error', 'Could not reach that server');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        await setServerUrl(null);
        Toast.success('Using the default Echo server');
        router.replace('/(auth)/signin');
    };

    return (
        <SafeAreaView style={s.safe}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                    <LinearGradient colors={['#0F1120', '#2D3561']} style={s.hero}>
                        <MaterialCommunityIcons name="server-network" size={40} color="#fff" />
                        <Text style={s.heroTitle}>Your own server</Text>
                        <Text style={s.heroSub}>
                            Self-hosting Echo? Open /connect on your instance and paste the server link here.
                        </Text>
                    </LinearGradient>

                    <View style={s.card}>
                        <Text style={s.label}>Server address</Text>
                        <View style={[s.inputWrap, focused && s.inputFocused]}>
                            <MaterialCommunityIcons name="link-variant" size={20} color={focused ? '#4F6BFF' : '#B0BAD0'} />
                            <TextInput
                                style={s.input}
                                placeholder="https://echo.example.com"
                                placeholderTextColor="#B0BAD0"
                                value={url}
                                onChangeText={setUrl}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="url"
                                returnKeyType="done"
                                onSubmitEditing={handleConnect}
                            />
                        </View>
                        <Text style={s.hint}>
                            Signing in switches accounts, so you will be asked to log in again.
                        </Text>

                        <TouchableOpacity onPress={handleConnect} disabled={loading} activeOpacity={0.85} style={s.cta}>
                            <LinearGradient colors={['#4F6BFF', '#7B3FE4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaGradient}>
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={s.ctaText}>Test & Connect</Text>
                                        <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {isCustomServer() && (
                            <TouchableOpacity onPress={handleReset} style={s.secondary}>
                                <Text style={s.secondaryText}>Use the default Echo server instead</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity onPress={() => router.replace('/(auth)/signin')} style={s.secondary}>
                            <Text style={s.secondaryText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F7F8FC' },
    scroll: { flexGrow: 1 },
    hero: { padding: 28, paddingTop: 40, paddingBottom: 44, alignItems: 'center', gap: 10 },
    heroTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
    heroSub: { color: '#C9D1E8', fontSize: 14, textAlign: 'center', lineHeight: 20 },
    card: { margin: 20, marginTop: -24, padding: 20, backgroundColor: '#fff', borderRadius: 20 },
    label: { fontSize: 13, fontWeight: '600', color: '#5A6480', marginBottom: 8 },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 52,
        borderRadius: 14, borderWidth: 1, borderColor: '#E5E8F0', backgroundColor: '#FAFBFF',
    },
    inputFocused: { borderColor: '#4F6BFF' },
    input: { flex: 1, fontSize: 15, color: '#1A1D2E' },
    hint: { fontSize: 12, color: '#8A93AD', marginTop: 10, lineHeight: 17 },
    cta: { marginTop: 20, borderRadius: 14, overflow: 'hidden' },
    ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52 },
    ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    secondary: { marginTop: 16, alignItems: 'center' },
    secondaryText: { color: '#4F6BFF', fontSize: 14, fontWeight: '600' },
});
