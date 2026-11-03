import React from 'react';

interface TeslaLogoProps {
  className?: string;
  variant?: 'wordmark' | 'icon' | 'badge';
  color?: string;
}

export const TeslaLogo: React.FC<TeslaLogoProps> = ({
  className = 'h-7 w-auto',
  variant = 'wordmark',
  color = 'currentColor',
}) => {
  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 120 120"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Ola Cabs"
      >
        <circle cx="60" cy="60" r="46" stroke={color} strokeWidth="20" />
        <circle cx="60" cy="60" r="18" fill="#a3e635" />
      </svg>
    );
  }

  if (variant === 'badge') {
    return (
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
        <TeslaLogo variant="icon" color={color} className="w-7 h-7" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 120 120"
        className="h-6 w-6 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Ola Cabs"
      >
        <circle cx="60" cy="60" r="46" stroke={color} strokeWidth="20" />
        <circle cx="60" cy="60" r="18" fill="#a3e635" />
      </svg>
      <span className="font-black tracking-[0.18em] text-lg uppercase" style={{ color }}>
        OLA CABS
      </span>
    </div>
  );
};

