import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useAuthRequest } from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useStorage } from '../../context/StorageContext';

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
    const router = useRouter();
    const { loginAsAPI, registerAPI, loginWithGoogle } = useStorage();
    const [isLogin, setIsLogin] = useState(false); // false = Sign Up, true = Login
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const slideAnim = useRef(new Animated.Value(40)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const [request, response, promptAsync] = useAuthRequest({
        iosClientId: 'YOUR_IOS_CLIENT_ID',
        androidClientId: 'YOUR_ANDROID_CLIENT_ID',
        webClientId: 'YOUR_WEB_CLIENT_ID',
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleLogin(id_token);
        }
    }, [response]);

    useEffect(() => {
        slideAnim.setValue(30);
        fadeAnim.setValue(0);
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]).start();
    }, [isLogin]);

    const handleGoogleLogin = async (token: string) => {
        try {
            setLoading(true);
            await loginWithGoogle(token);
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Google Login Failed', error.message);
        } finally { setLoading(false); }
    };

    const handleSignUp = async () => {
        if (!email || !password || !name) { Alert.alert('Error', 'Please fill in all fields'); return; }
        if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email.toLowerCase());
            formData.append('password', password);
            await registerAPI(formData);
            Alert.alert('Success! 🎉', 'Account created! Please login.');
            setIsLogin(true);
        } catch (error: any) {
            Alert.alert('Registration Failed', error.message);
        } finally { setLoading(false); }
    };

    const handleLogin = async () => {
        if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
        try {
            setLoading(true);
            await loginAsAPI({ email: email.toLowerCase(), password });
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
        } finally { setLoading(false); }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} bounces={false}>
                {/* Dark Gradient Hero */}
                <LinearGradient
                    colors={['#0F1120', '#1A1D2E', '#2D3561']}
                    style={styles.hero}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {/* Stars */}
                    <View style={styles.starsRow}>
                        {['✦', '✧', '✦', '✧', '✦', '✧'].map((s, i) => (
                            <Text key={i} style={[styles.star, { opacity: 0.2 + i * 0.1 }]}>{s}</Text>
                        ))}
                    </View>

                    <View style={styles.logoWrap}>
                        <Image
                            source={require('../../assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.heroTitle}>Echo</Text>
                    <Text style={styles.heroSub}>Your mindful journaling companion</Text>
                </LinearGradient>

                {/* Tab Selector */}
                <View style={styles.formCard}>
                    <View style={styles.tabRow}>
                        <TouchableOpacity
                            style={[styles.tab, !isLogin && styles.tabActive]}
                            onPress={() => setIsLogin(false)}
                        >
                            <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Sign Up</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, isLogin && styles.tabActive]}
                            onPress={() => setIsLogin(true)}
                        >
                            <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Login</Text>
                        </TouchableOpacity>
                    </View>

                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <Text style={styles.formTitle}>
                            {isLogin ? 'Welcome back 👋' : 'Create your sanctuary ✨'}
                        </Text>
                        <Text style={styles.formSub}>
                            {isLogin ? 'Continue your journey to mindfulness.' : 'Begin your journey to a calmer mind.'}
                        </Text>

                        {/* Name field (Sign Up only) */}
                        {!isLogin && (
                            <View style={styles.fieldWrap}>
                                <Text style={styles.fieldLabel}>Full Name</Text>
                                <View style={styles.input}>
                                    <MaterialCommunityIcons name="account-outline" size={20} color="#4F6BFF" />
                                    <TextInput
                                        style={styles.inputText}
                                        placeholder="Enter your name"
                                        placeholderTextColor="#B0BAD0"
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                            </View>
                        )}

                        {/* Email */}
                        <View style={styles.fieldWrap}>
                            <Text style={styles.fieldLabel}>Email Address</Text>
                            <View style={styles.input}>
                                <MaterialCommunityIcons name="email-outline" size={20} color="#4F6BFF" />
                                <TextInput
                                    style={styles.inputText}
                                    placeholder="you@example.com"
                                    placeholderTextColor="#B0BAD0"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* Password */}
                        <View style={styles.fieldWrap}>
                            <Text style={styles.fieldLabel}>Password</Text>
                            <View style={styles.input}>
                                <MaterialCommunityIcons name="lock-outline" size={20} color="#4F6BFF" />
                                <TextInput
                                    style={styles.inputText}
                                    placeholder={isLogin ? 'Enter your password' : 'Create a password'}
                                    placeholderTextColor="#B0BAD0"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <MaterialCommunityIcons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color="#B0BAD0"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {isLogin && (
                            <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
                                <Text style={styles.forgotText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        )}

                        {/* Primary CTA */}
                        <TouchableOpacity
                            style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
                            onPress={isLogin ? handleLogin : handleSignUp}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#4F6BFF', '#7B3FE4']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.ctaGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.ctaText}>{isLogin ? 'Continue' : 'Enter Echo'}</Text>
                                        <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google Sign-In Button */}
                        <TouchableOpacity
                            style={styles.googleBtn}
                            onPress={() => promptAsync()}
                            disabled={!request || loading}
                            activeOpacity={0.85}
                        >
                            <View style={styles.googleIconWrap}>
                                <FontAwesome5 name="google" size={18} color="#EA4335" />
                            </View>
                            <Text style={styles.googleBtnText}>Continue with Google</Text>
                        </TouchableOpacity>

                        {/* Local Mode */}
                        <View style={styles.localRow}>
                            <View style={styles.localDivider} />
                            <TouchableOpacity onPress={() => router.push('/(auth)/local-setup')}>
                                <Text style={styles.localText}>Continue without account →</Text>
                            </TouchableOpacity>
                            <View style={styles.localDivider} />
                        </View>

                        <View style={styles.privacyRow}>
                            <MaterialCommunityIcons name="shield-check" size={16} color="#4F6BFF" />
                            <Text style={styles.privacyText}>Your thoughts are private & encrypted.</Text>
                        </View>
                    </Animated.View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    scroll: { backgroundColor: '#0F1120' },

    hero: {
        alignItems: 'center',
        paddingTop: 70,
        paddingBottom: 44,
        paddingHorizontal: 24,
    },
    starsRow: { flexDirection: 'row', gap: 10, position: 'absolute', top: 40, width: '100%', justifyContent: 'center' },
    star: { fontSize: 16, color: '#fff' },
    logoWrap: {
        width: 80, height: 80, borderRadius: 24,
        backgroundColor: 'rgba(79,107,255,0.25)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(79,107,255,0.5)',
    },
    logo: { width: 50, height: 50 },
    heroTitle: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6, textAlign: 'center' },

    formCard: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 28,
        paddingBottom: 40,
        marginTop: -16,
    },

    tabRow: {
        flexDirection: 'row',
        backgroundColor: '#F5F6FA',
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
    },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    tabText: { fontSize: 15, fontWeight: '600', color: '#B0BAD0' },
    tabTextActive: { color: '#1A1D2E' },

    formTitle: { fontSize: 22, fontWeight: '800', color: '#1A1D2E', marginBottom: 6 },
    formSub: { fontSize: 14, color: '#7A8499', marginBottom: 24, lineHeight: 20 },

    fieldWrap: { marginBottom: 16 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: '#1A1D2E', marginBottom: 8 },
    input: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#F5F6FA', borderRadius: 14, paddingHorizontal: 14, height: 52,
        borderWidth: 1.5, borderColor: '#E5E8F0',
    },
    inputText: { flex: 1, fontSize: 15, color: '#1A1D2E' },

    forgotText: { fontSize: 13, fontWeight: '600', color: '#4F6BFF' },

    ctaBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
    ctaGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, gap: 8,
    },
    ctaText: { fontSize: 16, fontWeight: '800', color: '#fff' },

    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E8F0' },
    dividerText: { fontSize: 11, fontWeight: '700', color: '#B0BAD0', letterSpacing: 1 },

    googleBtn: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 14, height: 52,
        borderWidth: 1.5, borderColor: '#E5E8F0',
        marginBottom: 20,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
        overflow: 'hidden',
    },
    googleIconWrap: {
        width: 52, height: 52, alignItems: 'center', justifyContent: 'center',
        borderRightWidth: 1, borderRightColor: '#E5E8F0', backgroundColor: '#FAFAFA',
    },
    googleBtnText: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#3C4043' },

    localRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    localDivider: { flex: 1, height: 1, backgroundColor: '#E5E8F0' },
    localText: { fontSize: 13, color: '#4F6BFF', fontWeight: '600' },

    privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    privacyText: { fontSize: 12, color: '#7A8499' },
});