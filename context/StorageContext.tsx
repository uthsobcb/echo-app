import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, loadServerUrl } from '../service/api';
import { logger } from '../service/logger';
import { setupNotifications } from '../service/NotificationService';
import { tokenStorage } from '../service/tokenStorage';
import { Entry, MoodCreateResponse, Stats, StreakData, User } from '../types/data';

type AppMode = 'local' | 'api';

const ONBOARDING_KEY = 'onboardingComplete';
const USERNAME_KEY = 'userName';
const ONBOARDING_GOALS_KEY = 'onboardingGoals';

interface StorageContextType {
    user: User;
    entries: Entry[];
    stats: Stats;
    isLoading: boolean;
    isAuthenticated: boolean;
    appMode: AppMode;
    loginAsLocal: (userData?: Partial<User>) => Promise<void>;
    loginAsAPI: (credentials: { email: string; password: string }) => Promise<void>;
    registerAPI: (formData: FormData) => Promise<void>;
    logout: () => Promise<void>;
    addEntry: (entry: Omit<Entry, 'id' | 'createdAt'>) => Promise<(Entry & { streakData?: StreakData }) | void>;
    deleteEntry: (id: string) => Promise<void>;
    updateEntry: (id: string, updates: Partial<Entry>) => Promise<void>;
    updateUser: (user: Partial<User> & { currentPassword?: string; newPassword?: string }) => Promise<void>;
    resetData: () => Promise<void>;
    toggleMode: (mode: AppMode) => Promise<void>;
    userName: string;
    onboardingGoals: string[];
    onboardingComplete: boolean;
    completeOnboarding: (data: { userName: string; onboardingGoals: string[] }) => Promise<void>;
}

const defaultUser: User = {
    name: 'Guest',
    isLocal: true,
};

const defaultStats: Stats = {
    entries: 0,
    streak: 0,
    tasks: 0,
};

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User>(defaultUser);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [stats, setStats] = useState<Stats>(defaultStats);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [appMode, setAppMode] = useState<AppMode>('local');
    const [userName, setUserName] = useState('');
    const [onboardingGoals, setOnboardingGoals] = useState<string[]>([]);
    const [onboardingComplete, setOnboardingComplete] = useState(false);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        try {
            await loadServerUrl(); // must run before any request
            const storedMode = await AsyncStorage.getItem('appMode') as AppMode;
            const mode = storedMode || 'local';
            setAppMode(mode);
            const [storedName, storedGoals, storedOnboarding] = await Promise.all([
                AsyncStorage.getItem(USERNAME_KEY),
                AsyncStorage.getItem(ONBOARDING_GOALS_KEY),
                AsyncStorage.getItem(ONBOARDING_KEY),
            ]);
            if (storedName) setUserName(storedName);
            if (storedGoals) setOnboardingGoals(JSON.parse(storedGoals));
            if (storedOnboarding) setOnboardingComplete(storedOnboarding === 'true');
            await loadData(mode);
        } catch (error) {
            logger.error('Failed to initialize', error);
        } finally {
            setIsLoading(false);
        }
    };

    const completeOnboarding = async (data: { userName: string; onboardingGoals: string[] }) => {
        setUserName(data.userName);
        setOnboardingGoals(data.onboardingGoals);
        setOnboardingComplete(true);
        await Promise.all([
            AsyncStorage.setItem(USERNAME_KEY, data.userName),
            AsyncStorage.setItem(ONBOARDING_GOALS_KEY, JSON.stringify(data.onboardingGoals)),
            AsyncStorage.setItem(ONBOARDING_KEY, 'true'),
        ]);
    };

    // Compute streak from entries: count consecutive days up to today
    const computeStreak = (entries: Entry[]): number => {
        if (!entries.length) return 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const uniqueDays = new Set(
            entries.map(e => {
                const d = new Date(e.createdAt);
                d.setHours(0, 0, 0, 0);
                return d.getTime();
            })
        );
        let streak = 0;
        let check = today.getTime();
        while (uniqueDays.has(check)) {
            streak++;
            check -= 86400000;
        }
        return streak;
    };

    const loadData = async (mode: AppMode) => {
        try {
            if (mode === 'api') {
                const token = await tokenStorage.get();
                if (token) {
                    setIsAuthenticated(true);

                    const profileData = await api.profile.get();
                    const userData = profileData.user || profileData;
                    setUser({ ...(userData as User), isLocal: false });

                    const entriesData = await api.entries.getAll();
                    setEntries(Array.isArray(entriesData) ? entriesData : []);

                    const safeEntries = Array.isArray(entriesData) ? entriesData : [];
                    setStats({
                        entries: safeEntries.length,
                        streak: (userData as User)?.streak
                            ?? (userData as User)?.currentStreak
                            ?? computeStreak(safeEntries),
                        tasks: (userData as User)?.tasks ?? 0,
                    });
                } else {
                    setAppMode('local');
                    await loadData('local');
                }
            } else {
                const storedUser = await AsyncStorage.getItem('user');
                const storedEntries = await AsyncStorage.getItem('entries');
                const storedStats = await AsyncStorage.getItem('stats');
                const storedAuth = await AsyncStorage.getItem('isAuthenticated');

                if (storedAuth === 'true') {
                    setIsAuthenticated(true);
                }

                if (storedUser) setUser(JSON.parse(storedUser));
                if (storedEntries) setEntries(JSON.parse(storedEntries));
                if (storedStats) setStats(JSON.parse(storedStats));
            }
        } catch (error) {
            logger.error('Failed to load data', error);
        }
    };

    const saveDataLocal = async (key: string, value: unknown) => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            logger.error(`Failed to save ${key}`, error);
        }
    };

    const addEntry = async (newEntryData: Omit<Entry, 'id' | 'createdAt'>) => {
        if (appMode === 'api') {
            const result: MoodCreateResponse = await api.mood.create(newEntryData.content, newEntryData.imgUrl);
            const entry: Entry & { streakData?: StreakData } = {
                ...newEntryData,
                mood: result.mood,
                score: result.score,
                comment: result.comment,
                createdAt: new Date().toISOString(),
                streakData: result.streakData,
            };
            setEntries([entry, ...entries]);
            setStats(prev => ({
                ...prev,
                entries: prev.entries + 1,
                streak: result.streakData?.currentStreak ?? prev.streak,
            }));
            return entry;
        } else {
            const newEntry: Entry = {
                ...newEntryData,
                id: Date.now().toString(),
                createdAt: Date.now(),
            };
            const updatedEntries = [newEntry, ...entries];
            setEntries(updatedEntries);
            await saveDataLocal('entries', updatedEntries);

            const updatedStats = {
                ...stats,
                entries: stats.entries + 1,
            };
            setStats(updatedStats);
            await saveDataLocal('stats', updatedStats);
            return newEntry;
        }
    };

    const updateUser = async (updatedUser: Partial<User> & { currentPassword?: string; newPassword?: string }) => {
        if (appMode === 'api') {
            const result = await api.profile.update(updatedUser);
            setUser({ ...user, ...result.user });
        } else {
            // Local mode has no password concept — never persist these fields.
            const { currentPassword, newPassword, ...rest } = updatedUser;
            const newUser = { ...user, ...rest };
            setUser(newUser);
            await saveDataLocal('user', newUser);
        }
    };

    const loginAsLocal = async (userData?: Partial<User>) => {
        setAppMode('local');
        setIsAuthenticated(true);
        await AsyncStorage.setItem('appMode', 'local');
        await AsyncStorage.setItem('isAuthenticated', 'true');
        const localUser = { ...defaultUser, ...userData, isLocal: true };
        setUser(localUser);
        await saveDataLocal('user', localUser);
    };

    const loginAsAPI = async (credentials: { email: string; password: string }) => {
        logger.debug('Context: loginAsAPI called');
        try {
            const result = await api.auth.login(credentials);
            logger.debug('Context: login result received');
            if (result.token) {
                await tokenStorage.set(result.token);
                setAppMode('api');
                setIsAuthenticated(true);
                await AsyncStorage.setItem('appMode', 'api');
                await loadData('api');

                // Fetch and save push token after successful API login
                setupNotifications().catch(e => logger.error('Notification setup failed', e));
            }
        } catch (e) {
            logger.error('Context: loginAsAPI error', e);
            throw e;
        }
    };

    const registerAPI = async (formData: FormData) => {
        await api.auth.register(formData);
    };

    const logout = async () => {
        // Attempt to invalidate the server session before clearing local state
        if (appMode === 'api') {
            try {
                await api.auth.logout();
            } catch {
                // Server logout is best-effort; proceed with local cleanup
            }
        }

        setIsAuthenticated(false);
        await AsyncStorage.removeItem('isAuthenticated');
        await tokenStorage.remove();
        await AsyncStorage.removeItem(USERNAME_KEY);
        await AsyncStorage.removeItem(ONBOARDING_GOALS_KEY);
        await AsyncStorage.removeItem(ONBOARDING_KEY);
        setAppMode('local');
        await AsyncStorage.setItem('appMode', 'local');
        setUser(defaultUser);
        setEntries([]);
        setStats(defaultStats);
        setUserName('');
        setOnboardingGoals([]);
        setOnboardingComplete(false);
    };

    const resetData = async () => {
        try {
            await AsyncStorage.clear();
            setUser(defaultUser);
            setEntries([]);
            setStats(defaultStats);
            setAppMode('local');
            setIsAuthenticated(false);
            setUserName('');
            setOnboardingGoals([]);
            setOnboardingComplete(false);
        } catch (e) {
            logger.error('Failed to reset data', e);
        }
    };

    const deleteEntry = async (id: string) => {
        if (appMode === 'api') {
            await api.entries.delete(id);
            setEntries(entries.filter(e => e._id !== id));
            setStats(prev => ({ ...prev, entries: Math.max(0, prev.entries - 1) }));
        } else {
            const updatedEntries = entries.filter(e => e.id !== id);
            setEntries(updatedEntries);
            await saveDataLocal('entries', updatedEntries);

            const updatedStats = {
                ...stats,
                entries: Math.max(0, stats.entries - 1),
            };
            setStats(updatedStats);
            await saveDataLocal('stats', updatedStats);
        }
    };

    const updateEntry = async (id: string, updates: Partial<Entry>) => {
        if (appMode === 'api') {
            const result = await api.entries.update(id, updates);
            setEntries(entries.map(e => (e._id === id ? result : e)));
        } else {
            const updatedEntries = entries.map(e =>
                e.id === id ? { ...e, ...updates } : e
            );
            setEntries(updatedEntries);
            await saveDataLocal('entries', updatedEntries);
        }
    };

    const toggleMode = async (mode: AppMode) => {
        setAppMode(mode);
        await AsyncStorage.setItem('appMode', mode);
        await loadData(mode);
    };

    return (
        <StorageContext.Provider
            value={{
                user,
                entries,
                stats,
                isLoading,
                isAuthenticated,
                appMode,
                loginAsLocal,
                loginAsAPI,
                registerAPI,
                logout,
                addEntry,
                deleteEntry,
                updateEntry,
                updateUser,
                resetData,
                toggleMode,
                userName,
                onboardingGoals,
                onboardingComplete,
                completeOnboarding,
            }}
        >
            {children}
        </StorageContext.Provider>
    );
};

export const useStorage = () => {
    const context = useContext(StorageContext);
    if (!context) {
        throw new Error('useStorage must be used within a StorageProvider');
    }
    return context;
};
