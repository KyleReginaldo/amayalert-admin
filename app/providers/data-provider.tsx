'use client';

import alertsAPI, { Alert } from '@/app/lib/alerts-api';
import evacuationAPI, { EvacuationCenter } from '@/app/lib/evacuation-api';
import usersAPI, { User, UserStats } from '@/app/lib/users-api';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface DataCache {
  alerts: Alert[];
  evacuationCenters: EvacuationCenter[];
  users: User[];
  userStats: UserStats;
  lastUpdated: {
    alerts: number;
    evacuationCenters: number;
    users: number;
    userStats: number;
  };
}

interface DataContextType {
  // Data
  alerts: Alert[];
  evacuationCenters: EvacuationCenter[];
  users: User[];
  userStats: UserStats;

  // Loading states
  alertsLoading: boolean;
  evacuationLoading: boolean;
  usersLoading: boolean;

  // Actions
  refreshAlerts: () => Promise<void>;
  refreshEvacuationCenters: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // CRUD operations
  addAlert: (alert: Alert) => void;
  updateAlert: (id: number, alert: Alert) => void;
  removeAlert: (id: number) => void;

  addEvacuationCenter: (center: EvacuationCenter) => void;
  updateEvacuationCenter: (id: number, center: EvacuationCenter) => void;
  removeEvacuationCenter: (id: number) => void;

  addUser: (user: User) => void;
  updateUser: (id: string, user: User) => void;
  removeUser: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Cache keys
const CACHE_KEYS = {
  DATA_CACHE: 'amayalert_data_cache',
  AUTH_USER: 'amayalert_auth_user',
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Data states
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    adminUsers: 0,
    regularUsers: 0,
    recentUsers: 0,
    userGrowth: 0,
  });

  // Loading states
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [evacuationLoading, setEvacuationLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  // Cache management
  const saveToCache = (data: Partial<DataCache>) => {
    try {
      const existingCache = getFromCache();
      const newCache: DataCache = {
        alerts: data.alerts ?? existingCache?.alerts ?? [],
        evacuationCenters: data.evacuationCenters ?? existingCache?.evacuationCenters ?? [],
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
          alerts: data.alerts ? Date.now() : existingCache?.lastUpdated.alerts ?? 0,
          evacuationCenters: data.evacuationCenters
            ? Date.now()
            : existingCache?.lastUpdated.evacuationCenters ?? 0,
          users: data.users ? Date.now() : existingCache?.lastUpdated.users ?? 0,
          userStats: data.userStats ? Date.now() : existingCache?.lastUpdated.userStats ?? 0,
        },
      };
      localStorage.setItem(CACHE_KEYS.DATA_CACHE, JSON.stringify(newCache));
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  };

  const getFromCache = (): DataCache | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.DATA_CACHE);
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
      setAlerts(cached.alerts);
      setEvacuationCenters(cached.evacuationCenters);
      setUsers(cached.users);
      setUserStats(cached.userStats);

      // Then refresh if cache is stale
      if (!isCacheValid(cached.lastUpdated.alerts)) {
        refreshAlerts();
      }
      if (!isCacheValid(cached.lastUpdated.evacuationCenters)) {
        refreshEvacuationCenters();
      }
      if (!isCacheValid(cached.lastUpdated.users)) {
        refreshUsers();
      }
    } else {
      // No cache, load everything
      refreshAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // API functions
  const refreshAlerts = async () => {
    try {
      setAlertsLoading(true);
      const response = await alertsAPI.getAllAlerts();
      if (response.success && response.data) {
        setAlerts(response.data);
        saveToCache({ alerts: response.data });
      }
    } catch (error) {
      console.error('Failed to refresh alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  };

  const refreshEvacuationCenters = async () => {
    try {
      setEvacuationLoading(true);
      const response = await evacuationAPI.getAllEvacuationCenters();
      if (response.success && response.data) {
        setEvacuationCenters(response.data);
        saveToCache({ evacuationCenters: response.data });
      }
    } catch (error) {
      console.error('Failed to refresh evacuation centers:', error);
    } finally {
      setEvacuationLoading(false);
    }
  };

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

  const refreshAll = async () => {
    await Promise.all([refreshAlerts(), refreshEvacuationCenters(), refreshUsers()]);
  };

  // CRUD operations
  const addAlert = (alert: Alert) => {
    const newAlerts = [alert, ...alerts];
    setAlerts(newAlerts);
    saveToCache({ alerts: newAlerts });
  };

  const updateAlert = (id: number, updatedAlert: Alert) => {
    const newAlerts = alerts.map((alert) => (alert.id === id ? updatedAlert : alert));
    setAlerts(newAlerts);
    saveToCache({ alerts: newAlerts });
  };

  const removeAlert = (id: number) => {
    const newAlerts = alerts.filter((alert) => alert.id !== id);
    setAlerts(newAlerts);
    saveToCache({ alerts: newAlerts });
  };

  const addEvacuationCenter = (center: EvacuationCenter) => {
    const newCenters = [center, ...evacuationCenters];
    setEvacuationCenters(newCenters);
    saveToCache({ evacuationCenters: newCenters });
  };

  const updateEvacuationCenter = (id: number, updatedCenter: EvacuationCenter) => {
    const newCenters = evacuationCenters.map((center) =>
      center.id === id ? updatedCenter : center,
    );
    setEvacuationCenters(newCenters);
    saveToCache({ evacuationCenters: newCenters });
  };

  const removeEvacuationCenter = (id: number) => {
    const newCenters = evacuationCenters.filter((center) => center.id !== id);
    setEvacuationCenters(newCenters);
    saveToCache({ evacuationCenters: newCenters });
  };

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
    alerts,
    evacuationCenters,
    users,
    userStats,

    // Loading states
    alertsLoading,
    evacuationLoading,
    usersLoading,

    // Actions
    refreshAlerts,
    refreshEvacuationCenters,
    refreshUsers,
    refreshAll,

    // CRUD operations
    addAlert,
    updateAlert,
    removeAlert,
    addEvacuationCenter,
    updateEvacuationCenter,
    removeEvacuationCenter,
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
