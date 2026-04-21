
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useSupabaseJobs } from '@/hooks/useSupabaseJobs';
import { TabType, Job, JobStatus } from '@/types';

interface AppContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  jobs: Job[];
  loading: boolean;
  error: string | null;
  fetchJobs: (force?: boolean) => Promise<void>;
  addJob: (jobData: Omit<Job, 'id'>) => Promise<Job | null>;
  updateJob: (id: string, jobData: Partial<Job>) => Promise<boolean>;
  deleteJob: (id: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType>({
  activeTab: 'home',
  setActiveTab: () => {},
  jobs: [],
  loading: false,
  error: null,
  fetchJobs: async () => {},
  addJob: async () => null,
  updateJob: async () => false,
  deleteJob: async () => false,
});

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  
  // Use the jobs hook for all job operations
  const { 
    jobs, 
    loading, 
    error, 
    fetchJobs, 
    addJob, 
    updateJob, 
    deleteJob 
  } = useSupabaseJobs();

  // Ensure job statuses are properly typed
  const typedJobs = jobs.map(job => {
    return {
      ...job,
      status: job.status as JobStatus 
    };
  });
  
  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        jobs: typedJobs,
        loading,
        error,
        fetchJobs,
        addJob,
        updateJob,
        deleteJob
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
