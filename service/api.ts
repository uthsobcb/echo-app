import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, Chat, Entry, SpaceDrawStatus, User } from '../types/data';

const BASE_URL = 'https://echo-next.vercel.app/api';

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
        console.error('API: Error in getHeaders', e);
        throw e;
    }
}

const fetchWithTimeout = async (resource: RequestInfo, options: RequestInit = {}) => {
    const { timeout = 15000 } = options as any;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        throw error;
    }
}

const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.message || data.error || 'Something went wrong');
    }
    return data;
};

export const api = {
    // Auth
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
                console.error('API: Login failed', e);
                throw e;
            }
        },
        register: async (formData: FormData) => {
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: await getHeaders(true),
                body: formData,
            });
            return handleResponse(response) as Promise<{ message: string }>;
        },
        googleLogin: async (idToken: string) => {
            console.log('API: Google Login...');
            try {
                const response = await fetch(`${BASE_URL}/auth/google`, {
                    method: 'POST',
                    headers: await getHeaders(),
                    body: JSON.stringify({ idToken }),
                });
                console.log('API: Google Login Response status:', response.status);
                const data = await handleResponse(response);
                if (data.token) {
                    await AsyncStorage.setItem('token', data.token);
                }
                return data as AuthResponse;
            } catch (e) {
                console.error('API: Google Login failed', e);
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
        resetPassword: async (data: any) => {
            const response = await fetch(`${BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        }
    },

    // Mood & Journal
    mood: {
        create: async (content: string, imgUrl?: string) => {
            const response = await fetch(`${BASE_URL}/mood`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify({ content, imgUrl }),
            });
            return handleResponse(response) as Promise<Entry>;
        },
        getHistory: async () => {
            const response = await fetch(`${BASE_URL}/mood-tracker`, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<{ mood: string; score: number; _id: string; createdAt: string }[]>;
        },
    },

    // Entries
    entries: {
        getAll: async (search?: string, mood?: string) => {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (mood && mood !== 'All') params.set('mood', mood);
            const url = params.toString() ? `${BASE_URL}/entries?${params}` : `${BASE_URL}/entries`;
            const response = await fetch(url, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<Entry[]>;
        },
        getById: async (id: string) => {
            const response = await fetch(`${BASE_URL}/entries/${id}`, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<Entry>;
        },
        update: async (id: string, updates: Partial<Entry>) => {
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
        }
    },

    // Chat
    chat: {
        sendMessage: async (message: string, chatId?: string) => {
            const response = await fetch(`${BASE_URL}/chat`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify({ message, chatId }),
            });
            return handleResponse(response) as Promise<{ message: string; chatId: string }>;
        },
        getHistory: async () => {
            const response = await fetch(`${BASE_URL}/chat`, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<Chat[]>;
        },
        getSession: async (id: string) => {
            const response = await fetch(`${BASE_URL}/chat/${id}`, {
                headers: await getHeaders(),
            });
            return handleResponse(response) as Promise<Chat>;
        }
    },

    // Users
    users: {
        savePushToken: async (token: string) => {
            const response = await fetch(`${BASE_URL}/users/push-token`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify({ token }),
            });
            return handleResponse(response);
        }
    },

    // Profile
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
        }
    },

    // Insights
    insights: {
        get: async (range: 'week' | 'month' | 'year' = 'week') => {
            const response = await fetch(`${BASE_URL}/insights?range=${range}`, {
                headers: await getHeaders(),
            });
            return handleResponse(response);
        }
    },

    // Todo (Not in OpenAPI spec but kept as per plan)
    todo: {
        getAll: async () => {
            const response = await fetch(`${BASE_URL}/todo`, {
                headers: await getHeaders(),
            });
            return handleResponse(response);
        },
        updateStatus: async (moodId: string, status: string) => {
            const response = await fetch(`${BASE_URL}/todo/${moodId}`, {
                method: 'PATCH',
                headers: await getHeaders(),
                body: JSON.stringify({ status }),
            });
            return handleResponse(response);
        },
        delete: async (moodId: string) => {
            const response = await fetch(`${BASE_URL}/todo/${moodId}`, {
                method: 'DELETE',
                headers: await getHeaders(),
            });
            return handleResponse(response);
        }
    },

    // Blog (Not in OpenAPI spec but kept as per plan)
    posts: {
        getAll: async (all?: boolean) => {
            const url = all ? `${BASE_URL}/posts?all=true` : `${BASE_URL}/posts`;
            const response = await fetch(url, {
                headers: await getHeaders(),
            });
            return handleResponse(response);
        },
        getById: async (id: string) => {
            const response = await fetch(`${BASE_URL}/posts/${id}`, {
                headers: await getHeaders(),
            });
            return handleResponse(response);
        }
    },

    // Space
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
            return handleResponse(response);
        },
        postMessage: async (content: string) => {
            const response = await fetch(`${BASE_URL}/space/message`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify({ content }),
            });
            return handleResponse(response);
        },
        getLeaderboard: async () => {
            // Not in OpenAPI spec but kept
            const response = await fetch(`${BASE_URL}/space/leaderboard`, {
                headers: await getHeaders(),
            });
            return handleResponse(response);
        }
    }
};
