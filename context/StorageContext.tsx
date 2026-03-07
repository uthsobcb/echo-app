import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../service/api';
import { setupNotifications } from '../service/NotificationService';
import { Entry, Stats, User } from '../types/data';

type AppMode = 'local' | 'api';

interface StorageContextType {
    user: User;
    entries: Entry[];
    stats: Stats;
    isLoading: boolean;
    isAuthenticated: boolean;
    appMode: AppMode;
    loginAsLocal: (userData?: Partial<User>) => Promise<void>;
    loginAsAPI: (credentials: { email: string; password: any }) => Promise<void>;
    loginWithGoogle: (idToken: string) => Promise<void>;
    registerAPI: (formData: FormData) => Promise<void>;
    logout: () => Promise<void>;
    addEntry: (entry: Omit<Entry, 'id' | 'createdAt'>) => Promise<Entry | void>;
    deleteEntry: (id: string) => Promise<void>;
    updateEntry: (id: string, updates: Partial<Entry>) => Promise<void>;
    updateUser: (user: Partial<User>) => Promise<void>;
    resetData: () => Promise<void>;
    toggleMode: (mode: AppMode) => Promise<void>;
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

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        try {
            const storedMode = await AsyncStorage.getItem('appMode') as AppMode;
            const mode = storedMode || 'local';
            setAppMode(mode);
            await loadData(mode);
        } catch (error) {
            console.error('Failed to initialize', error);
        } finally {
            setIsLoading(false);
        }
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
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    setIsAuthenticated(true);
                    const profileData = await api.profile.get();
                    setUser({ ...profileData.user, isLocal: false });

                    const entriesData = await api.entries.getAll();
                    setEntries(entriesData);

                    setStats({
                        entries: entriesData.length,
                        streak: profileData.user?.streak
                            ?? profileData.user?.currentStreak
                            ?? computeStreak(entriesData),
                        tasks: profileData.user?.tasks ?? 0,
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
            console.error('Failed to load data', error);
        }
    };

    const saveDataLocal = async (key: string, value: any) => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Failed to save ${key}`, error);
        }
    };

    const addEntry = async (newEntryData: Omit<Entry, 'id' | 'createdAt'>) => {
        if (appMode === 'api') {
            const result = await api.mood.create(newEntryData.content, newEntryData.imgUrl);
            setEntries([result, ...entries]);
            setStats(prev => ({ ...prev, entries: prev.entries + 1 }));
            return result;
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

    const updateUser = async (updatedUser: Partial<User>) => {
        if (appMode === 'api') {
            const result = await api.profile.update(updatedUser);
            setUser({ ...user, ...result.user });
        } else {
            const newUser = { ...user, ...updatedUser };
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

    const loginAsAPI = async (credentials: { email: string; password: any }) => {
        console.log('Context: loginAsAPI called');
        try {
            const result = await api.auth.login(credentials);
            console.log('Context: login result received within loginAsAPI', result);
            if (result.token) {
                console.log('Context: Token found, saving matches...');
                await AsyncStorage.setItem('token', result.token);
                setAppMode('api');
                setIsAuthenticated(true);
                await AsyncStorage.setItem('appMode', 'api');
                console.log('Context: Loading initial data...');
                await loadData('api');
                console.log('Context: Data loaded successfully');

                // Fetch and save push token after successful API login
                setupNotifications().catch(console.error);
            } else {
                console.log('Context: No token in result');
            }
        } catch (e) {
            console.error('Context: loginAsAPI error', e);
            throw e;
        }
    };

    const loginWithGoogle = async (idToken: string) => {
        console.log('Context: loginWithGoogle called');
        try {
            const result = await api.auth.googleLogin(idToken);
            if (result.token) {
                await AsyncStorage.setItem('token', result.token);
                setAppMode('api');
                setIsAuthenticated(true);
                await AsyncStorage.setItem('appMode', 'api');
                await loadData('api');

                // Fetch and save push token after successful Google login
                setupNotifications().catch(console.error);
            }
        } catch (e) {
            console.error('Context: loginWithGoogle error', e);
            throw e;
        }
    };

    const registerAPI = async (formData: FormData) => {
        await api.auth.register(formData);
    };

    const logout = async () => {
        setIsAuthenticated(false);
        await AsyncStorage.removeItem('isAuthenticated');
        await AsyncStorage.removeItem('token');
        setAppMode('local');
        await AsyncStorage.setItem('appMode', 'local');
        setUser(defaultUser);
        setEntries([]);
        setStats(defaultStats);
    };

    const resetData = async () => {
        try {
            await AsyncStorage.clear();
            setUser(defaultUser);
            setEntries([]);
            setStats(defaultStats);
            setAppMode('local');
            setIsAuthenticated(false);
        } catch (e) {
            console.error(e);
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
                loginWithGoogle,
                registerAPI,
                logout,
                addEntry,
                deleteEntry,
                updateEntry,
                updateUser,
                resetData,
                toggleMode,
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
