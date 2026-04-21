import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Controller } from 'react-hook-form';
import { Check, Plus, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
import DatePickerField from '@/components/home/form/DatePickerField';
import TimeSelect from '@/components/home/form/TimeSelect';
import JobItemsManager from '@/components/home/form/JobItemsManager';
import MultiEmailInput from '@/components/shared/MultiEmailInput';
import PhoneInput from '@/components/shared/PhoneInput';
import { Button } from '@/components/ui/button';
import { useSupabaseClients } from '@/hooks/useSupabaseClients';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as SelectPrimitive from '@radix-ui/react-select';

interface NewJobCreationShellProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  onSaveDraft: () => void;
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  date: Date | null;
  setDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  handleSubmit: any;
  isSaving?: boolean;
  title?: string;
  control?: any;
  clearErrors?: any;
}

const fieldClassName =
  'h-12 rounded-xl border-2 border-[#DDDCE7] bg-white px-4 text-sm text-[#1F2430] shadow-none placeholder:text-[#A4A9B6] focus-visible:border-[#7A42E8] focus-visible:ring-0';

const sectionCardClassName =
  'rounded-[28px] border border-[#DDDCE7] bg-white p-5 shadow-[0_10px_32px_-22px_rgba(31,36,48,0.35)] sm:p-6';

const sectionTitleClassName = 'mb-4 text-xl font-bold text-[#1F2430]';

const emptyClientForm = {
  venue_name: '',
  contact_name: '',
  email_address: '',
  phone: '',
  location: '',
};

const SectionHeader: React.FC<{
  title: string;
  rightContent?: React.ReactNode;
}> = ({ title, rightContent }) => (
  <div className="mb-4 flex items-center justify-between gap-4">
    <h2 className={sectionTitleClassName}>{title}</h2>
    {rightContent}
  </div>
);

const FieldWrapper: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}> = ({ label, required = false, error, children }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-[#1F2430]">
      {label} {required && <span className="text-[#7A42E8]">*</span>}
    </Label>
    {children}
    {error ? <p className="text-sm text-red-600">{error}</p> : null}
  </div>
);

const NewJobCreationShell: React.FC<NewJobCreationShellProps> = ({
  onClose,
  onSubmit,
  onSaveDraft,
  register,
  errors,
  watch,
  setValue,
  date,
  setDate,
  endDate,
  setEndDate,
  handleSubmit,
  isSaving = false,
  title = 'New Job',
  control,
  clearErrors,
}) => {
  const formScrollRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState(emptyClientForm);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const { clients, loading: isLoadingClients, addClient } = useSupabaseClients();
  const { toast } = useToast();

  const jobItems = watch('job_items') || [];
  const clientName = watch('client') || '';
  const contactEmail = watch('contact_email') || '';
  const contactPhone = watch('contact_phone') || '';
  const totalLineItems = jobItems.length;
  const isExistingClientSelected = Boolean(selectedClientId);
  const hasClientSelection = Boolean(clientName?.trim());

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return;

    const previousDate = date;
    setDate(newDate);

    if (endDate && endDate < newDate) {
      setEndDate(newDate);
      setValue('end_date', format(newDate, 'yyyy-MM-dd'), { shouldValidate: true });
    }

    setValue('date', format(newDate, 'yyyy-MM-dd'), { shouldValidate: true });

    if (previousDate && newDate.toDateString() !== previousDate.toDateString()) {
      clearErrors?.(['end_time']);
      setTimeout(() => {
        setValue('end_time', watch('end_time'), { shouldValidate: true });
      }, 0);
    }
  };

  const handleEndDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return;

    let nextDate = newDate;
    if (date && nextDate < date) {
      nextDate = new Date(date);
    }

    const wasSingleDay = date && endDate && date.toDateString() === endDate.toDateString();
    const willBeMultiDay = date && nextDate.toDateString() !== date.toDateString();

    setEndDate(nextDate);
    setValue('end_date', format(nextDate, 'yyyy-MM-dd'), { shouldValidate: true });

    if ((wasSingleDay && willBeMultiDay) || (endDate && nextDate.toDateString() !== endDate.toDateString())) {
      clearErrors?.(['end_time']);
      setTimeout(() => {
        setValue('end_time', watch('end_time'), { shouldValidate: true });
      }, 0);
    }
  };

  const handleTimeChange = (field: string) => (value: string) => {
    setValue(field, value, { shouldValidate: true });

    if (field === 'end_time') {
      clearErrors?.(['end_time']);
    }

    if (field === 'start_time' && date && endDate && date.toDateString() === endDate.toDateString()) {
      const endTime = watch('end_time');
      if (endTime && endTime <= value) {
        const [hours, minutes] = value.split(':').map(Number);
        const nextHour = Math.min(hours + 1, 23);
        const nextEndTime = `${nextHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        setValue('end_time', nextEndTime, { shouldValidate: true });
      }
    }
  };

  const handleClearClientErrors = useCallback(() => {
    clearErrors?.(['client', 'contact_name', 'contact_email', 'location', 'contact_phone']);
  }, [clearErrors]);

  const closeAddClientModal = useCallback(() => {
    setShowAddClientModal(false);
    setNewClientForm(emptyClientForm);
  }, []);

  const hydrateClientFields = useCallback(
    (client: {
      venue_name?: string;
      contact_name?: string;
      email_address?: string;
      location?: string;
      phone?: string;
    }) => {
      setValue('client', client.venue_name || '', { shouldValidate: true });
      setValue('contact_name', client.contact_name || '', { shouldValidate: true });
      setValue('contact_email', client.email_address || '', { shouldValidate: true });
      setValue('location', client.location || '', { shouldValidate: true });
      setValue('contact_phone', client.phone || '', { shouldValidate: true });
      handleClearClientErrors();
    },
    [handleClearClientErrors, setValue]
  );

  const clearClientFields = useCallback(() => {
    setValue('client', '', { shouldValidate: true });
    setValue('contact_name', '', { shouldValidate: true });
    setValue('contact_email', '', { shouldValidate: true });
    setValue('location', '', { shouldValidate: true });
    setValue('contact_phone', '', { shouldValidate: true });
    handleClearClientErrors();
  }, [handleClearClientErrors, setValue]);

  const handleClientSelect = useCallback(
    (clientId: string) => {
      if (clientId === 'none') {
        setSelectedClientId('');
        clearClientFields();
        return;
      }

      const client = clients.find((entry) => entry.id === clientId);
      if (!client) return;

      setSelectedClientId(client.id);
      hydrateClientFields(client);
    },
    [clearClientFields, clients, hydrateClientFields]
  );

  const handleAddClientFieldChange = useCallback(
    (field: keyof typeof emptyClientForm, value: string) => {
      setNewClientForm((current) => ({
        ...current,
        [field]: value,
      }));
    },
    []
  );

  React.useEffect(() => {
    if (!clientName?.trim()) {
      if (selectedClientId) {
        setSelectedClientId('');
      }
      return;
    }

    const matchingClient = clients.find((client) => client.venue_name === clientName);
    if (matchingClient && matchingClient.id !== selectedClientId) {
      setSelectedClientId(matchingClient.id);
    }
  }, [clientName, clients, selectedClientId]);

  const handleSaveClient = useCallback(async () => {
    const venueName = watch('client');
    const emailValue = watch('contact_email');
    const contactName = watch('contact_name');
    const location = watch('location');
    const phoneValue = watch('contact_phone');

    if (!venueName?.trim()) {
      toast({
        title: 'Client name required',
        description: 'Please enter a client name before saving.',
        variant: 'destructive',
      });
      return;
    }

    if (!emailValue?.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter a client email before saving.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingClient(true);
    try {
      const newClient = await addClient({
        venue_name: venueName,
        email_address: emailValue,
        contact_name: contactName || '',
        location: location || '',
        phone: phoneValue || '',
      });

      if (newClient) {
        setSelectedClientId(newClient.id);
        hydrateClientFields(newClient);
        toast({
          title: 'Client saved',
          description: `${newClient.venue_name} has been saved to your clients.`,
        });
      }
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: 'Error saving client',
        description: 'There was an error saving the client. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingClient(false);
    }
  }, [addClient, hydrateClientFields, toast, watch]);

  const handleCreateClient = useCallback(async () => {
    if (!newClientForm.venue_name.trim()) {
      toast({
        title: 'Venue or company required',
        description: 'Please enter a venue or company name.',
        variant: 'destructive',
      });
      return;
    }

    if (!newClientForm.contact_name.trim()) {
      toast({
        title: 'Contact name required',
        description: 'Please enter a contact name.',
        variant: 'destructive',
      });
      return;
    }

    if (!newClientForm.email_address.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingClient(true);
    try {
      const createdClient = await addClient(newClientForm);
      if (!createdClient) {
        return;
      }

      setSelectedClientId(createdClient.id);
      hydrateClientFields(createdClient);
      closeAddClientModal();

      toast({
        title: 'Client added',
        description: `${createdClient.venue_name} is ready to use on this job.`,
      });
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: 'Error creating client',
        description: 'There was an error creating the client. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingClient(false);
    }
  }, [addClient, closeAddClientModal, hydrateClientFields, newClientForm, toast]);

  const shouldShowSaveClientButton =
    hasClientSelection &&
    !isExistingClientSelected &&
    clientName?.trim() &&
    contactEmail?.trim();

  const badgeLabel = title === 'Duplicate Job' ? 'Prefilled' : 'Upcoming';

  useEffect(() => {
    const scrollContainer = formScrollRef.current;
    if (!scrollContainer) return;

    const resetScrollPosition = () => {
      scrollContainer.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };

    resetScrollPosition();
    const firstFrame = requestAnimationFrame(() => {
      resetScrollPosition();
      closeButtonRef.current?.focus({ preventScroll: true });
    });
    const secondFrame = requestAnimationFrame(() => {
      resetScrollPosition();
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#F8F9FB]">
      <div className="shrink-0 border-b border-[#DDDCE7] bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="app-page-shell-form flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#1F2430]">{title}</h1>
            </div>
            <span className="rounded-full bg-[#F4EEFD] px-3 py-1 text-sm font-semibold text-[#7A42E8]">
              {badgeLabel}
            </span>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#7A7F8C] transition-colors hover:bg-[#F8F9FB]"
            aria-label="Close new job form"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div
          ref={formScrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6"
        >
          <div className="app-page-shell-form flex flex-col gap-8 pb-8">
            <section>
              <SectionHeader title="Job Details" />
              <div className={sectionCardClassName}>
                <div className="space-y-5">
                  <FieldWrapper label="Job Title" required error={errors.title?.message}>
                    <Input
                      {...register('title')}
                      placeholder="e.g., Corporate Gala Night"
                      className={fieldClassName}
                      disabled={isSaving}
                    />
                  </FieldWrapper>

                  <FieldWrapper label="Job Number" error={errors.job_number?.message}>
                    <Input
                      {...register('job_number')}
                      placeholder="e.g., MUS-2026-001"
                      className={fieldClassName}
                      disabled={isSaving}
                    />
                  </FieldWrapper>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Controller
                      control={control}
                      name="date"
                      render={({ fieldState }) => (
                        <DatePickerField
                          id="date"
                          label="Start Date"
                          date={date}
                          onDateSelect={handleDateSelect}
                          error={fieldState.error?.message}
                          required
                          buttonClassName="h-12 rounded-xl border-2 border-[#DDDCE7] bg-white px-4 text-sm text-[#1F2430] shadow-none hover:bg-white focus-visible:ring-0"
                          labelClassName="text-sm font-medium text-[#1F2430]"
                        />
                      )}
                    />

                    <FieldWrapper
                      label="Start Time"
                      required
                      error={errors.start_time?.message}
                    >
                      <TimeSelect
                        id="start_time"
                        value={watch('start_time')}
                        onChange={handleTimeChange('start_time')}
                        disabled={isSaving}
                        error={errors.start_time?.message}
                        includeNextDay={false}
                        triggerClassName="h-12 rounded-xl border-2 border-[#DDDCE7] bg-white px-4 text-sm text-[#1F2430] shadow-none focus-visible:ring-0"
                      />
                    </FieldWrapper>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Controller
                      control={control}
                      name="end_date"
                      render={({ fieldState }) => (
                        <DatePickerField
                          id="end_date"
                          label="End Date"
                          date={endDate}
                          onDateSelect={handleEndDateSelect}
                          error={fieldState.error?.message}
                          required
                          minDate={date}
                          buttonClassName="h-12 rounded-xl border-2 border-[#DDDCE7] bg-white px-4 text-sm text-[#1F2430] shadow-none hover:bg-white focus-visible:ring-0"
                          labelClassName="text-sm font-medium text-[#1F2430]"
                        />
                      )}
                    />

                    <FieldWrapper
                      label="End Time"
                      required
                      error={errors.end_time?.message}
                    >
                      <TimeSelect
                        id="end_time"
                        value={watch('end_time')}
                        onChange={handleTimeChange('end_time')}
                        disabled={isSaving}
                        error={errors.end_time?.message}
                        includeNextDay={false}
                        triggerClassName="h-12 rounded-xl border-2 border-[#DDDCE7] bg-white px-4 text-sm text-[#1F2430] shadow-none focus-visible:ring-0"
                      />
                    </FieldWrapper>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <SectionHeader
                title="Line Items"
                rightContent={
                  <span className="text-sm text-[#7A7F8C]">{totalLineItems}/10</span>
                }
              />
              <JobItemsManager
                control={control}
                watch={watch}
                errors={errors}
                disabled={isSaving}
                variant="prototype"
                showHeader={false}
              />
            </section>

            <section>
              <SectionHeader title="Notes" />
              <div className={sectionCardClassName}>
                <FieldWrapper label="Notes" error={errors.notes?.message}>
                  <Textarea
                    {...register('notes')}
                    placeholder="Add any additional notes or requirements..."
                    rows={4}
                    className={cn(
                      'min-h-[120px] rounded-xl border-2 border-[#DDDCE7] bg-white px-4 py-3 text-sm text-[#1F2430] shadow-none placeholder:text-[#A4A9B6] focus-visible:border-[#7A42E8] focus-visible:ring-0',
                      errors.notes?.message && 'border-red-500'
                    )}
                    disabled={isSaving}
                  />
                </FieldWrapper>
              </div>
            </section>

            <section>
              <SectionHeader title="Client Information" />
              <div className={sectionCardClassName}>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="text-sm font-medium text-[#1F2430]">
                        Select Client
                      </Label>
                      <button
                        type="button"
                        onClick={() => setShowAddClientModal(true)}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#8F6EE6] to-[#7A42E8] text-white shadow-[0_14px_28px_-18px_rgba(122,66,232,0.85)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Add new client"
                        disabled={isSaving}
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>

                    <Select
                      value={selectedClientId || 'none'}
                      onValueChange={handleClientSelect}
                      disabled={isSaving || isLoadingClients}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-2 border-[#DDDCE7] bg-white px-4 text-sm text-[#1F2430] shadow-none focus:ring-0 focus:ring-offset-0">
                        <SelectValue
                          placeholder={
                            isLoadingClients ? 'Loading clients...' : 'No client selected'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border border-[#DDDCE7] bg-white p-2 shadow-[0_20px_48px_-24px_rgba(31,36,48,0.35)]">
                        <SelectPrimitive.Item
                          value="none"
                          className="relative flex w-full cursor-default select-none items-center rounded-xl px-3 py-3 text-sm text-[#7A7F8C] outline-none focus:bg-[#F8F9FB] focus:text-[#7A7F8C] data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        >
                          <SelectPrimitive.ItemText>No client selected</SelectPrimitive.ItemText>
                        </SelectPrimitive.Item>
                        {clients.map((client) => (
                          <SelectItem
                            key={client.id}
                            value={client.id}
                            className="rounded-xl px-3 py-3 text-sm text-[#1F2430]"
                          >
                            {client.venue_name}
                            {client.contact_name ? ` • ${client.contact_name}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {errors.client?.message ? (
                      <p className="text-sm text-red-600">{errors.client.message}</p>
                    ) : null}
                  </div>

                  {(hasClientSelection || isExistingClientSelected) && (
                    <>
                      {!isExistingClientSelected && (
                        <FieldWrapper
                          label="Venue / Company Name"
                          required
                          error={errors.client?.message}
                        >
                          <Input
                            {...register('client')}
                            placeholder="e.g., The Grand Ballroom"
                            className={fieldClassName}
                            disabled={isSaving}
                          />
                        </FieldWrapper>
                      )}

                      <FieldWrapper
                        label="Contact Name"
                        error={errors.contact_name?.message}
                      >
                        <Input
                          {...register('contact_name')}
                          placeholder="e.g., Sarah Mitchell"
                          className={cn(
                            fieldClassName,
                            isExistingClientSelected && 'bg-[#F8F9FB] text-[#7A7F8C]'
                          )}
                          disabled={isSaving || isExistingClientSelected}
                        />
                      </FieldWrapper>

                      <FieldWrapper
                        label="Email Address"
                        required
                        error={errors.contact_email?.message}
                      >
                        <MultiEmailInput
                          value={watch('contact_email') || ''}
                          onChange={(value) =>
                            setValue('contact_email', value, { shouldValidate: true })
                          }
                          placeholder="Enter email addresses..."
                          className={cn(
                            'rounded-xl',
                            isExistingClientSelected && 'pointer-events-none opacity-60'
                          )}
                        />
                      </FieldWrapper>

                      <FieldWrapper
                        label="Location"
                        error={errors.location?.message}
                      >
                        <Input
                          {...register('location')}
                          placeholder="e.g., Sydney Opera House"
                          className={cn(
                            fieldClassName,
                            isExistingClientSelected && 'bg-[#F8F9FB] text-[#7A7F8C]'
                          )}
                          disabled={isSaving || isExistingClientSelected}
                        />
                      </FieldWrapper>

                      <FieldWrapper
                        label="Phone"
                        error={errors.contact_phone?.message}
                      >
                        <PhoneInput
                          value={watch('contact_phone') || ''}
                          onChange={(value) => setValue('contact_phone', value)}
                          placeholder="Client's phone number"
                          disabled={isSaving || isExistingClientSelected}
                          className={cn(
                            fieldClassName,
                            isExistingClientSelected && 'bg-[#F8F9FB] text-[#7A7F8C]'
                          )}
                        />
                      </FieldWrapper>

                      {shouldShowSaveClientButton && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSaveClient}
                          disabled={isSavingClient || isSaving}
                          className="w-full rounded-xl border-2 border-[#DDDCE7] py-6 text-[#4F5868] hover:bg-[#F8F9FB]"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {isSavingClient ? 'Saving Client...' : 'Save Client'}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#DDDCE7] bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
          <div className="app-page-shell-form flex flex-col gap-3 sm:flex-row">
            <LoadingButton
              type="button"
              onClick={onSaveDraft}
              variant="outline"
              isLoading={isSaving}
              loadingText="Saving Draft..."
              className="h-12 flex-1 rounded-xl border-2 border-[#DDDCE7] bg-white text-[#4F5868] hover:bg-[#F8F9FB]"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </LoadingButton>

            <LoadingButton
              type="submit"
              isLoading={isSaving}
              loadingText="Creating Job..."
              className="h-12 flex-1 rounded-xl bg-gradient-to-r from-[#8F6EE6] to-[#7A42E8] text-white shadow-[0_14px_28px_-18px_rgba(122,66,232,0.85)] hover:opacity-95"
            >
              <Check className="mr-2 h-4 w-4" />
              Create Job
            </LoadingButton>
          </div>
        </div>
      </form>

      <Dialog
        open={showAddClientModal}
        onOpenChange={(open) => {
          if (open) {
            setShowAddClientModal(true);
            return;
          }

          closeAddClientModal();
        }}
      >
        <DialogContent
          className="max-w-md border border-[#DDDCE7] bg-white p-0 sm:rounded-[32px]"
          hideCloseButton={true}
        >
          <div className="rounded-[32px] bg-white p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-[#1F2430]">Add Client</h2>
              <button
                type="button"
                onClick={closeAddClientModal}
                className="rounded-full p-2 text-[#7A7F8C] transition-colors hover:bg-[#F8F9FB]"
                aria-label="Close add client modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <FieldWrapper label="Venue / Company Name" required>
                <Input
                  value={newClientForm.venue_name}
                  onChange={(event) => handleAddClientFieldChange('venue_name', event.target.value)}
                  placeholder="The Grand Ballroom"
                  className={fieldClassName}
                  disabled={isSavingClient}
                />
              </FieldWrapper>

              <FieldWrapper label="Contact Name" required>
                <Input
                  value={newClientForm.contact_name}
                  onChange={(event) => handleAddClientFieldChange('contact_name', event.target.value)}
                  placeholder="Sarah Mitchell"
                  className={fieldClassName}
                  disabled={isSavingClient}
                />
              </FieldWrapper>

              <FieldWrapper label="Email" required>
                <Input
                  type="email"
                  value={newClientForm.email_address}
                  onChange={(event) => handleAddClientFieldChange('email_address', event.target.value)}
                  placeholder="sarah@example.com"
                  className={fieldClassName}
                  disabled={isSavingClient}
                />
              </FieldWrapper>

              <FieldWrapper label="Phone">
                <PhoneInput
                  value={newClientForm.phone}
                  onChange={(value) => handleAddClientFieldChange('phone', value)}
                  placeholder="+1 555 123 4567"
                  disabled={isSavingClient}
                  className={fieldClassName}
                />
              </FieldWrapper>

              <FieldWrapper label="Location">
                <Input
                  value={newClientForm.location}
                  onChange={(event) => handleAddClientFieldChange('location', event.target.value)}
                  placeholder="New York, NY"
                  className={fieldClassName}
                  disabled={isSavingClient}
                />
              </FieldWrapper>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeAddClientModal}
                disabled={isSavingClient}
                className="h-12 flex-1 rounded-xl border-2 border-[#DDDCE7] text-[#4F5868] hover:bg-[#F8F9FB]"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleCreateClient}
                disabled={isSavingClient}
                className="h-12 flex-1 rounded-xl bg-gradient-to-r from-[#8F6EE6] to-[#7A42E8] text-white shadow-[0_14px_28px_-18px_rgba(122,66,232,0.85)] hover:opacity-95"
              >
                {isSavingClient ? 'Adding...' : 'Add Client'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewJobCreationShell;
