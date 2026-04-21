import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  FileText,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  Receipt,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PrimaryActionButton } from '@/components/ui/primary-action-button';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Client, Job } from '@/types';
import PhoneInput from '@/components/shared/PhoneInput';
import MultiEmailInput from '@/components/shared/MultiEmailInput';
import { cn, formatCurrency, formatTimeWithoutSeconds } from '@/lib/utils';
import { getJobDisplayPrice } from '@/utils/jobPricing';

const clientSchema = z.object({
  venue_name: z.string().min(1, 'Client name is required'),
  contact_name: z.string().optional(),
  email_address: z
    .string()
    .min(1, 'Email address is required')
    .refine(
      (val) => {
        if (!val || val.trim() === '') return false;
        const emails = val.split(',').map((email) => email.trim()).filter(Boolean);
        return emails.every((email) => z.string().email().safeParse(email).success);
      },
      { message: 'Please enter valid email address(es)' }
    ),
  location: z.string().optional(),
  phone: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;
type DetailTab = 'overview' | 'jobs' | 'notes';
type ViewMode = 'details' | 'edit';

const CLIENT_NOTE_STORAGE_PREFIX = 'museio-client-note';

interface DeleteClientResult {
  success: boolean;
  error?: string;
  jobCount?: number;
}

interface EditClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onUpdateClient: (id: string, clientData: Partial<Client>) => Promise<boolean>;
  onDeleteClient: (id: string) => Promise<DeleteClientResult>;
}

const normalizeClientName = (value?: string) => (value || '').trim().toLowerCase();

const getClientNoteStorageKey = (client: Client) =>
  `${CLIENT_NOTE_STORAGE_PREFIX}:${client.user_id}:${client.id}`;

const getClientInitials = (clientName: string) =>
  clientName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'C';

const isLinkedJob = (job: Job, client: Client) =>
  job.client_id === client.id || normalizeClientName(job.client) === normalizeClientName(client.venue_name);

const statusBadgeClasses: Record<Job['status'], string> = {
  requested: 'bg-[#fff4df] text-[#b26a00] border-[#ffe0ab]',
  drafted: 'bg-slate-100 text-slate-600 border-slate-200',
  upcoming: 'bg-[#e8f0ff] text-[#3556c8] border-[#d6e3ff]',
  past: 'bg-slate-100 text-slate-500 border-slate-200',
  'invoice-sent': 'bg-[#f6ecff] text-[#7e49d8] border-[#ead7ff]',
  paid: 'bg-[#e7f8ef] text-[#1d8f5a] border-[#caedd9]',
  deleted: 'bg-[#fff1f4] text-[#d8576b] border-[#ffd4dc]',
};

const MetricCard = ({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'purple' | 'amber' | 'green';
}) => {
  const toneClasses = {
    default: 'bg-white text-slate-900 border-slate-200',
    purple: 'bg-[#f6ecff] text-[#7e49d8] border-[#ead7ff]',
    amber: 'bg-[#fff5e7] text-[#b26a00] border-[#ffe3b0]',
    green: 'bg-[#e7f8ef] text-[#1d8f5a] border-[#caedd9]',
  };

  return (
    <div className={cn('rounded-2xl border px-4 py-3 shadow-sm', toneClasses[tone])}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
};

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm">
    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6ecff]">
      <Icon className="h-4 w-4 text-[#8b5cf6]" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-900">{value}</p>
    </div>
  </div>
);

const QuickAction = ({
  icon: Icon,
  label,
  description,
  onClick,
  disabled = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'flex items-start gap-3 rounded-2xl border p-4 text-left transition-all',
      disabled
        ? 'cursor-not-allowed border-slate-200 bg-slate-100/70 opacity-60'
        : 'border-slate-200 bg-white/95 shadow-sm hover:border-[#d8c4ff] hover:bg-[#fcf8ff] hover:shadow-md'
    )}
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f6ecff]">
      <Icon className="h-4 w-4 text-[#8b5cf6]" />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  </button>
);

const JobStatusBadge = ({ status }: { status: Job['status'] }) => (
  <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize', statusBadgeClasses[status])}>
    {status.replace('-', ' ')}
  </span>
);

const EditClientDialog: React.FC<EditClientDialogProps> = ({
  isOpen,
  onClose,
  client,
  onUpdateClient,
  onDeleteClient,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { jobs } = useAppContext();

  const [viewMode, setViewMode] = useState<ViewMode>('details');
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [clientSnapshot, setClientSnapshot] = useState<Client | null>(client);
  const [storedNotes, setStoredNotes] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDependencyWarning, setShowDependencyWarning] = useState(false);
  const [jobCount, setJobCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      venue_name: '',
      contact_name: '',
      email_address: '',
      location: '',
      phone: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (!client || !isOpen) return;

    setClientSnapshot(client);
    setViewMode('details');
    setActiveTab('overview');
    setIsEditingNotes(false);
    setShowDeleteConfirm(false);
    setShowDependencyWarning(false);
    setJobCount(0);

    form.reset({
      venue_name: client.venue_name,
      contact_name: client.contact_name || '',
      email_address: client.email_address || '',
      location: client.location || '',
      phone: client.phone || '',
    });

    const savedNotes = typeof window === 'undefined'
      ? ''
      : localStorage.getItem(getClientNoteStorageKey(client)) || '';
    setStoredNotes(savedNotes);
    setNoteDraft(savedNotes);
  }, [client, form, isOpen]);

  const currentClient = clientSnapshot ?? client;

  const emailList = useMemo(
    () =>
      (currentClient?.email_address || '')
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean),
    [currentClient?.email_address]
  );

  const primaryEmail = emailList[0] || '';

  const linkedJobs = useMemo(() => {
    if (!currentClient) return [];

    return jobs
      .filter((job) => isLinkedJob(job, currentClient))
      .sort((left, right) => right.date.localeCompare(left.date));
  }, [currentClient, jobs]);

  const clientMetrics = useMemo(() => {
    return linkedJobs.reduce(
      (acc, job) => {
        const amount = getJobDisplayPrice(job);

        if (job.status === 'paid') {
          acc.totalPaid += amount;
        }

        if (job.status === 'invoice-sent') {
          acc.outstanding += amount;
        }

        if (job.status === 'upcoming' || job.status === 'requested') {
          acc.forecast += amount;
        }

        if (job.status === 'invoice-sent' || job.status === 'paid') {
          acc.invoiceCount += 1;
        }

        return acc;
      },
      {
        totalPaid: 0,
        outstanding: 0,
        forecast: 0,
        invoiceCount: 0,
      }
    );
  }, [linkedJobs]);

  const mostRecentJob = linkedJobs[0];

  const handleClose = () => {
    form.reset();
    setShowDeleteConfirm(false);
    setShowDependencyWarning(false);
    setViewMode('details');
    setActiveTab('overview');
    setIsEditingNotes(false);
    onClose();
  };

  const handleSaveNotes = () => {
    if (!currentClient || typeof window === 'undefined') return;

    const trimmedNotes = noteDraft.trim();
    const storageKey = getClientNoteStorageKey(currentClient);

    if (trimmedNotes) {
      localStorage.setItem(storageKey, trimmedNotes);
    } else {
      localStorage.removeItem(storageKey);
    }

    setStoredNotes(trimmedNotes);
    setNoteDraft(trimmedNotes);
    setIsEditingNotes(false);
    toast({
      title: 'Notes saved',
      description: 'Client notes were saved on this device.',
    });
  };

  const handleEmailClient = () => {
    if (!primaryEmail) return;
    window.location.href = `mailto:${primaryEmail}?subject=${encodeURIComponent(`Museio follow-up for ${currentClient?.venue_name || 'your booking'}`)}`;
  };

  const handleCallClient = () => {
    if (!currentClient?.phone) return;
    window.location.href = `tel:${currentClient.phone}`;
  };

  const handleOpenJobsPage = () => {
    handleClose();
    navigate('/app/jobs');
  };

  const handleOpenNewJob = () => {
    handleClose();
    navigate('/app/jobs/new');
  };

  const onSubmit = async (data: ClientFormData) => {
    if (!currentClient) return;

    const nextClientData = {
      venue_name: data.venue_name,
      contact_name: data.contact_name || undefined,
      email_address: data.email_address,
      location: data.location || undefined,
      phone: data.phone || undefined,
    };

    const success = await onUpdateClient(currentClient.id, nextClientData);
    if (!success) return;

    setClientSnapshot((previous) =>
      previous
        ? {
            ...previous,
            ...nextClientData,
            updated_at: new Date().toISOString(),
          }
        : previous
    );

    form.reset({
      venue_name: data.venue_name,
      contact_name: data.contact_name || '',
      email_address: data.email_address,
      location: data.location || '',
      phone: data.phone || '',
    });
    setViewMode('details');
  };

  const handleDelete = async () => {
    if (!currentClient) return;

    setIsDeleting(true);
    const result = await onDeleteClient(currentClient.id);

    if (result.success) {
      setShowDeleteConfirm(false);
      handleClose();
    } else if (result.error === 'DEPENDENCY_CONFLICT') {
      setShowDeleteConfirm(false);
      setShowDependencyWarning(true);
      setJobCount(result.jobCount || 0);
    }

    setIsDeleting(false);
  };

  if (!currentClient) return null;

  const renderDetailsView = () => (
    <>
      <div className="border-b border-[#eadff7] bg-gradient-to-br from-[#fff7ff] via-[#faf7ff] to-[#f6efff] px-5 pb-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#a98cff] via-[#8b5cf6] to-[#6e59a5] shadow-lg">
              <span className="text-lg font-semibold text-white">{getClientInitials(currentClient.venue_name)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b5cf6]">Client profile</p>
              <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-900">
                {currentClient.venue_name}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {currentClient.contact_name ? (
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                    {currentClient.contact_name}
                  </span>
                ) : null}
                {currentClient.location ? (
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                    {currentClient.location}
                  </span>
                ) : null}
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                  Client since {format(new Date(currentClient.created_at), 'MMM yyyy')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8c4ff] bg-white/90 text-[#8b5cf6] transition hover:bg-[#f7f1ff]"
              aria-label="Edit client"
            >
              <PencilLine className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f3d3d8] bg-white/90 text-[#d8576b] transition hover:bg-[#fff1f4]"
              aria-label="Delete client"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8c4ff] bg-white/90 text-[#8b5cf6] transition hover:bg-[#f7f1ff]"
              aria-label="Close client details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MetricCard label="Paid" value={formatCurrency(clientMetrics.totalPaid)} tone="green" />
          <MetricCard label="Forecast" value={formatCurrency(clientMetrics.forecast)} tone="purple" />
          <MetricCard label="Outstanding" value={formatCurrency(clientMetrics.outstanding)} tone="amber" />
          <MetricCard label="Jobs" value={`${linkedJobs.length}`} tone="default" />
        </div>
      </div>

      <div className="border-b border-[#eadff7] bg-white/80 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {([
            ['overview', 'Overview'],
            ['jobs', 'Jobs'],
            ['notes', 'Notes'],
          ] as Array<[DetailTab, string]>).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                activeTab === tab
                  ? 'bg-[#8b5cf6] text-white shadow-sm'
                  : 'bg-[#f4effd] text-slate-600 hover:bg-[#ede4ff] hover:text-[#7c3aed]'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4">
        {activeTab === 'overview' ? (
          <div className="space-y-5">
            <div className="grid gap-3">
              {primaryEmail ? <InfoRow icon={Mail} label="Email" value={primaryEmail} /> : null}
              {currentClient.phone ? <InfoRow icon={Phone} label="Phone" value={currentClient.phone} /> : null}
              {currentClient.location ? <InfoRow icon={MapPin} label="Location" value={currentClient.location} /> : null}
              {mostRecentJob ? (
                <InfoRow
                  icon={CalendarClock}
                  label="Latest booking"
                  value={format(new Date(`${mostRecentJob.date}T00:00:00`), 'EEEE, MMM d, yyyy')}
                />
              ) : null}
            </div>

            {clientMetrics.outstanding > 0 ? (
              <div className="rounded-[24px] border border-[#ffe3b0] bg-[#fff7e8] p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b26a00]">Outstanding balance</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                      {formatCurrency(clientMetrics.outstanding)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {clientMetrics.invoiceCount} invoice{clientMetrics.invoiceCount === 1 ? '' : 's'} still awaiting payment.
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#b26a00] shadow-sm">
                    <Receipt className="h-5 w-5" />
                  </div>
                </div>

                {primaryEmail ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 w-full rounded-2xl border-[#ffd999] bg-white text-[#b26a00] hover:bg-[#fffaf1]"
                    onClick={handleEmailClient}
                  >
                    <Mail className="h-4 w-4" />
                    Email Reminder
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Quick actions</p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Keep moving with this client</h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <QuickAction
                  icon={BriefcaseBusiness}
                  label="Create Job"
                  description="Open the New Job flow and add another booking for this client."
                  onClick={handleOpenNewJob}
                />
                <QuickAction
                  icon={Mail}
                  label="Email Client"
                  description={primaryEmail ? 'Open your mail app with this client prefilled.' : 'Add an email address in Edit Client to use this action.'}
                  onClick={handleEmailClient}
                  disabled={!primaryEmail}
                />
                <QuickAction
                  icon={Phone}
                  label="Call Client"
                  description={currentClient.phone ? 'Start a phone call from your device.' : 'Add a phone number in Edit Client to use this action.'}
                  onClick={handleCallClient}
                  disabled={!currentClient.phone}
                />
                <QuickAction
                  icon={StickyNote}
                  label="Open Notes"
                  description="Capture preferences, logistics, and booking reminders."
                  onClick={() => setActiveTab('notes')}
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Recent jobs</p>
                  <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Linked work history</h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-[#8b5cf6] hover:bg-[#f7f1ff] hover:text-[#7c3aed]"
                  onClick={() => setActiveTab('jobs')}
                >
                  View All
                </Button>
              </div>

              {linkedJobs.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {linkedJobs.slice(0, 3).map((job) => (
                    <div key={job.id} className="rounded-2xl border border-slate-200/90 bg-[#fcfbff] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{job.title}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {format(new Date(`${job.date}T00:00:00`), 'EEE, MMM d, yyyy')}
                          </p>
                        </div>
                        <JobStatusBadge status={job.status} />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-500">
                          {formatTimeWithoutSeconds(job.start_time)} - {formatTimeWithoutSeconds(job.end_time)}
                        </span>
                        <span className="font-semibold text-[#7c3aed]">{formatCurrency(getJobDisplayPrice(job))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/90 p-5 text-center">
                  <Building2 className="mx-auto h-9 w-9 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-900">No linked jobs yet</p>
                  <p className="mt-1 text-sm text-slate-500">Create the first booking for this client to start building history here.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === 'jobs' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Job history</p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                  {linkedJobs.length} linked job{linkedJobs.length === 1 ? '' : 's'}
                </h3>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl border-[#d8c4ff] text-[#7c3aed] hover:bg-[#f7f1ff]"
                  onClick={handleOpenJobsPage}
                >
                  <FileText className="h-4 w-4" />
                  Open Jobs
                </Button>
                <PrimaryActionButton type="button" className="rounded-2xl" onClick={handleOpenNewJob}>
                  <BriefcaseBusiness className="h-4 w-4" />
                  New Job
                </PrimaryActionButton>
              </div>
            </div>

            {linkedJobs.length > 0 ? (
              <div className="space-y-3">
                {linkedJobs.map((job) => (
                  <div key={job.id} className="rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-slate-900">{job.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {format(new Date(`${job.date}T00:00:00`), 'EEEE, MMM d, yyyy')}
                        </p>
                        {job.location ? (
                          <p className="mt-1 text-sm text-slate-500">{job.location}</p>
                        ) : null}
                      </div>
                      <JobStatusBadge status={job.status} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#faf7ff] p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Time</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatTimeWithoutSeconds(job.start_time)} - {formatTimeWithoutSeconds(job.end_time)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#faf7ff] p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Value</p>
                        <p className="mt-1 text-sm font-semibold text-[#7c3aed]">
                          {formatCurrency(getJobDisplayPrice(job))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/90 p-6 text-center">
                <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-900">No jobs connected yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  This tab will show paid, upcoming, and invoiced work once you create jobs for this client.
                </p>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'notes' ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Client notes</p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Preferences and reminders</h3>
                <p className="mt-1 text-sm text-slate-500">Private notes saved on this device for quick testing and reference.</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="text-[#8b5cf6] hover:bg-[#f7f1ff] hover:text-[#7c3aed]"
                onClick={() => {
                  setIsEditingNotes((previous) => {
                    if (!previous) {
                      setNoteDraft(storedNotes);
                    }
                    return !previous;
                  });
                }}
              >
                {isEditingNotes ? 'Preview' : 'Edit'}
              </Button>
            </div>

            {isEditingNotes ? (
              <div className="rounded-[24px] border border-[#ead7ff] bg-white/95 p-4 shadow-sm">
                <Textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  placeholder="Add logistics, payment habits, setup details, or anything you want to remember for this client."
                  className="min-h-[180px] rounded-2xl border-[#d8c4ff] bg-[#fcf9ff] text-sm"
                />
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => {
                      setNoteDraft(storedNotes);
                      setIsEditingNotes(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <PrimaryActionButton type="button" className="rounded-2xl" onClick={handleSaveNotes}>
                    Save Notes
                  </PrimaryActionButton>
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-slate-200 bg-white/95 p-5 shadow-sm">
                {storedNotes ? (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{storedNotes}</p>
                ) : (
                  <div className="text-center">
                    <StickyNote className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-900">No notes saved yet</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Use this space for load-in details, invoice preferences, and anything you want handy on mobile.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  );

  const renderEditView = () => (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#eadff7] bg-gradient-to-br from-[#fff7ff] via-[#faf7ff] to-[#f6efff] px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => {
                form.reset({
                  venue_name: currentClient.venue_name,
                  contact_name: currentClient.contact_name || '',
                  email_address: currentClient.email_address || '',
                  location: currentClient.location || '',
                  phone: currentClient.phone || '',
                });
                setViewMode('details');
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d8c4ff] bg-white/90 text-[#8b5cf6] transition hover:bg-[#f7f1ff]"
              aria-label="Back to client details"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b5cf6]">Edit mode</p>
              <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-900">
                {currentClient.venue_name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">Update contact details and business information for this client.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d8c4ff] bg-white/90 text-[#8b5cf6] transition hover:bg-[#f7f1ff]"
            aria-label="Close client dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-sm">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="venue_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client (Venue or company name) *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter venue or company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <MultiEmailInput
                          placeholder="Enter email addresses..."
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <PhoneInput
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Enter phone number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Invoices" value={`${clientMetrics.invoiceCount}`} tone="purple" />
                <MetricCard label="Linked jobs" value={`${linkedJobs.length}`} tone="default" />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="soft-destructive"
                className="rounded-2xl"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Client
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => {
                    form.reset({
                      venue_name: currentClient.venue_name,
                      contact_name: currentClient.contact_name || '',
                      email_address: currentClient.email_address || '',
                      location: currentClient.location || '',
                      phone: currentClient.phone || '',
                    });
                    setViewMode('details');
                  }}
                >
                  Cancel
                </Button>
                <PrimaryActionButton
                  type="submit"
                  isLoading={form.formState.isSubmitting}
                  disabled={!form.formState.isValid || form.formState.isSubmitting}
                  loadingText="Saving..."
                  className="rounded-2xl"
                >
                  Save Changes
                </PrimaryActionButton>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent
          hideCloseButton
          className="w-[min(96vw,480px)] max-h-[88vh] rounded-[28px] border border-white/80 bg-[#fcfbff] p-0 shadow-[0_30px_80px_-35px_rgba(109,40,217,0.45)]"
          style={{ maxHeight: '88svh' }}
          aria-describedby="client-detail-description"
        >
          <DialogTitle className="sr-only">
            {viewMode === 'edit' ? 'Edit client' : 'Client details'}
          </DialogTitle>
          <DialogDescription id="client-detail-description" className="sr-only">
            View client details, related jobs, notes, and edit client information.
          </DialogDescription>

          <div className="flex h-full max-h-[88svh] flex-col overflow-hidden">
            {viewMode === 'details' ? renderDetailsView() : renderEditView()}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{currentClient.venue_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDependencyWarning} onOpenChange={setShowDependencyWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cannot Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              "{currentClient.venue_name}" cannot be deleted because it has {jobCount} associated job
              {jobCount !== 1 ? 's' : ''}. Please delete all related jobs first, then try again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Understood</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditClientDialog;
