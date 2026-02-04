export interface User {
    id?: string;
    _id?: string;
    name: string;
    email?: string;
    avatar?: string; // Local URI or asset name
    image?: string;  // API field
    mood?: string;
    isLocal?: boolean;
    subscription?: 'free' | 'plus' | 'admin';
    badge?: string[];
}

export interface Entry {
    id?: string;     // Local id
    _id?: string;    // API id
    content: string;
    mood: string;
    date?: string;   // ISO string (Local)
    createdAt: number | string; // Timestamp (Local) or ISO date (API)
    score?: number;
    comment?: string;
    imgUrl?: string;
    todo?: string[];
}

export interface Stats {
    entries: number;
    streak: number;
    tasks: number;
}
