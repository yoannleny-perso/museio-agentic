
import React from 'react';

const AuthCallbackLoading = () => {
  return (
    <>
      <h2 className="text-xl font-semibold mb-2">Processing your login</h2>
      <p className="text-gray-500 mb-4">Please wait...</p>
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </>
  );
};

export default AuthCallbackLoading;
