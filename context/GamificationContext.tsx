import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../service/api';
import { logger } from '../service/logger';
import { scheduleStreakAtRiskNudge, scheduleBadgeProximityNudge } from '../service/NotificationService';
import { CelebrationType, GamificationState, StreakData } from '../types/data';
import { useStorage } from './StorageContext';

const XP_PER_LEVEL = 100;

function computeLevel(totalXp: number) {
    const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
    const xpInCurrentLevel = totalXp % XP_PER_LEVEL;
    return {
        currentLevel: level,
        xpInCurrentLevel,
        xpToNextLevel: XP_PER_LEVEL,
        xpProgress: xpInCurrentLevel / XP_PER_LEVEL,
    };
}

function isToday(dateStr?: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
    );
}

function isStreakAtRisk(lastEntryDate?: string): boolean {
    if (!lastEntryDate) return false;
    const last = new Date(lastEntryDate).getTime();
    const now = Date.now();
    const hoursSince = (now - last) / (1000 * 60 * 60);
    // At risk if 18+ hours since last entry and hasn't journaled today
    return hoursSince >= 18 && !isToday(lastEntryDate);
}

interface GamificationContextType {
    state: GamificationState;
    celebrations: CelebrationType[];
    consumeCelebration: () => CelebrationType | undefined;
    handleEntryCreated: (streakData: StreakData) => void;
    refresh: () => Promise<void>;
}

const defaultState: GamificationState = {
    totalXp: 0,
    currentLevel: 1,
    xpInCurrentLevel: 0,
    xpToNextLevel: XP_PER_LEVEL,
    xpProgress: 0,
    currentStreak: 0,
    maxStreak: 0,
    hasJournaledToday: false,
    streakAtRisk: false,
    earnedBadges: [],
    nextBadge: null,
    nextBadgeAt: null,
    entriesUntilNextBadge: 0,
    dailyGoalMet: false,
    totalEntries: 0,
};

const GamificationContext = createContext<GamificationContextType>({
    state: defaultState,
    celebrations: [],
    consumeCelebration: () => undefined,
    handleEntryCreated: () => {},
    refresh: async () => {},
});

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, stats, appMode, entries } = useStorage();
    const [state, setState] = useState<GamificationState>(defaultState);
    const [celebrations, setCelebrations] = useState<CelebrationType[]>([]);
    const previousLevelRef = useRef(1);

    const refresh = useCallback(async () => {
        if (appMode !== 'api') {
            // Local mode: derive from local data
            const totalXp = stats.entries * 10;
            const level = computeLevel(totalXp);
            setState({
                ...defaultState,
                ...level,
                totalXp,
                currentStreak: stats.streak,
                totalEntries: stats.entries,
                hasJournaledToday: entries.length > 0 && isToday(
                    typeof entries[0].createdAt === 'string' ? entries[0].createdAt : new Date(entries[0].createdAt).toISOString()
                ),
                dailyGoalMet: entries.length > 0 && isToday(
                    typeof entries[0].createdAt === 'string' ? entries[0].createdAt : new Date(entries[0].createdAt).toISOString()
                ),
            });
            return;
        }

        try {
            const insights = await api.insights.get('week');
            const xp = insights.xpStatus?.totalXp ?? user.totalXp ?? 0;
            const level = computeLevel(xp);
            const streak = insights.xpStatus?.currentStreak ?? user.currentStreak ?? stats.streak;
            const maxStr = insights.xpStatus?.maxStreak ?? user.maxStreak ?? streak;
            const journaledToday = isToday(user.lastEntryDate);
            const badge = insights.badgeProgress ?? { earned: [], nextBadge: null, nextBadgeAt: null, entriesUntilNext: 0, milestones: [] };

            previousLevelRef.current = level.currentLevel;

            setState({
                totalXp: xp,
                ...level,
                currentStreak: streak,
                maxStreak: maxStr,
                hasJournaledToday: journaledToday,
                streakAtRisk: isStreakAtRisk(user.lastEntryDate),
                earnedBadges: badge.earned ?? user.badge ?? [],
                nextBadge: badge.nextBadge,
                nextBadgeAt: badge.nextBadgeAt,
                entriesUntilNextBadge: badge.entriesUntilNext ?? 0,
                dailyGoalMet: journaledToday,
                totalEntries: insights.stats?.totalEntries ?? stats.entries,
            });

            // Schedule notifications based on state
            if (isStreakAtRisk(user.lastEntryDate) && !journaledToday && streak > 0) {
                scheduleStreakAtRiskNudge(streak).catch(() => {});
            }
            if (badge.nextBadge && badge.entriesUntilNext <= 3 && badge.entriesUntilNext > 0) {
                scheduleBadgeProximityNudge(badge.nextBadge, badge.entriesUntilNext).catch(() => {});
            }
        } catch (e) {
            logger.error('[Gamification] Failed to refresh', e);
            // Fallback to user/stats data
            const xp = user.totalXp ?? 0;
            const level = computeLevel(xp);
            setState(prev => ({
                ...prev,
                totalXp: xp,
                ...level,
                currentStreak: user.currentStreak ?? stats.streak,
                maxStreak: user.maxStreak ?? stats.streak,
                hasJournaledToday: isToday(user.lastEntryDate),
                streakAtRisk: isStreakAtRisk(user.lastEntryDate),
                earnedBadges: user.badge ?? [],
                totalEntries: stats.entries,
            }));
        }
    }, [appMode, user, stats, entries]);

    useEffect(() => {
        refresh();
    }, [appMode, user.totalXp, user.currentStreak, stats.entries]);

    const handleEntryCreated = useCallback((streakData: StreakData) => {
        const newXp = streakData.totalXp;
        const prevLevel = previousLevelRef.current;
        const newLevel = computeLevel(newXp);

        const newCelebrations: CelebrationType[] = [];

        // XP gain
        const xpGained = newXp - state.totalXp;
        if (xpGained > 0) {
            newCelebrations.push({ type: 'xp_gain', amount: xpGained });
        }

        // Streak update
        if (streakData.currentStreak > 0) {
            newCelebrations.push({ type: 'streak_update', days: streakData.currentStreak });
        }

        // Streak milestone
        if (streakData.milestone) {
            newCelebrations.push({
                type: 'streak_milestone',
                days: streakData.currentStreak,
                milestone: streakData.milestone,
            });
        }

        // Level up
        if (newLevel.currentLevel > prevLevel) {
            newCelebrations.push({
                type: 'level_up',
                newLevel: newLevel.currentLevel,
                previousLevel: prevLevel,
            });
        }

        // Daily goal
        if (!state.dailyGoalMet) {
            newCelebrations.push({ type: 'daily_goal_complete' });
        }

        previousLevelRef.current = newLevel.currentLevel;

        setState(prev => ({
            ...prev,
            totalXp: newXp,
            ...newLevel,
            currentStreak: streakData.currentStreak,
            hasJournaledToday: true,
            dailyGoalMet: true,
            streakAtRisk: false,
            totalEntries: prev.totalEntries + 1,
        }));

        setCelebrations(prev => [...prev, ...newCelebrations]);
    }, [state.totalXp, state.dailyGoalMet]);

    const consumeCelebration = useCallback(() => {
        let consumed: CelebrationType | undefined;
        setCelebrations(prev => {
            if (prev.length === 0) return prev;
            consumed = prev[0];
            return prev.slice(1);
        });
        return consumed;
    }, []);

    return (
        <GamificationContext.Provider value={{ state, celebrations, consumeCelebration, handleEntryCreated, refresh }}>
            {children}
        </GamificationContext.Provider>
    );
};

export const useGamification = () => useContext(GamificationContext);
