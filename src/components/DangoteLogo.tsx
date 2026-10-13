import React from 'react';

interface DangoteLogoProps {
  className?: string;
  variant?: 'wordmark' | 'icon' | 'badge';
  color?: string;
}

export const DangoteLogo: React.FC<DangoteLogoProps> = ({
  className = 'h-8 w-auto',
  variant = 'wordmark',
  color = 'currentColor',
}) => {
  if (variant === 'icon') {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-md ${className}`}>
        <img
          src="/dangote_logo.svg"
          alt="Dangote Petroleum Refinery Logo"
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/dangote_logo_official.png';
          }}
        />
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white p-1.5 shadow-lg border border-amber-400/50">
        <img
          src="/dangote_logo.svg"
          alt="Dangote Petroleum Refinery Logo"
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/dangote_logo_official.png';
          }}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-9 sm:h-10 bg-white px-2.5 py-1 rounded-xl shadow-md border border-amber-400/40 flex items-center justify-center">
        <img
          src="/dangote_logo.svg"
          alt="Dangote Petroleum Refinery Logo"
          className="h-full w-auto object-contain max-h-7"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/dangote_logo_official.png';
          }}
        />
      </div>
    </div>
  );
};
