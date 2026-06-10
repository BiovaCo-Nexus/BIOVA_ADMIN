import React from 'react';

export const BiovaCoLogo = ({ className = "h-8 w-auto" }: { className?: string }) => {
  return (
    <img 
      src="/uploads/Logo.png" 
      alt="BiovaCo Nexus Logo" 
      className={`object-contain ${className}`}
    />
  );
};
