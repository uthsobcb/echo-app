export interface User {
    id?: string;
    _id?: string;
    name: string;
    email?: string;
    image?: string;
    avatar?: string; // Local URI
    subscription?: 'free' | 'plus' | 'admin';
    badge?: string[];
    streak?: number;
    currentStreak?: number;
    tasks?: number;
    wantsWeeklyReport?: boolean;
    createdAt?: string;
    isLocal?: boolean;
}

export interface Entry {
    id?: string;         // Local id
    _id?: string;        // API id
    userId?: string;     // API field
    content: string;
    mood: string;        // E.g. "Happy", "Sad"
    score?: number;      // 1-10
    comment?: string;
    imgUrl?: string;
    todo?: string[] | { todo: string; type?: string; status?: string }[];
    createdAt: number | string; // Timestamp (Local) or ISO date (API)
    date?: string;       // ISO string (Local)
}

export interface ChatMessage {
    role: 'user' | 'ai';
    text: string;
    timestamp: string;
}

export interface LocalMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: number;
    status?: 'sending' | 'sent' | 'error';
}

export interface LocalConversation {
    id: string;
    title: string;
    messages: LocalMessage[];
    createdAt: number;
    updatedAt: number;
}

export interface Chat {
    _id: string;
    userId: string;
    messages: ChatMessage[];
    threadSummary?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface SpaceDrawStatus {
    drawCount: number;
    canDraw: boolean;
    requiresMessage: boolean;
    nextAvailableAt?: string;
}

export interface AuthResponse {
    token?: string;
    message?: string;
    user?: User;
}

export interface Stats {
    entries: number;
    streak: number;
    tasks: number;
}
