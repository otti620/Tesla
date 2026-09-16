import React, { useState, useEffect } from 'react';
import { DollarSign, Coins, CalendarCheck2, Headset, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { Ticker } from './Ticker';
import { MOCK_TICKERS } from '../data/initialData';
import { UserState } from '../types';
import { TeslaLogo } from './TeslaLogo';

interface HomeScreenProps {
  user: UserState;
  onNavigate: (screen: 'recharge' | 'withdraw' | 'customer_service' | 'my_store') => void;
  onOpenGifts: () => void;
  onGoToProducts: () => void;
  onOpenNotify: () => void;
  onDailyCheckIn: () => void;
}

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1698870404396-7c089c2c62c2?w=900&auto=format&fit=crop&q=80', // Tesla Cybertruck
  'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=900&auto=format&fit=crop&q=80', // Tesla Model 3
  'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=900&auto=format&fit=crop&q=80', // Tesla Model Y
  'https://images.unsplash.com/photo-1571127236794-81c0bbfe1ce3?w=900&auto=format&fit=crop&q=80', // Tesla Supercharging Network
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  onNavigate,
  onOpenGifts,
  onGoToProducts,
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

  const todayStr = new Date().toDateString();
  const hasCheckedInToday = user.lastCheckInDate === todayStr;

  return (
    <div className="min-h-screen pb-24 bg-neutral-50 text-neutral-900">
      {/* Top Hero Carousel */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-neutral-900 shadow-md">
        {HERO_IMAGES.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt="Tesla Energy"
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
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <TeslaLogo variant="icon" color="#ffffff" className="w-5 h-5" />
            <span className="text-xs font-bold tracking-widest text-white">TESLA</span>
          </div>

          <button
            onClick={onOpenNotify}
            className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium rounded-full border border-white/20 transition active:scale-95"
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
                idx === currentSlide ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3 -mt-4 relative z-20">
        {/* Quick Action Grid (matching screenshot 4) */}
        <div className="bg-white rounded-xl shadow-xs border border-neutral-100 p-3 grid grid-cols-4 gap-2 text-center">
          {/* Recharge */}
          <button
            onClick={() => onNavigate('recharge')}
            className="flex flex-col items-center group active:scale-95 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#00c269] flex items-center justify-center mb-1.5 shadow-xs group-hover:bg-emerald-100">
              <DollarSign className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs text-neutral-700 font-medium">Recharge</span>
          </button>

          {/* Withdraw */}
          <button
            onClick={() => onNavigate('withdraw')}
            className="flex flex-col items-center group active:scale-95 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#00c269] flex items-center justify-center mb-1.5 shadow-xs group-hover:bg-emerald-100">
              <Coins className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs text-neutral-700 font-medium">Withdraw</span>
          </button>

          {/* Redeem gifts */}
          <button
            onClick={onOpenGifts}
            className="flex flex-col items-center group active:scale-95 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#00c269] flex items-center justify-center mb-1.5 shadow-xs group-hover:bg-emerald-100">
              <CalendarCheck2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs text-neutral-700 font-medium">Redeem gifts</span>
          </button>

          {/* Help */}
          <button
            onClick={() => onNavigate('customer_service')}
            className="flex flex-col items-center group active:scale-95 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#00c269] flex items-center justify-center mb-1.5 shadow-xs group-hover:bg-emerald-100">
              <Headset className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-xs text-neutral-700 font-medium">Help</span>
          </button>
        </div>

        {/* Ticker / Marquee Bar */}
        <Ticker items={MOCK_TICKERS} />

        {/* Balance Cards (Screenshot 4) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Account Balance */}
          <div className="bg-[#00c269] rounded-xl p-4 text-white shadow-xs">
            <div className="text-lg sm:text-xl font-extrabold tracking-tight truncate">
              ₦ {user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-medium text-white/90 mt-1">
              Account balance
            </div>
          </div>

          {/* Cumulative Income */}
          <div className="bg-[#00c269] rounded-xl p-4 text-white shadow-xs">
            <div className="text-lg sm:text-xl font-extrabold tracking-tight truncate">
              ₦ {user.cumulativeIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-medium text-white/90 mt-1">
              Cumulative income
            </div>
          </div>
        </div>

        {/* Daily Attendance Check-In Card */}
        <div className="bg-white rounded-xl p-3.5 border border-neutral-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#00c269] flex items-center justify-center shrink-0">
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
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
              hasCheckedInToday
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                : 'bg-[#00c269] hover:bg-[#00ab5c] text-white shadow-2xs'
            }`}
          >
            {hasCheckedInToday ? 'Signed In' : 'Sign In'}
          </button>
        </div>

        {/* Promo Banner Card (Screenshot 4) */}
        <div
          onClick={onGoToProducts}
          className="relative h-32 rounded-xl overflow-hidden shadow-xs cursor-pointer group active:scale-[0.99] transition border border-neutral-200"
        >
          <img
            src="https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=80"
            alt="Tesla Supercharger VIP Hub"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-80"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent p-4 flex flex-col justify-center text-white">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
              Tesla Energy Fleet
            </span>
            <h3 className="text-base font-bold leading-snug">
              Power Your Financial Future
            </h3>
            <p className="text-xs text-neutral-200 mt-0.5">
              Click to view VIP investment packages &gt;
            </p>
          </div>
        </div>

        {/* Active Subscriptions Summary Widget */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-neutral-800">My Active Subscriptions</h4>
            <button
              onClick={() => onNavigate('my_store')}
              className="text-xs text-[#00c269] font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>Manage Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {user.purchasedProducts.length === 0 ? (
            <div className="text-center py-5 text-neutral-400 text-xs">
              <p>No active VIP plans yet.</p>
              <button
                onClick={onGoToProducts}
                className="mt-2 px-3 py-1.5 bg-[#00c269] text-white rounded-md text-xs font-medium active:scale-95 transition"
              >
                Purchase VIP1
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {user.purchasedProducts.map((p) => (
                <div
                  key={p.instanceId}
                  className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-xs text-[10px]">
                      {p.vipLevel}
                    </span>
                    <span className="font-semibold text-neutral-800 truncate max-w-[140px]">
                      {p.title}
                    </span>
                  </div>
                  <div className="text-emerald-600 font-bold">
                    +₦ {p.dailyIncome.toLocaleString()}/day
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
