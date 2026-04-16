import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    AdminStats,
    AuthResponse,
    Chat,
    ChatSendResponse,
    Entry,
    InsightsResponse,
    LeaderboardEntry,
    MoodCreateResponse,
    MoodHistoryItem,
    Notification,
    Post,
    SpaceDrawStatus,
    SpaceMessage,
    Todo,
    User,
} from '../types/data';
import { config } from './config';
import { logger } from './logger';

const BASE_URL = config.API_BASE_URL;

async function getHeaders(isMultipart = false) {
    try {
        const token = await AsyncStorage.getItem('token');
        const headers: Record<string, string> = {
            'Accept': 'application/json',
        };
        if (!isMultipart) {
            headers['Content-Type'] = 'application/json';
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    } catch (e) {
        logger.error('API: Error in getHeaders', e);
        throw e;
    }
}

const fetchWithTimeout = async (resource: RequestInfo, options: RequestInit = {}) => {
    const { timeout = 15000 } = options as RequestInit & { timeout?: number };

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        throw error;
    }
}

const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        logger.error('API Error:', data);
        const msg =
            data.message ||
            (typeof data.error === 'string' ? data.error : data.error?.message) ||
            `Request failed (${response.status})`;
        throw new Error(msg);
    }
    return data;
};

export const api = {
    // ─── Authentication ──────────────────────────────────────────────
    auth: {
        login: async (credentials: { email: string; password: string }) => {
            try {
                const response = await fetchWithTimeout(`${BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: await getHeaders(),
                    body: JSON.stringify(credentials),
                });
                const data = await handleResponse(response);
                if (data.token) {
                    await AsyncStorage.setItem('token', data.token);
                }
                return data as AuthResponse;
            } catch (e) {
                logger.error('API: Login failed', e);
                throw e;
            }
        },

        register: async (formData: FormData) => {
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: await getHeaders(true),
                body: formData,
            });
            return handleResponse(response) as Promise<{ message: string; imageUrl?: string }>;
        },

        logout: async () => {
            try {
                const response = await fetch(`${BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: await getHeaders(),
                });
                return handleResponse(response);
            } catch (e) {
                logger.error('API: Logout failed', e);
                throw e;
            }
        },

        googleLogin: async (idToken: string) => {
            logger.debug('API: Google Login...');
            try {
                const response = await fetch(`${BASE_URL}/auth/google`, {
                    method: 'POST',
                    headers: await getHeaders(),
                    body: JSON.stringify({ idToken }),
                });
                logger.debug('API: Google Login Response status:', response.status);
                const data = await handleResponse(response);
                if (data.token) {
                    await AsyncStorage.setItem('token', data.token);
                }
                return data as AuthResponse;
            } catch (e) {
                logger.error('API: Google Login failed', e);
                throw e;
            }
        },

        forgotPassword: async (email: string) => {
            const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify({ email }),
            });
            return handleResponse(response);
        },

        resetPassword: async (data: { email: string; code: string; password: string }) => {
            const response = await fetch(`${BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
    },

    // ─── User Profile ────────────────────────────────────────────────
    profile: {
        get: async () => {
            const response = await fetch(`${BASE_URL}/profile`, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<{ success: boolean; user: User }>;
        },

        update: async (updates: Partial<User> & { currentPassword?: string; newPassword?: string }) => {
            const response = await fetch(`${BASE_URL}/profile`, {
                method: 'PUT',
                headers: await getHeaders(),
                body: JSON.stringify(updates),
            });
            return handleResponse(response);
        },
    },

    users: {
        savePushToken: async (token: string, timezone?: string) => {
            const response = await fetch(`${BASE_URL}/users/push-token`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify({ token, timezone }),
            });
            return handleResponse(response) as Promise<{ message: string; pushToken: string; timezone: string }>;
        },
    },

    // ─── Mood & Journal ──────────────────────────────────────────────
    mood: {
        create: async (content: string, imgUrl?: string) => {
            const response = await fetch(`${BASE_URL}/mood`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify({ content, imgUrl }),
            });
            return handleResponse(response) as Promise<MoodCreateResponse>;
        },

        getHistory: async () => {
            const response = await fetch(`${BASE_URL}/mood-tracker`, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<MoodHistoryItem[]>;
        },
    },

    // ─── Entry Management ────────────────────────────────────────────
    entries: {
        getAll: async (search?: string, mood?: string) => {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (mood && mood !== 'All') params.set('mood', mood);
            const url = params.toString() ? `${BASE_URL}/entries?${params}` : `${BASE_URL}/entries`;
            const response = await fetch(url, {
                headers: await getHeaders(),
            });
            const data = await handleResponse(response);
            const entries = Array.isArray(data) ? data : (data.entries || data.moods || []);
            return entries as Entry[];
        },

        getById: async (id: string) => {
            const response = await fetch(`${BASE_URL}/entries/${id}`, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<Entry>;
        },

        update: async (id: string, updates: Partial<Pick<Entry, 'mood' | 'score' | 'comment' | 'content' | 'imgUrl'>>) => {
            const response = await fetch(`${BASE_URL}/entries/${id}`, {
                method: 'PATCH',
                headers: await getHeaders(),
                body: JSON.stringify(updates),
            });
            return handleResponse(response);
        },

        delete: async (id: string) => {
            const response = await fetch(`${BASE_URL}/entries/${id}`, {
                method: 'DELETE',
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<{ message: string }>;
        },
    },

    // ─── Todos ───────────────────────────────────────────────────────
    todo: {
        getAll: async () => {
            const response = await fetch(`${BASE_URL}/todo`, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<{ todos: Todo[] }>;
        },

        update: async (id: string, updates: { oldTask?: string; newTask?: string; status?: 'pending' | 'in progress' | 'completed' }) => {
            const response = await fetch(`${BASE_URL}/todo/${id}`, {
                method: 'PATCH',
                headers: await getHeaders(),
                body: JSON.stringify(updates),
            });
            return handleResponse(response) as Promise<{ message: string; todo: Todo }>;
        },

        delete: async (id: string, task: string) => {
            const response = await fetch(`${BASE_URL}/todo/${id}`, {
                method: 'DELETE',
                headers: await getHeaders(),
                body: JSON.stringify({ task }),
            });
            return handleResponse(response) as Promise<{ message: string }>;
        },
    },

    // ─── Chat ────────────────────────────────────────────────────────
    chat: {
        sendMessage: async (message: string, chatId?: string) => {
            const response = await fetch(`${BASE_URL}/chat`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify({ message, chatId }),
            });
            return handleResponse(response) as Promise<ChatSendResponse>;
        },

        getAll: async () => {
            const response = await fetch(`${BASE_URL}/chat`, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<Chat[]>;
        },

        getById: async (id: string) => {
            const response = await fetch(`${BASE_URL}/chat/${id}`, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<Chat>;
        },

        delete: async (id: string) => {
            const response = await fetch(`${BASE_URL}/chat/${id}`, {
                method: 'DELETE',
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<{ message: string }>;
        },

        updateSummary: async (id: string, threadSummary: string) => {
            const response = await fetch(`${BASE_URL}/chat/${id}`, {
                method: 'PATCH',
                headers: await getHeaders(),
                body: JSON.stringify({ threadSummary }),
            });
            return handleResponse(response);
        },
    },

    // ─── Space (Community) ───────────────────────────────────────────
    space: {
        getDrawStatus: async () => {
            const response = await fetch(`${BASE_URL}/space/draw`, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<SpaceDrawStatus>;
        },

        recordDraw: async () => {
            const response = await fetch(`${BASE_URL}/space/draw`, {
                method: 'POST',
                headers: await getHeaders(),
            });
            return handleResponse(response);
        },

        getMessage: async () => {
            const response = await fetch(`${BASE_URL}/space/message`, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<{ data: SpaceMessage }>;
        },

        postMessage: async (content: string) => {
            const response = await fetch(`${BASE_URL}/space/message`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify({ content }),
            });
            return handleResponse(response) as Promise<{ message: string; data: SpaceMessage }>;
        },

        getLeaderboard: async () => {
            const response = await fetch(`${BASE_URL}/space/leaderboard`, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<{ data: LeaderboardEntry[] }>;
        },
    },

    // ─── Blog Posts ──────────────────────────────────────────────────
    posts: {
        getAll: async (all?: boolean) => {
            const url = all ? `${BASE_URL}/posts?all=true` : `${BASE_URL}/posts`;
            const response = await fetch(url, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<Post[]>;
        },

        getById: async (id: string) => {
            const response = await fetch(`${BASE_URL}/posts/${id}`, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<Post>;
        },

        create: async (post: { title: string; content: string; slug: string; published?: boolean }) => {
            const response = await fetch(`${BASE_URL}/posts`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify(post),
            });
            return handleResponse(response) as Promise<Post>;
        },

        update: async (id: string, updates: Partial<Pick<Post, 'title' | 'content' | 'slug' | 'published' | 'coverImage' | 'excerpt' | 'tags'>>) => {
            const response = await fetch(`${BASE_URL}/posts/${id}`, {
                method: 'PATCH',
                headers: await getHeaders(),
                body: JSON.stringify(updates),
            });
            return handleResponse(response);
        },

        delete: async (id: string) => {
            const response = await fetch(`${BASE_URL}/posts/${id}`, {
                method: 'DELETE',
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<{ message: string }>;
        },
    },

    // ─── Insights ────────────────────────────────────────────────────
    insights: {
        get: async (range: 'week' | 'month' | 'year' = 'week') => {
            const response = await fetch(`${BASE_URL}/insights?range=${range}`, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<InsightsResponse>;
        },
    },

    // ─── Admin ───────────────────────────────────────────────────────
    admin: {
        getStats: async () => {
            const response = await fetch(`${BASE_URL}/admin/stats`, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<AdminStats>;
        },

        updateUser: async (userId: string, updates: Record<string, unknown>) => {
            const response = await fetch(`${BASE_URL}/admin/user`, {
                method: 'PATCH',
                headers: await getHeaders(),
                body: JSON.stringify({ userId, updates }),
            });
            return handleResponse(response);
        },

        deleteUser: async (userId: string) => {
            const response = await fetch(`${BASE_URL}/admin/user`, {
                method: 'DELETE',
                headers: await getHeaders(),
                body: JSON.stringify({ userId }),
            });
            return handleResponse(response);
        },

        broadcastNotification: async (notification: {
            title: string;
            body: string;
            data?: Record<string, unknown>;
            scheduledAt?: string;
        }) => {
            const response = await fetch(`${BASE_URL}/admin/notifications/broadcast`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify(notification),
            });
            return handleResponse(response);
        },

        sendNotificationToUser: async (notification: {
            userId: string;
            title: string;
            body: string;
            type?: 'JOURNAL_REMINDER' | 'STREAK_RECOVERY' | 'TODO_REMINDER' | 'CUSTOM' | 'SYSTEM';
            data?: Record<string, unknown>;
            scheduledAt?: string;
        }) => {
            const response = await fetch(`${BASE_URL}/admin/notifications/send-to-user`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify(notification),
            });
            return handleResponse(response);
        },

        listNotifications: async () => {
            const response = await fetch(`${BASE_URL}/admin/notifications/list`, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<{ notifications: Notification[] }>;
        },
    },

    // ─── Cron Jobs ───────────────────────────────────────────────────
    cron: {
        sendWeeklyReports: async (cronSecret: string) => {
            const response = await fetch(`${BASE_URL}/cron/reports`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${cronSecret}`,
                },
            });
            return handleResponse(response);
        },

        sendReminders: async (cronSecret: string) => {
            const response = await fetch(`${BASE_URL}/cron/reminders`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${cronSecret}`,
                },
            });
            return handleResponse(response) as Promise<{ message: string }>;
        },

        sendTimelyNudges: async (cronSecret: string) => {
            const response = await fetch(`${BASE_URL}/cron/timely-nudges`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${cronSecret}`,
                },
            });
            return handleResponse(response) as Promise<{ message: string }>;
        },

        processScheduledQueue: async (cronSecret: string) => {
            const response = await fetch(`${BASE_URL}/cron/scheduled-queue`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${cronSecret}`,
                },
            });
            return handleResponse(response) as Promise<{ message: string }>;
        },
    },
};
