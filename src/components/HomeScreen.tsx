import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Coins,
  CalendarCheck2,
  Headset,
  ArrowRight,
  Flame,
  Car,
  Zap,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { Ticker } from './Ticker';
import { PLATFORM_TICKERS, INITIAL_PRODUCTS } from '../data/initialData';
import { UserState } from '../types';
import { TeslaLogo } from './TeslaLogo';
import { isAdminUser } from '../utils/adminAuth';

interface HomeScreenProps {
  user: UserState;
  onNavigate: (screen: 'recharge' | 'withdraw' | 'customer_service' | 'my_store' | 'admin') => void;
  onOpenGifts: () => void;
  onGoToProducts: () => void;
  onGoToPromoters?: () => void;
  onOpenNotify: () => void;
  onDailyCheckIn: () => void;
}

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=900&auto=format&fit=crop&q=80', // Ola Prime Sedan Fleet
  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=900&auto=format&fit=crop&q=80', // Ola Executive Cab
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=900&auto=format&fit=crop&q=80', // Ola Prime SUV
  'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=900&auto=format&fit=crop&q=80', // Ola Electric Mobility Hub
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  onNavigate,
  onOpenGifts,
  onGoToProducts,
  onGoToPromoters,
  onOpenNotify,
  onDailyCheckIn,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = user.lastCheckInDate === today;
  const featuredFleets = INITIAL_PRODUCTS.filter((p) => p.status === 'available').slice(0, 6);

  return (
    <div className="min-h-screen pb-24 bg-[#f4f6f0] text-neutral-900">
      {/* Top Hero Carousel */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-neutral-900 shadow-md">
        {HERO_IMAGES.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt="Ola Cabs"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              idx === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            referrerPolicy="no-referrer"
          />
        ))}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />

        {/* Brand header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-2 bg-neutral-950/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#a3e635]/40">
            <TeslaLogo variant="icon" color="#ffffff" className="w-5 h-5" />
            <span className="text-xs font-black tracking-widest text-white">
              OLA <span className="text-[#a3e635]">CABS</span>
            </span>
          </div>

          <button
            onClick={onOpenNotify}
            className="text-xs px-3 py-1 bg-[#a3e635] hover:bg-[#bef264] text-neutral-950 font-black rounded-full shadow-sm transition active:scale-95 cursor-pointer"
          >
            Announcement
          </button>
        </div>

        {/* Carousel indicators */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          {HERO_IMAGES.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-5 bg-[#a3e635]' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3.5 -mt-4 relative z-20">
        {/* Master Admin Console Quick Launch Banner (visible strictly to 07077599057 & 09011711470) */}
        {isAdminUser(user.phone) && (
          <button
            onClick={() => onNavigate('admin')}
            className="w-full bg-neutral-950 hover:bg-neutral-900 border-2 border-[#a3e635] rounded-xl p-3 text-white shadow-lg flex items-center justify-between transition active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#a3e635] text-neutral-950 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-[#a3e635]">
                    Master Admin Console
                  </span>
                  <span className="px-1.5 py-0.2 bg-[#a3e635] text-neutral-950 text-[9px] font-mono font-black rounded-sm">
                    ROOT
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 mt-0.5">
                  Manage deposits, withdrawals, users, fleets &amp; settings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-[#a3e635]">
              <span>Open</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        )}

        {/* Quick Action Grid */}
        <div className="bg-white rounded-xl shadow-xs border border-neutral-100 p-3 grid grid-cols-4 gap-2 text-center">
          {/* Recharge */}
          <button
            onClick={() => onNavigate('recharge')}
            className="flex flex-col items-center group active:scale-95 transition cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-neutral-950 text-[#a3e635] border border-[#a3e635]/30 flex items-center justify-center mb-1.5 shadow-xs group-hover:bg-neutral-900">
              <DollarSign className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs text-neutral-800 font-bold">Recharge</span>
          </button>

          {/* Withdraw */}
          <button
            onClick={() => onNavigate('withdraw')}
            className="flex flex-col items-center group active:scale-95 transition cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-neutral-950 text-[#a3e635] border border-[#a3e635]/30 flex items-center justify-center mb-1.5 shadow-xs group-hover:bg-neutral-900">
              <Coins className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs text-neutral-800 font-bold">Withdraw</span>
          </button>

          {/* Redeem gifts */}
          <button
            onClick={onOpenGifts}
            className="flex flex-col items-center group active:scale-95 transition cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-neutral-950 text-[#a3e635] border border-[#a3e635]/30 flex items-center justify-center mb-1.5 shadow-xs group-hover:bg-neutral-900">
              <CalendarCheck2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs text-neutral-800 font-bold">Redeem gifts</span>
          </button>

          {/* Help */}
          <button
            onClick={() => onNavigate('customer_service')}
            className="flex flex-col items-center group active:scale-95 transition cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-neutral-950 text-[#a3e635] border border-[#a3e635]/30 flex items-center justify-center mb-1.5 shadow-xs group-hover:bg-neutral-900">
              <Headset className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs text-neutral-800 font-bold">Help</span>
          </button>
        </div>

        {/* Ticker / Marquee Bar */}
        <Ticker items={PLATFORM_TICKERS} />

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Account Balance */}
          <div className="bg-neutral-950 border border-[#a3e635]/40 rounded-xl p-4 text-white shadow-sm">
            <div className="text-lg sm:text-xl font-black tracking-tight truncate text-[#a3e635]">
              ₦ {user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-semibold text-neutral-300 mt-1">
              Account balance
            </div>
          </div>

          {/* Cumulative Income */}
          <div className="bg-[#a3e635] border border-[#84cc16] rounded-xl p-4 text-neutral-950 shadow-sm">
            <div className="text-lg sm:text-xl font-black tracking-tight truncate text-neutral-950">
              ₦ {user.cumulativeIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-bold text-neutral-800 mt-1">
              Cumulative income
            </div>
          </div>
        </div>

        {/* Daily Attendance Check-In Card */}
        <div className="bg-white rounded-xl p-3.5 border border-neutral-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-950 text-[#a3e635] flex items-center justify-center shrink-0">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900">Daily Member Check-In</h4>
              <p className="text-[11px] text-neutral-500">Sign in daily to receive a free ₦10 reward!</p>
            </div>
          </div>

          <button
            onClick={onDailyCheckIn}
            disabled={hasCheckedInToday}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black transition active:scale-95 ${
              hasCheckedInToday
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                : 'bg-[#a3e635] hover:bg-[#84cc16] text-neutral-950 shadow-2xs cursor-pointer'
            }`}
          >
            {hasCheckedInToday ? 'Signed In' : 'Sign In'}
          </button>
        </div>

        {/* Promoter Mega Bounty Card */}
        <div
          onClick={onGoToPromoters}
          className="relative bg-gradient-to-r from-neutral-950 via-neutral-900 to-[#1a2e05] rounded-xl p-3.5 text-white shadow-xs cursor-pointer group border border-[#a3e635]/35 active:scale-[0.99] transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#a3e635]/20 text-[#a3e635] border border-[#a3e635]/40 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black text-white">Promoters Program</h4>
                  <span className="px-1.5 py-0.2 bg-[#a3e635] text-[9px] font-black text-neutral-950 rounded-full">
                    UP TO ₦3.5M
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 mt-0.5">
                  Earn progressive cash rewards for inviting active VIP buyers!
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs font-bold text-[#a3e635] group-hover:translate-x-0.5 transition-transform">
              <span>View</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </div>
          </div>
        </div>

        {/* Featured Ola Cabs Fleet Showroom Deck */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-neutral-950 text-[#a3e635] flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                  Ola Cabs Fleet Showroom
                </h3>
                <p className="text-[10px] text-neutral-500">
                  Swipe to preview ride-hailing tiers & daily yields
                </p>
              </div>
            </div>

            <button
              onClick={onGoToProducts}
              className="text-xs font-black text-[#4d7c0f] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>All Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1.5 snap-x snap-mandatory">
            {featuredFleets.map((fleet) => (
              <div
                key={fleet.id}
                onClick={onGoToProducts}
                className="min-w-[225px] max-w-[225px] snap-start rounded-xl overflow-hidden bg-neutral-950 text-white border border-neutral-800 hover:border-[#a3e635] transition cursor-pointer shrink-0 flex flex-col justify-between group"
              >
                <div className="relative h-28 overflow-hidden">
                  <img
                    src={fleet.image}
                    alt={fleet.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-sm bg-[#a3e635] text-neutral-950 text-[10px] font-black">
                    {fleet.vipLevel}
                  </span>
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-sm bg-neutral-950/85 border border-white/15 text-[9px] font-bold text-neutral-200">
                    {fleet.category}
                  </span>
                  <div className="absolute bottom-1.5 left-2.5 right-2.5">
                    <h4 className="text-xs font-black text-white truncate">{fleet.title}</h4>
                  </div>
                </div>

                <div className="p-2.5 space-y-2">
                  <div className="grid grid-cols-2 gap-1.5 bg-neutral-900 p-2 rounded-lg border border-neutral-800 text-[10px]">
                    <div>
                      <span className="text-neutral-400 block">Daily Fare</span>
                      <span className="text-[#a3e635] font-black text-xs">
                        +₦{fleet.dailyIncome.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-neutral-400 block">Total ({fleet.validityDays}d)</span>
                      <span className="text-white font-bold text-xs">
                        ₦{fleet.totalIncome.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-xs font-black text-white">
                      ₦{fleet.price.toLocaleString()}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-[#a3e635] text-neutral-950 text-[10px] font-black inline-flex items-center gap-0.5">
                      Deploy <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Dispatched Fleet Garage Widget */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#65a30d] fill-[#65a30d]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-800">
                My Dispatched Garage ({user.purchasedProducts.length})
              </h4>
            </div>
            <button
              onClick={() => onNavigate('my_store')}
              className="text-xs text-[#4d7c0f] font-black hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Open Garage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {user.purchasedProducts.length === 0 ? (
            <div className="text-center py-5 text-neutral-400 text-xs bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
              <p className="font-semibold text-neutral-600">No active cabs deployed in your garage yet.</p>
              <button
                onClick={onGoToProducts}
                className="mt-2.5 px-4 py-2 bg-[#a3e635] hover:bg-[#84cc16] text-neutral-950 rounded-lg text-xs font-black active:scale-95 transition cursor-pointer"
              >
                Deploy VIP1 Fleet
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {user.purchasedProducts.map((p) => (
                <div
                  key={p.instanceId}
                  onClick={() => onNavigate('my_store')}
                  className="flex items-center justify-between p-2.5 bg-neutral-950 text-white rounded-xl border border-neutral-800 hover:border-[#a3e635]/50 transition cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {p.image && (
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-11 h-9 rounded-lg object-cover shrink-0 border border-white/15"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 bg-[#a3e635] text-neutral-950 font-black rounded-xs text-[9px]">
                          {p.vipLevel}
                        </span>
                        <span className="font-bold text-white truncate">
                          {p.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">
                        Day {p.daysActive || 0} of {p.validityDays} • Active Dispatch
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <div className="text-[#a3e635] font-black">
                      +₦{p.dailyIncome.toLocaleString()}/d
                    </div>
                    <span className="text-[9px] text-neutral-400">On Trip</span>
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
