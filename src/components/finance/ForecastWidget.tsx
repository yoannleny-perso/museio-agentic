
import React, { useState, useMemo } from 'react';
import { format, isToday, isFuture, addDays, addMonths, isBefore, endOfDay, startOfDay, isSameDay } from 'date-fns';
import { useAppContext } from '@/context/AppContext';
import { getJobDisplayPrice } from '@/utils/jobPricing';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileText, Info } from 'lucide-react';
import ForecastChart from './components/ForecastChart';

// Forecast time range types
type ForecastRange = 'this_month' | 'this_year';

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-[200px] text-center">
    <FileText size={48} className="text-[#9B70F9] mb-4" />
    <p className="text-lg font-medium text-[#4D2AAE]">No upcoming jobs found</p>
    <p className="text-sm text-[#888888] mt-1">Add jobs to see your forecast</p>
  </div>
);

const ForecastWidget: React.FC = () => {
  // Default to this_month
  const [forecastRange, setForecastRange] = useState<ForecastRange>('this_month');
  const { jobs, loading } = useAppContext();
  
  // Calculate forecast data based on upcoming jobs only
  const forecastData = useMemo(() => {
    if (loading) return { total: 0, confirmedCount: 0, filteredjobs: [] };
    
    const today = new Date();
    const todayEndOfDay = endOfDay(today); // Ensure end of day is used
    const todayStartOfDay = startOfDay(today);
    
    // Calculate the end date based on selected range
    let endDate = todayEndOfDay;
    
    switch(forecastRange) {
      case 'this_month':
        // For weekly view: today + 6 days (end of day)
        endDate = endOfDay(addDays(today, 5)); // 6 days including today
        break;
      case 'this_year':
        // For monthly view: today + 6 months (end of day)
        endDate = endOfDay(addMonths(today, 5)); // 6 months including current month
        break;
    }
    
    // Filter jobs based on forecastRange and date
    // For weekly view, first day includes all job types, other days only upcoming
    // For monthly view, only include upcoming jobs
    const filteredJobs = jobs.filter(job => {
      const jobDate = new Date(job.date);
      const jobDateStart = startOfDay(jobDate);
      
      // Check if the job is within the selected range
      const isWithinRange = 
        (isToday(jobDate) || isFuture(jobDate)) && 
        isBefore(jobDate, endDate);
        
      if (!isWithinRange) {
        return false;
      }
      
      // For weekly view, show all types (upcoming, paid, past, invoice-sent) only for the first day (today)
      if (forecastRange === 'this_month') {
        if (isSameDay(jobDateStart, todayStartOfDay)) {
          return ['upcoming', 'paid', 'past', 'invoice-sent'].includes(job.status);
        } else {
          // For other days in weekly view, only show upcoming jobs
          return job.status === 'upcoming';
        }
      } 
      // For monthly view, only include upcoming jobs
      else {
        return job.status === 'upcoming';
      }
    });
    
    // Calculate total from filtered jobs within the selected range
    let total = 0;
    let confirmedCount = 0;
    
    for (const job of filteredJobs) {
      total += getJobDisplayPrice(job);
      confirmedCount++;
    }
    
    return { total, confirmedCount, filteredjobs: filteredJobs };
  }, [jobs, forecastRange, loading]);

  // Updated forecast range options to make labels more clear
  const forecastRangeOptions = [
    { value: 'this_month', label: 'Weekly' },
    { value: 'this_year', label: 'Monthly' },
  ];

  const handleForecastRangeChange = (value: string) => {
    setForecastRange(value as ForecastRange);
  };

  const isEmpty = forecastData.confirmedCount === 0;

  return (
    <Card className="w-full overflow-hidden rounded-[20px] bg-white/90 backdrop-blur-sm shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)] border border-[rgba(122,83,255,0.08)]">
      <CardHeader className="flex flex-row items-start justify-between pb-4 px-6 pt-6">
        <div>
          <div className="flex items-center">
            <CardTitle className="text-[#4D2AAE] text-[18px] md:text-[22px] font-bold">Forecast</CardTitle>
            <Popover>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button className="ml-1 flex items-center justify-center w-5 h-5 rounded-full transition-colors bg-transparent">
                        <Info size={16} className="text-[#9b87f5]" />
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Click for forecast info
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <PopoverContent className="w-64 p-4 text-sm" side="bottom" align="start">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-[#4D2AAE] mb-2">Forecast Overview</h4>
                    <p className="text-gray-600">
                      Shows estimated earnings from your upcoming jobs based on their scheduled dates and rates.
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-[#4D2AAE] mb-1">Time Ranges:</h5>
                    <ul className="text-gray-600 space-y-1">
                      <li><strong>Weekly:</strong> Shows all jobs from today for the next 6 days.</li>
                      <li><strong>Monthly:</strong> Shows all jobs from this month for the next 6 months.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-[#4D2AAE] mb-1">Visual Indicators:</h5>
                    <ul className="text-gray-600 space-y-1">
                      <li><strong>Dark purple:</strong> Current period (today/this month)</li>
                      <li><strong>Light purple:</strong> Future periods</li>
                    </ul>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-[12px] text-[#888888] mt-1 leading-tight">
            From <span className="text-[#9B87F5] font-medium">{forecastData.confirmedCount}</span> {forecastRange === 'this_month' ? 'relevant' : 'upcoming'} {forecastData.confirmedCount === 1 ? 'job' : 'jobs'}
          </p>
        </div>
        <Select value={forecastRange} onValueChange={handleForecastRangeChange}>
          <SelectTrigger className="border-[#D3D3D3] rounded-xl h-10 w-[140px] text-[15px] font-medium">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {forecastRangeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent text-[#8B5CF6] mr-2" />
            <span className="text-sm text-gray-600">Loading forecast data...</span>
          </div>
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          <ForecastChart 
            jobs={forecastData.filteredjobs} 
            forecastRange={forecastRange} 
            isEmpty={isEmpty}
            totalForecast={forecastData.total}
            confirmedCount={forecastData.confirmedCount}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ForecastWidget;
