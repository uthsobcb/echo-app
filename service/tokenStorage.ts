import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'token';

// expo-secure-store wraps the OS keychain/keystore and isn't available on web,
// so web keeps using AsyncStorage there — no OS-level secure storage exists to
// wrap in a browser anyway.
export const tokenStorage = {
    async get(): Promise<string | null> {
        if (Platform.OS === 'web') return AsyncStorage.getItem(KEY);

        const secure = await SecureStore.getItemAsync(KEY);
        if (secure) return secure;

        // One-time migration: earlier app versions kept the token in AsyncStorage.
        const legacy = await AsyncStorage.getItem(KEY);
        if (legacy) {
            await SecureStore.setItemAsync(KEY, legacy);
            await AsyncStorage.removeItem(KEY);
            return legacy;
        }
        return null;
    },

    async set(value: string): Promise<void> {
        if (Platform.OS === 'web') {
            await AsyncStorage.setItem(KEY, value);
            return;
        }
        await SecureStore.setItemAsync(KEY, value);
    },

    async remove(): Promise<void> {
        if (Platform.OS === 'web') {
            await AsyncStorage.removeItem(KEY);
            return;
        }
        await SecureStore.deleteItemAsync(KEY);
        await AsyncStorage.removeItem(KEY); // clears any not-yet-migrated legacy value too
    },
};
