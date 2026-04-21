import { useState, useEffect } from 'react';
import { useJobForm } from './useJobForm';
import { useJobFormSubmit, type JobFormValues } from './useJobFormSubmit';

export const useNewJobForm = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(() => Date.now()); // Force new form instance
  
  // Use job form for field management with mode set to onBlur to prevent validation during initialization
  const jobForm = useJobForm(undefined, { mode: 'onBlur' });
  const {
    reset: resetJobForm,
    setDate: setJobDate,
    setEndDate: setJobEndDate,
    watch,
  } = jobForm;
  
  // Use job form submit for submission handling with correct redirect path
  const { 
    isSaving, 
    handleFormSubmit, 
    handleSaveDraft, 
    handleClose
  } = useJobFormSubmit({
    //redirectTo: '/app/jobs'
  });

  // Force complete form reset on mount and whenever we need a fresh form
  useEffect(() => {
    console.log('[useNewJobForm] Forcing complete form reset');
    const emptyDefaults = {
      title: '',
      job_number: '',
      job_description: '',
      location: '',
      client: '',
      contact_name: '',
      date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '17:00',
      rate: '',
      notes: '',
      contact_email: '',
      contact_phone: '',
      status: 'upcoming',
      pricing_mode: 'itemized',
      job_items: [{
        item_name: '',
        unit_cost: 0,
        quantity: 1,
        is_taxable: false,
        sort_order: 0
      }]
    };
    
    console.log('[useNewJobForm] Setting empty defaults:', emptyDefaults);
    
    // Force reset with explicit empty values
    resetJobForm(emptyDefaults);
    
    // Reset dates to today
    const today = new Date();
    setJobDate(today);
    setJobEndDate(today);
    
    // Clear any server errors
    setServerError(null);
  }, [formKey, resetJobForm, setJobDate, setJobEndDate]); // Reset when formKey changes

  // Form submission handler with validation
  const submitForm = async (data: JobFormValues) => {
    console.log('[useNewJobForm] submitForm - Raw data received:', data);
    console.log('[useNewJobForm] submitForm - Pricing mode:', data.pricing_mode);
    console.log('[useNewJobForm] submitForm - Job items:', data.job_items);
    
    setServerError(null);
    
    try {
      // Submit with isDraft = false to let status be determined by date
      await handleFormSubmit(data);
    } catch (error) {
      console.error('[useNewJobForm] Error submitting form:', error);
      setServerError(error instanceof Error ? error.message : 'An unexpected error occurred.');
    }
  };
  
  // Draft save handler
  const handleSaveAsDraft = async () => {
    setServerError(null);
    
    try {
      // Get current form data and format it
      const data = watch();
      
      console.log('[useNewJobForm] Saving draft with data:', data);

      await handleSaveDraft(data);
    } catch (error) {
      console.error('[useNewJobForm] Error saving draft:', error);
      setServerError(error instanceof Error ? error.message : 'An unexpected error occurred.');
    }
  };
  
  // Enhanced cancel handler - properly resets everything and forces new form
  const handleCancel = () => {
    console.log('[useNewJobForm] Cancelling and forcing fresh form');
    
    // Force a new form instance by updating the key
    setFormKey(Date.now());
    
    // Navigate back to home
    handleClose()
    //navigate('/app/home');
  };

  // Enhanced reset function that forces a completely fresh form
  const resetForm = () => {
    console.log('[useNewJobForm] Forcing completely fresh form');
    
    // Update form key to force complete reinitialization
    setFormKey(Date.now());
  };
  
  return {
    ...jobForm,
    serverError,
    isSaving,
    hasErrors: Object.keys(jobForm.errors).length > 0,
    submitForm,
    handleSaveAsDraft,
    handleCancel,
    reset: resetForm, // Use our enhanced reset function
    formKey, // Expose formKey for components that need it
    // For backward compatibility
    handleFormSubmit: submitForm,
    handleSaveDraft: handleSaveAsDraft,
    handleClose: handleCancel
  };
};
