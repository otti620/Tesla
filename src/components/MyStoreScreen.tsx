import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Zap, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  History, 
  Calendar, 
  CheckCircle2, 
  RefreshCw, 
  ShieldAlert, 
  Headset, 
  Box,
  TrendingUp
} from 'lucide-react';
import { UserState, VIPProduct } from '../types';
import { calculateProductMaturity, formatTimeUntilNigerianMidnight } from '../utils/nigerianTime';
import { DangoteLogo } from './DangoteLogo';

interface MyStoreScreenProps {
  user: UserState;
  onBack: () => void;
  onGoToShop?: () => void;
  onGoToProducts?: () => void;
  onCollectDailyYield?: (instanceId?: string) => void;
  onCollectRevenue?: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToCustomerService?: () => void;
  onRefreshOrders?: () => Promise<void>;
}

export const MyStoreScreen: React.FC<MyStoreScreenProps> = ({
  user,
  onBack,
  onGoToShop,
  onGoToProducts,
  onCollectDailyYield,
  onCollectRevenue,
  onNavigateToAdmin,
  onNavigateToCustomerService,
  onRefreshOrders,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefreshOrders) {
      try {
        await onRefreshOrders();
      } catch (err) {
        console.warn('Orders live sync notice:', err);
      }
    }
    setTimeout(() => setRefreshing(false), 600);
  };

  const allProducts = user.purchasedProducts || [];
  const activeProducts = allProducts.filter((p) => {
    const maturity = calculateProductMaturity(p, now);
    return !maturity.isExpired;
  });
  const completedProducts = allProducts.filter((p) => {
    const maturity = calculateProductMaturity(p, now);
    return maturity.isExpired;
  });

  const displayProducts = activeTab === 'active' ? activeProducts : completedProducts;

  let totalClaimableYield = 0;
  allProducts.forEach((p) => {
    const maturity = calculateProductMaturity(p, now);
    if (maturity.isMature) {
      totalClaimableYield += maturity.claimableYield;
    }
  });

  const midnightCountdown = formatTimeUntilNigerianMidnight(now);

  return (
    <div className="min-h-screen pb-24 bg-[#0A192F] text-white">
      {/* Top Header matching screenshot */}
      <div className="sticky top-0 z-30 bg-[#002B49] border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <DangoteLogo variant="wordmark" color="#ffffff" className="h-6" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black shadow-md transition flex items-center gap-1 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>HQ</span>
            </button>
          )}

          {onNavigateToCustomerService && (
            <button
              onClick={onNavigateToCustomerService}
              className="p-2 rounded-xl bg-gradient-to-r from-[#002B49] to-[#003B66] hover:brightness-125 text-white font-black shadow-md border border-cyan-400/50 transition cursor-pointer active:scale-95"
              title="Support"
            >
              <Headset className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Title & Refresh button */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-white">
            Shareholder Tranche Contracts
          </h2>
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Segmented Tabs (Active Orders vs Completed / Expired) */}
        <div className="grid grid-cols-2 gap-2 bg-[#002B49] p-1.5 rounded-2xl border border-white/10 shadow-md">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-3 rounded-xl text-xs font-extrabold transition cursor-pointer text-center ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-[#006837] to-[#004D28] text-white shadow-lg border border-white/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Active Orders ({activeProducts.length})
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`py-3 rounded-xl text-xs font-extrabold transition cursor-pointer text-center ${
              activeTab === 'completed'
                ? 'bg-gradient-to-r from-[#006837] to-[#004D28] text-white shadow-lg border border-white/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Completed / Expired ({completedProducts.length})
          </button>
        </div>

        {/* Main Content Card (Matching Screenshot exactly) */}
        {displayProducts.length === 0 ? (
          <div className="bg-white text-neutral-900 rounded-3xl p-8 text-center shadow-2xl border border-white/20 mt-4 space-y-5">
            <div className="w-20 h-20 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-inner border border-purple-100">
              <Box className="w-10 h-10 stroke-[2]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-black text-xl text-neutral-900 tracking-tight">
                No active shareholdings
              </h3>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                You don't have any running Dangote Refinery shareholdings right now.
              </p>
            </div>

            <button
              onClick={handleGoToCatalog}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-neutral-950 text-xs font-black rounded-full shadow-lg active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Dangote Share Tranches</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {totalClaimableYield > 0 && activeTab === 'active' && (
              <button
                type="button"
                onClick={() => handleCollect()}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-110 text-white rounded-2xl text-xs font-extrabold shadow-lg transition flex items-center justify-center gap-2 cursor-pointer animate-pulse border border-emerald-400/40"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Claim All Ready Dividends (+₦ {totalClaimableYield.toLocaleString()})</span>
              </button>
            )}

            {displayProducts.map((item) => {
              const maturity = calculateProductMaturity(item, now);

              return (
                <div
                  key={item.instanceId}
                  className="bg-[#002B49]/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/15 space-y-3"
                >
                  <div className="flex gap-3.5 items-start">
                    {item.image && (
                      <div className="relative w-16 h-14 rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-white/10">
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
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-black uppercase">
                          {item.vipLevel}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                          {maturity.isExpired ? 'Completed' : 'Active Dividend'}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-white mt-1 truncate">
                        {item.title}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-amber-400 font-mono">
                        +₦ {item.dailyIncome.toLocaleString()}/day
                      </div>
                      <span className="text-[10px] text-neutral-400 font-medium">Daily Drop</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-neutral-300 font-medium">
                      <span>Runtime: Day {item.daysActive || 0} of {item.validityDays}</span>
                      <span>{maturity.progressPct.toFixed(0)}% completed</span>
                    </div>
                    <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-white/10">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${maturity.progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Detailed Stats */}
                  <div className="grid grid-cols-3 gap-2 bg-neutral-950/60 p-2.5 rounded-xl text-center text-xs border border-white/5">
                    <div>
                      <span className="text-[10px] text-neutral-400 block">Total Return</span>
                      <span className="font-bold text-white font-mono">₦ {item.totalIncome.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 block">Harvested</span>
                      <span className="font-bold text-emerald-400 font-mono">₦ {maturity.currentIncome.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 block">Remaining</span>
                      <span className="font-bold text-neutral-300 font-mono">{Math.max(0, item.validityDays - (item.daysActive || 0))} days</span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-1">
                    {maturity.isMature ? (
                      <button
                        type="button"
                        onClick={() => handleCollect(item.instanceId)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md animate-pulse"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>Claim Yield (+₦ {maturity.claimableYield.toLocaleString()})</span>
                      </button>
                    ) : maturity.isExpired ? (
                      <div className="w-full py-2 bg-neutral-950 text-neutral-400 rounded-xl text-xs font-medium text-center border border-white/10">
                        Tranche Contract Completed ({item.validityDays} Days)
                      </div>
                    ) : (
                      <div className="w-full py-2 bg-neutral-950 text-neutral-300 rounded-xl text-xs font-medium flex items-center justify-center gap-2 border border-white/10 select-none">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          Next Dividend in:{' '}
                          <strong className="font-mono text-amber-300 font-bold">
                            {midnightCountdown.formattedString}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
