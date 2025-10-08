'use client';

import rescueAPI, { Rescue } from '@/app/lib/rescue-api';
import { createContext, useContext, useEffect, useState } from 'react';

interface RescueContextType {
  rescues: Rescue[];
  rescueLoading: boolean;
  refreshRescues: () => Promise<void>;
  addRescue: (rescue: Rescue) => void;
  updateRescue: (id: string, rescue: Rescue) => void;
  removeRescue: (id: string) => void;
}

const RescueContext = createContext<RescueContextType | undefined>(undefined);

export function RescueProvider({ children }: { children: React.ReactNode }) {
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [rescueLoading, setRescueLoading] = useState(true);

  // Fetch all rescues
  const refreshRescues = async () => {
    try {
      setRescueLoading(true);
      const response = await rescueAPI.getAllRescues();
      if (response.success && response.data) {
        setRescues(response.data);
      } else {
        console.error('Failed to fetch rescues:', response.error);
        setRescues([]);
      }
    } catch (error) {
      console.error('Error fetching rescues:', error);
      setRescues([]);
    } finally {
      setRescueLoading(false);
    }
  };

  // Add a new rescue
  const addRescue = (rescue: Rescue) => {
    setRescues((prev) => [rescue, ...prev]);
  };

  // Update an existing rescue
  const updateRescue = (id: string, rescue: Rescue) => {
    setRescues((prev) => prev.map((r) => (r.id === id ? rescue : r)));
  };

  // Remove a rescue
  const removeRescue = (id: string) => {
    setRescues((prev) => prev.filter((r) => r.id !== id));
  };

  // Load rescues on mount
  useEffect(() => {
    refreshRescues();
  }, []);

  return (
    <RescueContext.Provider
      value={{
        rescues,
        rescueLoading,
        refreshRescues,
        addRescue,
        updateRescue,
        removeRescue,
      }}
    >
      {children}
    </RescueContext.Provider>
  );
}

export function useRescue() {
  const context = useContext(RescueContext);
  if (context === undefined) {
    throw new Error('useRescue must be used within a RescueProvider');
  }
  return context;
}
