'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/src/models/types';
import { getMyInfo } from '@/src/models/api';

interface UserContextType {
    user: User | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    updateUser: (userData: User) => void;
    clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            setLoading(true);
            const userData = await getMyInfo();
            setUser(userData);
        } catch (error) {
            console.error('Failed to fetch user info:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUser = useCallback((userData: User) => {
        setUser(userData);
    }, []);

    const clearUser = useCallback(() => {
        setUser(null);
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    return (
        <UserContext.Provider value={{ user, loading, refreshUser, updateUser, clearUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}