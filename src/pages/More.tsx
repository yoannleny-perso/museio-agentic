
import React from 'react';

const More = () => {
  // This page serves as a placeholder for the "more" tab
  // Users should access Settings and Clients through the More drawer
  return (
    <div className="app-page-shell-narrow flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">More Options</h2>
        <p className="text-sm text-gray-500">
          Use the More tab in the bottom navigation to access additional features.
        </p>
      </div>
    </div>
  );
};

export default More;
