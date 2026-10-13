import React, { useState, useEffect } from 'react';
import { DollarSign, Coins, CalendarCheck2, Headset, CheckCircle2, Zap, ArrowRight, Flame, Crown, TrendingUp, Users, ShieldCheck, Award, Send } from 'lucide-react';
import { Ticker } from './Ticker';
import { PLATFORM_TICKERS } from '../data/initialData';
import { UserState } from '../types';
import { DangoteLogo } from './DangoteLogo';

interface HomeScreenProps {
  user: UserState;
  onNavigate: (screen: 'recharge' | 'withdraw' | 'customer_service' | 'my_store' | 'tasks') => void;
  onOpenGifts: () => void;
  onGoToProducts: () => void;
  onGoToOrders?: () => void;
  onDailyCheckIn: () => void;
  onOpenTelegramGroupFlyer?: () => void;
}

const DANGOTE_HERO_IMAGES = [
  '/Rfnry-Blog.png', // Everything To Know About The Dangote Refinery IPO on Flutterwave
  '/images-2.jpeg', // Dangote Refinery Facility
  'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=900&auto=format&fit=crop&q=80', // Dangote Refinery
  'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=900&auto=format&fit=crop&q=80', // Petrochemical
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  onNavigate,
  onOpenGifts,
  onGoToProducts,
  onGoToOrders,
  onDailyCheckIn,
  onOpenTelegramGroupFlyer,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % DANGOTE_HERO_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = user.lastCheckInDate === today;

  return (
    <div className="min-h-screen pb-24 bg-slate-50 text-slate-900 font-sans">
      {/* Top Header / Status Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <DangoteLogo variant="wordmark" color="#1d4ed8" className="h-6" />
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 text-white px-2.5 py-1 rounded-full text-[11px] font-black flex items-center gap-1 shadow-xs border border-sky-300/40">
            <Crown className="w-3.5 h-3.5 fill-white" />
            <span>VIP 1</span>
          </div>

          <button
            onClick={onDailyCheckIn}
            disabled={hasCheckedInToday}
            className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
              hasCheckedInToday
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
            }`}
          >
            <CalendarCheck2 className="w-3.5 h-3.5" />
            <span>{hasCheckedInToday ? 'Checked In' : 'Check-in'}</span>
          </button>
        </div>
      </div>

      {/* Top Hero Carousel */}
      <div className="relative h-52 sm:h-60 w-full overflow-hidden bg-slate-900 shadow-md">
        {DANGOTE_HERO_IMAGES.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt="Dangote Refinery"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              idx === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            referrerPolicy="no-referrer"
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-black/50" />

        <div className="absolute inset-0 p-4.5 flex flex-col justify-between z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-sky-400/40 text-[10px] font-black text-sky-200 uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3 text-sky-400" />
              <span>Official Flutterwave IPO Partner</span>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-white leading-snug drop-shadow-md">
              Everything To Know About The Dangote Refinery IPO on Flutterwave
            </h2>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-sky-300 font-bold">Dangote Share Tranches Live Now</span>
              <button
                onClick={onGoToProducts}
                className="px-3.5 py-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-black shadow-md flex items-center gap-1 transition cursor-pointer"
              >
                <span>Acquire</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel indicators */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
          {DANGOTE_HERO_IMAGES.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-5 bg-sky-400' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3.5 -mt-3 relative z-20">
        {/* Available Balance Card */}
        <div className="bg-gradient-to-br from-[#1e40af] via-[#1d4ed8] to-[#0f172a] text-white rounded-2xl shadow-xl border border-sky-400/30 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-black tracking-wider text-sky-200 uppercase">
                Available Wallet Balance
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5 flex items-baseline gap-2 font-mono">
                <span>₦ {(user?.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-xs font-mono font-medium text-sky-300">
                  ≈ ${((user?.balance ?? 0) / 1500).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-black tracking-wider text-sky-200 uppercase">
                Total Dividends
              </div>
              <div className="text-sm sm:text-base font-black text-sky-300 font-mono mt-0.5">
                +₦ {(user?.cumulativeIncome ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => onNavigate('recharge')}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-300 hover:to-cyan-400 text-slate-950 text-xs font-black shadow-md spring-press transition-butter flex items-center justify-center gap-2 cursor-pointer border border-sky-200"
            >
              <DollarSign className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>Deposit Funds</span>
            </button>

            <button
              onClick={() => onNavigate('withdraw')}
              className="py-3 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold shadow-md spring-press transition-butter flex items-center justify-center gap-2 cursor-pointer border border-white/20"
            >
              <Coins className="w-4 h-4 text-sky-300" />
              <span>Withdraw Yield</span>
            </button>
          </div>
        </div>

        {/* Quick Action Grid */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-3.5 grid grid-cols-4 gap-2 text-center">
          {/* VIP */}
          <button
            onClick={onGoToProducts}
            className="flex flex-col items-center group spring-press cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-1.5 shadow-2xs border border-blue-300/40 group-hover:bg-blue-500/20 transition-butter">
              <Crown className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-xs text-slate-800 font-black">VIP Tranches</span>
          </button>

          {/* Tasks */}
          <button
            onClick={() => onNavigate('tasks')}
            className="flex flex-col items-center group spring-press cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-1.5 shadow-2xs border border-sky-300/40 group-hover:bg-sky-500/20 transition-butter">
              <Award className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-xs text-slate-800 font-black">Tasks &amp; Gifts</span>
          </button>

          {/* Team */}
          <button
            onClick={() => {}}
            className="flex flex-col items-center group spring-press cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-1.5 shadow-2xs border border-indigo-300/40 group-hover:bg-indigo-500/20 transition-butter">
              <Users className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-xs text-slate-800 font-black">Team ({user.teamMembers?.length || 0})</span>
          </button>

          {/* Roadmap */}
          <button
            onClick={onGoToProducts}
            className="flex flex-col items-center group spring-press cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center mb-1.5 shadow-2xs border border-cyan-300/40 group-hover:bg-cyan-500/20 transition-butter">
              <TrendingUp className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-xs text-slate-800 font-black">Roadmap</span>
          </button>
        </div>

        {/* Official Telegram Group Syndicate Flyer Banner */}
        <button
          onClick={onOpenTelegramGroupFlyer || (() => window.open('https://t.me/teslainvestment456', '_blank'))}
          className="w-full bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-900 rounded-2xl p-4 border border-sky-300/40 shadow-md flex items-center justify-between group spring-press hover-butter-lift cursor-pointer text-left relative overflow-hidden text-white"
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white border border-white/30 flex items-center justify-center shrink-0 shadow-xs">
              <Send className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-white">Official Telegram Group</span>
                <span className="bg-sky-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase shadow-xs">
                  t.me/teslainvestment456
                </span>
              </div>
              <p className="text-xs text-slate-100 font-medium mt-1">
                Join 45,000+ shareholders for live IPO updates, signals &amp; giveaways
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-sky-300 group-hover:translate-x-1.5 transition-transform shrink-0 relative z-10" />
        </button>

        {/* Referral Tasks Spotlight Card */}
        <button
          onClick={() => onNavigate('tasks')}
          className="w-full bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-4 border border-blue-500/30 shadow-md flex items-center justify-between group spring-press hover-butter-lift cursor-pointer text-left relative overflow-hidden text-white"
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center shrink-0 shadow-xs">
              <Award className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-white">Referral Tasks &amp; Bounties</span>
                <span className="bg-sky-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase shadow-xs">
                  Up to ₦3.5M
                </span>
              </div>
              <p className="text-xs text-sky-100 font-medium mt-1">
                Complete shareholder tasks &amp; invite active friends for instant cash rewards
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-sky-300 group-hover:translate-x-1.5 transition-transform shrink-0 relative z-10" />
        </button>

        {/* Ticker / Marquee Bar */}
        <Ticker items={PLATFORM_TICKERS} />

        {/* Active Subscriptions Summary Widget */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">My Active Share Tranches</h4>
            <button
              onClick={() => onNavigate('my_store')}
              className="text-xs text-blue-700 hover:underline font-extrabold cursor-pointer"
            >
              View All ({user?.purchasedProducts?.length || 0}) &gt;
            </button>
          </div>

          {(user?.purchasedProducts?.length || 0) === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
              <p>No active share tranches subscribed yet.</p>
              <button
                onClick={onGoToProducts}
                className="mt-2.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
              >
                Browse Share Tranches Now
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {(user?.purchasedProducts || []).slice(0, 2).map((item) => (
                <div key={item.instanceId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-slate-900 truncate">{item.title}</div>
                    <div className="text-[11px] text-blue-700 font-mono font-bold mt-0.5">
                      Daily: ₦{(item?.dailyIncome ?? 0).toLocaleString()} | Active: {item?.daysActive ?? 0}/{item?.validityDays ?? 0} Days
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded-full">
                    Active Yield
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
