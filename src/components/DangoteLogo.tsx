import React from 'react';
import { TeslaLogo } from './TeslaLogo';

interface DangoteLogoProps {
  className?: string;
  variant?: 'wordmark' | 'icon' | 'badge';
  color?: string;
}

export const DangoteLogo: React.FC<DangoteLogoProps> = ({
  className = 'h-8 w-auto',
  variant = 'wordmark',
  color = '#ffffff',
}) => {
  return <TeslaLogo className={className} variant={variant} color={color} />;
};

