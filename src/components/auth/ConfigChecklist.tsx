
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Check } from 'lucide-react';

interface ConfigChecklistProps {
  configChecked: {[key: string]: boolean};
  toggleConfigCheck: (key: string) => void;
}

const supabaseAuthSettingsUrl = import.meta.env.VITE_SUPABASE_PROJECT_ID
  ? `https://supabase.com/dashboard/project/${import.meta.env.VITE_SUPABASE_PROJECT_ID}/auth/providers`
  : 'https://supabase.com/dashboard';

const ConfigChecklist = ({ configChecked, toggleConfigCheck }: ConfigChecklistProps) => {
  return (
    <Alert className="mt-8">
      <Info className="h-4 w-4" />
      <AlertDescription>
        <p className="font-medium mb-2">Authentication Configuration Checklist</p>
        <div className="text-sm space-y-2 mt-2">
          <div className="flex items-start">
            <button 
              className={`flex-shrink-0 w-5 h-5 rounded mr-2 mt-0.5 border flex items-center justify-center ${configChecked.siteUrl ? 'bg-green-100 border-green-500' : 'bg-white border-gray-300'}`}
              onClick={() => toggleConfigCheck('siteUrl')}
              type="button"
            >
              {configChecked.siteUrl && <Check className="h-3 w-3 text-green-600" />}
            </button>
            <div className="text-left">
              <p className="font-medium">Supabase Site URL</p>
              <p className="text-xs text-gray-500">Set to: <code className="bg-gray-100 px-1 rounded">{window.location.origin}</code></p>
            </div>
          </div>
          
          <div className="flex items-start">
            <button 
              className={`flex-shrink-0 w-5 h-5 rounded mr-2 mt-0.5 border flex items-center justify-center ${configChecked.redirectUrl ? 'bg-green-100 border-green-500' : 'bg-white border-gray-300'}`}
              onClick={() => toggleConfigCheck('redirectUrl')}
              type="button"
            >
              {configChecked.redirectUrl && <Check className="h-3 w-3 text-green-600" />}
            </button>
            <div className="text-left">
              <p className="font-medium">Supabase Redirect URL</p>
              <p className="text-xs text-gray-500">Includes: <code className="bg-gray-100 px-1 rounded">{window.location.origin}/auth/callback</code></p>
            </div>
          </div>
          
          <div className="flex items-start">
            <button 
              className={`flex-shrink-0 w-5 h-5 rounded mr-2 mt-0.5 border flex items-center justify-center ${configChecked.googleProvider ? 'bg-green-100 border-green-500' : 'bg-white border-gray-300'}`}
              onClick={() => toggleConfigCheck('googleProvider')}
              type="button"
            >
              {configChecked.googleProvider && <Check className="h-3 w-3 text-green-600" />}
            </button>
            <div className="text-left">
              <p className="font-medium">Google Provider Enabled</p>
              <p className="text-xs text-gray-500">In Supabase Authentication settings</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <button 
              className={`flex-shrink-0 w-5 h-5 rounded mr-2 mt-0.5 border flex items-center justify-center ${configChecked.googleOrigins ? 'bg-green-100 border-green-500' : 'bg-white border-gray-300'}`}
              onClick={() => toggleConfigCheck('googleOrigins')}
              type="button"
            >
              {configChecked.googleOrigins && <Check className="h-3 w-3 text-green-600" />}
            </button>
            <div className="text-left">
              <p className="font-medium">Google Authorized JavaScript Origins</p>
              <p className="text-xs text-gray-500">Includes: <code className="bg-gray-100 px-1 rounded">{window.location.origin}</code></p>
            </div>
          </div>
          
          <div className="flex items-start">
            <button 
              className={`flex-shrink-0 w-5 h-5 rounded mr-2 mt-0.5 border flex items-center justify-center ${configChecked.googleRedirect ? 'bg-green-100 border-green-500' : 'bg-white border-gray-300'}`}
              onClick={() => toggleConfigCheck('googleRedirect')}
              type="button"
            >
              {configChecked.googleRedirect && <Check className="h-3 w-3 text-green-600" />}
            </button>
            <div className="text-left">
              <p className="font-medium">Google Authorized Redirect URIs</p>
              <p className="text-xs text-gray-500">Includes: <code className="bg-gray-100 px-1 rounded">{window.location.origin}/auth/callback</code></p>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full"
            onClick={() => window.open(supabaseAuthSettingsUrl, '_blank')}
          >
            Open Supabase Auth Settings
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ConfigChecklist;
