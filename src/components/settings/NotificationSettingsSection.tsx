
import React from 'react';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mail, Bell, BellOff, AlertTriangle, Copy, Smartphone } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

export const NotificationSettingsSection = () => {
  const {
    sendJobConfirmation,
    sendJobUpdates,
    sendJobCancellations,
    receiveEmailCopies,
    receivePushNotifications,
    updateNotificationSettings,
    isSaving
  } = useNotificationSettings();

  const handleToggleChange = (setting: string, value: boolean) => {
    const updateData: any = {};
    updateData[setting] = value;
    updateNotificationSettings(updateData);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <Label htmlFor="send-confirmation" className="text-sm font-medium">
              Send confirmation email to client
            </Label>
          </div>
          <Switch
            id="send-confirmation"
            checked={sendJobConfirmation}
            onCheckedChange={(checked) => handleToggleChange('sendJobConfirmation', checked)}
            disabled={isSaving}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-500" />
            <Label htmlFor="send-updates" className="text-sm font-medium">
              Send update email to client
            </Label>
          </div>
          <Switch
            id="send-updates"
            checked={sendJobUpdates}
            onCheckedChange={(checked) => handleToggleChange('sendJobUpdates', checked)}
            disabled={isSaving}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellOff className="h-4 w-4 text-gray-500" />
            <Label htmlFor="send-cancellations" className="text-sm font-medium">
              Send cancellation email to client
            </Label>
          </div>
          <Switch
            id="send-cancellations"
            checked={sendJobCancellations}
            onCheckedChange={(checked) => handleToggleChange('sendJobCancellations', checked)}
            disabled={isSaving}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Copy className="h-4 w-4 text-gray-500" />
            <Label htmlFor="receive-copies" className="text-sm font-medium">
              Send me a copy of all client emails
            </Label>
          </div>
          <Switch
            id="receive-copies"
            checked={receiveEmailCopies}
            onCheckedChange={(checked) => handleToggleChange('receiveEmailCopies', checked)}
            disabled={isSaving}
          />
        </div>

        {Capacitor.isNativePlatform() && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-gray-500" />
              <Label htmlFor="receive-push" className="text-sm font-medium">
                Receive mobile push notifications
              </Label>
            </div>
            <Switch
              id="receive-push"
              checked={receivePushNotifications}
              onCheckedChange={(checked) => handleToggleChange('receivePushNotifications', checked)}
              disabled={isSaving}
            />
          </div>
        )}
      </div>

      <div className="mt-2 p-3 bg-gray-50 rounded-md">
        <div className="flex gap-2 text-gray-500">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p className="text-xs">
            Note: When clicking "Send Invoice" to complete a job (yellow card), an email will be sent to the client with the PDF invoice attached.
          </p>
        </div>
      </div>
    </div>
  );
};
