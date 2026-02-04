import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://my-echo.space/api';

async function getHeaders(isMultipart = false) {
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
}

const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || data.error || 'Something went wrong');
    }
    return data;
};

export const api = {
    // Auth
    auth: {
        login: async (credentials: any) => {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify(credentials),
            });
            const data = await handleResponse(response);
            if (data.token) {
                await AsyncStorage.setItem('token', data.token);
            }
            return data;
        },
        register: async (formData: FormData) => {
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: await getHeaders(true),
                body: formData,
            });
            return handleResponse(response);
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
            return handleResponse(response);
        },
        getHistory: async () => {
            const response = await fetch(`${BASE_URL}/mood-tracker`, {
                headers: await getHeaders(),
            });
            return handleResponse(response);
        }
    },

    // Entries
    entries: {
        getAll: async (search?: string) => {
            const url = search ? `${BASE_URL}/entries?search=${encodeURIComponent(search)}` : `${BASE_URL}/entries`;
            const response = await fetch(url, {
                headers: await getHeaders(),
            });
            return handleResponse(response);
        },
        getById: async (id: string) => {
            const response = await fetch(`${BASE_URL}/entries/${id}`, {
                headers: await getHeaders(),
            });
            return handleResponse(response);
        },
        update: async (id: string, updates: any) => {
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
            return handleResponse(response);
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
            return handleResponse(response);
        },
        getHistory: async () => {
            const response = await fetch(`${BASE_URL}/chat`, {
                headers: await getHeaders(),
            });
            return handleResponse(response);
        },
        getSession: async (id: string) => {
            const response = await fetch(`${BASE_URL}/chat/${id}`, {
                headers: await getHeaders(),
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
            return handleResponse(response);
        },
        update: async (updates: any) => {
            const response = await fetch(`${BASE_URL}/profile`, {
                method: 'PUT',
                headers: await getHeaders(),
                body: JSON.stringify(updates),
            });
            return handleResponse(response);
        }
    },

    // Todo
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

    // Blog
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
            return handleResponse(response);
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
            const response = await fetch(`${BASE_URL}/space/leaderboard`, {
                headers: await getHeaders(),
            });
            return handleResponse(response);
        }
    }
};
