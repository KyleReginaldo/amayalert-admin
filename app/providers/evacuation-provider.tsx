'use client';

import evacuationAPI, { EvacuationCenter } from '@/app/lib/evacuation-api';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface EvacuationContextType {
  // Data
  evacuationCenters: EvacuationCenter[];

  // Loading state
  evacuationLoading: boolean;

  // Actions
  refreshEvacuationCenters: () => Promise<void>;

  // CRUD operations
  addEvacuationCenter: (center: EvacuationCenter) => void;
  updateEvacuationCenter: (id: number, center: EvacuationCenter) => void;
  removeEvacuationCenter: (id: number) => void;
}

const EvacuationContext = createContext<EvacuationContextType | undefined>(undefined);

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;
const CACHE_KEY = 'amayalert_evacuation_cache';

interface EvacuationCache {
  evacuationCenters: EvacuationCenter[];
  lastUpdated: number;
}

export function EvacuationProvider({ children }: { children: React.ReactNode }) {
  const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[]>([]);
  const [evacuationLoading, setEvacuationLoading] = useState(false);

  // Cache management
  const saveToCache = (evacuationData: EvacuationCenter[]) => {
    try {
      const cache: EvacuationCache = {
        evacuationCenters: evacuationData,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to save evacuation centers to cache:', error);
    }
  };

  const getFromCache = (): EvacuationCache | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get evacuation centers from cache:', error);
      return null;
    }
  };

  const isCacheValid = (lastUpdated: number): boolean => {
    return Date.now() - lastUpdated < CACHE_DURATION;
  };

  // Load cached data on mount
  useEffect(() => {
    const loadData = async () => {
      const cached = getFromCache();
      if (cached) {
        // Always load cached data first for instant UI
        setEvacuationCenters(cached.evacuationCenters);

        // Then refresh if cache is stale
        if (!isCacheValid(cached.lastUpdated)) {
          await refreshEvacuationCenters();
        }
      } else {
        // No cache, load data
        await refreshEvacuationCenters();
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // API functions
  const refreshEvacuationCenters = async () => {
    try {
      console.log('🔄 Starting evacuation centers fetch...');
      setEvacuationLoading(true);
      const response = await evacuationAPI.getAllEvacuationCenters();

      if (response.success && response.data) {
        console.log('✅ Evacuation centers fetched successfully:', response.data.length, 'centers');
        setEvacuationCenters(response.data);
        saveToCache(response.data);
      } else {
        // Handle case where response is not successful
        console.error('❌ Failed to fetch evacuation centers:', response);
        // Keep existing data if available, don't clear it
      }
    } catch (error) {
      console.error('💥 Error refreshing evacuation centers:', error);
      // Don't clear existing data on error, just log it
    } finally {
      // Always set loading to false, regardless of success or error
      console.log('🏁 Setting evacuation loading to false');
      setEvacuationLoading(false);
    }
  };

  // CRUD operations
  const addEvacuationCenter = (center: EvacuationCenter) => {
    const newCenters = [center, ...evacuationCenters];
    setEvacuationCenters(newCenters);
    saveToCache(newCenters);
  };

  const updateEvacuationCenter = (id: number, updatedCenter: EvacuationCenter) => {
    const newCenters = evacuationCenters.map((center) =>
      center.id === id ? updatedCenter : center,
    );
    setEvacuationCenters(newCenters);
    saveToCache(newCenters);
  };

  const removeEvacuationCenter = (id: number) => {
    const newCenters = evacuationCenters.filter((center) => center.id !== id);
    setEvacuationCenters(newCenters);
    saveToCache(newCenters);
  };

  const value: EvacuationContextType = {
    // Data
    evacuationCenters,

    // Loading state
    evacuationLoading,

    // Actions
    refreshEvacuationCenters,

    // CRUD operations
    addEvacuationCenter,
    updateEvacuationCenter,
    removeEvacuationCenter,
  };

  return <EvacuationContext.Provider value={value}>{children}</EvacuationContext.Provider>;
}

export function useEvacuation() {
  const context = useContext(EvacuationContext);
  if (context === undefined) {
    throw new Error('useEvacuation must be used within an EvacuationProvider');
  }
  return context;
}
