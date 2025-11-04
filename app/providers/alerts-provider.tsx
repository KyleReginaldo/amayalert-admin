'use client';

import alertsAPI, { Alert } from '@/app/lib/alerts-api';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AlertsContextType {
  // Data
  alerts: Alert[];

  // Loading state
  alertsLoading: boolean;

  // Actions
  refreshAlerts: () => Promise<void>;

  // CRUD operations
  addAlert: (alert: Alert) => void;
  updateAlert: (id: number, alert: Alert) => void;
  removeAlert: (id: number) => void;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;
const CACHE_KEY = 'amayalert_alerts_cache';

interface AlertsCache {
  alerts: Alert[];
  lastUpdated: number;
}

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Cache management
  const saveToCache = (alertsData: Alert[]) => {
    try {
      const cache: AlertsCache = {
        alerts: alertsData,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to save alerts to cache:', error);
    }
  };

  const getFromCache = (): AlertsCache | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get alerts from cache:', error);
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

      // Then refresh if cache is stale
      if (!isCacheValid(cached.lastUpdated)) {
        refreshAlerts();
      }
    } else {
      // No cache, load data
      refreshAlerts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // API functions
  const refreshAlerts = async () => {
    try {
      console.log('🔄 Starting alerts refresh...');
      setAlertsLoading(true);
      const response = await alertsAPI.getAllAlerts();

      if (response.success && response.data) {
        console.log(`✅ Successfully loaded ${response.data.length} alerts`);
        setAlerts(response.data);
        saveToCache(response.data);
      } else {
        console.error('❌ Failed to fetch alerts:', response);
        // Keep existing alerts if API call fails
      }
    } catch (error) {
      console.error('❌ Error refreshing alerts:', error);
      // Keep existing alerts if API call fails
    } finally {
      console.log('🏁 Alerts refresh completed, setting loading to false');
      setAlertsLoading(false);
    }
  };

  // CRUD operations
  const addAlert = (alert: Alert) => {
    const newAlerts = [alert, ...alerts];
    setAlerts(newAlerts);
    saveToCache(newAlerts);
  };

  const updateAlert = (id: number, updatedAlert: Alert) => {
    const newAlerts = alerts.map((alert) => (alert.id === id ? updatedAlert : alert));
    setAlerts(newAlerts);
    saveToCache(newAlerts);
  };

  const removeAlert = (id: number) => {
    const newAlerts = alerts.filter((alert) => alert.id !== id);
    setAlerts(newAlerts);
    saveToCache(newAlerts);
  };

  const value: AlertsContextType = {
    // Data
    alerts,

    // Loading state
    alertsLoading,

    // Actions
    refreshAlerts,

    // CRUD operations
    addAlert,
    updateAlert,
    removeAlert,
  };

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
}
