import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import * as Device from "expo-device";
import { Platform } from "react-native";
import { api } from './api';
import { logger } from './logger';

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

// Stable identifiers — cancel before re-schedule to prevent duplicates
const NOTIF_ID = {
    DAILY_MORNING: 'daily-reminder-morning',
    DAILY_AFTERNOON: 'daily-reminder-afternoon',
    DAILY_EVENING: 'daily-reminder-evening',
    TODO_DAILY: 'todo-daily-reminder',
    STREAK_AT_RISK: 'streak-at-risk-nudge',
    BADGE_PROXIMITY: 'badge-proximity-nudge',
};

const DAILY_SLOTS: Array<{ id: string; hour: number; minute: number }> = [
    { id: NOTIF_ID.DAILY_MORNING,   hour: 9,  minute: 0  },
    { id: NOTIF_ID.DAILY_AFTERNOON, hour: 14, minute: 30 },
    { id: NOTIF_ID.DAILY_EVENING,   hour: 20, minute: 0  },
];

const NOTIFICATION_REGISTRY: Record<NotificationType, NotificationContent[]> = {
    [NotificationType.JOURNAL_REMINDER]: [
        { title: "☀️ Good Morning!", body: "Start your day with a quick reflection. What's on your mind?" },
        { title: "📝 Afternoon Check-in", body: "How's your day going? Take a moment to journal your thoughts." },
        { title: "🌙 Evening Wind-down", body: "Time to reflect on your day. Write a few thoughts before you rest." },
        { title: "🔥 Streak Alert!", body: "Don't break your streak! A quick entry keeps it alive." },
        { title: "✨ Echo Misses You", body: "Your thoughts matter. Take 2 minutes to journal today." },
        { title: "💭 Quick Reflection", body: "What made you smile today? Echo wants to know!" },
        { title: "🌱 Small Steps", body: "Even one sentence counts. Open Echo and write something." },
        { title: "⏱️ 10 Seconds Only", body: "Write one thing you felt today. That's it!" },
        { title: "💫 Future You Will Thank You", body: "Journal entries are gifts to your future self. Write one now!" },
        { title: "🌟 Daily Moment", body: "Capture today's moment before it fades. Journal now!" },
    ],
    [NotificationType.TODO_REMINDER]: [
        { title: "Echo's Check-in ✅", body: "Hey! Echo noticed some tasks are still waiting for you." },
        { title: "Let's do this! 🚀", body: "Let's clear that list together with Echo!" },
        { title: "You got this! 💪", body: "Echo believes in you! Ready to tackle your next task?" },
        { title: "Task check-in 📋", body: "A few things on your list are calling your name." },
    ],
    [NotificationType.STREAK_RECOVERY]: [
        { title: "Don't lose it! 🔥", body: "Your streak is on the line! Echo is cheering for you." },
        { title: "Keep it going! ✨", body: "You're doing great! Don't let the streak break tonight." },
        { title: "Streak SOS 🚨", body: "Quick! One entry keeps your streak alive. Echo is rooting for you." },
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
    logger.info('[Notifications] expo-notifications not available in this environment (Expo Go).');
}

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

    Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        logger.info('[Notifications] Response received:', data);
    });

    Notifications.addNotificationReceivedListener(notification => {
        logger.info('[Notifications] Foreground notification:', notification.request.content.title);
    });
}

export const setupNotifications = async (): Promise<boolean> => {
    if (!Notifications) {
        logger.info('[Notifications] Skipping – not supported in current environment.');
        return false;
    }

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "Echo Reminders",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#4F6BFF",
            sound: 'default',
            enableVibrate: true,
            enableLights: true,
            showBadge: true,
        });
    }

    if (!Device.isDevice) {
        logger.info("[Notifications] Must use physical device for Push Notifications");
        return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        logger.info("[Notifications] Permission not granted.");
        return false;
    }

    try {
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId;

        if (projectId) {
            const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
            logger.info("[Notifications] Push token fetched:", tokenData.data);
            await api.users.savePushToken(tokenData.data);
        } else {
            logger.info("[Notifications] No EAS projectId found.");
        }
    } catch (e) {
        logger.info("[Notifications] Could not save push token:", e);
    }

    return true;
};

const getMascotAsset = async () => {
    try {
        const asset = Asset.fromModule(require('../assets/images/mascot.png'));
        await asset.downloadAsync();
        return asset.localUri || asset.uri;
    } catch (e) {
        logger.info("[Notifications] Could not load mascot asset:", e);
        return null;
    }
};

const cancelById = async (id: string) => {
    if (!Notifications) return;
    try {
        await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
        // Notification may not exist — fine
    }
};

/**
 * Cancel all daily reminder notifications
 */
export const cancelAllDailyReminders = async () => {
    if (!Notifications) return;
    
    for (const slot of DAILY_SLOTS) {
        await cancelById(slot.id);
    }
    logger.info('[Notifications] All daily reminders canceled');
};

/**
 * Schedule 3 daily reminders (morning, afternoon, evening).
 * Cancels previous ones first so re-calling never duplicates.
 */
export const scheduleDailyReminder = async () => {
    if (!Notifications) {
        logger.info('[Notifications] Skipping schedule – not supported in current environment.');
        return;
    }

    try {
        const mascotUri = await getMascotAsset();

        for (const slot of DAILY_SLOTS) {
            // Cancel existing notification with this ID first
            await cancelById(slot.id);

            const { title, body } = getRandomMessage(NotificationType.JOURNAL_REMINDER);

            await Notifications.scheduleNotificationAsync({
                identifier: slot.id,
                content: {
                    title,
                    body,
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    vibrate: [0, 250, 250, 250],
                    data: { type: 'JOURNAL_REMINDER', timeSlot: slot.id },
                    ...(mascotUri && {
                        attachments: [{
                            url: mascotUri,
                            identifier: 'mascot',
                            type: 'image/png'
                        } as any],
                    }),
                },
                trigger: {
                    type: 'daily',
                    channelId: "default",
                    hour: slot.hour,
                    minute: slot.minute,
                    repeats: true,
                } as any,
            });

            logger.info(`[Notifications] Daily reminder scheduled at ${slot.hour}:${String(slot.minute).padStart(2, '0')}: "${title}"`);
        }
    } catch (e) {
        logger.info("[Notifications] Could not schedule reminders:", e);
    }
};

/**
 * Schedule a single daily todo reminder at 10:00 AM.
 * Cancels previous first — no duplicates regardless of how often called.
 * Call after fetching todos whenever there are pending items.
 */
export const scheduleTodoDailyReminder = async (pendingCount: number, sampleTask?: string) => {
    if (!Notifications) return;
    if (pendingCount <= 0) {
        await cancelById(NOTIF_ID.TODO_DAILY);
        return;
    }

    try {
        await cancelById(NOTIF_ID.TODO_DAILY);

        const { title } = getRandomMessage(NotificationType.TODO_REMINDER);
        const body = sampleTask
            ? `"${sampleTask}"${pendingCount > 1 ? ` + ${pendingCount - 1} more` : ''} waiting for you.`
            : `You have ${pendingCount} pending ${pendingCount === 1 ? 'task' : 'tasks'} today.`;

        const mascotUri = await getMascotAsset();

        await Notifications.scheduleNotificationAsync({
            identifier: NOTIF_ID.TODO_DAILY,
            content: {
                title,
                body,
                sound: true,
                data: { screen: 'todo', type: 'TODO_REMINDER' },
                attachments: mascotUri ? [{
                    url: mascotUri,
                    identifier: 'mascot-todo',
                    type: 'image/png'
                } as any] : [],
            },
            trigger: {
                type: 'daily',
                channelId: 'default',
                hour: 10,
                minute: 0,
                repeats: true,
            } as any,
        });

        logger.info(`[Notifications] Todo daily reminder scheduled: ${pendingCount} pending tasks`);
    } catch (e) {
        logger.info("[Notifications] Could not schedule todo reminder:", e);
    }
};

export const scheduleCustomNotification = async (title: string, body: string, data: Record<string, unknown> = {}) => {
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
        logger.info("[Notifications] Could not schedule custom notification:", e);
    }
};

export const scheduleStreakReminder = async (days: number) => {
    if (!Notifications) return;

    try {
        const { title, body } = getRandomMessage(NotificationType.STREAK_RECOVERY);
        const mascotUri = await getMascotAsset();

        await Notifications.scheduleNotificationAsync({
            identifier: NOTIF_ID.STREAK_AT_RISK,
            content: {
                title: `${title} (${days} days)`,
                body,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                data: { type: 'STREAK_RECOVERY', days },
                attachments: mascotUri ? [{
                    url: mascotUri,
                    identifier: 'mascot-streak',
                    type: 'image/png'
                } as any] : [],
            },
            trigger: {
                type: 'daily',
                hour: 21,
                minute: 0,
                repeats: true,
            } as any,
        });
    } catch (e) {
        logger.info("[Notifications] Could not schedule streak reminder:", e);
    }
};

/**
 * Schedule a streak-at-risk nudge (fires in 2 hours).
 * Cancels any pending nudge first — only ever 1 queued.
 */
export const scheduleStreakAtRiskNudge = async (streakDays: number) => {
    if (!Notifications) return;

    try {
        await cancelById(NOTIF_ID.STREAK_AT_RISK);

        const mascotUri = await getMascotAsset();
        await Notifications.scheduleNotificationAsync({
            identifier: NOTIF_ID.STREAK_AT_RISK,
            content: {
                title: `Your ${streakDays}-day streak is about to end!`,
                body: "Write a quick entry to keep it alive. Echo believes in you!",
                sound: true,
                data: { screen: 'create', type: 'STREAK_RECOVERY' },
                attachments: mascotUri ? [{
                    url: mascotUri,
                    identifier: 'mascot-risk',
                    type: 'image/png'
                } as any] : [],
            },
            trigger: {
                type: 'timeInterval',
                seconds: 7200,
                repeats: false,
            } as any,
        });
        logger.info(`[Notifications] Streak-at-risk nudge scheduled for ${streakDays}-day streak`);
    } catch (e) {
        logger.info("[Notifications] Could not schedule streak-at-risk nudge:", e);
    }
};

/**
 * Schedule a badge proximity nudge.
 * Cancels any pending nudge first — only ever 1 queued.
 */
export const scheduleBadgeProximityNudge = async (badgeName: string, entriesRemaining: number) => {
    if (!Notifications) return;
    if (entriesRemaining > 3 || entriesRemaining <= 0) return;

    try {
        await cancelById(NOTIF_ID.BADGE_PROXIMITY);

        const mascotUri = await getMascotAsset();
        await Notifications.scheduleNotificationAsync({
            identifier: NOTIF_ID.BADGE_PROXIMITY,
            content: {
                title: `Almost there! 🏅`,
                body: `Just ${entriesRemaining} more ${entriesRemaining === 1 ? 'entry' : 'entries'} until you earn "${badgeName}"!`,
                sound: true,
                data: { screen: 'create', type: 'CUSTOM' },
                attachments: mascotUri ? [{
                    url: mascotUri,
                    identifier: 'mascot-badge',
                    type: 'image/png'
                } as any] : [],
            },
            trigger: {
                type: 'timeInterval',
                seconds: 3600,
                repeats: false,
            } as any,
        });
        logger.info(`[Notifications] Badge proximity nudge scheduled: ${entriesRemaining} until "${badgeName}"`);
    } catch (e) {
        logger.info("[Notifications] Could not schedule badge proximity nudge:", e);
    }
};
