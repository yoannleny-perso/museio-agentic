import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Plus,
  Receipt,
  Send,
  Wallet,
} from 'lucide-react';
import {
  endOfQuarter,
  format,
  isWithinInterval,
  parseISO,
  startOfQuarter,
  subDays,
  subQuarters,
} from 'date-fns';

import InvoiceStatusWidget from '@/components/finance/InvoiceStatusWidget';
import ForecastWidget from '@/components/finance/ForecastWidget';
import StripeDashboardButton from '@/components/finance/StripeDashboardButton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import { useBankDetails } from '@/context/BankDetailsContext';
import { useInvoiceSettings } from '@/hooks/useInvoiceSettings';
import { useProfile } from '@/context/ProfileContext';
import { useInvoiceSender } from '@/hooks/useInvoiceSender';
import { supabase } from '@/integrations/supabase/client';
import { cn, formatCurrency } from '@/lib/utils';
import { getJobDisplayPrice } from '@/utils/jobPricing';
import { JOB_STATUS } from '@/contracts';
import type { Job } from '@/types';

type FinanceTab = 'overview' | 'deposits' | 'reports' | 'tax-centre';
type DepositsView = 'deposits' | 'payouts';
type AccountingBasis = 'cash' | 'accrual';
type ExportFormat = 'bas-package' | 'pdf-report' | 'csv';
type DepositMode = 'percentage' | 'fixed';

interface SentInvoiceRecord {
  id: string;
  invoice_number: string;
  amount: number;
  job_id: string | null;
  client_email: string;
  status: string | null;
  sent_at: string;
  due_date?: string | null;
  updated_at?: string | null;
}

interface DepositRow {
  job: Job;
  totalAmount: number;
  depositTargetAmount: number;
  depositIssuedAmount: number;
  depositPaidAmount: number;
  relatedInvoices: SentInvoiceRecord[];
  outstandingAmount: number;
  depositDue: Date;
  balanceDue: Date;
  depositPaid: boolean;
  balancePaid: boolean;
  hasOpenInvoice: boolean;
}

interface PayoutRow {
  id: string;
  title: string;
  date: string;
  gross: number;
  platformFee: number;
  artistNet: number;
  status: 'completed' | 'pending';
}

interface ReportPeriod {
  id: string;
  label: string;
  shortLabel: string;
  start: Date;
  end: Date;
  revenue: number;
  gst: number;
  taxableRevenue: number;
  invoiceCount: number;
  exportedAt?: string;
}

interface CombinedReportPeriod {
  id: string;
  label: string;
  shortLabel: string;
  cash: ReportPeriod;
  accrual: ReportPeriod;
}

interface DepositDefaults {
  mode: DepositMode;
  value: number;
  dueLeadDays: number;
}

interface AnnualSummaryMetric {
  label: string;
  cash: number;
  accrual: number;
  trend?: number;
}

const PAID_INVOICE_STATUSES = new Set(['paid', 'invoice_paid']);
const FINANCE_EXPORT_HISTORY_KEY = 'finance-report-export-history-v1';
const FINANCE_DEPOSIT_DEFAULTS_KEY = 'finance-deposit-defaults-v1';
const DEFAULT_DEPOSIT_DEFAULTS: DepositDefaults = {
  mode: 'percentage',
  value: 50,
  dueLeadDays: 14,
};
const PLATFORM_FEE_RATE = 0.05;

const loadStoredJson = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const roundCurrency = (value: number) =>
  Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;

const isPaidInvoiceStatus = (status: string | null | undefined) =>
  status ? PAID_INVOICE_STATUSES.has(status) : false;

const getInvoiceClientName = (job: Job) =>
  job.client_data?.venue_name || job.client || job.contact_name || 'Client';

const getInvoiceContactEmail = (job: Job) =>
  job.client_data?.email_address || job.contact_email || '';

const getInvoiceLocation = (job: Job) =>
  job.client_data?.location || job.location || 'Location not set';

const downloadFile = (filename: string, type: string, content: BlobPart) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const buildCsv = (rows: Array<Record<string, string | number>>) => {
  if (!rows.length) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) =>
    `"${String(value ?? '').replace(/"/g, '""')}"`;

  return [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((header) => escape(row[header] ?? '')).join(',')
    ),
  ].join('\n');
};

const getFinancialYearRange = (referenceDate: Date) => {
  const year =
    referenceDate.getMonth() >= 6
      ? referenceDate.getFullYear()
      : referenceDate.getFullYear() - 1;

  return {
    start: new Date(year, 6, 1),
    end: new Date(year + 1, 5, 30, 23, 59, 59, 999),
    label: `${year}-${String(year + 1).slice(-2)}`,
  };
};

const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="rounded-[20px] border border-dashed border-[#DDDCE7] bg-[#FAFAFD] px-4 py-8 text-center">
    <p className="text-base font-semibold text-[#1F2430]">{title}</p>
    <p className="mx-auto mt-2 max-w-[250px] text-[13px] leading-5 text-[#7A7F8C]">
      {description}
    </p>
  </div>
);

const Finance = () => {
  useAuthRedirect();

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { jobs, loading } = useAppContext();
  const { profileData } = useProfile();
  const { bankDetails } = useBankDetails();
  const { invoiceSettings } = useInvoiceSettings();
  const { sendInvoice, isSending: isSendingInvoice } = useInvoiceSender();

  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [depositsView, setDepositsView] = useState<DepositsView>('deposits');
  const [accountingBasis, setAccountingBasis] = useState<AccountingBasis>('cash');
  const [exportHistory, setExportHistory] = useState<Record<string, string>>(() =>
    loadStoredJson<Record<string, string>>(FINANCE_EXPORT_HISTORY_KEY, {})
  );
  const [depositDefaults, setDepositDefaults] = useState<DepositDefaults>(() =>
    loadStoredJson<DepositDefaults>(
      FINANCE_DEPOSIT_DEFAULTS_KEY,
      DEFAULT_DEPOSIT_DEFAULTS
    )
  );
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [depositJobId, setDepositJobId] = useState('');
  const [depositMode, setDepositMode] = useState<DepositMode>(depositDefaults.mode);
  const [depositValue, setDepositValue] = useState(depositDefaults.value);
  const [depositLeadDays, setDepositLeadDays] = useState(
    depositDefaults.dueLeadDays
  );
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('bas-package');
  const [exportPeriodId, setExportPeriodId] = useState('');

  const { data: sentInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['finance-sent-invoices', user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = (await supabase
        .from('sent_invoices')
        .select('*')
        .eq('user_id', user!.id)
        .order('sent_at', { ascending: false })) as {
        data: SentInvoiceRecord[] | null;
        error: Error | null;
      };

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });

  useEffect(() => {
    window.localStorage.setItem(
      FINANCE_EXPORT_HISTORY_KEY,
      JSON.stringify(exportHistory)
    );
  }, [exportHistory]);

  useEffect(() => {
    window.localStorage.setItem(
      FINANCE_DEPOSIT_DEFAULTS_KEY,
      JSON.stringify(depositDefaults)
    );
  }, [depositDefaults]);

  const financeTabs = useMemo(
    () => [
      { id: 'overview' as const, label: 'Overview', icon: DollarSign },
      { id: 'deposits' as const, label: 'Deposits', icon: CreditCard },
      { id: 'reports' as const, label: 'Reports', icon: BarChart3 },
      { id: 'tax-centre' as const, label: 'Tax Centre', icon: FileText },
    ],
    []
  );

  const invoiceMap = useMemo(() => {
    const map = new Map<string, SentInvoiceRecord[]>();

    sentInvoices.forEach((invoice) => {
      if (!invoice.job_id) {
        return;
      }

      const rows = map.get(invoice.job_id) ?? [];
      rows.push(invoice);
      map.set(invoice.job_id, rows);
    });

    return map;
  }, [sentInvoices]);

  const activeJobs = useMemo(
    () =>
      jobs
        .filter(
          (job) =>
            job.status !== JOB_STATUS.requested && job.status !== JOB_STATUS.drafted
        )
        .sort(
          (left, right) =>
            new Date(left.date).getTime() - new Date(right.date).getTime()
        ),
    [jobs]
  );

  const depositRows = useMemo<DepositRow[]>(() => {
    return activeJobs.map((job) => {
      const totalAmount = roundCurrency(getJobDisplayPrice(job));
      const relatedInvoices = [...(invoiceMap.get(job.id) ?? [])].sort(
        (left, right) =>
          new Date(right.sent_at).getTime() - new Date(left.sent_at).getTime()
      );
      const partialInvoices = relatedInvoices.filter(
        (invoice) =>
          Number(invoice.amount) > 0 && Number(invoice.amount) < totalAmount
      );
      const depositTargetAmount = partialInvoices.length
        ? roundCurrency(Number(partialInvoices[0].amount))
        : roundCurrency((totalAmount * depositDefaults.value) / 100);
      const depositIssuedAmount = partialInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.amount || 0),
        0
      );
      const depositPaidAmount = partialInvoices
        .filter((invoice) => isPaidInvoiceStatus(invoice.status))
        .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
      const totalPaidAmount = relatedInvoices
        .filter((invoice) => isPaidInvoiceStatus(invoice.status))
        .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);

      return {
        job,
        totalAmount,
        depositTargetAmount,
        depositIssuedAmount,
        depositPaidAmount,
        relatedInvoices,
        outstandingAmount: Math.max(totalAmount - totalPaidAmount, 0),
        depositDue: subDays(parseISO(job.date), depositDefaults.dueLeadDays),
        balanceDue: parseISO(job.date),
        depositPaid:
          depositPaidAmount >= Math.min(depositTargetAmount, totalAmount) ||
          totalPaidAmount >= Math.min(depositTargetAmount, totalAmount),
        balancePaid: totalPaidAmount >= totalAmount || job.status === JOB_STATUS.paid,
        hasOpenInvoice: relatedInvoices.some(
          (invoice) => !isPaidInvoiceStatus(invoice.status)
        ),
      };
    });
  }, [activeJobs, depositDefaults.dueLeadDays, depositDefaults.value, invoiceMap]);

  const depositPendingRows = useMemo(
    () => depositRows.filter((row) => !row.balancePaid),
    [depositRows]
  );

  const totalPendingDeposits = useMemo(
    () =>
      roundCurrency(
        depositPendingRows.reduce(
          (sum, row) =>
            sum + Math.max(row.depositTargetAmount - row.depositPaidAmount, 0),
          0
        )
      ),
    [depositPendingRows]
  );

  const totalPaidDeposits = useMemo(
    () =>
      roundCurrency(
        depositRows.reduce((sum, row) => sum + row.depositPaidAmount, 0)
      ),
    [depositRows]
  );

  const totalOutstandingBalances = useMemo(
    () =>
      roundCurrency(
        depositPendingRows.reduce((sum, row) => sum + row.outstandingAmount, 0)
      ),
    [depositPendingRows]
  );

  const payoutRows = useMemo<PayoutRow[]>(() => {
    const completed = jobs
      .filter((job) => job.status === JOB_STATUS.paid)
      .map((job) => {
        const gross = roundCurrency(getJobDisplayPrice(job));
        const platformFee = roundCurrency(gross * PLATFORM_FEE_RATE);

        return {
          id: job.id,
          title: job.title,
          date: job.date,
          gross,
          platformFee,
          artistNet: roundCurrency(gross - platformFee),
          status: 'completed' as const,
        };
      });

    const pending = jobs
      .filter(
        (job) =>
          job.status === JOB_STATUS.invoiceSent || job.status === JOB_STATUS.upcoming
      )
      .map((job) => {
        const gross = roundCurrency(getJobDisplayPrice(job));
        const platformFee = roundCurrency(gross * PLATFORM_FEE_RATE);

        return {
          id: `pending-${job.id}`,
          title: job.title,
          date: job.date,
          gross,
          platformFee,
          artistNet: roundCurrency(gross - platformFee),
          status: 'pending' as const,
        };
      });

    return [...pending, ...completed].sort(
      (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
    );
  }, [jobs]);

  const completedPayouts = useMemo(
    () => payoutRows.filter((row) => row.status === 'completed'),
    [payoutRows]
  );
  const pendingPayouts = useMemo(
    () => payoutRows.filter((row) => row.status === 'pending'),
    [payoutRows]
  );
  const totalCompletedPayouts = useMemo(
    () =>
      roundCurrency(
        completedPayouts.reduce((sum, row) => sum + row.artistNet, 0)
      ),
    [completedPayouts]
  );
  const totalPendingPayouts = useMemo(
    () =>
      roundCurrency(
        pendingPayouts.reduce((sum, row) => sum + row.artistNet, 0)
      ),
    [pendingPayouts]
  );

  const getPeriodInvoices = useCallback(
    (basis: AccountingBasis, start: Date, end: Date) =>
      sentInvoices.filter((invoice) => {
        const referenceDate =
          basis === 'cash' && invoice.updated_at
            ? new Date(invoice.updated_at)
            : new Date(invoice.sent_at);

        if (basis === 'cash' && !isPaidInvoiceStatus(invoice.status)) {
          return false;
        }

        return isWithinInterval(referenceDate, { start, end });
      }),
    [sentInvoices]
  );

  const buildReportPeriodsForBasis = useCallback(
    (basis: AccountingBasis): ReportPeriod[] =>
      Array.from({ length: 4 }, (_, index) => {
        const periodStart = startOfQuarter(subQuarters(new Date(), index));
        const periodEnd = endOfQuarter(periodStart);
        const periodInvoices = getPeriodInvoices(basis, periodStart, periodEnd);
        const revenue = roundCurrency(
          periodInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0)
        );
        const gst = invoiceSettings?.addGST ? roundCurrency(revenue - revenue / 1.1) : 0;
        const taxableRevenue = invoiceSettings?.addGST
          ? roundCurrency(revenue - gst)
          : revenue;
        const label = `Q${Math.floor(periodStart.getMonth() / 3) + 1} ${format(periodStart, 'yyyy')}`;
        const shortLabel = `${format(periodStart, 'MMM')}–${format(periodEnd, 'MMM')}`;

        return {
          id: `${format(periodStart, 'yyyy')}-Q${Math.floor(periodStart.getMonth() / 3) + 1}`,
          label,
          shortLabel,
          start: periodStart,
          end: periodEnd,
          revenue,
          gst,
          taxableRevenue,
          invoiceCount: new Set(periodInvoices.map((invoice) => invoice.id)).size,
          exportedAt: exportHistory[`${basis}:${label}`],
        };
      }),
    [exportHistory, getPeriodInvoices, invoiceSettings?.addGST]
  );

  const cashReportPeriods = useMemo(
    () => buildReportPeriodsForBasis('cash'),
    [buildReportPeriodsForBasis]
  );
  const accrualReportPeriods = useMemo(
    () => buildReportPeriodsForBasis('accrual'),
    [buildReportPeriodsForBasis]
  );
  const reportPeriods = useMemo(
    () => (accountingBasis === 'cash' ? cashReportPeriods : accrualReportPeriods),
    [accountingBasis, accrualReportPeriods, cashReportPeriods]
  );
  const combinedReportPeriods = useMemo<CombinedReportPeriod[]>(() => {
    const cashById = new Map(cashReportPeriods.map((period) => [period.id, period]));

    return accrualReportPeriods.map((period) => ({
      id: period.id,
      label: period.label,
      shortLabel: period.shortLabel,
      cash: cashById.get(period.id) ?? period,
      accrual: period,
    }));
  }, [accrualReportPeriods, cashReportPeriods]);

  const currentFinancialYear = useMemo(() => getFinancialYearRange(new Date()), []);
  const previousFinancialYear = useMemo(
    () => getFinancialYearRange(new Date(currentFinancialYear.start.getFullYear(), 0, 1)),
    [currentFinancialYear.start]
  );

  const getFinancialYearRevenue = useCallback(
    (basis: AccountingBasis, start: Date, end: Date) =>
      roundCurrency(
        getPeriodInvoices(basis, start, end).reduce(
          (sum, invoice) => sum + Number(invoice.amount || 0),
          0
        )
      ),
    [getPeriodInvoices]
  );

  const annualSummaryMetrics = useMemo<AnnualSummaryMetric[]>(() => {
    const buildBasisSummary = (basis: AccountingBasis) => {
      const revenue = getFinancialYearRevenue(
        basis,
        currentFinancialYear.start,
        currentFinancialYear.end
      );
      const previousRevenue = getFinancialYearRevenue(
        basis,
        previousFinancialYear.start,
        previousFinancialYear.end
      );
      const gst = invoiceSettings?.addGST ? roundCurrency(revenue - revenue / 1.1) : 0;
      const gstFreeRevenue = invoiceSettings?.addGST ? 0 : revenue;
      const netRevenue = invoiceSettings?.addGST ? roundCurrency(revenue - gst) : revenue;
      const trend =
        previousRevenue > 0
          ? ((revenue - previousRevenue) / previousRevenue) * 100
          : undefined;

      return { revenue, gst, gstFreeRevenue, netRevenue, trend };
    };

    const cashSummary = buildBasisSummary('cash');
    const accrualSummary = buildBasisSummary('accrual');

    return [
      {
        label: 'Total Revenue',
        cash: cashSummary.revenue,
        accrual: accrualSummary.revenue,
        trend: cashSummary.trend,
      },
      {
        label: 'GST Collected',
        cash: cashSummary.gst,
        accrual: accrualSummary.gst,
        trend: cashSummary.trend,
      },
      {
        label: 'GST-Free Revenue',
        cash: cashSummary.gstFreeRevenue,
        accrual: accrualSummary.gstFreeRevenue,
      },
      {
        label: 'Net Revenue (ex GST)',
        cash: cashSummary.netRevenue,
        accrual: accrualSummary.netRevenue,
        trend: cashSummary.trend,
      },
    ];
  }, [
    currentFinancialYear.end,
    currentFinancialYear.start,
    getFinancialYearRevenue,
    invoiceSettings?.addGST,
    previousFinancialYear.end,
    previousFinancialYear.start,
  ]);

  const currentTaxPeriod = cashReportPeriods[0] ?? null;
  const gstCollected = currentTaxPeriod?.gst ?? 0;
  const gstPayable = gstCollected;
  const nextBasDue = useMemo(
    () =>
      currentTaxPeriod
        ? subDays(new Date(currentTaxPeriod.end.getTime() + 28 * 24 * 60 * 60 * 1000), -1)
        : new Date(),
    [currentTaxPeriod]
  );
  const basDaysRemaining = useMemo(
    () =>
      Math.max(
        Math.ceil((nextBasDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        0
      ),
    [nextBasDue]
  );

  const currentPeriodSummary = useMemo(() => {
    if (!currentTaxPeriod) {
      return [];
    }

    return [
      {
        label: 'GST Collected',
        value: formatCurrency(gstCollected),
        caption: currentTaxPeriod.label,
        width: `${Math.max(
          Math.min(
            (gstCollected / Math.max(currentTaxPeriod.revenue || 1, 1)) * 100,
            100
          ),
          20
        )}%`,
        className: 'from-green-400 to-emerald-500',
      },
      {
        label: 'GST Payable',
        value: formatCurrency(gstPayable),
        caption: 'Paid jobs only',
        width: `${Math.max(
          Math.min(
            (gstPayable / Math.max(currentTaxPeriod.revenue || 1, 1)) * 100,
            100
          ),
          20
        )}%`,
        className: 'from-amber-400 to-orange-500',
      },
      {
        label: 'BAS Due',
        value: format(nextBasDue, 'dd MMM yyyy'),
        caption: `${basDaysRemaining} day${basDaysRemaining === 1 ? '' : 's'} remaining`,
        width: `${Math.max(Math.min(((28 - basDaysRemaining) / 28) * 100, 100), 24)}%`,
        className: 'from-[#8F6EE6] to-[#7A42E8]',
      },
    ];
  }, [basDaysRemaining, currentTaxPeriod, gstCollected, gstPayable, nextBasDue]);

  const selectedDepositJob = useMemo(
    () => jobs.find((job) => job.id === depositJobId) ?? null,
    [depositJobId, jobs]
  );
  const selectedDepositJobAmount = selectedDepositJob
    ? roundCurrency(getJobDisplayPrice(selectedDepositJob))
    : 0;

  const computedDepositAmount = useMemo(() => {
    if (!selectedDepositJob) {
      return 0;
    }

    if (depositMode === 'fixed') {
      return Math.min(roundCurrency(depositValue), selectedDepositJobAmount);
    }

    return Math.min(
      roundCurrency((selectedDepositJobAmount * depositValue) / 100),
      selectedDepositJobAmount
    );
  }, [depositMode, depositValue, selectedDepositJob, selectedDepositJobAmount]);

  const selectedExportPeriod = useMemo(
    () =>
      reportPeriods.find((period) => period.id === exportPeriodId) ??
      reportPeriods[0] ??
      null,
    [exportPeriodId, reportPeriods]
  );

  useEffect(() => {
    if (!depositJobId && activeJobs.length) {
      setDepositJobId(activeJobs[0].id);
    }
  }, [activeJobs, depositJobId]);

  useEffect(() => {
    if (!exportPeriodId && reportPeriods.length) {
      setExportPeriodId(reportPeriods[0].id);
    }
  }, [exportPeriodId, reportPeriods]);

  const sendCustomInvoice = useCallback(
    async (job: Job, amount: number, suffix: string) => {
      if (!profileData || !bankDetails) {
        toast({
          title: 'Complete finance setup first',
          description:
            'Profile and bank details are required before sending invoices.',
          variant: 'destructive',
        });
        navigate('/app/settings?tab=account');
        return false;
      }

      if (!job.contact_email) {
        toast({
          title: 'Missing client email',
          description:
            'Add a contact email to this job before sending an invoice.',
          variant: 'destructive',
        });
        return false;
      }

      const invoiceJob: Job = {
        ...job,
        title: `${job.title} — ${suffix}`,
        rate: roundCurrency(amount),
        pricing_mode: 'simple',
        job_items: [],
        discount_percent: 0,
      };

      const success = await sendInvoice(
        invoiceJob,
        profileData,
        bankDetails,
        invoiceSettings?.logo ?? null
      );

      if (success) {
        await queryClient.invalidateQueries({
          queryKey: ['finance-sent-invoices'],
        });
      }

      return success;
    },
    [
      bankDetails,
      invoiceSettings?.logo,
      navigate,
      profileData,
      queryClient,
      sendInvoice,
      toast,
    ]
  );

  const openReminderDraft = useCallback(
    (row: DepositRow) => {
      const recipient = getInvoiceContactEmail(row.job);
      if (!recipient) {
        toast({
          title: 'Missing client email',
          description: 'Add a client email before opening a reminder.',
          variant: 'destructive',
        });
        return;
      }

      const amount = row.depositPaid
        ? row.outstandingAmount
        : row.depositTargetAmount;
      const subject = row.depositPaid
        ? `Balance reminder for ${row.job.title}`
        : `Deposit reminder for ${row.job.title}`;
      const bodyLines = [
        `Hi ${row.job.contact_name || getInvoiceClientName(row.job)},`,
        '',
        row.depositPaid
          ? `Just a quick reminder that the remaining balance of ${formatCurrency(amount)} for ${row.job.title} is still outstanding.`
          : `Just a quick reminder that the deposit of ${formatCurrency(amount)} for ${row.job.title} is due soon.`,
        '',
        `Job date: ${format(parseISO(row.job.date), 'PPP')}`,
        `Location: ${getInvoiceLocation(row.job)}`,
        '',
        'Let me know if you have any questions.',
      ];

      window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    },
    [toast]
  );

  const copyDepositDraft = useCallback(async () => {
    if (!selectedDepositJob) {
      return;
    }

    const recipientName =
      selectedDepositJob.contact_name || getInvoiceClientName(selectedDepositJob);
    const preferredDueDate = depositLeadDays
      ? subDays(parseISO(selectedDepositJob.date), depositLeadDays)
      : new Date();
    const body = [
      `Hi ${recipientName},`,
      '',
      `I'm preparing the deposit request for ${selectedDepositJob.title}.`,
      `Requested deposit: ${formatCurrency(computedDepositAmount)}`,
      `Preferred due date: ${format(preferredDueDate, 'PPP')}`,
      '',
      'Once confirmed, I can issue the invoice directly from Museio.',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(body);
      toast({
        title: 'Deposit draft copied',
        description:
          'The deposit request text is ready to paste anywhere you need it.',
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Your browser blocked clipboard access for this action.',
        variant: 'destructive',
      });
    }
  }, [computedDepositAmount, depositLeadDays, selectedDepositJob, toast]);

  const sendDepositInvoice = useCallback(async () => {
    if (!selectedDepositJob || computedDepositAmount <= 0) {
      return;
    }

    setDepositDefaults({
      mode: depositMode,
      value: depositValue,
      dueLeadDays: depositLeadDays,
    });

    const success = await sendCustomInvoice(
      selectedDepositJob,
      computedDepositAmount,
      'Deposit Invoice'
    );

    if (success) {
      setIsDepositDialogOpen(false);
    }
  }, [
    computedDepositAmount,
    depositLeadDays,
    depositMode,
    depositValue,
    selectedDepositJob,
    sendCustomInvoice,
  ]);

  const sendBalanceInvoice = useCallback(
    async (row: DepositRow) => {
      if (row.outstandingAmount <= 0) {
        return;
      }

      await sendCustomInvoice(row.job, row.outstandingAmount, 'Balance Invoice');
    },
    [sendCustomInvoice]
  );

  const openDepositDialogForJob = useCallback(
    (jobId?: string) => {
      if (jobId) {
        setDepositJobId(jobId);
      }

      setIsDepositDialogOpen(true);
    },
    []
  );

  const exportPayoutHistoryCsv = useCallback(() => {
    if (!payoutRows.length) {
      toast({
        title: 'No payouts to export',
        description: 'Payout history will appear here once you have finance activity.',
        variant: 'destructive',
      });
      return;
    }

    const csvContent = buildCsv(
      payoutRows.map((row) => ({
        title: row.title,
        date: format(parseISO(row.date), 'yyyy-MM-dd'),
        status: row.status,
        gross_amount: row.gross,
        platform_fee: row.platformFee,
        artist_net: row.artistNet,
      }))
    );

    downloadFile(
      `payout-history-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      'text/csv;charset=utf-8',
      csvContent
    );

    toast({
      title: 'Payout history exported',
      description: 'Your payout CSV is ready to download.',
    });
  }, [payoutRows, toast]);

  const exportReport = useCallback(async () => {
    if (!selectedExportPeriod) {
      return;
    }

    const periodInvoices = getPeriodInvoices(
      accountingBasis,
      selectedExportPeriod.start,
      selectedExportPeriod.end
    );

    const rows = periodInvoices.map((invoice) => {
      const linkedJob = jobs.find((job) => job.id === invoice.job_id);

      return {
        invoice_number: invoice.invoice_number,
        job_title: linkedJob?.title || 'Untitled job',
        client: linkedJob ? getInvoiceClientName(linkedJob) : invoice.client_email,
        amount: Number(invoice.amount || 0),
        status: invoice.status || 'sent',
        issued_on: invoice.sent_at
          ? format(new Date(invoice.sent_at), 'yyyy-MM-dd')
          : '',
        due_date: invoice.due_date || '',
      };
    });

    if (exportFormat === 'csv' || exportFormat === 'bas-package') {
      const summaryRows =
        exportFormat === 'bas-package'
          ? [
              {
                section: 'summary',
                period: selectedExportPeriod.label,
                taxable_revenue: selectedExportPeriod.taxableRevenue,
                gst_collected: selectedExportPeriod.gst,
                total_revenue: selectedExportPeriod.revenue,
                accounting_basis: accountingBasis,
              },
            ]
          : [];

      const csvContent = buildCsv([
        ...summaryRows,
        ...(summaryRows.length
          ? [
              {
                section: 'transactions',
                period: '',
                taxable_revenue: '',
                gst_collected: '',
                total_revenue: '',
                accounting_basis: '',
              },
            ]
          : []),
        ...rows.map((row) => ({
          invoice_number: row.invoice_number,
          job_title: row.job_title,
          client: row.client,
          amount: row.amount,
          status: row.status,
          issued_on: row.issued_on,
          due_date: row.due_date,
        })),
      ]);

      downloadFile(
        `finance-${selectedExportPeriod.id}-${exportFormat}.csv`,
        'text/csv;charset=utf-8',
        csvContent
      );
    } else {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      let cursorY = 18;

      doc.setFontSize(18);
      doc.text(`Finance Report — ${selectedExportPeriod.label}`, 14, cursorY);
      cursorY += 10;

      doc.setFontSize(11);
      doc.text(`Accounting basis: ${accountingBasis}`, 14, cursorY);
      cursorY += 8;
      doc.text(
        `Revenue: ${formatCurrency(selectedExportPeriod.revenue)}`,
        14,
        cursorY
      );
      cursorY += 6;
      doc.text(`GST: ${formatCurrency(selectedExportPeriod.gst)}`, 14, cursorY);
      cursorY += 10;

      rows.forEach((row) => {
        if (cursorY > 270) {
          doc.addPage();
          cursorY = 18;
        }

        const text = `${row.invoice_number}  •  ${row.job_title}  •  ${row.client}  •  ${formatCurrency(Number(row.amount))}`;
        doc.text(doc.splitTextToSize(text, 180), 14, cursorY);
        cursorY += 10;
      });

      doc.save(`finance-${selectedExportPeriod.id}.pdf`);
    }

    setExportHistory((current) => ({
      ...current,
      [`${accountingBasis}:${selectedExportPeriod.label}`]: new Date().toISOString(),
    }));
    setIsExportDialogOpen(false);
    toast({
      title: 'Report exported',
      description: `${selectedExportPeriod.label} is ready to download.`,
    });
  }, [
    accountingBasis,
    exportFormat,
    getPeriodInvoices,
    jobs,
    selectedExportPeriod,
    toast,
  ]);

  const depositAwaitingCount = useMemo(
    () => depositPendingRows.filter((row) => !row.depositPaid).length,
    [depositPendingRows]
  );
  const depositReceivedCount = useMemo(
    () => depositRows.filter((row) => row.depositPaid).length,
    [depositRows]
  );
  const balanceOutstandingCount = useMemo(
    () => depositPendingRows.filter((row) => !row.balancePaid).length,
    [depositPendingRows]
  );
  const annualSummaryLabel = `${currentFinancialYear.start.getFullYear()}–${currentFinancialYear.end.getFullYear()}`;
  const loadingFinanceTabs = loading || invoicesLoading;

  return (
    <div
      className={`mx-auto w-full max-w-[390px] space-y-4 pb-24 ${
        Capacitor.isNativePlatform() ? 'pt-14' : ''
      }`}
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as FinanceTab)}
        className="w-full"
      >
        <TabsList className="flex justify-between w-full mb-6 bg-transparent h-auto p-0">
          {financeTabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex flex-col items-center gap-1 py-2 px-2 text-xs font-medium border-none bg-transparent data-[state=active]:bg-gray-50/80 data-[state=active]:shadow-lg data-[state=active]:text-museio-purple data-[state=active]:scale-105 rounded-lg flex-1 transition-all duration-200 hover:bg-gray-50 hover:shadow-md"
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {activeTab === 'overview' ? (
        loading ? (
          <div className="rounded-[28px] border border-[#DDDCE7] bg-white px-6 py-12 shadow-sm">
            <div className="flex items-center justify-center py-6">
              <div className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent text-[#8B5CF6]" />
              <span className="text-base text-slate-600">
                Loading financial overview…
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <InvoiceStatusWidget />
            <ForecastWidget />
            <StripeDashboardButton />
          </div>
        )
      ) : null}

      {activeTab === 'deposits' ? (
        <div className="space-y-4">
          <div className="inline-flex gap-1 rounded-[14px] border border-[#DDDCE7] bg-white p-1 shadow-[0_6px_20px_-16px_rgba(31,36,48,0.5)]">
            {(['deposits', 'payouts'] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setDepositsView(view)}
                className={cn(
                  'rounded-[11px] px-4 py-2 text-[12px] font-semibold capitalize transition-all',
                  depositsView === view
                    ? 'bg-[#F7F4FD] text-[#1F2430] shadow-sm'
                    : 'text-[#7A7F8C]'
                )}
              >
                {view}
              </button>
            ))}
          </div>

          {depositsView === 'deposits' ? (
            <>
              <section className="rounded-[26px] border border-[#DDDCE7] bg-white p-4 shadow-sm">
                <div className="space-y-4">
                  {[
                    {
                      icon: Clock3,
                      label: 'Awaiting Deposit',
                      value: formatCurrency(totalPendingDeposits),
                      subLabel: `${depositAwaitingCount} client${depositAwaitingCount === 1 ? '' : 's'}`,
                      iconClassName: 'bg-amber-50 text-amber-500',
                      barClassName: 'from-amber-400 to-orange-400',
                      width: `${Math.max(
                        Math.min(
                          (totalPendingDeposits /
                            Math.max(
                              totalPendingDeposits +
                                totalPaidDeposits +
                                totalOutstandingBalances,
                              1
                            )) *
                            100,
                          100
                        ),
                        18
                      )}%`,
                    },
                    {
                      icon: CheckCircle2,
                      label: 'Deposits Received',
                      value: formatCurrency(totalPaidDeposits),
                      subLabel: `${depositReceivedCount} confirmed`,
                      iconClassName: 'bg-green-50 text-green-500',
                      barClassName: 'from-green-400 to-emerald-400',
                      width: `${Math.max(
                        Math.min(
                          (totalPaidDeposits /
                            Math.max(
                              totalPendingDeposits +
                                totalPaidDeposits +
                                totalOutstandingBalances,
                              1
                            )) *
                            100,
                          100
                        ),
                        18
                      )}%`,
                    },
                    {
                      icon: Wallet,
                      label: 'Balance Outstanding',
                      value: formatCurrency(totalOutstandingBalances),
                      subLabel: `${balanceOutstandingCount} final invoice${balanceOutstandingCount === 1 ? '' : 's'}`,
                      iconClassName: 'bg-blue-50 text-blue-500',
                      barClassName: 'from-blue-400 to-indigo-400',
                      width: `${Math.max(
                        Math.min(
                          (totalOutstandingBalances /
                            Math.max(
                              totalPendingDeposits +
                                totalPaidDeposits +
                                totalOutstandingBalances,
                              1
                            )) *
                            100,
                          100
                        ),
                        18
                      )}%`,
                    },
                  ].map((metric) => (
                    <div key={metric.label} className="flex items-start gap-3">
                      <div
                        className={cn(
                          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          metric.iconClassName
                        )}
                      >
                        <metric.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] font-semibold text-[#7A7F8C]">
                            {metric.label}
                          </p>
                          <p className="text-sm font-bold text-[#1F2430]">
                            {metric.value}
                          </p>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#F3F4F8]">
                          <div
                            className={cn(
                              'h-full rounded-full bg-gradient-to-r',
                              metric.barClassName
                            )}
                            style={{ width: metric.width }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-[#7A7F8C]">
                          {metric.subLabel}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[26px] border border-[#DDDCE7] bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[20px] font-bold text-[#1F2430]">All Deposits</h2>
                  <button
                    type="button"
                    onClick={() => openDepositDialogForJob(depositRows[0]?.job.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7A42E8] text-white shadow-md"
                    aria-label="New Deposit Request"
                    title="New Deposit Request"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {depositRows.length ? (
                    depositRows.map((row) => {
                      const paidAmount = roundCurrency(
                        row.totalAmount - row.outstandingAmount
                      );
                      const primaryAction = !row.depositPaid
                        ? row.depositIssuedAmount > 0 || row.hasOpenInvoice
                          ? {
                              label: 'Send Reminder',
                              onClick: () => openReminderDraft(row),
                              variant: 'solid' as const,
                            }
                          : {
                              label: 'Send Deposit Invoice',
                              onClick: () => openDepositDialogForJob(row.job.id),
                              variant: 'solid' as const,
                            }
                        : !row.balancePaid
                          ? {
                              label: 'Send Balance Invoice',
                              onClick: () => void sendBalanceInvoice(row),
                              variant: 'outline' as const,
                            }
                          : null;

                      return (
                        <div
                          key={row.job.id}
                          className="rounded-[22px] border border-[#DDDCE7] p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4EEFD] text-[#7A42E8]">
                              <CreditCard className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-[#1F2430]">
                                {row.job.title}
                              </p>
                              <p className="text-[13px] text-[#7A7F8C]">
                                {getInvoiceClientName(row.job)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-[11px] text-[#7A7F8C]">
                              <span>Payment Progress</span>
                              <span>
                                {formatCurrency(paidAmount)} /{' '}
                                {formatCurrency(row.totalAmount)}
                              </span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-[#F3F4F8]">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#8F6EE6] to-[#7A42E8]"
                                style={{
                                  width: `${Math.min(
                                    (paidAmount / Math.max(row.totalAmount, 1)) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                                row.depositPaid
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                              )}
                            >
                              {row.depositPaid ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <Clock3 className="h-3 w-3" />
                              )}
                              {row.depositPaid
                                ? `Deposit Paid ${format(row.depositDue, 'd MMM')}`
                                : `Deposit Due ${format(row.depositDue, 'd MMM')}`}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4EEFD] px-2.5 py-1 text-[11px] font-semibold text-[#7A42E8]">
                              <Clock3 className="h-3 w-3" />
                              Balance Due {format(row.balanceDue, 'd MMM')}
                            </span>
                          </div>

                          <div className="mt-4 flex items-end justify-between gap-3">
                            <div>
                              <p className="text-[32px] font-bold leading-none text-[#1F2430]">
                                {formatCurrency(row.depositTargetAmount)}
                              </p>
                              <p className="mt-1 text-[11px] text-[#7A7F8C]">
                                of {formatCurrency(row.totalAmount)} total
                              </p>
                            </div>

                            {primaryAction ? (
                              <button
                                type="button"
                                onClick={primaryAction.onClick}
                                className={cn(
                                  'rounded-[14px] px-4 py-2 text-[13px] font-semibold transition-colors',
                                  primaryAction.variant === 'solid'
                                    ? 'bg-[#7A42E8] text-white hover:bg-[#6816B0]'
                                    : 'border border-[#8F6EE6] text-[#7A42E8] hover:bg-[#F4EEFD]'
                                )}
                                disabled={isSendingInvoice}
                              >
                                {primaryAction.label}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <EmptyState
                      title="No deposits yet"
                      description="Create and invoice jobs first, then deposits and balance tracking will appear here automatically."
                    />
                  )}
                </div>
              </section>
            </>
          ) : (
            <>
              <section className="rounded-[26px] border border-[#DDDCE7] bg-white p-4 shadow-sm">
                <div className="space-y-4">
                  {[
                    {
                      icon: Wallet,
                      label: 'Total Net Payouts',
                      value: formatCurrency(totalCompletedPayouts),
                      subLabel: 'Completed this year',
                      iconClassName: 'bg-[#F4EEFD] text-[#7A42E8]',
                      barClassName: 'from-[#8F6EE6] to-[#7A42E8]',
                      width: `${Math.max(
                        Math.min(
                          (totalCompletedPayouts /
                            Math.max(
                              totalCompletedPayouts + totalPendingPayouts,
                              1
                            )) *
                            100,
                          100
                        ),
                        18
                      )}%`,
                    },
                    {
                      icon: Clock3,
                      label: 'Pending Payouts',
                      value: formatCurrency(totalPendingPayouts),
                      subLabel: `${pendingPayouts.length} upcoming job${
                        pendingPayouts.length === 1 ? '' : 's'
                      }`,
                      iconClassName: 'bg-amber-50 text-amber-500',
                      barClassName: 'from-amber-400 to-orange-400',
                      width: `${Math.max(
                        Math.min(
                          (totalPendingPayouts /
                            Math.max(
                              totalCompletedPayouts + totalPendingPayouts,
                              1
                            )) *
                            100,
                          100
                        ),
                        18
                      )}%`,
                    },
                  ].map((metric) => (
                    <div key={metric.label} className="flex items-start gap-3">
                      <div
                        className={cn(
                          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          metric.iconClassName
                        )}
                      >
                        <metric.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] font-semibold text-[#7A7F8C]">
                            {metric.label}
                          </p>
                          <p className="text-sm font-bold text-[#1F2430]">
                            {metric.value}
                          </p>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#F3F4F8]">
                          <div
                            className={cn(
                              'h-full rounded-full bg-gradient-to-r',
                              metric.barClassName
                            )}
                            style={{ width: metric.width }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-[#7A7F8C]">
                          {metric.subLabel}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[26px] border border-[#DDDCE7] bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[20px] font-bold text-[#1F2430]">Payout History</h2>
                  <button
                    type="button"
                    onClick={() => void exportPayoutHistoryCsv()}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#7A42E8]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </button>
                </div>

                <div className="space-y-3">
                  {payoutRows.length ? (
                    payoutRows.map((row) => (
                      <div
                        key={row.id}
                        className="rounded-[22px] border border-[#DDDCE7] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[#1F2430]">{row.title}</p>
                            <p className="text-[13px] text-[#7A7F8C]">
                              {format(parseISO(row.date), 'd MMMM yyyy')}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                              row.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            )}
                          >
                            {row.status === 'completed' ? 'Completed' : 'Pending'}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-[14px]">
                          <div className="flex items-center justify-between">
                            <span className="text-[#7A7F8C]">Gross Amount</span>
                            <span className="font-semibold text-[#1F2430]">
                              {formatCurrency(row.gross)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#7A7F8C]">Platform Fee (5%)</span>
                            <span className="font-semibold text-red-500">
                              −{formatCurrency(row.platformFee)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-[#EEEAF8] pt-2">
                            <span className="font-bold text-[#1F2430]">Your Net</span>
                            <span className="text-[28px] font-bold leading-none text-[#7A42E8]">
                              {formatCurrency(row.artistNet)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="No payout history yet"
                      description="Completed payouts will appear here automatically once jobs are paid and settled."
                    />
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      ) : null}

      {activeTab === 'reports' ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setActiveTab('tax-centre')}
            className="inline-flex items-center gap-2 rounded-[14px] border border-[#DDDCE7] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#1F2430] shadow-sm"
          >
            <FileText className="h-4 w-4 text-[#7A42E8]" />
            Open Tax Centre
          </button>

          <section className="rounded-[26px] border border-[#DDDCE7] bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-bold text-[#1F2430]">
                  Annual Summary {annualSummaryLabel}
                </h2>
                <p className="mt-1 text-[12px] text-[#7A7F8C]">
                  Cash and accrual reporting combined
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {annualSummaryMetrics.map((metric) => (
                <div key={metric.label} className="rounded-[18px] bg-[#F8F9FB] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[11px] text-[#7A7F8C]">{metric.label}</p>
                    <div className="flex items-center gap-1">
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#7A7F8C]">
                        Cash
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#7A7F8C]">
                        Accrual
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-[14px]">
                    <div className="rounded-[14px] bg-white px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#7A7F8C]">
                        Cash basis
                      </p>
                      <p className="mt-1 font-semibold text-[#1F2430]">
                        {formatCurrency(metric.cash)}
                      </p>
                    </div>
                    <div className="rounded-[14px] bg-white px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#7A7F8C]">
                        Accrual basis
                      </p>
                      <p className="mt-1 font-semibold text-[#1F2430]">
                        {formatCurrency(metric.accrual)}
                      </p>
                    </div>
                  </div>
                  {typeof metric.trend === 'number' ? (
                    <p className="mt-2 text-[11px] font-semibold text-green-600">
                      {metric.trend >= 0 ? '+' : ''}
                      {metric.trend.toFixed(0)}% vs prior year
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setAccountingBasis('cash');
                setExportFormat('pdf-report');
                setIsExportDialogOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-[14px] bg-gradient-to-r from-[#8F6EE6] to-[#7A42E8] px-4 py-3 text-[13px] font-semibold text-white"
            >
              <Download className="h-4 w-4" />
              Export Annual Report
            </button>
          </section>

          <section className="rounded-[26px] border border-[#DDDCE7] bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-[20px] font-bold text-[#1F2430]">
              Quarterly Reports
            </h2>
            <div className="space-y-3">
              {combinedReportPeriods.map((period) => {
                const exportedAt = period.cash.exportedAt ?? period.accrual.exportedAt;

                return (
                  <div key={period.id} className="rounded-[20px] border border-[#DDDCE7] p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4EEFD] text-[#7A42E8]">
                        <BarChart3 className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[#1F2430]">
                              {period.label} ({period.shortLabel})
                            </p>
                            <p className="text-[12px] text-[#7A7F8C]">
                              {Math.max(
                                period.cash.invoiceCount,
                                period.accrual.invoiceCount
                              )}{' '}
                              jobs
                            </p>
                          </div>
                          {exportedAt ? (
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                              Exported {format(new Date(exportedAt), 'd MMM')}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
                          <div className="rounded-[14px] bg-[#F8F9FB] px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-[#7A7F8C]">
                              Cash basis
                            </p>
                            <p className="mt-1 font-medium text-[#1F2430]">
                              Revenue: {formatCurrency(period.cash.revenue)}
                            </p>
                            <p className="mt-0.5 text-[#7A7F8C]">
                              GST: {formatCurrency(period.cash.gst)}
                            </p>
                          </div>
                          <div className="rounded-[14px] bg-[#F8F9FB] px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-[#7A7F8C]">
                              Accrual basis
                            </p>
                            <p className="mt-1 font-medium text-[#1F2430]">
                              Revenue: {formatCurrency(period.accrual.revenue)}
                            </p>
                            <p className="mt-0.5 text-[#7A7F8C]">
                              GST: {formatCurrency(period.accrual.gst)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setAccountingBasis('cash');
                            setExportPeriodId(period.id);
                            setExportFormat('bas-package');
                            setIsExportDialogOpen(true);
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-[12px] border border-[#DDDCE7] px-3 py-2 text-[13px] font-semibold text-[#4F5868]"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Export
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === 'tax-centre' ? (
        <div className="space-y-4">
          <section className="rounded-[26px] border border-[#DDDCE7] bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[20px] font-bold text-[#1F2430]">Tax Centre</h2>
                <p className="mt-1 text-[13px] leading-5 text-[#7A7F8C]">
                  Manage GST, track BAS readiness, and export ATO reports
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[22px] border border-[#DDDCE7] bg-white p-4">
              <div className="space-y-4">
                {currentPeriodSummary.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F8F9FB] text-[#7A42E8]">
                      {item.label === 'GST Collected' ? (
                        <Receipt className="h-4 w-4 text-green-600" />
                      ) : item.label === 'GST Payable' ? (
                        <DollarSign className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Calendar className="h-4 w-4 text-[#7A42E8]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7A7F8C]">
                          {item.label}
                        </span>
                        <span className="text-[20px] font-bold leading-none text-[#1F2430]">
                          {item.value}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F3F4F8]">
                        <div
                          className={cn('h-full rounded-full bg-gradient-to-r', item.className)}
                          style={{ width: item.width }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-[#7A7F8C]">{item.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setAccountingBasis('cash');
                  setExportFormat('bas-package');
                  setIsExportDialogOpen(true);
                }}
                className="flex w-full items-center gap-4 rounded-[20px] border border-[#DDDCE7] px-4 py-4 text-left"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F4EEFD] text-[#7A42E8]">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-[#1F2430]">Download BAS Package</p>
                  <p className="text-[13px] text-[#7A7F8C]">Ready for ATO submission</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className="flex w-full items-center gap-4 rounded-[20px] border border-[#DDDCE7] px-4 py-4 text-left"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4FF] text-blue-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-[#1F2430]">View GST Report</p>
                  <p className="text-[13px] text-[#7A7F8C]">Detailed breakdown by job</p>
                </div>
              </button>
            </div>
          </section>

          <div className="rounded-[20px] border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">GST Tracking</p>
                <p className="mt-1 text-[13px] leading-5 text-green-700">
                  All invoice amounts automatically track GST. Your quarterly BAS package is generated from paid jobs only.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="max-w-xl rounded-[30px] border-[#DDDCE7] bg-white p-0">
          <DialogHeader className="border-b border-[#EEEAF8] px-6 py-5 text-left">
            <DialogTitle className="text-2xl font-bold text-[#1F2430]">
              New Deposit Request
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-slate-500">
              Create a deposit invoice for any job, or copy a polished deposit email before sending.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2430]">
                Linked Job
              </label>
              <select
                value={depositJobId}
                onChange={(event) => setDepositJobId(event.target.value)}
                className="w-full rounded-2xl border-2 border-[#DDDCE7] bg-white px-4 py-3 text-sm text-[#1F2430] outline-none transition-colors focus:border-[#7A42E8]"
              >
                {activeJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} • {getInvoiceClientName(job)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2430]">
                  Deposit Type
                </label>
                <div className="flex gap-2 rounded-2xl bg-[#F8F9FB] p-1">
                  {(['percentage', 'fixed'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDepositMode(mode)}
                      className={cn(
                        'flex-1 rounded-[14px] px-4 py-3 text-sm font-semibold capitalize transition-all',
                        depositMode === mode
                          ? 'bg-white text-[#1F2430] shadow-sm'
                          : 'text-slate-500 hover:text-[#1F2430]'
                      )}
                    >
                      {mode === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2430]">
                  {depositMode === 'percentage' ? 'Deposit Percentage' : 'Deposit Amount'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step={depositMode === 'percentage' ? '5' : '50'}
                    value={depositValue}
                    onChange={(event) =>
                      setDepositValue(Number(event.target.value) || 0)
                    }
                    className="w-full rounded-2xl border-2 border-[#DDDCE7] bg-white px-4 py-3 pr-12 text-sm text-[#1F2430] outline-none transition-colors focus:border-[#7A42E8]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                    {depositMode === 'percentage' ? '%' : 'AUD'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2430]">
                  Due Days Before Job
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={depositLeadDays}
                  onChange={(event) =>
                    setDepositLeadDays(Number(event.target.value) || 0)
                  }
                  className="w-full rounded-2xl border-2 border-[#DDDCE7] bg-white px-4 py-3 text-sm text-[#1F2430] outline-none transition-colors focus:border-[#7A42E8]"
                />
              </div>
              <div className="rounded-[24px] border border-[#DDDCE7] bg-[#F8F9FB] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Preview
                </p>
                <p className="mt-2 text-lg font-bold text-[#1F2430]">
                  {formatCurrency(computedDepositAmount)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedDepositJob
                    ? `${formatCurrency(selectedDepositJobAmount)} total job value`
                    : 'Pick a job to preview'}
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#E3DBF9] bg-[#F4EEFD] p-4 text-sm text-slate-600">
              Deposit invoices use your existing invoice branding and payment terms. The due date above is used for the copied request text.
            </div>
          </div>

          <DialogFooter className="border-t border-[#EEEAF8] px-6 py-5">
            <Button
              type="button"
              variant="outline"
              className="rounded-[16px] px-4 py-2"
              onClick={() => void copyDepositDraft()}
            >
              Copy Deposit Draft
            </Button>
            <Button
              type="button"
              className="rounded-[16px] px-4 py-2"
              onClick={() => void sendDepositInvoice()}
              disabled={!selectedDepositJob || computedDepositAmount <= 0 || isSendingInvoice}
            >
              <Send className="h-4 w-4" />
              {isSendingInvoice ? 'Sending…' : 'Send Deposit Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-xl rounded-[30px] border-[#DDDCE7] bg-white p-0">
          <DialogHeader className="border-b border-[#EEEAF8] px-6 py-5 text-left">
            <DialogTitle className="text-2xl font-bold text-[#1F2430]">
              Export Report
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-slate-500">
              Choose a finance period, basis, and export format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2430]">
                Period
              </label>
              <select
                value={selectedExportPeriod?.id ?? ''}
                onChange={(event) => setExportPeriodId(event.target.value)}
                className="w-full rounded-2xl border-2 border-[#DDDCE7] bg-white px-4 py-3 text-sm text-[#1F2430] outline-none transition-colors focus:border-[#7A42E8]"
              >
                {reportPeriods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.label} • {period.shortLabel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2430]">
                Export Format
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  { value: 'bas-package' as const, label: 'BAS Package' },
                  { value: 'pdf-report' as const, label: 'PDF Report' },
                  { value: 'csv' as const, label: 'CSV' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setExportFormat(option.value)}
                    className={cn(
                      'rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition-all',
                      exportFormat === option.value
                        ? 'border-[#7A42E8] bg-[#F4EEFD] text-[#7A42E8]'
                        : 'border-[#DDDCE7] text-slate-600 hover:border-[#8F6EE6]'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2430]">
                Accounting Basis
              </label>
              <div className="flex gap-2 rounded-2xl bg-[#F8F9FB] p-1">
                {(['cash', 'accrual'] as const).map((basis) => (
                  <button
                    key={basis}
                    type="button"
                    onClick={() => setAccountingBasis(basis)}
                    className={cn(
                      'flex-1 rounded-[14px] px-4 py-3 text-sm font-semibold capitalize transition-all',
                      accountingBasis === basis
                        ? 'bg-white text-[#1F2430] shadow-sm'
                        : 'text-slate-500 hover:text-[#1F2430]'
                    )}
                  >
                    {basis} basis
                  </button>
                ))}
              </div>
            </div>

            {selectedExportPeriod ? (
              <div className="rounded-[24px] border border-[#DDDCE7] bg-[#F8F9FB] p-4 text-sm text-slate-600">
                <p className="font-semibold text-[#1F2430]">
                  {selectedExportPeriod.label}
                </p>
                <p className="mt-1">
                  Revenue {formatCurrency(selectedExportPeriod.revenue)} • GST{' '}
                  {formatCurrency(selectedExportPeriod.gst)} •{' '}
                  {selectedExportPeriod.invoiceCount} invoice
                  {selectedExportPeriod.invoiceCount === 1 ? '' : 's'}
                </p>
              </div>
            ) : null}
          </div>

          <DialogFooter className="border-t border-[#EEEAF8] px-6 py-5">
            <Button
              type="button"
              variant="outline"
              className="rounded-[16px] px-4 py-2"
              onClick={() => setIsExportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[16px] px-4 py-2"
              onClick={() => exportReport()}
              disabled={!selectedExportPeriod}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Finance;
