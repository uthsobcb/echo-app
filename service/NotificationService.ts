import AsyncStorage from '@react-native-async-storage/async-storage';
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

const NOTIF_ID = {
    DAILY_EVENING: 'daily-reminder-evening',
    TODO_DAILY: 'todo-daily-reminder',
    STREAK_AT_RISK: 'streak-at-risk-nudge',
    BADGE_PROXIMITY: 'badge-proximity-nudge',
    WIN_CELEBRATE: 'win-celebrate',
};

// Daily dedup keys — one notification type fires at most once per calendar day
const DEDUP_KEY = {
    REMINDER: 'echo_notif_reminder_date',
    STREAK_NUDGE: 'echo_notif_streak_nudge_date',
    BADGE_NUDGE: 'echo_notif_badge_nudge_date',
    WIN: 'echo_notif_win_date',
};

const NOTIFICATION_REGISTRY: Record<NotificationType, NotificationContent[]> = {
    [NotificationType.JOURNAL_REMINDER]: [
        { title: "✨ Evening Reflection", body: "What made today worth remembering? Take 2 minutes to journal." },
        { title: "🌙 Wind down with Echo", body: "Before you rest — what's on your mind? A quick reflection goes a long way." },
        { title: "📝 Your journal is waiting", body: "Even one sentence counts. Open Echo and write something." },
        { title: "💭 Echo is listening", body: "How did today feel? Write it out — future you will thank you." },
        { title: "🌟 Daily moment", body: "Capture today before it fades. Just a thought or two is enough." },
        { title: "🔥 Keep the streak alive", body: "No entry yet today. One quick thought keeps it going!" },
    ],
    [NotificationType.TODO_REMINDER]: [
        { title: "Echo's Check-in ✅", body: "Hey! You've got tasks waiting for you." },
        { title: "Let's do this! 🚀", body: "A few things on your list are calling your name." },
    ],
    [NotificationType.STREAK_RECOVERY]: [
        { title: "🔥 Streak check!", body: "No entry yet today — write one quick thought to keep it alive." },
        { title: "Don't lose it! ✨", body: "Your streak ends at midnight. One sentence is all it takes." },
        { title: "Streak SOS 🚨", body: "Echo is rooting for you! Quick entry before midnight?" },
    ],
    [NotificationType.CUSTOM]: [],
    [NotificationType.SYSTEM]: [
        { title: "System Update ⚙️", body: "Echo has been updated with new features!" },
    ],
};

const WIN_MESSAGES: NotificationContent[] = [
    { title: "Great work today! 🎉", body: "You journaled! Echo noticed — keep the momentum going." },
    { title: "Streak protected! 🔥", body: "Another entry in the books. You're on a roll." },
    { title: "You showed up ✨", body: "That entry is now a part of your story. See you tomorrow!" },
    { title: "Echo is proud of you 💙", body: "You took time to reflect today. That matters." },
];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const todayStr = () => new Date().toDateString();

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
        }
    } catch (e) {
        logger.info("[Notifications] Could not save push token:", e);
    }

    return true;
};

const cancelById = async (id: string) => {
    if (!Notifications) return;
    try {
        await Notifications.cancelScheduledNotificationAsync(id);
    } catch { /* Notification may not exist */ }
};

const alreadySentToday = async (key: string): Promise<boolean> => {
    const last = await AsyncStorage.getItem(key);
    return last === todayStr();
};

const markSentToday = (key: string) => AsyncStorage.setItem(key, todayStr());

/**
 * Schedule ONE daily journal reminder at 8pm.
 * Safe to call repeatedly — schedules at most once per calendar day.
 * Pass journaledToday=true after the user submits an entry to cancel the reminder.
 */
export const scheduleDailyReminder = async (journaledToday = false) => {
    if (!Notifications) return;

    if (journaledToday) {
        await cancelById(NOTIF_ID.DAILY_EVENING);
        logger.info('[Notifications] User journaled today — evening reminder cancelled');
        return;
    }

    // Dedup: only schedule once per calendar day
    if (await alreadySentToday(DEDUP_KEY.REMINDER)) {
        logger.info('[Notifications] Evening reminder already scheduled today, skipping');
        return;
    }

    try {
        await cancelById(NOTIF_ID.DAILY_EVENING);
        const { title, body } = pick(NOTIFICATION_REGISTRY[NotificationType.JOURNAL_REMINDER]);

        await Notifications.scheduleNotificationAsync({
            identifier: NOTIF_ID.DAILY_EVENING,
            content: {
                title,
                body,
                sound: true,
                data: { type: 'JOURNAL_REMINDER' },
            },
            trigger: {
                type: 'daily',
                channelId: 'default',
                hour: 20,
                minute: 0,
                repeats: true,
            } as any,
        });

        await markSentToday(DEDUP_KEY.REMINDER);
        logger.info('[Notifications] Evening journal reminder scheduled (8pm daily)');
    } catch (e) {
        logger.info('[Notifications] Could not schedule daily reminder:', e);
    }
};

export const cancelAllDailyReminders = async () => {
    if (!Notifications) return;
    await cancelById(NOTIF_ID.DAILY_EVENING);
    await AsyncStorage.removeItem(DEDUP_KEY.REMINDER);
    logger.info('[Notifications] Daily reminder cancelled');
};

/**
 * Fire a single win-celebration notification ~3 seconds after journaling.
 * Throttled to once per day — safe to call after every journal submit.
 */
export const notifyJournalComplete = async () => {
    if (!Notifications) return;
    if (await alreadySentToday(DEDUP_KEY.WIN)) return;

    try {
        const msg = pick(WIN_MESSAGES);
        await Notifications.scheduleNotificationAsync({
            identifier: NOTIF_ID.WIN_CELEBRATE,
            content: {
                title: msg.title,
                body: msg.body,
                sound: true,
                data: { type: 'WIN' },
            },
            trigger: {
                type: 'timeInterval',
                seconds: 3,
                repeats: false,
            } as any,
        });
        await markSentToday(DEDUP_KEY.WIN);
        // User journaled — cancel the day's reminder
        await cancelById(NOTIF_ID.DAILY_EVENING);
        logger.info('[Notifications] Win celebration notification scheduled');
    } catch (e) {
        logger.info('[Notifications] Could not schedule win notification:', e);
    }
};

/**
 * Schedule a single daily todo reminder at 10:00 AM.
 * Cancel it when pending count reaches zero.
 */
export const scheduleTodoDailyReminder = async (pendingCount: number, sampleTask?: string) => {
    if (!Notifications) return;
    if (pendingCount <= 0) {
        await cancelById(NOTIF_ID.TODO_DAILY);
        return;
    }

    try {
        await cancelById(NOTIF_ID.TODO_DAILY);

        const { title } = pick(NOTIFICATION_REGISTRY[NotificationType.TODO_REMINDER]);
        const body = sampleTask
            ? `"${sampleTask}"${pendingCount > 1 ? ` + ${pendingCount - 1} more` : ''} waiting for you.`
            : `You have ${pendingCount} pending ${pendingCount === 1 ? 'task' : 'tasks'} today.`;

        await Notifications.scheduleNotificationAsync({
            identifier: NOTIF_ID.TODO_DAILY,
            content: { title, body, sound: true, data: { screen: 'todo', type: 'TODO_REMINDER' } },
            trigger: { type: 'daily', channelId: 'default', hour: 10, minute: 0, repeats: true } as any,
        });

        logger.info(`[Notifications] Todo daily reminder scheduled: ${pendingCount} pending tasks`);
    } catch (e) {
        logger.info('[Notifications] Could not schedule todo reminder:', e);
    }
};

/**
 * Throttled custom notification — fires once per day, with a 3s delay.
 * Replaces the old immediate-fire version that caused notification storms.
 */
export const scheduleCustomNotification = async (title: string, body: string, data: Record<string, unknown> = {}) => {
    if (!Notifications) return;
    if (await alreadySentToday(DEDUP_KEY.WIN)) return; // Share win dedup slot

    try {
        await Notifications.scheduleNotificationAsync({
            content: { title, body, data, sound: true },
            trigger: { type: 'timeInterval', seconds: 3, repeats: false } as any,
        });
        await markSentToday(DEDUP_KEY.WIN);
    } catch (e) {
        logger.info('[Notifications] Could not schedule custom notification:', e);
    }
};

/**
 * Schedule a streak-at-risk nudge (fires in 2 hours).
 * Throttled to once per day — safe to call on every gamification update.
 */
export const scheduleStreakAtRiskNudge = async (streakDays: number) => {
    if (!Notifications) return;
    if (await alreadySentToday(DEDUP_KEY.STREAK_NUDGE)) {
        logger.info('[Notifications] Streak nudge already sent today, skipping');
        return;
    }

    try {
        await cancelById(NOTIF_ID.STREAK_AT_RISK);
        const { title, body } = pick(NOTIFICATION_REGISTRY[NotificationType.STREAK_RECOVERY]);

        await Notifications.scheduleNotificationAsync({
            identifier: NOTIF_ID.STREAK_AT_RISK,
            content: {
                title: `${title} (${streakDays} days)`,
                body,
                sound: true,
                data: { screen: 'create', type: 'STREAK_RECOVERY', days: streakDays },
            },
            trigger: { type: 'timeInterval', seconds: 7200, repeats: false } as any,
        });
        await markSentToday(DEDUP_KEY.STREAK_NUDGE);
        logger.info(`[Notifications] Streak-at-risk nudge scheduled for ${streakDays}-day streak`);
    } catch (e) {
        logger.info('[Notifications] Could not schedule streak-at-risk nudge:', e);
    }
};

/**
 * @deprecated Use scheduleStreakAtRiskNudge instead.
 * Kept for backwards compatibility with existing callers.
 */
export const scheduleStreakReminder = async (days: number) => {
    await scheduleStreakAtRiskNudge(days);
};

/**
 * Schedule a badge proximity nudge (fires in 1 hour).
 * Only triggers if 1–3 entries remain, and at most once per day.
 */
export const scheduleBadgeProximityNudge = async (badgeName: string, entriesRemaining: number) => {
    if (!Notifications) return;
    if (entriesRemaining > 3 || entriesRemaining <= 0) return;
    if (await alreadySentToday(DEDUP_KEY.BADGE_NUDGE)) return;

    try {
        await cancelById(NOTIF_ID.BADGE_PROXIMITY);

        await Notifications.scheduleNotificationAsync({
            identifier: NOTIF_ID.BADGE_PROXIMITY,
            content: {
                title: `Almost there! 🏅`,
                body: `Just ${entriesRemaining} more ${entriesRemaining === 1 ? 'entry' : 'entries'} until you earn "${badgeName}"!`,
                sound: true,
                data: { screen: 'create', type: 'CUSTOM' },
            },
            trigger: { type: 'timeInterval', seconds: 3600, repeats: false } as any,
        });
        await markSentToday(DEDUP_KEY.BADGE_NUDGE);
        logger.info(`[Notifications] Badge proximity nudge scheduled: ${entriesRemaining} until "${badgeName}"`);
    } catch (e) {
        logger.info('[Notifications] Could not schedule badge proximity nudge:', e);
    }
};
