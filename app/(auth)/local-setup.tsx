import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useStorage } from '../../context/StorageContext';

// Local setup screen
export default function LocalSetup() {
    const router = useRouter();
    const { loginAsLocal } = useStorage();
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Hardcoded avatars for now - using local assets or could be emojis
    const avatars = ['😊', '😎', '🤠', '🤓', '🤖', '👽'];
    const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);

    const handleStartJourney = async () => {
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            await loginAsLocal({
                name: name.trim(),
                mood: selectedAvatar + ' Feeling Good', // Default mood
                avatar: selectedAvatar // Storing emoji as avatar for now for simplicity
            });
            router.replace('/(tabs)');
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
                <View className="items-center mb-10">
                    <View className="h-24 w-24 rounded-full bg-blue-50 items-center justify-center mb-4">
                        <Text className="text-5xl">{selectedAvatar}</Text>
                    </View>
                    <Text className="text-2xl font-bold text-gray-900 text-center">
                        Welcome to Echo
                    </Text>
                    <Text className="text-gray-500 text-center mt-2">
                        Let's get to know you a little better. All data stays on this device.
                    </Text>
                </View>

                <View className="mb-8">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">What should we call you?</Text>
                    <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-lg text-gray-900"
                        placeholder="Your Name"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />
                </View>

                <View className="mb-10">
                    <Text className="text-sm font-semibold text-gray-700 mb-4">Choose an Avatar</Text>
                    <View className="flex-row flex-wrap gap-4 justify-center">
                        {avatars.map((avatar) => (
                            <TouchableOpacity
                                key={avatar}
                                onPress={() => setSelectedAvatar(avatar)}
                                className={`h-16 w-16 items-center justify-center rounded-full border-2 ${selectedAvatar === avatar ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-50'
                                    }`}
                            >
                                <Text className="text-3xl">{avatar}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleStartJourney}
                    disabled={!name.trim() || isLoading}
                    className={`h-14 rounded-2xl items-center justify-center flex-row shadow-sm ${!name.trim() ? 'bg-gray-300' : 'bg-blue-600'
                        }`}
                    style={{ shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text className="text-white font-bold text-lg mr-2">Start Journey</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mt-6 items-center"
                >
                    <Text className="text-gray-500 font-medium">Go Back</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
