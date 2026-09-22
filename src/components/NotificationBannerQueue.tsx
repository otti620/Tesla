import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Sparkles, ChevronRight, ChevronLeft, X, ShoppingBag, CheckCircle2, BellRing, ArrowRight } from 'lucide-react';
import { NotificationBannerItem } from '../types';

interface NotificationBannerQueueProps {
  queue: NotificationBannerItem[];
  onAction: (item: NotificationBannerItem) => void;
  onSecondaryAction?: (item: NotificationBannerItem) => void;
  onDismiss?: (id: string) => void;
}

export const NotificationBannerQueue: React.FC<NotificationBannerQueueProps> = ({
  queue,
  onAction,
  onSecondaryAction,
  onDismiss,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!queue || queue.length === 0) {
    return null;
  }

  // Ensure index remains in bounds if queue shrinks
  const activeIndex = Math.min(currentIndex, queue.length - 1);
  const activeItem = queue[activeIndex] || queue[0];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % queue.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + queue.length) % queue.length);
  };

  const isRevenue = activeItem.type === 'revenue_ready';

  return (
    <aside aria-label="Notifications" className="sticky top-0 z-40 w-full px-3 pt-2.5 pb-1">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeItem.id}
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`relative overflow-hidden rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
            isRevenue
              ? 'bg-gradient-to-br from-neutral-950 via-emerald-950/90 to-neutral-900 border-emerald-500/40 shadow-emerald-950/30'
              : 'bg-neutral-900/95 border-neutral-700/80 shadow-black/40 text-white'
          }`}
        >
          {/* Top ambient glowing accent line */}
          <div
            className={`h-1 w-full ${
              isRevenue
                ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 animate-pulse'
                : 'bg-neutral-600'
            }`}
          />

          <div className="p-3.5 sm:p-4">
            {/* Header row: Badge, Title & Counter / Dismiss */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    isRevenue
                      ? 'bg-emerald-500 text-neutral-950 font-black ring-2 ring-emerald-400/30 animate-bounce'
                      : 'bg-neutral-800 text-amber-400'
                  }`}
                >
                  {isRevenue ? <Zap className="w-4 h-4 fill-neutral-950" /> : <BellRing className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {activeItem.badgeText || (isRevenue ? 'Ready to Claim' : 'Notification')}
                    </span>
                    {queue.length > 1 && (
                      <span className="text-[10px] font-mono text-neutral-400">
                        ({activeIndex + 1}/{queue.length})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Queue Controls & Dismiss */}
              <div className="flex items-center gap-1 shrink-0">
                {queue.length > 1 && (
                  <div className="flex items-center gap-0.5 bg-neutral-900/80 rounded-lg p-0.5 border border-neutral-700/50">
                    <button
                      type="button"
                      aria-label="Previous notification"
                      onClick={handlePrev}
                      className="p-1 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-sm transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next notification"
                      onClick={handleNext}
                      className="p-1 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-sm transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {!activeItem.persistent && onDismiss && (
                  <button
                    type="button"
                    aria-label="Dismiss notification"
                    onClick={() => onDismiss(activeItem.id)}
                    className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800/80 rounded-lg transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Content info */}
            <div className="mb-3">
              <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>{activeItem.title}</span>
                {activeItem.amount && activeItem.amount > 0 && (
                  <span className="text-emerald-400 font-extrabold text-sm">
                    +₦ {activeItem.amount.toLocaleString()}
                  </span>
                )}
              </h4>
              <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                {activeItem.message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => onAction(activeItem)}
                className={`flex-1 py-2 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-98 transition cursor-pointer ${
                  isRevenue
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black ring-1 ring-emerald-300 shadow-emerald-950/50'
                    : 'bg-white hover:bg-neutral-100 text-neutral-950'
                }`}
              >
                {isRevenue ? <Zap className="w-3.5 h-3.5 fill-neutral-950" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{activeItem.actionLabel || (isRevenue ? 'Claim Revenue Now' : 'Take Action')}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>

              {activeItem.secondaryActionLabel && onSecondaryAction && (
                <button
                  type="button"
                  onClick={() => onSecondaryAction(activeItem)}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 font-semibold text-xs transition cursor-pointer active:scale-98 flex items-center gap-1 shrink-0"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-neutral-300" />
                  <span>{activeItem.secondaryActionLabel}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </aside>
  );
};
