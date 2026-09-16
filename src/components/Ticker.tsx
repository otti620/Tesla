import React, { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';

interface TickerProps {
  items: string[];
}

export const Ticker: React.FC<TickerProps> = ({ items }) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setOffset((prev) => (prev + 1) % items.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [items.length]);

  return (
    <div className="flex items-center gap-2.5 bg-neutral-100/90 border border-neutral-200/80 rounded-lg px-3 py-2 text-xs text-neutral-700 overflow-hidden shadow-xs">
      <Volume2 className="w-4 h-4 text-orange-500 shrink-0 animate-pulse" />
      <div className="flex-1 overflow-hidden relative h-4">
        {items.map((item, index) => {
          const isCurrent = index === offset;
          const isPrev = index === (offset - 1 + items.length) % items.length;
          return (
            <div
              key={index}
              className={`absolute inset-0 flex items-center transition-all duration-500 transform ${
                isCurrent
                  ? 'translate-y-0 opacity-100'
                  : isPrev
                  ? '-translate-y-full opacity-0'
                  : 'translate-y-full opacity-0'
              }`}
            >
              <span className="font-medium truncate tracking-tight">{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
