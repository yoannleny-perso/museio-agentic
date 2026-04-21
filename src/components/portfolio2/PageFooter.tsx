
import React from 'react';

interface PageFooterProps {
  isEditMode?: boolean;
}

const PageFooter: React.FC<PageFooterProps> = () => {
  return (
    <footer className="mt-8 border-t border-gray-200 py-8 text-center">
      <div className="space-y-2 text-sm text-gray-600">
        <p className="mt-4 text-xs text-gray-400">
          Powered by Museio
        </p>
      </div>
    </footer>
  );
};

export default PageFooter;
