
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface JobsSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const JobsSearch: React.FC<JobsSearchProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="relative mb-4">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
        <Search className="h-4 w-4" />
      </div>
      <Input
        placeholder="Search jobs..."
        className="pl-10 input-field" 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ paddingLeft: "2.5rem" }}
      />
    </div>
  );
};

export default JobsSearch;
