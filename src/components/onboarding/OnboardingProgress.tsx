
import React from 'react';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { useOnboardingContext } from '@/context/OnboardingContext';
import { Card } from '@/components/ui/card';

export const OnboardingProgress: React.FC = () => {
  const { onboardingState, setupCompletion, loading } = useOnboardingContext();

  if (loading || !onboardingState || onboardingState.onboarding_completed) {
    return null;
  }

  const setupItems = [
    {
      id: 'profile',
      title: 'Personal Profile',
      completed: setupCompletion.profile,
      mandatory: true
    },
    {
      id: 'invoice',
      title: 'Invoicing Details',
      completed: setupCompletion.invoice,
      mandatory: true
    },
    {
      id: 'bank',
      title: 'Bank Account',
      completed: setupCompletion.bank,
      mandatory: true
    }
  ];

  const completedCount = setupItems.filter(item => item.completed).length;
  const mandatoryItems = setupItems.filter(item => item.mandatory);
  const completedMandatory = mandatoryItems.filter(item => item.completed).length;
  const hasPendingMandatory = completedMandatory < mandatoryItems.length;

  return (
    hasPendingMandatory && (
      <Card className="p-4 mb-6 border-l-4 border-l-[#A98CFF]">
        <div className="flex items-start space-x-3">
        <div className="mt-1">
          {hasPendingMandatory ? (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              Account Setup Progress
            </h3>
            <span className="text-sm text-gray-500">
              {completedCount}/{setupItems.length} completed
            </span>
          </div>
          
          <div className="mt-2 space-y-2">
            <div className="flex space-x-4">
              {setupItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-1">
                  {item.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className={`text-xs ${item.completed ? 'text-green-600' : 'text-gray-500'}`}>
                    {item.title}
                    {item.mandatory && !item.completed && ' (Required)'}
                  </span>
                </div>
              ))}
            </div>
            
            {hasPendingMandatory && (
              <p className="text-sm text-amber-600">
                Complete the required sections to unlock all features.
              </p>
            )}
          </div>
          
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / setupItems.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
    )
  );
};
