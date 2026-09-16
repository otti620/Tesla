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
        viewBox="0 0 342 350"
        className={className}
        fill={color}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Tesla"
      >
        <path d="M0 31.8c4.8 1.4 9.6 3.1 14.5 4.8C59.7 52.8 112.5 61 171.1 61c58.6 0 111.4-8.2 156.6-24.4 4.9-1.8 9.7-3.4 14.5-4.8 0 0-4.3 14.7-4.3 14.7-36.9 14.7-78.7 22.8-122.9 23.4l24 107.5c17.5-12.8 38.6-20.9 61.6-22.3 0 0-3.3 15-3.3 15-21.7 1.8-41.5 10.3-56.7 23.5l-28.7 128.8-1.5 6.7-1.5-6.7L130 198.2c-15.2-13.2-35-21.7-56.7-23.5 0 0-3.3-15-3.3-15 23 1.4 44.1 9.5 61.6 22.3L155.6 74.7c-44.2-.6-86-8.7-122.9-23.4 0 0-4.3-14.7-4.3-14.7-.6.2-1.2.4-1.8.6L0 31.8z" />
        <path d="M171.1 0C108.4 0 52 10.3 7.7 27.9c0 0 2.2 13.9 2.2 13.9 44.9-18.4 99.4-28.8 161.2-28.8 61.8 0 116.3 10.4 161.2 28.8 0 0 2.2-13.9 2.2-13.9C290.2 10.3 233.8 0 171.1 0z" />
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
        viewBox="0 0 342 350"
        className="h-6 w-auto"
        fill={color}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 31.8c4.8 1.4 9.6 3.1 14.5 4.8C59.7 52.8 112.5 61 171.1 61c58.6 0 111.4-8.2 156.6-24.4 4.9-1.8 9.7-3.4 14.5-4.8 0 0-4.3 14.7-4.3 14.7-36.9 14.7-78.7 22.8-122.9 23.4l24 107.5c17.5-12.8 38.6-20.9 61.6-22.3 0 0-3.3 15-3.3 15-21.7 1.8-41.5 10.3-56.7 23.5l-28.7 128.8-1.5 6.7-1.5-6.7L130 198.2c-15.2-13.2-35-21.7-56.7-23.5 0 0-3.3-15-3.3-15 23 1.4 44.1 9.5 61.6 22.3L155.6 74.7c-44.2-.6-86-8.7-122.9-23.4 0 0-4.3-14.7-4.3-14.7-.6.2-1.2.4-1.8.6L0 31.8z" />
        <path d="M171.1 0C108.4 0 52 10.3 7.7 27.9c0 0 2.2 13.9 2.2 13.9 44.9-18.4 99.4-28.8 161.2-28.8 61.8 0 116.3 10.4 161.2 28.8 0 0 2.2-13.9 2.2-13.9C290.2 10.3 233.8 0 171.1 0z" />
      </svg>
      <span className="font-extrabold tracking-[0.25em] text-lg uppercase" style={{ color }}>
        TESLA
      </span>
    </div>
  );
};
