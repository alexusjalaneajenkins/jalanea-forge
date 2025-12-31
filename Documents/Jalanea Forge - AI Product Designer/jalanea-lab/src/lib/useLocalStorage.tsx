'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProjectData } from './types';
import initialData from '@/data/projects.json';

const STORAGE_KEY = 'jalanea-lab-data';

export function useLocalStorage() {
  const [data, setData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ProjectData;
        // Merge with initial data to ensure new fields are added
        setData({
          ...initialData,
          ...parsed,
          // Ensure internalTools exists
          internalTools: parsed.internalTools || initialData.internalTools,
        } as ProjectData);
      } else {
        setData(initialData as ProjectData);
      }
    } catch {
      setData(initialData as ProjectData);
    }
    setIsLoading(false);
  }, []);

  // Save data to localStorage whenever it changes
  const saveData = useCallback((newData: ProjectData) => {
    setData(newData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, []);

  // Update a specific section
  const updateSection = useCallback(<K extends keyof ProjectData>(
    section: K,
    updater: (current: ProjectData[K]) => ProjectData[K]
  ) => {
    if (!data) return;
    const newData = {
      ...data,
      [section]: updater(data[section]),
    };
    saveData(newData);
  }, [data, saveData]);

  // Add activity entry
  const addActivity = useCallback((
    type: 'experiment' | 'client' | 'deploy' | 'tool' | 'note',
    action: string,
    target: string
  ) => {
    if (!data) return;
    const newActivity = {
      id: Date.now().toString(),
      type,
      action,
      target,
      timestamp: new Date().toISOString(),
    };
    const newData = {
      ...data,
      activity: [newActivity, ...data.activity.slice(0, 19)], // Keep last 20
    };
    saveData(newData);
  }, [data, saveData]);

  // Recalculate stats based on current data
  const recalculateStats = useCallback(() => {
    if (!data) return;
    const lab = data.lab;
    const newStats = {
      totalProjects: lab.length,
      activeExperiments: lab.filter(p => p.status === 'building' || p.status === 'testing').length,
      liveProducts: lab.filter(p => p.status === 'graduated').length,
      ideasInQueue: lab.filter(p => p.status === 'idea').length,
    };
    const newData = { ...data, stats: newStats };
    saveData(newData);
  }, [data, saveData]);

  // Export data as JSON
  const exportData = useCallback(() => {
    if (!data) return;
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jalanea-lab-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data]);

  // Import data from JSON
  const importData = useCallback((jsonData: ProjectData) => {
    saveData(jsonData);
  }, [saveData]);

  // Reset to initial data
  const resetData = useCallback(() => {
    saveData(initialData as ProjectData);
  }, [saveData]);

  return {
    data,
    isLoading,
    saveData,
    updateSection,
    addActivity,
    recalculateStats,
    exportData,
    importData,
    resetData,
  };
}

// Create a context for global data access
import { createContext, useContext, ReactNode } from 'react';

interface DataContextType {
  data: ProjectData | null;
  isLoading: boolean;
  saveData: (data: ProjectData) => void;
  updateSection: <K extends keyof ProjectData>(
    section: K,
    updater: (current: ProjectData[K]) => ProjectData[K]
  ) => void;
  addActivity: (
    type: 'experiment' | 'client' | 'deploy' | 'tool' | 'note',
    action: string,
    target: string
  ) => void;
  recalculateStats: () => void;
  exportData: () => void;
  importData: (data: ProjectData) => void;
  resetData: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const storage = useLocalStorage();

  return (
    <DataContext.Provider value={storage}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
