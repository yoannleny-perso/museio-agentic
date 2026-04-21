
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Plus } from 'lucide-react';
import { useSupabaseClients } from '@/hooks/useSupabaseClients';
import { Client } from '@/types';
import FormFieldError from './FormFieldError';
import PhoneInput from '@/components/shared/PhoneInput';
import { useToast } from '@/hooks/use-toast';
import MultiEmailInput from '@/components/shared/MultiEmailInput';

interface ClientSelectionFieldProps {
  value: string;
  onChange: (value: string) => void;
  onClientDataChange: (clientData: {
    contact_name?: string;
    location?: string;
    email_address?: string;
    phone?: string;
  }) => void;
  onClientIdChange?: (clientId: string | null) => void;
  onClientSelectionChange?: (isExistingClient: boolean) => void;
  onSelectionMade?: (hasSelection: boolean) => void;
  onClearErrors?: () => void;
  error?: string;
  disabled?: boolean;
  initialEmail?: string;
  showIndividualFields?: boolean;
  onCreateClient?: () => Promise<void>;
  defaultToManualEntry?: boolean;
}

const ClientSelectionField: React.FC<ClientSelectionFieldProps> = ({
  value,
  onChange,
  onClientDataChange,
  onClientIdChange,
  onClientSelectionChange,
  onSelectionMade,
  onClearErrors,
  error,
  disabled = false,
  initialEmail,
  showIndividualFields = false,
  onCreateClient,
  defaultToManualEntry = false
}) => {
  const { clients, loading, addClient } = useSupabaseClients();
  const [isManualEntry, setIsManualEntry] = useState(defaultToManualEntry);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientFormData, setClientFormData] = useState({
    contact_name: '',
    location: '',
    email_address: initialEmail || '',
    phone: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [previousClientsLength, setPreviousClientsLength] = useState(0);
  const { toast } = useToast();

  // Reset component state when value is cleared (form reset)
  useEffect(() => {
    if (!value) {
      console.log('[ClientSelectionField] Value cleared, resetting component state');
      // Only reset selection state if we're not in manual entry mode
      // This prevents fields from disappearing when switching to "Add new client"
      if (!isManualEntry) {
        setIsManualEntry(false);
        setSelectedClient(null);
        onClientSelectionChange?.(false);
        onSelectionMade?.(false);
        // Clear client data when form is reset
        onClientDataChange({
          contact_name: '',
          location: '',
          email_address: '',
          phone: ''
        });
      }
    }
  }, [value, onClientSelectionChange, onSelectionMade, isManualEntry, onClientDataChange]);

  // Check for email-based auto-selection when clients load or initialEmail is provided
  useEffect(() => {
    if (!clients.length || !initialEmail) return;
    
    // Find client by email first (higher priority)
    const clientByEmail = clients.find(client => 
      client.email_address && client.email_address.toLowerCase() === initialEmail.toLowerCase()
    );
    
    if (clientByEmail) {
      console.log('[ClientSelectionField] Auto-selecting client by email:', clientByEmail.venue_name);
      setSelectedClient(clientByEmail);
      setIsManualEntry(false);
      onClientSelectionChange?.(true);
      onClientIdChange?.(clientByEmail.id);
      onSelectionMade?.(true);
      onChange(clientByEmail.venue_name);
      onClientDataChange({
        contact_name: clientByEmail.contact_name || '',
        location: clientByEmail.location || '',
        email_address: clientByEmail.email_address || '',
        phone: clientByEmail.phone || ''
      });
      onClearErrors?.();
    }
  }, [clients, initialEmail, onChange, onClientDataChange, onClientIdChange, onClientSelectionChange, onSelectionMade, onClearErrors]);

  // Check if current value matches an existing client by venue name
  useEffect(() => {
    if (!value) return; // Skip if value is empty
    
    const existingClient = clients.find(client => client.venue_name === value);
    if (existingClient) {
      setSelectedClient(existingClient);
      setIsManualEntry(false);
      onClientSelectionChange?.(true);
      // Auto-fill client data
      onClientDataChange({
        contact_name: existingClient.contact_name || '',
        location: existingClient.location || '',
        email_address: existingClient.email_address || '',
        phone: existingClient.phone || ''
      });
    } else if (value && !isManualEntry) {
      // Value exists but no matching client found, switch to manual entry
      setIsManualEntry(true);
      setSelectedClient(null);
      onClientSelectionChange?.(false);
    }
  }, [value, clients, onClientDataChange, isManualEntry, onClientSelectionChange]);

  // Auto-select newly created clients
  useEffect(() => {
    if (clients.length > previousClientsLength && isManualEntry && value) {
      // A new client was added, check if it matches the current value
      const newClient = clients.find(client => client.venue_name === value);
      if (newClient) {
        console.log('[ClientSelectionField] Auto-selecting newly created client:', newClient.venue_name);
        setSelectedClient(newClient);
        setIsManualEntry(false);
        onClientSelectionChange?.(true);
        onClientIdChange?.(newClient.id);
        onSelectionMade?.(true);
        onClientDataChange({
          contact_name: newClient.contact_name || '',
          location: newClient.location || '',
          email_address: newClient.email_address || '',
          phone: newClient.phone || ''
        });
        onClearErrors?.();
      }
    }
    setPreviousClientsLength(clients.length);
  }, [clients, previousClientsLength, isManualEntry, value, onClientSelectionChange, onClientIdChange, onSelectionMade, onClientDataChange, onClearErrors]);

  const handleClientSelect = (clientId: string) => {
    if (clientId === 'manual') {
      setIsManualEntry(true);
      setSelectedClient(null);
      onClientSelectionChange?.(false);
      onClientIdChange?.(null);
      onSelectionMade?.(true);
      onChange('');
      onClientDataChange({
        contact_name: '',
        location: '',
        email_address: '',
        phone: ''
      });
      onClearErrors?.();
    } else {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setSelectedClient(client);
        setIsManualEntry(false);
        onClientSelectionChange?.(true);
        onClientIdChange?.(client.id);
        onSelectionMade?.(true);
        onChange(client.venue_name);
        onClientDataChange({
          contact_name: client.contact_name || '',
          location: client.location || '',
          email_address: client.email_address || '',
          phone: client.phone || ''
        });
        onClearErrors?.();
      }
    }
  };

  const handleManualInputChange = (newValue: string) => {
    onChange(newValue);
    // Update form data when venue name changes
    const updatedFormData = { ...clientFormData };
    setClientFormData(updatedFormData);
    onClientDataChange(updatedFormData);
    // Clear auto-filled data when typing manually
    if (selectedClient && newValue !== selectedClient.venue_name) {
      setSelectedClient(null);
      onClientSelectionChange?.(false);
      onClientIdChange?.(null);
      onClearErrors?.();
    }
  };

  const handleFieldChange = (field: string, fieldValue: string) => {
    const updatedFormData = { ...clientFormData, [field]: fieldValue };
    setClientFormData(updatedFormData);
    onClientDataChange(updatedFormData);
  };

  const handleCreateClient = async () => {
    if (!value.trim()) {
      toast({
        title: "Error",
        description: "Please enter a venue or company name",
        variant: "destructive",
      });
      return;
    }

    if (!clientFormData.email_address.trim()) {
      toast({
        title: "Error", 
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const result = await addClient({
        venue_name: value,
        contact_name: clientFormData.contact_name,
        email_address: clientFormData.email_address,
        location: clientFormData.location,
        phone: clientFormData.phone
      });

      if (result) {
        toast({
          title: "Success",
          description: "Client created successfully",
        });
        
        // Auto-select the newly created client
        setSelectedClient(result);
        setIsManualEntry(false);
        onClientSelectionChange?.(true);
        onClientIdChange?.(result.id);
        onSelectionMade?.(true);
        onClearErrors?.();
        
        // Call the optional callback
        if (onCreateClient) {
          await onCreateClient();
        }
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-1">
      {!isManualEntry ? (
        <>
          <Label htmlFor="client" className="text-sm font-medium text-black">
            Client (Venue or Company name) <span className="text-black">*</span>
          </Label>
          <Select 
            value={selectedClient?.id || ''} 
            onValueChange={handleClientSelect}
            disabled={disabled || loading}
          >
            <SelectTrigger className="w-[98%] mx-auto">
              <SelectValue placeholder={
                <span className="text-gray-500">
                  {loading ? "Loading clients..." : "Select existing client or create a new one"}
                </span>
              } />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              <SelectItem value="manual">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-gray-500" />
                  <span>Add new client</span>
                </div>
              </SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span>{client.venue_name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      ) : (
        <div className="space-y-4">
          {clients.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsManualEntry(false);
                setSelectedClient(null);
                onChange('');
                onClientDataChange({
                  contact_name: '',
                  location: '',
                  email_address: '',
                  phone: ''
                });
                setClientFormData({
                  contact_name: '',
                  location: '',
                  email_address: '',
                  phone: ''
                });
                onClientSelectionChange?.(false);
                onClientIdChange?.(null);
                onSelectionMade?.(false);
                onClearErrors?.();
              }}
              className="w-full"
              disabled={disabled}
            >
              Choose from existing clients
            </Button>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="client" className="text-sm font-medium text-black">
              Client (Venue or Company name) <span className="text-black">*</span>
            </Label>
            <Input
              id="client"
              placeholder="Enter venue or company name"
              value={value}
              onChange={(e) => handleManualInputChange(e.target.value)}
              disabled={disabled}
              className="w-[98%] mx-auto"
            />
          </div>

          {showIndividualFields && (
            <>
              <div className="space-y-2">
                <Label htmlFor="contact_name" className="text-sm font-medium text-black">
                  Contact Name
                </Label>
                <Input
                  id="contact_name"
                  placeholder="Enter contact name"
                  value={clientFormData.contact_name}
                  onChange={(e) => handleFieldChange('contact_name', e.target.value)}
                  disabled={disabled}
                  className="w-[98%] mx-auto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_address" className="text-sm font-medium text-black">
                  Email Address <span className="text-black">*</span>
                </Label>
                <MultiEmailInput
                  value={clientFormData.email_address}
                  onChange={(value) => handleFieldChange('email_address', value)}
                  placeholder="Enter email addresses..."
                  className="w-[98%] mx-auto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-black">
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="Enter location"
                  value={clientFormData.location}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  disabled={disabled}
                  className="w-[98%] mx-auto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-black">
                  Phone
                </Label>
                <PhoneInput
                  value={clientFormData.phone}
                  onChange={(phoneValue) => handleFieldChange('phone', phoneValue)}
                  placeholder="Enter phone number"
                  disabled={disabled}
                  className="w-[98%] mx-auto"
                />
              </div>

              <Button
                type="button"
                onClick={handleCreateClient}
                disabled={disabled || isCreating || !value.trim() || !clientFormData.email_address.trim()}
                className="w-full bg-purple-museio hover:bg-purple-museio/90"
              >
                {isCreating ? "Creating..." : "Create Client"}
              </Button>
            </>
          )}
        </div>
      )}
      
      {error && <FormFieldError error={error} />}
    </div>
  );
};

export default ClientSelectionField;
