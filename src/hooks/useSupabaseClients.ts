
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/types';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';

export const useSupabaseClients = (onClientUpdate?: () => Promise<void>) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch all clients for the authenticated user
  const fetchClients = useCallback(async () => {
    if (!user) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('venue_name', { ascending: true });
      
      if (error) {
        console.error('[useSupabaseClients] Error fetching clients:', error);
        throw error;
      }
      
      setClients(data || []);
    } catch (error: any) {
      console.error('[useSupabaseClients] Error fetching clients:', error);
      setError(error.message);
      toast({
        title: 'Error fetching clients',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Find existing client or create new one
  const findOrCreateClient = async (clientData: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      return null;
    }
    
    try {
      // First, check if client already exists
      const { data: existingClient, error: findError } = await supabase
        .from('clients')
        .select('*')
        .eq('venue_name', clientData.venue_name)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (findError) {
        console.error('[useSupabaseClients] Error finding client:', findError);
        throw findError;
      }
      
      if (existingClient) {
        // Check if we need to update any fields
        const hasUpdates = 
          (clientData.contact_name && clientData.contact_name !== existingClient.contact_name) ||
          (clientData.location && clientData.location !== existingClient.location) ||
          (clientData.email_address && clientData.email_address !== existingClient.email_address) ||
          (clientData.phone && clientData.phone !== existingClient.phone);
        
        if (hasUpdates) {
          const updatedClient = await updateClient(existingClient.id, {
            ...clientData,
            contact_name: clientData.contact_name || existingClient.contact_name,
            location: clientData.location || existingClient.location,
            email_address: clientData.email_address || existingClient.email_address,
            phone: clientData.phone || existingClient.phone
          });
          
          if (updatedClient) {
            // Find the updated client data
            const updatedData = clients.find(c => c.id === existingClient.id);
            // Trigger job refetch if callback provided (for auto-update case)
            if (onClientUpdate) {
              await onClientUpdate();
            }
            return updatedData || existingClient;
          }
        }
        
        return existingClient;
      }
      
      // Client doesn't exist, create new one
      const newClient = await addClient(clientData);
      // Note: addClient already triggers onClientUpdate callback
      return newClient;
    } catch (error: any) {
      console.error('[useSupabaseClients] Error in findOrCreateClient:', error);
      return null;
    }
  };

  // Add a new client
  const addClient = async (clientData: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...clientData, user_id: user.id })
        .select()
        .single();
      
      if (error) {
        console.error('[useSupabaseClients] Error creating client:', error);
        throw error;
      }
      
      setClients(prev => [...prev, data]);
      
      // Trigger job refetch if callback provided
      if (onClientUpdate) {
        await onClientUpdate();
      }
      
      return data;
    } catch (error: any) {
      console.error('[useSupabaseClients] Error creating client:', error);
      toast({
        title: 'Error creating client',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  // Update an existing client
  const updateClient = async (id: string, clientData: Partial<Client>) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`[useSupabaseClients] Error updating client ${id}:`, error);
        throw error;
      }
      
      setClients(prev => prev.map(client => client.id === id ? data : client));
      
      toast({
        title: 'Success',
        description: 'Client updated successfully',
      });
      
      // Trigger job refetch if callback provided
      if (onClientUpdate) {
        await onClientUpdate();
      }
      
      return true;
    } catch (error: any) {
      console.error('[useSupabaseClients] Error updating client:', error);
      toast({
        title: 'Error updating client',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  // Delete a client
  const deleteClient = async (id: string): Promise<{ success: boolean; error?: string; jobCount?: number }> => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      // Check if there are any jobs referencing this client (both new client_id and old client field)
      const client = clients.find(c => c.id === id);
      if (!client) {
        return { success: false, error: 'Client not found' };
      }
      
      const { data: linkedJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id')
        .or(`client_id.eq.${id},client.eq.${client.venue_name}`);
      
      if (jobsError) {
        console.error(`[useSupabaseClients] Error checking linked jobs for client ${id}:`, jobsError);
        throw jobsError;
      }
      
      if (linkedJobs && linkedJobs.length > 0) {
        return { 
          success: false, 
          error: 'DEPENDENCY_CONFLICT', 
          jobCount: linkedJobs.length 
        };
      }
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`[useSupabaseClients] Error deleting client ${id}:`, error);
        throw error;
      }
      
      setClients(prev => prev.filter(client => client.id !== id));
      
      toast({
        title: 'Success',
        description: 'Client deleted successfully',
      });
      
      // Trigger job refetch if callback provided
      if (onClientUpdate) {
        await onClientUpdate();
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('[useSupabaseClients] Error deleting client:', error);
      toast({
        title: 'Error deleting client',
        description: error.message,
        variant: 'destructive'
      });
      return { success: false, error: error.message };
    }
  };

  // Fetch clients on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchClients();
    } else {
      setClients([]);
      setLoading(false);
    }
  }, [user, fetchClients]);

  return {
    clients,
    loading,
    error,
    fetchClients,
    addClient,
    findOrCreateClient,
    updateClient,
    deleteClient
  };
};
