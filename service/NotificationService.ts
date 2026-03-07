import Constants from 'expo-constants';
import * as Device from "expo-device";
import { Platform } from "react-native";
import { api } from './api';

// Safely import expo-notifications; it's removed from Expo Go in SDK 53+
let Notifications: typeof import('expo-notifications') | null = null;
try {
    Notifications = require('expo-notifications');
} catch (e) {
    console.log('[Notifications] expo-notifications not available in this environment (Expo Go).');
}

// Set the notification handler if module is available
if (Notifications) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}

export const setupNotifications = async (): Promise<boolean> => {
    if (!Notifications) {
        console.log('[Notifications] Skipping – not supported in current environment.');
        return false;
    }

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
        });
    }

    if (!Device.isDevice) {
        console.log("[Notifications] Must use physical device for Push Notifications");
        return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        console.log("[Notifications] Permission not granted.");
        return false;
    }

    try {
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId;

        if (projectId) {
            const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
            console.log("[Notifications] Push token fetched:", tokenData.data);
            await api.users.savePushToken(tokenData.data);
        } else {
            console.log("[Notifications] No EAS projectId found. Configure eas.projectId in app.json for remote push.");
        }
    } catch (e) {
        console.log("[Notifications] Could not save push token:", e);
    }

    return true;
};

export const scheduleDailyReminder = async () => {
    if (!Notifications) {
        console.log('[Notifications] Skipping schedule – not supported in current environment.');
        return;
    }

    try {
        // Cancel all previously scheduled notifications to avoid duplicates
        await Notifications.cancelAllScheduledNotificationsAsync();

        // Schedule a daily journaling reminder at 8 PM (20:00)
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Time to Journal! ✍️",
                body: "Take a few minutes to reflect on your day and keep your streak going!",
                sound: true,
            },
            trigger: {
                type: 'daily',
                channelId: "default",
                hour: 20,
                minute: 0,
                repeats: true,
            } as any,
        });

        console.log("[Notifications] Daily reminder scheduled for 8 PM.");
    } catch (e) {
        console.log("[Notifications] Could not schedule reminder:", e);
    }
};
