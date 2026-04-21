import { useMemo } from 'react';
import { toast } from 'sonner';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  cardBackground: string;
  buttonHover: string;
  socialIconColor: string;
  socialIconHover: string;
  cardBackgroundPrimary: string;
  cardBackgroundSecondary: string;
  cardBackgroundTertiary: string;
  sectionTitleColor: string;
  inputBackground: string;
  inputBorder: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
}

export interface LayoutPreferences {
  max_width: string;
  section_spacing: string;
}

export interface BackgroundGradient {
  id: string;
  name: string;
  gradient: string;
}

export const GRADIENT_PRESETS: BackgroundGradient[] = [
  { id: 'soft-purple', name: 'Soft Purple', gradient: 'bg-gradient-to-b from-purple-300/20 via-purple-100/40 to-purple-50/20' },
  { id: 'soft-blue', name: 'Soft Blue', gradient: 'bg-gradient-to-b from-blue-300/20 via-blue-100/40 to-blue-50/20' },
  { id: 'soft-pink', name: 'Soft Pink', gradient: 'bg-gradient-to-b from-pink-300/20 via-pink-100/40 to-pink-50/20' },
  { id: 'soft-green', name: 'Soft Green', gradient: 'bg-gradient-to-b from-emerald-300/20 via-emerald-100/40 to-emerald-50/20' },
  { id: 'soft-orange', name: 'Soft Orange', gradient: 'bg-gradient-to-b from-orange-300/20 via-orange-100/40 to-orange-50/20' },
  { id: 'soft-indigo', name: 'Soft Indigo', gradient: 'bg-gradient-to-b from-indigo-300/20 via-indigo-100/40 to-indigo-50/20' },
  { id: 'soft-teal', name: 'Soft Teal', gradient: 'bg-gradient-to-b from-teal-300/20 via-teal-100/40 to-teal-50/20' },
  { id: 'pure-white', name: 'Pure White', gradient: 'bg-gradient-to-b from-white to-white' },
  { id: 'soft-gray', name: 'Soft Gray', gradient: 'bg-gradient-to-b from-gray-50/30 via-gray-25/20 to-white' },
  { id: 'dark-purple', name: 'Dark Purple', gradient: 'bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900' },
  { id: 'dark-blue', name: 'Dark Blue', gradient: 'bg-gradient-to-b from-blue-900 via-indigo-800 to-purple-900' },
  { id: 'dark-navy', name: 'Dark Navy', gradient: 'bg-gradient-to-b from-slate-900 via-gray-800 to-slate-900' },
  { id: 'dark-emerald', name: 'Dark Emerald', gradient: 'bg-gradient-to-b from-emerald-900 via-teal-800 to-cyan-900' },
  { id: 'dark-rose', name: 'Dark Rose', gradient: 'bg-gradient-to-b from-rose-900 via-pink-800 to-purple-900' },
];

const getThemeColors = (gradientId: string): ThemeColors => {
  const isDark = ['dark-purple', 'dark-blue', 'dark-navy', 'dark-emerald', 'dark-rose'].includes(gradientId);
  
  if (isDark) {
    const colorMap: Record<string, ThemeColors> = {
      'dark-purple': {
        primary: '#A855F7',
        secondary: '#7C3AED',
        background: 'rgba(255, 255, 255, 0.18)',
        text: '#FFFFFF',
        textSecondary: 'rgba(255, 255, 255, 0.8)',
        border: 'rgba(255, 255, 255, 0.2)',
        accent: '#C084FC',
        cardBackground: 'rgba(255, 255, 255, 0.05)',
        buttonHover: '#9333EA',
        socialIconColor: '#FFFFFF',
        socialIconHover: '#A855F7',
        cardBackgroundPrimary: 'rgba(168, 85, 247, 0.22)',
        cardBackgroundSecondary: 'rgba(168, 85, 247, 0.22)',
        cardBackgroundTertiary: 'rgba(168, 85, 247, 0.22)',
        sectionTitleColor: '#FFFFFF',
        inputBackground: 'rgba(255, 255, 255, 0.1)',
        inputBorder: 'rgba(255, 255, 255, 0.3)',
        successColor: '#10B981',
        warningColor: '#F59E0B',
        dangerColor: '#EF4444'
      },
      'dark-blue': {
        primary: '#3B82F6',
        secondary: '#1D4ED8',
        background: 'rgba(255, 255, 255, 0.18)',
        text: '#FFFFFF',
        textSecondary: 'rgba(255, 255, 255, 0.8)',
        border: 'rgba(255, 255, 255, 0.2)',
        accent: '#60A5FA',
        cardBackground: 'rgba(255, 255, 255, 0.05)',
        buttonHover: '#2563EB',
        socialIconColor: '#FFFFFF',
        socialIconHover: '#3B82F6',
        cardBackgroundPrimary: 'rgba(59, 130, 246, 0.22)',
        cardBackgroundSecondary: 'rgba(59, 130, 246, 0.22)',
        cardBackgroundTertiary: 'rgba(59, 130, 246, 0.22)',
        sectionTitleColor: '#FFFFFF',
        inputBackground: 'rgba(255, 255, 255, 0.1)',
        inputBorder: 'rgba(255, 255, 255, 0.3)',
        successColor: '#10B981',
        warningColor: '#F59E0B',
        dangerColor: '#EF4444'
      },
      'dark-navy': {
        primary: '#64748B',
        secondary: '#475569',
        background: 'rgba(255, 255, 255, 0.18)',
        text: '#FFFFFF',
        textSecondary: 'rgba(255, 255, 255, 0.8)',
        border: 'rgba(255, 255, 255, 0.2)',
        accent: '#94A3B8',
        cardBackground: 'rgba(255, 255, 255, 0.05)',
        buttonHover: '#334155',
        socialIconColor: '#FFFFFF',
        socialIconHover: '#64748B',
        cardBackgroundPrimary: 'rgba(100, 116, 139, 0.22)',
        cardBackgroundSecondary: 'rgba(100, 116, 139, 0.22)',
        cardBackgroundTertiary: 'rgba(100, 116, 139, 0.22)',
        sectionTitleColor: '#FFFFFF',
        inputBackground: 'rgba(255, 255, 255, 0.1)',
        inputBorder: 'rgba(255, 255, 255, 0.3)',
        successColor: '#10B981',
        warningColor: '#F59E0B',
        dangerColor: '#EF4444'
      },
      'dark-emerald': {
        primary: '#10B981',
        secondary: '#059669',
        background: 'rgba(255, 255, 255, 0.18)',
        text: '#FFFFFF',
        textSecondary: 'rgba(255, 255, 255, 0.8)',
        border: 'rgba(255, 255, 255, 0.2)',
        accent: '#34D399',
        cardBackground: 'rgba(255, 255, 255, 0.05)',
        buttonHover: '#047857',
        socialIconColor: '#FFFFFF',
        socialIconHover: '#10B981',
        cardBackgroundPrimary: 'rgba(16, 185, 129, 0.22)',
        cardBackgroundSecondary: 'rgba(16, 185, 129, 0.22)',
        cardBackgroundTertiary: 'rgba(16, 185, 129, 0.22)',
        sectionTitleColor: '#FFFFFF',
        inputBackground: 'rgba(255, 255, 255, 0.1)',
        inputBorder: 'rgba(255, 255, 255, 0.3)',
        successColor: '#10B981',
        warningColor: '#F59E0B',
        dangerColor: '#EF4444'
      },
      'dark-rose': {
        primary: '#F43F5E',
        secondary: '#E11D48',
        background: 'rgba(255, 255, 255, 0.18)',
        text: '#FFFFFF',
        textSecondary: 'rgba(255, 255, 255, 0.8)',
        border: 'rgba(255, 255, 255, 0.2)',
        accent: '#FB7185',
        cardBackground: 'rgba(255, 255, 255, 0.05)',
        buttonHover: '#BE123C',
        socialIconColor: '#FFFFFF',
        socialIconHover: '#F43F5E',
        cardBackgroundPrimary: 'rgba(244, 63, 94, 0.22)',
        cardBackgroundSecondary: 'rgba(244, 63, 94, 0.22)',
        cardBackgroundTertiary: 'rgba(244, 63, 94, 0.22)',
        sectionTitleColor: '#FFFFFF',
        inputBackground: 'rgba(255, 255, 255, 0.1)',
        inputBorder: 'rgba(255, 255, 255, 0.3)',
        successColor: '#10B981',
        warningColor: '#F59E0B',
        dangerColor: '#EF4444'
      }
    };
    return colorMap[gradientId] || colorMap['dark-purple'];
  }

  // Light theme colors with enhanced color schemes
  const colorMap: Record<string, ThemeColors> = {
    'soft-purple': {
      primary: '#8B5CF6',
      secondary: '#7C3AED',
      background: 'rgba(255, 255, 255, 0.9)',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: 'rgba(139, 92, 246, 0.3)',
      accent: '#A78BFA',
      cardBackground: 'rgba(255, 255, 255, 0.7)',
      buttonHover: '#7C3AED',
      socialIconColor: '#6B7280',
      socialIconHover: '#8B5CF6',
      cardBackgroundPrimary: 'rgba(139, 92, 246, 0.15)',
      cardBackgroundSecondary: 'rgba(139, 92, 246, 0.15)',
      cardBackgroundTertiary: 'rgba(139, 92, 246, 0.15)',
      sectionTitleColor: '#1F2937',
      inputBackground: '#FFFFFF',
      inputBorder: 'rgba(139, 92, 246, 0.3)',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      dangerColor: '#EF4444'
    },
    'soft-blue': {
      primary: '#3B82F6',
      secondary: '#2563EB',
      background: 'rgba(255, 255, 255, 0.9)',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: 'rgba(59, 130, 246, 0.3)',
      accent: '#60A5FA',
      cardBackground: 'rgba(255, 255, 255, 0.7)',
      buttonHover: '#2563EB',
      socialIconColor: '#6B7280',
      socialIconHover: '#3B82F6',
      cardBackgroundPrimary: 'rgba(59, 130, 246, 0.15)',
      cardBackgroundSecondary: 'rgba(59, 130, 246, 0.15)',
      cardBackgroundTertiary: 'rgba(59, 130, 246, 0.15)',
      sectionTitleColor: '#1F2937',
      inputBackground: '#FFFFFF',
      inputBorder: 'rgba(59, 130, 246, 0.3)',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      dangerColor: '#EF4444'
    },
    'soft-pink': {
      primary: '#EC4899',
      secondary: '#DB2777',
      background: 'rgba(255, 255, 255, 0.9)',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: 'rgba(236, 72, 153, 0.3)',
      accent: '#F472B6',
      cardBackground: 'rgba(255, 255, 255, 0.7)',
      buttonHover: '#DB2777',
      socialIconColor: '#6B7280',
      socialIconHover: '#EC4899',
      cardBackgroundPrimary: 'rgba(236, 72, 153, 0.15)',
      cardBackgroundSecondary: 'rgba(236, 72, 153, 0.15)',
      cardBackgroundTertiary: 'rgba(236, 72, 153, 0.15)',
      sectionTitleColor: '#1F2937',
      inputBackground: '#FFFFFF',
      inputBorder: 'rgba(236, 72, 153, 0.3)',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      dangerColor: '#EF4444'
    },
    'soft-green': {
      primary: '#10B981',
      secondary: '#059669',
      background: 'rgba(255, 255, 255, 0.9)',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: 'rgba(16, 185, 129, 0.3)',
      accent: '#34D399',
      cardBackground: 'rgba(255, 255, 255, 0.7)',
      buttonHover: '#059669',
      socialIconColor: '#6B7280',
      socialIconHover: '#10B981',
      cardBackgroundPrimary: 'rgba(16, 185, 129, 0.15)',
      cardBackgroundSecondary: 'rgba(16, 185, 129, 0.15)',
      cardBackgroundTertiary: 'rgba(16, 185, 129, 0.15)',
      sectionTitleColor: '#1F2937',
      inputBackground: '#FFFFFF',
      inputBorder: 'rgba(16, 185, 129, 0.3)',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      dangerColor: '#EF4444'
    },
    'soft-orange': {
      primary: '#F59E0B',
      secondary: '#D97706',
      background: 'rgba(255, 255, 255, 0.9)',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: 'rgba(245, 158, 11, 0.3)',
      accent: '#FBBF24',
      cardBackground: 'rgba(255, 255, 255, 0.7)',
      buttonHover: '#D97706',
      socialIconColor: '#6B7280',
      socialIconHover: '#F59E0B',
      cardBackgroundPrimary: 'rgba(245, 158, 11, 0.15)',
      cardBackgroundSecondary: 'rgba(245, 158, 11, 0.15)',
      cardBackgroundTertiary: 'rgba(245, 158, 11, 0.15)',
      sectionTitleColor: '#1F2937',
      inputBackground: '#FFFFFF',
      inputBorder: 'rgba(245, 158, 11, 0.3)',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      dangerColor: '#EF4444'
    },
    'soft-indigo': {
      primary: '#6366F1',
      secondary: '#4F46E5',
      background: 'rgba(255, 255, 255, 0.9)',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: 'rgba(99, 102, 241, 0.3)',
      accent: '#818CF8',
      cardBackground: 'rgba(255, 255, 255, 0.7)',
      buttonHover: '#4F46E5',
      socialIconColor: '#6B7280',
      socialIconHover: '#6366F1',
      cardBackgroundPrimary: 'rgba(99, 102, 241, 0.15)',
      cardBackgroundSecondary: 'rgba(99, 102, 241, 0.15)',
      cardBackgroundTertiary: 'rgba(99, 102, 241, 0.15)',
      sectionTitleColor: '#1F2937',
      inputBackground: '#FFFFFF',
      inputBorder: 'rgba(99, 102, 241, 0.3)',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      dangerColor: '#EF4444'
    },
    'soft-teal': {
      primary: '#14B8A6',
      secondary: '#0D9488',
      background: 'rgba(255, 255, 255, 0.9)',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: 'rgba(20, 184, 166, 0.3)',
      accent: '#2DD4BF',
      cardBackground: 'rgba(255, 255, 255, 0.7)',
      buttonHover: '#0D9488',
      socialIconColor: '#6B7280',
      socialIconHover: '#14B8A6',
      cardBackgroundPrimary: 'rgba(20, 184, 166, 0.15)',
      cardBackgroundSecondary: 'rgba(20, 184, 166, 0.15)',
      cardBackgroundTertiary: 'rgba(20, 184, 166, 0.15)',
      sectionTitleColor: '#1F2937',
      inputBackground: '#FFFFFF',
      inputBorder: 'rgba(20, 184, 166, 0.3)',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      dangerColor: '#EF4444'
    },
    'pure-white': {
      primary: '#8B5CF6',
      secondary: '#7C3AED',
      background: '#FFFFFF',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: 'rgba(229, 231, 235, 1)',
      accent: '#A78BFA',
      cardBackground: '#FFFFFF',
      buttonHover: '#7C3AED',
      socialIconColor: '#6B7280',
      socialIconHover: '#8B5CF6',
      cardBackgroundPrimary: 'rgba(139, 92, 246, 0.05)',
      cardBackgroundSecondary: 'rgba(139, 92, 246, 0.05)',
      cardBackgroundTertiary: 'rgba(139, 92, 246, 0.05)',
      sectionTitleColor: '#1F2937',
      inputBackground: '#FFFFFF',
      inputBorder: 'rgba(229, 231, 235, 1)',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      dangerColor: '#EF4444'
    },
    'soft-gray': {
      primary: '#6B7280',
      secondary: '#4B5563',
      background: 'rgba(255, 255, 255, 0.9)',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: 'rgba(107, 114, 128, 0.2)',
      accent: '#9CA3AF',
      cardBackground: 'rgba(255, 255, 255, 0.7)',
      buttonHover: '#4B5563',
      socialIconColor: '#6B7280',
      socialIconHover: '#6B7280',
      cardBackgroundPrimary: 'rgba(107, 114, 128, 0.08)',
      cardBackgroundSecondary: 'rgba(107, 114, 128, 0.08)',
      cardBackgroundTertiary: 'rgba(107, 114, 128, 0.08)',
      sectionTitleColor: '#1F2937',
      inputBackground: '#FFFFFF',
      inputBorder: 'rgba(107, 114, 128, 0.3)',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      dangerColor: '#EF4444'
    }
  };

  return colorMap[gradientId] || colorMap['soft-purple'];
};

export const usePortfolioTheme = () => {
  const { data, loading: dataLoading, updateData } = useModedPortfolioData();

  const selectedGradient = data?.background_gradient || 'soft-purple';
  const layoutPreferences: LayoutPreferences = {
    max_width: (data?.layout_preferences as any)?.max_width || '400px',
    section_spacing: (data?.layout_preferences as any)?.section_spacing || '32px'
  };

  // Memoize theme colors calculation to prevent recalculation on every render
  const themeColors = useMemo(() => {
    return getThemeColors(selectedGradient);
  }, [selectedGradient]);

  const updateTheme = async (colors: ThemeColors, layout: LayoutPreferences) => {
    try {
      const success = await updateData({
        theme_colors: colors as any,
        layout_preferences: layout as any
      });

      if (success) {
        toast.success('Theme updated successfully');
      }
    } catch (error) {
      console.error('Error updating theme:', error);
      toast.error('Failed to update theme');
    }
  };

  const updateBackgroundGradient = async (gradientId: string) => {
    try {
      const success = await updateData({
        background_gradient: gradientId
      });

      // Success is handled by the component
    } catch (error) {
      console.error('Error updating background gradient:', error);
      toast.error('Failed to update background');
    }
  };

  const getCurrentGradient = () => {
    const gradient = GRADIENT_PRESETS.find(g => g.id === selectedGradient);
    return gradient ? gradient.gradient : GRADIENT_PRESETS[0].gradient;
  };

  const isDarkTheme = () => {
    return ['dark-purple', 'dark-blue', 'dark-navy', 'dark-emerald', 'dark-rose'].includes(selectedGradient);
  };

  return {
    themeColors,
    layoutPreferences,
    selectedGradient,
    loading: dataLoading,
    updateTheme,
    updateBackgroundGradient,
    getCurrentGradient,
    isDarkTheme,
    gradientPresets: GRADIENT_PRESETS
  };
};
