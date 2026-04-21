import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { useProfile } from '@/context/ProfileContext';
import { 
  DayAvailability,
  fetchUserAvailabilityForDateRange, 
  saveWeekSpecificAvailability,
  convertDbAvailabilityToUI,
  copyWeekAvailability,
  generateWeekDates,
  formatWeekLabel,
  loadUserAvailabilitySettings,
  saveUserAvailabilitySettings,
  loadUserVacationPeriods,
  saveUserVacationPeriods,
  addUserVacationPeriod,
  removeUserVacationPeriod,
  UserAvailability,
  UserAvailabilitySettings,
  UserVacationPeriod
} from '@/lib/availability';
import { toast } from 'sonner';

interface VacationPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
}

export const useUserAvailability = (weekDates?: Date[]) => {
  const { user } = useAuth();
  const { profileData } = useProfile();
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [previousAvailability, setPreviousAvailability] = useState<DayAvailability[]>([]);
  const [dbAvailability, setDbAvailability] = useState<UserAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<UserAvailabilitySettings>({
    user_id: user?.id || '',
    buffer_time_minutes: 15,
    min_notice_hours: 24,
    enable_breaks: false,
    break_duration_minutes: 60,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Vacation periods state
  const [vacationPeriods, setVacationPeriods] = useState<VacationPeriod[]>([]);
  const [vacationPeriodsLoading, setVacationPeriodsLoading] = useState(false);

  // Default availability for new users
  const getDefaultAvailability = useCallback((): DayAvailability[] => [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ].map(day => ({
    day,
    enabled: false, // Default to all days disabled
    timeSlots: [{ start: '09:00', end: '17:00' }],
  })), []);

  const loadAvailability = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      let dbData: UserAvailability[];
      
      if (weekDates) {
        // Load availability for specific date range plus patterns
        const startDate = weekDates[0];
        const endDate = weekDates[6];
        dbData = await fetchUserAvailabilityForDateRange(user.id, startDate, endDate);
      } else {
        // Load all availability (patterns and recent date-specific)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // Look back 1 week
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // Look ahead 30 days
        dbData = await fetchUserAvailabilityForDateRange(user.id, startDate, endDate);
      }
      
      setDbAvailability(dbData);
      
      if (dbData.length > 0) {
        const uiData = convertDbAvailabilityToUI(dbData, weekDates);
        setAvailability(uiData);
        setPreviousAvailability([...uiData]); // Store as previous state
      } else {
        // No availability data found, use defaults
        const defaultData = getDefaultAvailability();
        setAvailability(defaultData);
        setPreviousAvailability([...defaultData]); // Store as previous state
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      const defaultData = getDefaultAvailability();
      setAvailability(defaultData);
      setPreviousAvailability([...defaultData]); // Store as previous state
      toast.error('Failed to load availability settings');
    } finally {
      setLoading(false);
    }
  }, [getDefaultAvailability, user?.id, weekDates]);

  const saveAvailability = async () => {
    if (!user?.id || !weekDates) return false;
    
    setSaving(true);
    try {
      const success = await saveWeekSpecificAvailability(user.id, availability, weekDates, profileData?.username);
      
      if (success) {
        // Reload to get fresh data
        await loadAvailability();
        toast.success('Availability saved successfully');
        return true;
      } else {
        toast.error('Failed to save availability settings');
        return false;
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability settings');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Auto-save function that doesn't reload
  const autoSaveAvailability = async (newAvailability: DayAvailability[]) => {
    if (!user?.id || !weekDates) return { success: false, error: 'User not authenticated or week dates missing' };
    
    // Store current state as previous before attempting save
    setPreviousAvailability([...availability]);
    setSaving(true);
    
    try {
      const success = await saveWeekSpecificAvailability(user.id, newAvailability, weekDates, profileData?.username);
      
      if (success) {
        // Update previous state to current successful state - don't reload
        setPreviousAvailability([...newAvailability]);
        return { success: true };
      } else {
        return { success: false, error: 'Failed to save availability settings' };
      }
    } catch (error) {
      console.error('Error auto-saving availability:', error);
      return { success: false, error: 'Failed to save availability settings' };
    } finally {
      setSaving(false);
    }
  };

  // Function to rollback to previous state
  const rollbackAvailability = () => {
    setAvailability([...previousAvailability]);
  };

  // Function to copy this week's availability to other weeks
  const copyWeekToTargets = async (targetWeekOffsets: number[]) => {
    if (!user?.id || !weekDates) return false;
    
    setCopying(true);
    try {
      const mondayDate = weekDates[0];
      const targetWeeksList = targetWeekOffsets.map(offset => {
        const targetMondayDate = new Date(mondayDate);
        targetMondayDate.setDate(targetMondayDate.getDate() + (offset * 7));
        return generateWeekDates(targetMondayDate);
      });

      const results = await Promise.all(
        targetWeeksList.map(targetWeekDates => 
          copyWeekAvailability(user.id, weekDates, targetWeekDates, profileData?.username)
        )
      );

      const successCount = results.filter(result => result).length;
      
      if (successCount > 0) {
        toast.success(`Successfully copied to ${successCount} week${successCount > 1 ? 's' : ''}`);
        return true;
      } else {
        toast.error('Failed to copy availability');
        return false;
      }
    } catch (error) {
      console.error('Error copying availability:', error);
      toast.error('Failed to copy availability');
      return false;
    } finally {
      setCopying(false);
    }
  };

  // Load user settings
  const loadSettings = useCallback(async () => {
    if (!user?.id) return;
    
    setSettingsLoading(true);
    try {
      const settingsData = await loadUserAvailabilitySettings(user.id);
      if (settingsData) {
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setSettingsLoading(false);
    }
  }, [user?.id]);

  // Save user settings
  const saveSettings = async (newSettings: Omit<UserAvailabilitySettings, 'id' | 'user_id'>) => {
    if (!user?.id) return false;
    
    setSettingsSaving(true);
    try {
      const success = await saveUserAvailabilitySettings(user.id, newSettings);
      if (success) {
        setSettings(prev => ({ ...prev, ...newSettings }));
        toast.success('Settings saved successfully');
        return true;
      } else {
        toast.error('Failed to save settings');
        return false;
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
      return false;
    } finally {
      setSettingsSaving(false);
    }
  };

  // Load vacation periods
  const loadVacationPeriods = useCallback(async () => {
    if (!user?.id) return;
    
    setVacationPeriodsLoading(true);
    try {
      const periodsData = await loadUserVacationPeriods(user.id);
      const formattedPeriods = periodsData.map(period => ({
        id: period.id || '',
        startDate: new Date(period.start_date),
        endDate: new Date(period.end_date),
      }));
      setVacationPeriods(formattedPeriods);
    } catch (error) {
      console.error('Error loading vacation periods:', error);
      toast.error('Failed to load vacation periods');
    } finally {
      setVacationPeriodsLoading(false);
    }
  }, [user?.id]);

  // Add vacation period
  const addVacationPeriod = async (startDate: Date, endDate: Date) => {
    if (!user?.id) return false;
    
    try {
      const success = await addUserVacationPeriod(user.id, startDate, endDate);
      if (success) {
        await loadVacationPeriods(); // Reload to get fresh data with IDs
        toast.success('Vacation period added successfully');
        return true;
      } else {
        toast.error('Failed to add vacation period');
        return false;
      }
    } catch (error) {
      console.error('Error adding vacation period:', error);
      toast.error('Failed to add vacation period');
      return false;
    }
  };

  // Remove vacation period
  const removeVacationPeriod = async (periodId: string) => {
    if (!user?.id) return false;
    
    try {
      const success = await removeUserVacationPeriod(user.id, periodId);
      if (success) {
        setVacationPeriods(prev => prev.filter(period => period.id !== periodId));
        toast.success('Vacation period removed successfully');
        return true;
      } else {
        toast.error('Failed to remove vacation period');
        return false;
      }
    } catch (error) {
      console.error('Error removing vacation period:', error);
      toast.error('Failed to remove vacation period');
      return false;
    }
  };

  useEffect(() => {
    if (user?.id) {
      void loadAvailability();
      void loadSettings();
      void loadVacationPeriods();
    }
  }, [loadAvailability, loadSettings, loadVacationPeriods, user?.id]);

  return {
    availability,
    setAvailability,
    previousAvailability,
    dbAvailability,
    loading,
    saving,
    copying,
    saveAvailability,
    autoSaveAvailability,
    rollbackAvailability,
    loadAvailability,
    copyWeekToTargets,
    // Settings
    settings,
    settingsLoading,
    settingsSaving,
    loadSettings,
    saveSettings,
    // Vacation periods
    vacationPeriods,
    vacationPeriodsLoading,
    addVacationPeriod,
    removeVacationPeriod,
    loadVacationPeriods,
  };
};
