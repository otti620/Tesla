import React from 'react';
import { TeslaLogo } from './TeslaLogo';

interface OlaCarVisualProps {
  vipLevel?: string;
  title?: string;
  category?: string;
  image?: string;
  className?: string;
  variant?: 'card' | 'hero' | 'compact' | 'showroom';
  showBadge?: boolean;
}

const DEFAULT_CAR_IMAGES: Record<string, string> = {
  VIP1: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80',
  VIP2: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80',
  VIP3: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&auto=format&fit=crop&q=80',
  VIP4: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80',
  VIP5: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80',
  VIP6: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&auto=format&fit=crop&q=80',
  VIP7: 'https://images.unsplash.com/photo-1508873696983-2df57046475b?w=800&auto=format&fit=crop&q=80',
  VIP8: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
  VIP9: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80',
};

export const OlaCarVisual: React.FC<OlaCarVisualProps> = ({
  vipLevel = 'VIP1',
  title = 'Ola Cabs Fleet Vehicle',
  category,
  image,
  className = 'w-full h-full',
  variant = 'card',
  showBadge = true,
}) => {
  const cleanVip = vipLevel.toUpperCase().replace(/\s+/g, '');
  const resolvedImage = image || DEFAULT_CAR_IMAGES[cleanVip] || DEFAULT_CAR_IMAGES.VIP1;
  const isCompact = variant === 'compact';

  return (
    <div className={`relative overflow-hidden bg-neutral-950 select-none ${className}`}>
      <img
        src={resolvedImage}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

      {showBadge && !isCompact && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-neutral-950/85 border border-[#a3e635]/50 backdrop-blur-md px-2 py-0.5 rounded-md shadow-sm">
          <TeslaLogo variant="icon" color="#ffffff" className="w-3.5 h-3.5" />
          <span className="text-[9px] font-black text-[#a3e635] uppercase tracking-wider">
            {cleanVip} • OLA CABS
          </span>
        </div>
      )}

      {(variant === 'hero' || variant === 'showroom') && category && (
        <div className="absolute bottom-2 left-2 z-20 bg-neutral-950/85 text-white border border-white/15 px-2 py-0.5 rounded-xs text-[9px] font-bold">
          {category}
        </div>
      )}
    </div>
  );
};
