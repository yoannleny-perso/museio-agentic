
import React from 'react';

interface TroubleshootingInfoProps {
  debugInfo: {
    hasHashParams: boolean;
    hasSearchParams: boolean;
    callbackType: string | null;
    errorCode: string | null;
    timestamp: string;
  } | null;
}

const TroubleshootingInfo: React.FC<TroubleshootingInfoProps> = ({ debugInfo }) => {
  return (
    <div className="mt-6 text-left bg-gray-50 p-4 rounded-md border border-gray-200">
      <h3 className="font-medium mb-2">Troubleshooting 403 Forbidden Error</h3>
      
      <div className="border-l-2 border-blue-400 pl-4 py-2 mb-4">
        <h4 className="font-medium text-sm">1. Google OAuth Configuration</h4>
        <p className="text-xs mt-1">
          In Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs:
        </p>
        <ul className="list-disc pl-5 text-xs mt-1">
          <li><span className="font-semibold">Authorized JavaScript origins</span> must include: <code className="bg-gray-100 px-1">{window.location.origin}</code></li>
          <li><span className="font-semibold">Authorized redirect URIs</span> must include: <code className="bg-gray-100 px-1">{window.location.origin}/auth/callback</code></li>
        </ul>
      </div>
      
      <div className="border-l-2 border-blue-400 pl-4 py-2 mb-4">
        <h4 className="font-medium text-sm">2. Supabase Configuration</h4>
        <p className="text-xs mt-1">
          In Supabase Dashboard → Authentication → URL Configuration:
        </p>
        <ul className="list-disc pl-5 text-xs mt-1">
          <li><span className="font-semibold">Site URL</span> must be set to: <code className="bg-gray-100 px-1">{window.location.origin}</code></li>
          <li><span className="font-semibold">Redirect URLs</span> must include: <code className="bg-gray-100 px-1">{window.location.origin}/auth/callback</code></li>
        </ul>
      </div>
      
      <div className="border-l-2 border-blue-400 pl-4 py-2 mb-4">
        <h4 className="font-medium text-sm">3. Provider Settings</h4>
        <p className="text-xs mt-1">
          In Supabase Dashboard → Authentication → Providers → Google:
        </p>
        <ul className="list-disc pl-5 text-xs mt-1">
          <li>Ensure Google provider is <span className="font-semibold">enabled</span></li>
          <li>Verify Client ID and Secret are correctly entered</li>
        </ul>
      </div>

      {debugInfo && (
        <div className="mt-4 border-t pt-3">
          <h4 className="font-medium text-sm mb-1">Sanitized Debug Information</h4>
          <pre className="bg-gray-800 text-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TroubleshootingInfo;
