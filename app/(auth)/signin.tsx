import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';



export default function SignIn() {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, [isSignUp]);

    const handleSignUp = () => {
        if (!email || !password || !name) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }
    };

    const handleLogin = () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-blue-50"
        >
            <ScrollView
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <Animated.View
                    style={[
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                    className="items-center pt-10 pb-7"
                >
                    <View className="h-20 w-20 rounded-full bg-white items-center justify-center mb-5 shadow-md" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
                        <Image
                            source={require('../../assets/images/logo.png')}
                            className="h-12 w-12"
                            style={{ resizeMode: 'contain' }}
                        />
                    </View>
                    <Text className="text-4xl font-bold text-gray-950 mb-2">Echo</Text>
                    <Text className="text-base font-medium text-gray-600">Your mindful companion</Text>
                </Animated.View>

                {/* Tab Section */}
                <Animated.View
                    style={[
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                    className="mx-5 mb-7 flex-row rounded-3xl bg-white p-2"
                >
                    <TouchableOpacity
                        className={`flex-1 items-center rounded-2xl py-3.5 ${!isSignUp ? 'bg-blue-50' : ''}`}
                        onPress={() => setIsSignUp(false)}
                    >
                        <Text className={`text-base font-semibold ${!isSignUp ? 'text-gray-950' : 'text-gray-600'}`}>
                            Sign Up
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 items-center rounded-2xl py-3.5 ${isSignUp ? 'bg-blue-50' : ''}`}
                        onPress={() => setIsSignUp(true)}
                    >
                        <Text className={`text-base font-semibold ${isSignUp ? 'text-gray-950' : 'text-gray-600'}`}>
                            Login
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Form Section */}
                <Animated.View
                    style={[
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                    className="mx-5 rounded-3xl bg-white p-6"
                >
                    {!isSignUp ? (
                        <>
                            {/* Sign Up Form */}
                            <Text className="mb-2 text-2xl font-bold text-gray-950">Create your sanctuary</Text>
                            <Text className="mb-6 text-sm leading-5 text-gray-600">
                                Begin your journey to a calmer mind.
                            </Text>

                            <View className="mb-5">
                                <Text className="mb-2 text-sm font-semibold text-gray-950">Full Name</Text>
                                <View className="flex-row items-center rounded-2xl bg-gray-100 px-3 h-12">
                                    <MaterialCommunityIcons name="account" size={20} color="#4b91e2" />
                                    <TextInput
                                        className="flex-1 px-3 py-3 text-base text-gray-950"
                                        placeholder="Enter your name"
                                        placeholderTextColor="#bbb"
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                            </View>

                            <View className="mb-5">
                                <Text className="mb-2 text-sm font-semibold text-gray-950">Email Address</Text>
                                <View className="flex-row items-center rounded-2xl bg-gray-100 px-3 h-12">
                                    <MaterialCommunityIcons name="email" size={20} color="#4b91e2" />
                                    <TextInput
                                        className="flex-1 px-3 py-3 text-base text-gray-950"
                                        placeholder="you@example.com"
                                        placeholderTextColor="#bbb"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize='none'
                                    />
                                </View>
                            </View>

                            <View className="mb-5">
                                <Text className="mb-2 text-sm font-semibold text-gray-950">Password</Text>
                                <View className="flex-row items-center rounded-2xl bg-gray-100 px-3 h-12">
                                    <MaterialCommunityIcons name="lock" size={20} color="#4b91e2" />
                                    <TextInput
                                        className="flex-1 px-3 py-3 text-base text-gray-950"
                                        placeholder="Create a password"
                                        placeholderTextColor="#bbb"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <MaterialCommunityIcons
                                            name={showPassword ? "eye" : "eye-off"}
                                            size={20}
                                            color="#999"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                className="mb-5 flex-row items-center justify-center rounded-3xl h-14 bg-blue-500"
                                onPress={handleSignUp}
                                activeOpacity={0.8}
                                style={{ shadowColor: '#4b91e2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                            >
                                <Text className="text-base font-bold text-white">Enter Echo</Text>
                                <MaterialCommunityIcons
                                    name="arrow-right"
                                    size={20}
                                    color="white"
                                    style={{ marginLeft: 10 }}
                                />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {/* Login Form */}
                            <Text className="mb-2 text-2xl font-bold text-gray-950">Welcome Back</Text>
                            <Text className="mb-6 text-sm leading-5 text-gray-600">
                                Continue your journey to mindfulness.
                            </Text>

                            <View className="mb-5">
                                <Text className="mb-2 text-sm font-semibold text-gray-950">Email Address</Text>
                                <View className="flex-row items-center rounded-2xl bg-gray-100 px-3 h-12">
                                    <MaterialCommunityIcons name="email" size={20} color="#4b91e2" />
                                    <TextInput
                                        className="flex-1 px-3 py-3 text-base text-gray-950"
                                        placeholder="you@example.com"
                                        placeholderTextColor="#bbb"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize='none'
                                    />
                                </View>
                            </View>

                            <View className="mb-5">
                                <Text className="mb-2 text-sm font-semibold text-gray-950">Password</Text>
                                <View className="flex-row items-center rounded-2xl bg-gray-100 px-3 h-12">
                                    <MaterialCommunityIcons name="lock" size={20} color="#4b91e2" />
                                    <TextInput
                                        className="flex-1 px-3 py-3 text-base text-gray-950"
                                        placeholder="Enter your password"
                                        placeholderTextColor="#bbb"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <MaterialCommunityIcons
                                            name={showPassword ? "eye" : "eye-off"}
                                            size={20}
                                            color="#999"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                className="mb-5 flex-row items-center justify-center rounded-3xl h-14 bg-blue-500"
                                onPress={handleLogin}
                                activeOpacity={0.8}
                                style={{ shadowColor: '#4b91e2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                            >
                                <Text className="text-base font-bold text-white">Continue</Text>
                                <MaterialCommunityIcons
                                    name="arrow-right"
                                    size={20}
                                    color="white"
                                    style={{ marginLeft: 10 }}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity className="items-center mb-6">
                                <Text className="text-sm font-semibold text-blue-500">Forgot Password?</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Social Login */}
                    <View className="mb-6">
                        <Text className="mb-3 text-center text-xs font-semibold tracking-wider text-gray-600">OR CONTINUE WITH</Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity className="flex-1 flex-row items-center justify-center h-12 rounded-2xl border border-gray-200 gap-2">
                                <FontAwesome5 name="google" size={18} color="#EA4335" />
                                <Text className="text-sm font-semibold text-gray-950">Google</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="flex-1 flex-row items-center justify-center h-12 rounded-2xl border border-gray-200 gap-2">
                                <FontAwesome5 name="apple" size={18} color="#000" />
                                <Text className="text-sm font-semibold text-gray-950">Apple</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Privacy Notice */}
                    <View className="items-center border-t border-gray-100 pt-5">
                        <MaterialCommunityIcons name="shield-check" size={24} color="#4b91e2" />
                        <Text className="text-center text-xs leading-4.5 text-gray-600">
                            Your thoughts are private and encrypted.{'\n'}
                            We are here to listen, not to share.
                        </Text>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}