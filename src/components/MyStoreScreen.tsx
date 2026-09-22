import React, { useState, useEffect } from 'react';
import { ChevronLeft, Zap, Clock, ShieldCheck, ArrowRight, History, Calendar, CheckCircle2 } from 'lucide-react';
import { UserState } from '../types';
import { calculateProductMaturity, formatTimeUntilNigerianMidnight } from '../utils/nigerianTime';

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

  // Filter transaction records for revenue collection history (specifically type === 'income')
  const incomeRecords = (user.records || [])
    .filter((r) => r.type === 'income')
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const totalCollectedIncome = incomeRecords.reduce((sum, r) => sum + (r.amount || 0), 0);

  // Check if any product has mature daily yield ready to collect (after 12 midnight Nigerian Time)
  let totalClaimableYield = 0;
  products.forEach((p) => {
    const maturity = calculateProductMaturity(p, now);
    if (maturity.isMature) {
      totalClaimableYield += maturity.claimableYield;
    }
  });

  const midnightCountdown = formatTimeUntilNigerianMidnight(now);

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

      <div className="p-3 space-y-4">
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-xs border border-neutral-200 mt-2 space-y-3">
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
                type="button"
                onClick={() => totalClaimableYield > 0 && handleCollect()}
                disabled={totalClaimableYield <= 0}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center gap-1 ${
                  totalClaimableYield > 0
                    ? 'text-white bg-emerald-600 hover:bg-emerald-500 animate-pulse cursor-pointer'
                    : 'text-neutral-400 bg-neutral-800 cursor-not-allowed'
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
                    <span>Next Drop: 12:00 AM WAT</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              {products.map((item) => {
                const maturity = calculateProductMaturity(item, now);

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
                            {maturity.isExpired ? 'Completed' : 'Online & Generating'}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-neutral-900 mt-1 truncate">
                          {item.title}
                        </h3>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-[#00c269]">
                          +₦ {item.dailyIncome.toLocaleString()}/day
                        </div>
                        <span className="text-[10px] text-neutral-400 font-medium">Daily Midnight Drop</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-neutral-500 font-medium">
                        <span>Runtime: Day {item.daysActive || 0} of {item.validityDays}</span>
                        <span>{maturity.progressPct.toFixed(0)}% completed</span>
                      </div>
                      <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#00c269] h-full rounded-full transition-all duration-500"
                          style={{ width: `${maturity.progressPct}%` }}
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
                        <span className="font-bold text-emerald-600">₦ {maturity.currentIncome.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block">Remaining</span>
                        <span className="font-bold text-neutral-700">{Math.max(0, item.validityDays - (item.daysActive || 0))} days</span>
                      </div>
                    </div>

                    {/* Midnight Drop Action & Countdown */}
                    <div className="pt-1">
                      {maturity.isMature ? (
                        <button
                          type="button"
                          onClick={() => handleCollect(item.instanceId)}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md animate-pulse"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                          <span>Claim Daily Yield (+₦ {maturity.claimableYield.toLocaleString()})</span>
                        </button>
                      ) : maturity.isExpired ? (
                        <div className="w-full py-2 bg-neutral-100 text-neutral-500 rounded-lg text-xs font-medium text-center border border-neutral-200">
                          Fleet Contract Completed ({item.validityDays} Days)
                        </div>
                      ) : (
                        <div
                          className="w-full py-2 bg-neutral-900 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 border border-neutral-800 select-none"
                        >
                          <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            Next Income Drop (12:00 AM WAT) in:{' '}
                            <strong className="font-mono text-emerald-300 font-semibold">
                              {String(maturity.hoursLeft).padStart(2, '0')}h {String(maturity.minutesLeft).padStart(2, '0')}m {String(maturity.secondsLeft).padStart(2, '0')}s
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Revenue Collection History (Filtered for type === 'income') */}
        <div className="pt-2 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Revenue Collection History ({incomeRecords.length})
              </h2>
            </div>
            {incomeRecords.length > 0 && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Total: +₦ {totalCollectedIncome.toLocaleString()}
              </span>
            )}
          </div>

          {incomeRecords.length === 0 ? (
            <div className="bg-white rounded-xl p-5 text-center shadow-xs border border-neutral-200 space-y-1.5">
              <Clock className="w-6 h-6 mx-auto text-neutral-300" />
              <p className="text-xs font-semibold text-neutral-700">No revenue collections yet</p>
              <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                Daily energy earnings claimed at 12:00 AM midnight (WAT) will automatically appear in this history log.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {incomeRecords.map((record) => (
                <div
                  key={record.id}
                  className="bg-white rounded-xl p-3.5 shadow-xs border border-neutral-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <Zap className="w-4 h-4 fill-emerald-500 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900">
                        {record.title || 'Daily Energy Generation Income'}
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-neutral-400" />
                        <span>{new Date(record.timestamp).toLocaleString()}</span>
                      </div>
                      {record.details && (
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          {record.details}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-extrabold text-[#00c269]">
                      +₦ {record.amount.toLocaleString()}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 mt-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                      Settled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
