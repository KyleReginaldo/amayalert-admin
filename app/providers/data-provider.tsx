'use client';

import usersAPI, { User, UserStats } from '@/app/lib/users-api';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface UsersCache {
  users: User[];
  userStats: UserStats;
  lastUpdated: {
    users: number;
    userStats: number;
  };
}

interface DataContextType {
  // Data
  users: User[];
  userStats: UserStats;

  // Loading states
  usersLoading: boolean;

  // Actions
  refreshUsers: () => Promise<void>;

  // CRUD operations
  addUser: (user: User) => void;
  updateUser: (id: string, user: User) => void;
  removeUser: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;
const CACHE_KEY = 'amayalert_users_cache';

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    adminUsers: 0,
    regularUsers: 0,
    recentUsers: 0,
    userGrowth: 0,
  });

  // Loading states
  const [usersLoading, setUsersLoading] = useState(false);

  // Cache management
  const saveToCache = (data: Partial<UsersCache>) => {
    try {
      const existingCache = getFromCache();
      const newCache: UsersCache = {
        users: data.users ?? existingCache?.users ?? [],
        userStats: data.userStats ??
          existingCache?.userStats ?? {
            totalUsers: 0,
            adminUsers: 0,
            regularUsers: 0,
            recentUsers: 0,
            userGrowth: 0,
          },
        lastUpdated: {
          users: data.users ? Date.now() : existingCache?.lastUpdated.users ?? 0,
          userStats: data.userStats ? Date.now() : existingCache?.lastUpdated.userStats ?? 0,
        },
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  };

  const getFromCache = (): UsersCache | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get from cache:', error);
      return null;
    }
  };

  const isCacheValid = (lastUpdated: number): boolean => {
    return Date.now() - lastUpdated < CACHE_DURATION;
  };

  // Load cached data on mount
  useEffect(() => {
    const cached = getFromCache();
    if (cached) {
      // Always load cached data first for instant UI
      setUsers(cached.users);
      setUserStats(cached.userStats);

      // Then refresh if cache is stale
      if (!isCacheValid(cached.lastUpdated.users)) {
        refreshUsers();
      }
    } else {
      // No cache, load everything
      refreshUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshUsers = async () => {
    try {
      setUsersLoading(true);
      const [usersResponse, statsResponse] = await Promise.all([
        usersAPI.getAllUsers(),
        usersAPI.getUserStats(),
      ]);

      if (usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data);
        saveToCache({ users: usersResponse.data });
      }

      if (statsResponse) {
        setUserStats(statsResponse);
        saveToCache({ userStats: statsResponse });
      }
    } catch (error) {
      console.error('Failed to refresh users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  // CRUD operations
  const addUser = (user: User) => {
    const newUsers = [user, ...users];
    setUsers(newUsers);
    saveToCache({ users: newUsers });
  };

  const updateUser = (id: string, updatedUser: User) => {
    const newUsers = users.map((user) => (user.id === id ? updatedUser : user));
    setUsers(newUsers);
    saveToCache({ users: newUsers });
  };

  const removeUser = (id: string) => {
    const newUsers = users.filter((user) => user.id !== id);
    setUsers(newUsers);
    saveToCache({ users: newUsers });
  };

  const value: DataContextType = {
    // Data
    users,
    userStats,

    // Loading states
    usersLoading,

    // Actions
    refreshUsers,

    // CRUD operations
    addUser,
    updateUser,
    removeUser,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
