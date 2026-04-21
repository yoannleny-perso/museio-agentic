
import React from 'react';
import { Client } from '@/types';
import { Building, Receipt, DollarSign } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import { useClientInvoiceStats } from '@/hooks/useClientInvoiceStats';

interface ClientsListProps {
  clients: Client[];
  loading: boolean;
  onClientClick?: (client: Client) => void;
}

const ClientsList: React.FC<ClientsListProps> = ({ clients, loading, onClientClick }) => {
  const { getClientStats } = useClientInvoiceStats();

  if (loading) {
    return (
      <div className="space-y-4 ">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
        <p className="text-gray-500 mb-6">Start building your client database by adding your first client.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {clients.map((client) => {
        const stats = getClientStats(client);
        
        return (
          <div
            key={client.id}
            className="relative rounded-xl p-4 mb-3 bg-gradient-to-br shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)] hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onClientClick?.(client)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg mb-1">
                  {client.venue_name}
                </h3>
                
                {client.contact_name && (
                  <p className="text-gray-600 text-sm mb-2">
                    Contact: {client.contact_name}
                  </p>
                )}
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <DollarSign className="h-4 w-4" />
                    <span>${stats.totalEarned.toFixed(2)} total paid</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    <span>${stats.totalForecast.toFixed(2)} total forecast</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-50 to-purple-100">
                <Building className="h-5 w-5 text-[#9b87f5]" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ClientsList;
