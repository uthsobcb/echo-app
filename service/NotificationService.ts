import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import * as Device from "expo-device";
import { Platform } from "react-native";
import { api } from './api';

export enum NotificationType {
    JOURNAL_REMINDER = 'JOURNAL_REMINDER',
    TODO_REMINDER = 'TODO_REMINDER',
    STREAK_RECOVERY = 'STREAK_RECOVERY',
    CUSTOM = 'CUSTOM',
    SYSTEM = 'SYSTEM',
}

interface NotificationContent {
    title: string;
    body: string;
}

const NOTIFICATION_REGISTRY: Record<NotificationType, NotificationContent[]> = {
    [NotificationType.JOURNAL_REMINDER]: [
        { title: "Echo is waiting! 📖", body: "Echo is waiting for your story! Take a moment to reflect." },
        { title: "Streak Alert! 🔥", body: "Only 5 minutes to keep your streak alive! Echo believes in you." },
        { title: "Echo misses you ✨", body: "Echo misses your thoughts. Let's write them down!" },
        { title: "Don't leave Echo hanging... 💭", body: "What happened today? Echo is curious!" },
        { title: "Echo's feeling lonely... 😢", body: "Echo is feeling a bit lonely without your updates. Write a quick note?" },
        { title: "Are we still friends? 💔", body: "Echo thought we were best friends. Want to share something?" },
    ],
    [NotificationType.TODO_REMINDER]: [
        { title: "Echo's Check-in ✅", body: "Hey! Echo noticed some tasks are still waiting for you." },
        { title: "Let's do this! 🚀", body: "Let's clear that list together with Echo!" },
        { title: "You got this! 💪", body: "Echo believes in you! Ready to tackle your next task?" },
    ],
    [NotificationType.STREAK_RECOVERY]: [
        { title: "Don't lose it! 🔥", body: "Your streak is on the line! Echo is cheering for you." },
        { title: "Keep it going! ✨", body: "You're doing great! Don't let the streak break tonight." },
    ],
    [NotificationType.CUSTOM]: [],
    [NotificationType.SYSTEM]: [
        { title: "System Update ⚙️", body: "Echo has been updated with new features!" },
    ],
};

const getRandomMessage = (type: NotificationType): NotificationContent => {
    const messages = NOTIFICATION_REGISTRY[type];
    return messages[Math.floor(Math.random() * messages.length)];
};

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

    // Add listeners for interaction
    Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        console.log('[Notifications] Response received:', data);
        // Handle deep linking or screen navigation based on data.screen
    });

    Notifications.addNotificationReceivedListener(notification => {
        console.log('[Notifications] Foreground notification:', notification.request.content.title);
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

const getMascotAsset = async () => {
    try {
        const asset = Asset.fromModule(require('../assets/images/mascot.png'));
        await asset.downloadAsync();
        return asset.localUri || asset.uri;
    } catch (e) {
        console.log("[Notifications] Could not load mascot asset:", e);
        return null;
    }
};

export const scheduleDailyReminder = async () => {
    if (!Notifications) {
        console.log('[Notifications] Skipping schedule – not supported in current environment.');
        return;
    }

    try {
        const { title, body } = getRandomMessage(NotificationType.JOURNAL_REMINDER);
        const mascotUri = await getMascotAsset();

        // Schedule a daily journaling reminder at 8 PM (20:00)
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
                attachments: mascotUri ? [{
                    url: mascotUri,
                    identifier: 'mascot',
                    type: 'image/png'
                } as any] : [],
            },
            trigger: {
                type: 'daily',
                channelId: "default",
                hour: 20,
                minute: 0,
                repeats: true,
            } as any,
        });

        console.log(`[Notifications] Daily reminder scheduled: "${title}"`);
    } catch (e) {
        console.log("[Notifications] Could not schedule reminder:", e);
    }
};

export const scheduleTodoReminder = async (taskTitle: string) => {
    if (!Notifications) return;

    try {
        const { title, body } = getRandomMessage(NotificationType.TODO_REMINDER);
        const mascotUri = await getMascotAsset();

        await Notifications.scheduleNotificationAsync({
            content: {
                title: `${title}: ${taskTitle}`,
                body: body,
                sound: true,
                attachments: mascotUri ? [{
                    url: mascotUri,
                    identifier: 'mascot-todo',
                    type: 'image/png'
                } as any] : [],
            },
            trigger: null, // Send immediately
        });
    } catch (e) {
        console.log("[Notifications] Could not schedule todo reminder:", e);
    }
};

export const scheduleCustomNotification = async (title: string, body: string, data: any = {}) => {
    if (!Notifications) return;

    try {
        const mascotUri = await getMascotAsset();
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
                attachments: mascotUri ? [{
                    url: mascotUri,
                    identifier: 'mascot-custom',
                    type: 'image/png'
                } as any] : [],
            },
            trigger: null,
        });
    } catch (e) {
        console.log("[Notifications] Could not schedule custom notification:", e);
    }
};

export const scheduleStreakReminder = async (days: number) => {
    if (!Notifications) return;

    try {
        const { title, body } = getRandomMessage(NotificationType.STREAK_RECOVERY);
        const mascotUri = await getMascotAsset();

        await Notifications.scheduleNotificationAsync({
            content: {
                title: `${title} (${days} days)`,
                body,
                sound: true,
                attachments: mascotUri ? [{
                    url: mascotUri,
                    identifier: 'mascot-streak',
                    type: 'image/png'
                } as any] : [],
            },
            trigger: {
                type: 'daily',
                hour: 21, // 9 PM
                minute: 0,
                repeats: false,
            } as any,
        });
    } catch (e) {
        console.log("[Notifications] Could not schedule streak reminder:", e);
    }
};
