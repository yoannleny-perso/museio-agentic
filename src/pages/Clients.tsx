
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSupabaseClients } from '@/hooks/useSupabaseClients';
import ClientsList from '@/components/clients/ClientsList';
import AddClientDialog from '@/components/clients/AddClientDialog';
import EditClientDialog from '@/components/clients/EditClientDialog';
import { Capacitor } from '@capacitor/core';
import { useOutletContext } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Client } from '@/types';

interface OutletContext {
  isAddClientDialogOpen: boolean;
  setIsAddClientDialogOpen: (open: boolean) => void;
}

const Clients = () => {
  const { fetchJobs } = useAppContext();
  const { clients, loading, fetchClients, updateClient, deleteClient } = useSupabaseClients(async () => {
    await fetchJobs(true);
  });
  const [searchQuery, setSearchQuery] = useState('');
  const { isAddClientDialogOpen, setIsAddClientDialogOpen } = useOutletContext<OutletContext>();
  
  // Edit dialog state
  const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Refresh clients when dialog closes after successful add
  const handleDialogClose = () => {
    setIsAddClientDialogOpen(false);
    // Refresh the clients list to ensure new client appears
    setTimeout(() => {
      fetchClients();
    }, 100);
  };

  // Handle edit dialog close
  const handleEditDialogClose = () => {
    setIsEditClientDialogOpen(false);
    setSelectedClient(null);
    // Refresh the clients list to ensure changes appear
    setTimeout(() => {
      fetchClients();
    }, 100);
  };

  // Handle client click to open edit dialog
  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setIsEditClientDialogOpen(true);
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(client =>
    client.venue_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`app-page-shell-narrow ${Capacitor.isNativePlatform() ? 'pt-14' : ''}`}>
      {/* Description */}
      <div className="mb-6">
        <p className="text-sm text-gray-500">
          Manage your client database and track business relationships
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none z-10">
          <Search className="h-4 w-4" />
        </div>
        <Input
          placeholder="Search clients..."
          className="pl-10 rounded-2xl bg-white/90 border-gray-200/50 shadow-sm hover:bg-white focus:bg-white transition-colors duration-200"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: "2.5rem" }}
        />
      </div>

      {/* Clients List */}
      <ClientsList 
        clients={filteredClients} 
        loading={loading} 
        onClientClick={handleClientClick}
      />

      {/* Add Client Dialog */}
      <AddClientDialog
        isOpen={isAddClientDialogOpen}
        onClose={handleDialogClose}
      />

      {/* Edit Client Dialog */}
      <EditClientDialog
        isOpen={isEditClientDialogOpen}
        onClose={handleEditDialogClose}
        client={selectedClient}
        onUpdateClient={updateClient}
        onDeleteClient={deleteClient}
      />
    </div>
  );
};

export default Clients;
