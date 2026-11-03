import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Zap,
  Clock,
  ArrowRight,
  History,
  Calendar,
  CheckCircle2,
  Car,
  Gauge,
  Radio,
} from 'lucide-react';
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

  return (
    <div className="min-h-screen pb-20 bg-[#f4f6f0] text-neutral-900">
      {/* Top Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-neutral-950 text-white border-b border-[#a3e635]/30 shadow-xs">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-white hover:bg-neutral-800 rounded-full transition active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <div className="flex items-center gap-1.5">
          <Car className="w-4 h-4 text-[#a3e635]" />
          <h1 className="text-base font-black tracking-tight text-white">My Fleet Garage</h1>
        </div>

        <div className="w-7" />
      </div>

      {/* Top Banner Telemetry */}
      <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-[#1a2e05] border-b border-[#a3e635]/30 text-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#a3e635] uppercase tracking-widest font-black flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Dispatched Ola Cabs Fleet
            </span>
            <div className="text-3xl font-black mt-0.5 text-white">
              {products.length} {products.length === 1 ? 'Vehicle' : 'Vehicles'}
            </div>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-[#a3e635]/15 backdrop-blur-xs flex items-center justify-center border border-[#a3e635]/40">
            <Car className="w-6 h-6 text-[#a3e635]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-white/15 text-xs">
          <div className="bg-black/30 rounded-xl p-2.5 border border-white/10">
            <div className="text-neutral-400 text-[11px]">Daily Combined Fare:</div>
            <div className="text-base font-black text-[#a3e635] mt-0.5">
              +₦ {totalDaily.toLocaleString()}/day
            </div>
          </div>
          <div className="bg-black/30 rounded-xl p-2.5 border border-white/10">
            <div className="text-neutral-400 text-[11px]">Total Fare Harvested:</div>
            <div className="text-base font-black text-white mt-0.5">
              ₦ {totalMined.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-3.5 space-y-4">
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-xs border border-neutral-200 mt-2 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-neutral-950 text-[#a3e635] border border-[#a3e635]/40 flex items-center justify-center mx-auto">
              <Car className="w-8 h-8" />
            </div>
            <h3 className="font-black text-base text-neutral-900">Your Fleet Garage Is Empty</h3>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              You haven't deployed any Ola Cabs VIP vehicles yet. Visit the Fleet Showroom to deploy a cab and earn daily ride-hailing returns!
            </p>
            <button
              onClick={handleGoToCatalog}
              className="mt-2 inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#a3e635] hover:bg-[#84cc16] text-neutral-950 text-xs font-black rounded-xl shadow-md active:scale-95 transition cursor-pointer"
            >
              <span>Open Fleet Showroom</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-1 pt-1">
              <h2 className="text-xs font-black uppercase tracking-wider text-neutral-700">
                Dispatched Vehicles ({products.length})
              </h2>

              <button
                type="button"
                onClick={() => totalClaimableYield > 0 && handleCollect()}
                disabled={totalClaimableYield <= 0}
                className={`text-xs font-black px-3 py-1.5 rounded-lg shadow-2xs transition flex items-center gap-1 ${
                  totalClaimableYield > 0
                    ? 'text-neutral-950 bg-[#a3e635] hover:bg-[#84cc16] animate-pulse cursor-pointer'
                    : 'text-neutral-400 bg-neutral-900 cursor-not-allowed'
                }`}
              >
                {totalClaimableYield > 0 ? (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-neutral-950 text-neutral-950" />
                    <span>Claim All (+₦{totalClaimableYield.toLocaleString()})</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-[#a3e635]" />
                    <span>Drop: 12:00 AM WAT</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3.5">
              {products.map((item, idx) => {
                const maturity = calculateProductMaturity(item, now);
                const plateCode = `OLA-${item.vipLevel}-${String(idx + 101)}`;

                return (
                  <div
                    key={item.instanceId}
                    className="bg-white rounded-2xl overflow-hidden shadow-xs border border-neutral-200"
                  >
                    {/* Vehicle Banner Header */}
                    <div className="relative h-32 bg-neutral-950 overflow-hidden">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover opacity-85"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-black/30" />

                      {/* Top Left: VIP Tier + Plate ID */}
                      <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-[#a3e635] text-neutral-950 text-[10px] font-black">
                          {item.vipLevel}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-neutral-950/85 border border-white/15 text-neutral-200 font-mono text-[10px] font-bold">
                          {plateCode}
                        </span>
                      </div>

                      {/* Top Right: Live Dispatch Status */}
                      <div className="absolute top-2.5 right-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-neutral-950/90 border border-[#a3e635]/40 text-[#a3e635] text-[10px] font-black flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#a3e635] animate-ping" />
                          {maturity.isExpired ? 'CONTRACT DONE' : 'ON TRIP • EARNING'}
                        </span>
                      </div>

                      {/* Bottom Title & Daily Rate */}
                      <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                            {item.title}
                          </h3>
                          <span className="text-[10px] text-neutral-300 font-medium">
                            Midnight WAT Auto-Settlement
                          </span>
                        </div>
                        <div className="text-right bg-neutral-950/85 border border-[#a3e635]/40 px-2.5 py-1 rounded-lg">
                          <span className="text-xs font-black text-[#a3e635] block">
                            +₦ {item.dailyIncome.toLocaleString()}/day
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-3">
                      {/* Fleet Route Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold text-neutral-600">
                          <span className="flex items-center gap-1">
                            <Gauge className="w-3.5 h-3.5 text-[#65a30d]" />
                            Active Cycle: Day {item.daysActive || 0} of {item.validityDays}
                          </span>
                          <span className="text-[#4d7c0f] font-black">
                            {maturity.progressPct.toFixed(0)}% Completed
                          </span>
                        </div>
                        <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden border border-neutral-200/60">
                          <div
                            className="bg-[#a3e635] h-full rounded-full transition-all duration-500"
                            style={{ width: `${maturity.progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Detailed Telemetry Stats */}
                      <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/70 text-center text-xs">
                        <div>
                          <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                            Contract Total
                          </span>
                          <span className="font-black text-neutral-800">
                            ₦ {item.totalIncome.toLocaleString()}
                          </span>
                        </div>
                        <div className="border-x border-neutral-200/70">
                          <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                            Harvested
                          </span>
                          <span className="font-black text-[#4d7c0f]">
                            ₦ {maturity.currentIncome.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                            Remaining
                          </span>
                          <span className="font-black text-neutral-800">
                            {Math.max(0, item.validityDays - (item.daysActive || 0))}d
                          </span>
                        </div>
                      </div>

                      {/* Midnight Drop Action & Countdown */}
                      <div>
                        {maturity.isMature ? (
                          <button
                            type="button"
                            onClick={() => handleCollect(item.instanceId)}
                            className="w-full py-2.5 bg-[#a3e635] hover:bg-[#84cc16] text-neutral-950 rounded-xl text-xs font-black active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md animate-pulse"
                          >
                            <Zap className="w-4 h-4 text-neutral-950 fill-neutral-950" />
                            <span>
                              Claim Daily Fleet Yield (+₦ {maturity.claimableYield.toLocaleString()})
                            </span>
                          </button>
                        ) : maturity.isExpired ? (
                          <div className="w-full py-2 bg-neutral-100 text-neutral-500 rounded-xl text-xs font-bold text-center border border-neutral-200">
                            Fleet Contract Completed ({item.validityDays} Days)
                          </div>
                        ) : (
                          <div className="w-full py-2 bg-neutral-950 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 border border-[#a3e635]/30 select-none">
                            <Clock className="w-3.5 h-3.5 text-[#a3e635] shrink-0" />
                            <span>
                              Next Fare Settlement in:{' '}
                              <strong className="font-mono text-[#a3e635] font-bold">
                                {String(maturity.hoursLeft).padStart(2, '0')}h{' '}
                                {String(maturity.minutesLeft).padStart(2, '0')}m{' '}
                                {String(maturity.secondsLeft).padStart(2, '0')}s
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Revenue Collection History */}
        <div className="pt-2 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <History className="w-4 h-4 text-[#65a30d]" />
              <h2 className="text-xs font-black uppercase tracking-wider text-neutral-700">
                Fare Settlement Log ({incomeRecords.length})
              </h2>
            </div>
            {incomeRecords.length > 0 && (
              <span className="text-[11px] font-black text-[#4d7c0f] bg-lime-100 px-2.5 py-0.5 rounded-full border border-lime-300">
                Total: +₦ {totalCollectedIncome.toLocaleString()}
              </span>
            )}
          </div>

          {incomeRecords.length === 0 ? (
            <div className="bg-white rounded-xl p-5 text-center shadow-xs border border-neutral-200 space-y-1.5">
              <Clock className="w-6 h-6 mx-auto text-neutral-300" />
              <p className="text-xs font-semibold text-neutral-700">No fare settlements yet</p>
              <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                Daily Ola Cabs fleet earnings claimed at 12:00 AM midnight (WAT) will automatically appear in this log.
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
                    <div className="w-9 h-9 rounded-full bg-neutral-950 text-[#a3e635] flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 fill-[#a3e635] text-[#a3e635]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900">
                        {record.title || 'Daily Ola Cabs Fleet Income'}
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
                    <div className="text-sm font-black text-[#4d7c0f]">
                      +₦ {record.amount.toLocaleString()}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-lime-100 text-lime-900 mt-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-[#65a30d]" />
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
