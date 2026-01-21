export interface User {
    name: string;
    avatar?: string; // Local URI or asset name
    mood: string;
    isLocal?: boolean;
}

export interface Entry {
    id: string;
    content: string;
    mood: string;
    date: string; // ISO string
    createdAt: number; // Timestamp
}

export interface Stats {
    entries: number;
    streak: number;
    tasks: number;
}
