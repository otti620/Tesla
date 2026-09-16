import React, { useState, useEffect } from 'react';
import { ChevronLeft, Zap, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { UserState } from '../types';

interface MyStoreScreenProps {
  user: UserState;
  onBack: () => void;
  onGoToShop?: () => void;
  onGoToProducts?: () => void;
  onCollectDailyYield?: (instanceId?: string) => void;
  onCollectRevenue?: () => void;
}

export const MyStoreScreen: React.FC<MyStoreScreenProps> = ({
  user,
  onBack,
  onGoToShop,
  onGoToProducts,
  onCollectDailyYield,
  onCollectRevenue,
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGoToCatalog = onGoToProducts || onGoToShop || (() => {});
  const handleCollect = (instanceId?: string) => {
    if (onCollectDailyYield) {
      onCollectDailyYield(instanceId);
    } else if (onCollectRevenue) {
      onCollectRevenue();
    }
  };

  const products = user.purchasedProducts;
  const totalDaily = products.reduce((sum, p) => sum + p.dailyIncome, 0);
  const totalMined = products.reduce((sum, p) => sum + p.dailyIncome * p.daysActive, 0);

  const MS_24_HOURS = 24 * 60 * 60 * 1000;

  // Check if any product has mature 24-hour yield ready to collect
  let totalClaimableYield = 0;
  products.forEach((p) => {
    if (p.daysActive >= p.validityDays) return;
    const lastDrop = p.lastClaimDate || p.purchaseDate || now;
    const elapsed = now - lastDrop;
    const cycles = Math.floor(elapsed / MS_24_HOURS);
    const maxCycles = p.validityDays - p.daysActive;
    const mature = Math.min(cycles, maxCycles);
    if (mature >= 1) {
      totalClaimableYield += mature * p.dailyIncome;
    }
  });

  return (
    <div className="min-h-screen pb-16 bg-neutral-100 text-neutral-900">
      {/* Top Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100 shadow-2xs">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-neutral-800 hover:bg-neutral-100 rounded-full transition active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <h1 className="text-base font-bold text-neutral-900">My Store</h1>

        <div className="w-7" />
      </div>

      {/* Top Banner Stats */}
      <div className="bg-gradient-to-r from-[#00c269] to-emerald-900 text-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-200 uppercase tracking-wider font-semibold">
              Active Tesla Fleet
            </span>
            <div className="text-3xl font-black mt-0.5">{products.length} Units</div>
          </div>

          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
            <Zap className="w-6 h-6 text-amber-300 fill-amber-300" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/20 text-xs">
          <div>
            <div className="text-white/80">Daily Combined Yield:</div>
            <div className="text-base font-extrabold text-white">
              +₦ {totalDaily.toLocaleString()}/day
            </div>
          </div>
          <div>
            <div className="text-white/80">Total Harvested:</div>
            <div className="text-base font-extrabold text-amber-300">
              ₦ {totalMined.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-xs border border-neutral-200 mt-4 space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#00c269] flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-base text-neutral-900">No Active Store Products</h3>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              You haven't activated any Tesla VIP energy plans yet. Choose a plan in the product catalog to start generating daily passive returns!
            </p>
            <button
              onClick={handleGoToCatalog}
              className="mt-2 inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#00c269] hover:bg-[#00ad5e] text-white text-xs font-bold rounded-full shadow-md active:scale-95 transition cursor-pointer"
            >
              <span>Explore VIP Products</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-1 pt-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                Active Energy Subscriptions ({products.length})
              </h2>

              <button
                onClick={() => handleCollect()}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs active:scale-95 transition flex items-center gap-1 cursor-pointer ${
                  totalClaimableYield > 0
                    ? 'text-white bg-emerald-600 hover:bg-emerald-500 animate-pulse'
                    : 'text-neutral-300 bg-neutral-800 hover:bg-neutral-700'
                }`}
              >
                {totalClaimableYield > 0 ? (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                    <span>Claim Ready (+₦{totalClaimableYield.toLocaleString()})</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>24h Settle Status</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              {products.map((item) => {
                const progressPct = Math.min(100, (item.daysActive / item.validityDays) * 100);
                const currentIncome = item.dailyIncome * item.daysActive;

                const lastDrop = item.lastClaimDate || item.purchaseDate || now;
                const elapsed = now - lastDrop;
                const cycles = Math.floor(elapsed / MS_24_HOURS);
                const maxCycles = item.validityDays - item.daysActive;
                const matureCycles = Math.min(cycles, maxCycles);
                const isItemMatured = matureCycles >= 1;
                const itemClaimableYield = matureCycles * item.dailyIncome;

                const remainingMs = Math.max(0, MS_24_HOURS - (elapsed % MS_24_HOURS));
                const hoursLeft = Math.floor(remainingMs / (1000 * 60 * 60));
                const minutesLeft = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                const secondsLeft = Math.floor((remainingMs % (1000 * 60)) / 1000);

                return (
                  <div
                    key={item.instanceId}
                    className="bg-white rounded-xl p-4 shadow-xs border border-neutral-200 space-y-3"
                  >
                    <div className="flex gap-3 items-start">
                      {item.image && (
                        <div className="relative w-16 h-14 rounded-lg overflow-hidden shrink-0 bg-neutral-900 border border-neutral-200">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                            {item.vipLevel}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-[#00c269] animate-ping inline-block" />
                            Online &amp; Generating
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-neutral-900 mt-1 truncate">
                          {item.title}
                        </h3>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-[#00c269]">
                          +₦ {item.dailyIncome.toLocaleString()}/24h
                        </div>
                        <span className="text-[10px] text-neutral-400 font-medium">24-Hour Cycle</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-neutral-500 font-medium">
                        <span>Runtime: Day {item.daysActive} of {item.validityDays}</span>
                        <span>{progressPct.toFixed(0)}% completed</span>
                      </div>
                      <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#00c269] h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Detailed Stats */}
                    <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-2.5 rounded-lg text-center text-xs">
                      <div>
                        <span className="text-[10px] text-neutral-400 block">Total Target</span>
                        <span className="font-bold text-neutral-800">₦ {item.totalIncome.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block">Harvested</span>
                        <span className="font-bold text-emerald-600">₦ {currentIncome.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block">Remaining</span>
                        <span className="font-bold text-neutral-700">{item.validityDays - item.daysActive} days</span>
                      </div>
                    </div>

                    {/* 24-Hour Drop Action & Countdown */}
                    <div className="pt-1">
                      {isItemMatured ? (
                        <button
                          onClick={() => handleCollect(item.instanceId)}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md animate-pulse"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                          <span>Claim 24-Hour Yield (+₦ {itemClaimableYield.toLocaleString()})</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCollect(item.instanceId)}
                          className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer border border-neutral-800"
                        >
                          <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            Next 24h Yield Drop in:{' '}
                            <strong className="font-mono text-emerald-300 font-semibold">
                              {String(hoursLeft).padStart(2, '0')}h {String(minutesLeft).padStart(2, '0')}m {String(secondsLeft).padStart(2, '0')}s
                            </strong>
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
