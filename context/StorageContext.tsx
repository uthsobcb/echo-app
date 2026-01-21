import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Entry, Stats, User } from '../types/data';

interface StorageContextType {
    user: User;
    entries: Entry[];
    stats: Stats;
    isLoading: boolean;
    isAuthenticated: boolean;
    loginAsLocal: (userData?: Partial<User>) => Promise<void>;
    logout: () => Promise<void>;
    addEntry: (entry: Omit<Entry, 'id' | 'createdAt'>) => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    updateEntry: (id: string, updates: Partial<Entry>) => Promise<void>;
    updateUser: (user: Partial<User>) => Promise<void>;
    resetData: () => Promise<void>;
}

const defaultUser: User = {
    name: 'Guest',
    mood: 'Neutral 😐',
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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            const storedEntries = await AsyncStorage.getItem('entries');
            const storedStats = await AsyncStorage.getItem('stats');
            const storedAuth = await AsyncStorage.getItem('isAuthenticated');

            if (storedAuth === 'true') {
                setIsAuthenticated(true);
            }

            if (storedUser) setUser(JSON.parse(storedUser));
            if (storedEntries) {
                const parsedEntries = JSON.parse(storedEntries);
                setEntries(parsedEntries);
                // Recalculate basic stats on load if needed, or trust stored stats
                // holding off on complex stats logic for now
            }
            if (storedStats) setStats(JSON.parse(storedStats));
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveData = async (key: string, value: any) => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Failed to save ${key}`, error);
        }
    };

    const addEntry = async (newEntryData: Omit<Entry, 'id' | 'createdAt'>) => {
        const newEntry: Entry = {
            ...newEntryData,
            id: Date.now().toString(),
            createdAt: Date.now(),
        };

        const updatedEntries = [newEntry, ...entries];
        setEntries(updatedEntries);
        await saveData('entries', updatedEntries);

        // Update stats
        const updatedStats = {
            ...stats,
            entries: stats.entries + 1,
            // Simple streak logic: if last entry was yesterday or today
            // For now just increment entries
        };
        setStats(updatedStats);
        await saveData('stats', updatedStats);
    };

    const updateUser = async (updatedUser: Partial<User>) => {
        const newUser = { ...user, ...updatedUser };
        setUser(newUser);
        await saveData('user', newUser);
    };

    const loginAsLocal = async (userData?: Partial<User>) => {
        setIsAuthenticated(true);
        await AsyncStorage.setItem('isAuthenticated', 'true');
        const localUser = { ...defaultUser, ...userData, isLocal: true };
        setUser(localUser);
        await saveData('user', localUser);
    };

    const logout = async () => {
        setIsAuthenticated(false);
        await AsyncStorage.removeItem('isAuthenticated');
    };

    const resetData = async () => {
        try {
            await AsyncStorage.clear();
            setUser(defaultUser);
            setEntries([]);
            setStats(defaultStats);
        } catch (e) {
            console.error(e);
        }
    };

    const deleteEntry = async (id: string) => {
        const updatedEntries = entries.filter(e => e.id !== id);
        setEntries(updatedEntries);
        await saveData('entries', updatedEntries);

        // Update stats
        const updatedStats = {
            ...stats,
            entries: Math.max(0, stats.entries - 1),
        };
        setStats(updatedStats);
        await saveData('stats', updatedStats);
    };

    const updateEntry = async (id: string, updates: Partial<Entry>) => {
        const updatedEntries = entries.map(e =>
            e.id === id ? { ...e, ...updates } : e
        );
        setEntries(updatedEntries);
        await saveData('entries', updatedEntries);
    };

    return (
        <StorageContext.Provider
            value={{
                user,
                entries,
                stats,
                isLoading,
                isAuthenticated,
                loginAsLocal,
                logout,
                addEntry,
                deleteEntry,
                updateEntry,
                updateUser,
                resetData,
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
