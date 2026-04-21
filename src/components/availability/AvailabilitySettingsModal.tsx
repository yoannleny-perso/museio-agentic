import { useEffect, useState } from 'react';
import { Clock3, Settings2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PrimaryActionButton } from '@/components/ui/primary-action-button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { UserAvailabilitySettings } from '@/lib/availability';

interface AvailabilitySettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: UserAvailabilitySettings;
  settingsSaving: boolean;
  onSave: (settings: Omit<UserAvailabilitySettings, 'id' | 'user_id'>) => Promise<void>;
}

const AvailabilitySettingsModal = ({
  open,
  onOpenChange,
  settings,
  settingsSaving,
  onSave,
}: AvailabilitySettingsModalProps) => {
  const [formState, setFormState] = useState({
    minNoticeHours: String(settings.min_notice_hours),
    bufferMinutes: String(settings.buffer_time_minutes),
    enableBreaks: settings.enable_breaks,
    breakDurationMinutes: String(settings.break_duration_minutes),
  });

  useEffect(() => {
    if (!open) return;

    setFormState({
      minNoticeHours: String(settings.min_notice_hours),
      bufferMinutes: String(settings.buffer_time_minutes),
      enableBreaks: settings.enable_breaks,
      breakDurationMinutes: String(settings.break_duration_minutes),
    });
  }, [open, settings]);

  const handleSave = async () => {
    await onSave({
      min_notice_hours: Math.max(0, Number(formState.minNoticeHours) || 0),
      buffer_time_minutes: Math.max(0, Number(formState.bufferMinutes) || 0),
      enable_breaks: formState.enableBreaks,
      break_duration_minutes: Math.max(0, Number(formState.breakDurationMinutes) || 0),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="w-[min(94vw,520px)] rounded-[28px] border border-white/80 bg-[#fcfbff] p-0 shadow-[0_30px_80px_-35px_rgba(109,40,217,0.45)]"
      >
        <DialogTitle className="sr-only">Availability settings</DialogTitle>
        <DialogDescription className="sr-only">
          Adjust booking notice, buffer time, and break settings for public availability.
        </DialogDescription>

        <div className="border-b border-[#eadff7] bg-gradient-to-br from-[#fff7ff] via-[#faf7ff] to-[#f6efff] px-6 pb-5 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 shadow-sm">
                <Settings2 className="h-5 w-5 text-[#8b5cf6]" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b5cf6]">Booking rules</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Availability Settings</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Control how much notice you need, how buffers work, and whether breaks should trim public slots.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8c4ff] bg-white/90 text-[#8b5cf6] transition hover:bg-[#f7f1ff]"
              aria-label="Close availability settings"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-sm">
              <Label htmlFor="min-notice" className="text-sm font-semibold text-slate-900">
                Minimum Notice
              </Label>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Smallest lead time clients need before they can request a slot.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Input
                  id="min-notice"
                  type="number"
                  min={0}
                  value={formState.minNoticeHours}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      minNoticeHours: event.target.value,
                    }))
                  }
                />
                <span className="text-sm font-medium text-slate-500">hours</span>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-sm">
              <Label htmlFor="buffer-minutes" className="text-sm font-semibold text-slate-900">
                Booking Buffer
              </Label>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Automatic gap around bookings for travel, setup, or decompression.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Input
                  id="buffer-minutes"
                  type="number"
                  min={0}
                  value={formState.bufferMinutes}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      bufferMinutes: event.target.value,
                    }))
                  }
                />
                <span className="text-sm font-medium text-slate-500">mins</span>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Checkbox
                id="enable-breaks"
                checked={formState.enableBreaks}
                onCheckedChange={(checked) =>
                  setFormState((current) => ({
                    ...current,
                    enableBreaks: Boolean(checked),
                  }))
                }
              />
              <div className="min-w-0">
                <Label htmlFor="enable-breaks" className="text-sm font-semibold text-slate-900">
                  Enable Break Trimming
                </Label>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Shorten exposed booking windows by your break duration to avoid back-to-back requests.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-slate-400" />
              <Input
                type="number"
                min={0}
                disabled={!formState.enableBreaks}
                value={formState.breakDurationMinutes}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    breakDurationMinutes: event.target.value,
                  }))
                }
              />
              <span className="text-sm font-medium text-slate-500">mins</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#eadff7] px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => onOpenChange(false)}
            disabled={settingsSaving}
          >
            Cancel
          </Button>
          <PrimaryActionButton
            type="button"
            className="rounded-2xl"
            isLoading={settingsSaving}
            loadingText="Saving..."
            onClick={handleSave}
          >
            Save Settings
          </PrimaryActionButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvailabilitySettingsModal;
