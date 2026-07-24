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
    maxStreak?: number;
    totalXp?: number;
    lastEntryDate?: string;
    timezone?: string;
    pushToken?: string;
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

export interface StreakData {
    currentStreak: number;
    totalXp: number;
    milestone: string | null;
}

export interface MoodCreateResponse {
    message: string;
    mood: string;
    comment: string;
    score: number;
    todo: { todo: string; type?: string; status?: string }[];
    streakData: StreakData;
}

export interface Todo {
    _id: string;
    userId: string;
    todo: string;
    type?: string;
    status: 'pending' | 'in progress' | 'completed';
    createdAt: string;
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

export interface ChatSendResponse {
    reply: string;
    chatId: string;
    messages: ChatMessage[];
}

export interface InsightsResponse {
    stats: {
        totalEntries: number;
        currentStreak: number;
        bestStreak: number;
        avgWordCount: number;
    };
    moodTimeline: { day: string; date: string; mood: string; score: number }[];
    writingTrend: { label: string; count: number }[];
    weeklyEntries: { label: string; count: number }[];
    topTopics: { topic: string; count: number }[];
    commonWords: { word: string; frequency: number }[];
    activityCalendar: { date: string; hasEntry: boolean }[];
    aiInsights: string[];
    writingTrendComparison: string;
    badgeProgress: {
        earned: string[];
        nextBadge: string | null;
        nextBadgeAt: number | null;
        entriesUntilNext: number;
        milestones: { name: string; threshold: number; earned: boolean }[];
    };
    xpStatus: {
        totalXp: number;
        currentStreak: number;
        maxStreak: number;
        subscription: string;
    };
}

// ─── Gamification ────────────────────────────────────────────────

export interface GamificationState {
    totalXp: number;
    currentLevel: number;
    xpInCurrentLevel: number;
    xpToNextLevel: number;
    xpProgress: number; // 0–1
    currentStreak: number;
    maxStreak: number;
    hasJournaledToday: boolean;
    streakAtRisk: boolean;
    earnedBadges: string[];
    nextBadge: string | null;
    nextBadgeAt: number | null;
    entriesUntilNextBadge: number;
    dailyGoalMet: boolean;
    totalEntries: number;
}

export type CelebrationType =
    | { type: 'xp_gain'; amount: number }
    | { type: 'streak_update'; days: number }
    | { type: 'streak_milestone'; days: number; milestone: string }
    | { type: 'badge_unlock'; badge: string }
    | { type: 'level_up'; newLevel: number; previousLevel: number }
    | { type: 'daily_goal_complete' };

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
