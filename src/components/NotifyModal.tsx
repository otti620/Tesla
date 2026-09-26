import React from 'react';
import { Send, CheckCircle2, ShieldCheck, ArrowRight, X } from 'lucide-react';

interface NotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTelegram: () => void;
  announcementNotice?: string;
  signupBonus?: number;
  level1CommissionPct?: number;
  telegramGroupLink?: string;
}

export const NotifyModal: React.FC<NotifyModalProps> = ({
  isOpen,
  onClose,
  onOpenTelegram,
  announcementNotice,
  signupBonus = 1500,
  level1CommissionPct = 25,
  telegramGroupLink = 'https://t.me/teslainvestment456',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl bg-white border border-white/20 text-white animate-in zoom-in-95 duration-200 relative">
        
        {/* Close Button Top-Right */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white/90 flex items-center justify-center backdrop-blur-md transition active:scale-95 cursor-pointer border border-white/20"
          aria-label="Close Announcement"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with image & large NOTIFY text */}
        <div className="relative h-40 bg-neutral-950 overflow-hidden flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=800&auto=format&fit=crop&q=80"
            alt="Tesla Energy Community"
            className="absolute inset-0 w-full h-full object-cover brightness-65 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00c269] via-black/30 to-black/60" />
          
          <div className="relative z-10 text-center px-4">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-emerald-400/30 mb-1">
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
              Official Announcement
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-wider text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              NOTIFY
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="bg-[#00c269] p-4.5 sm:p-5 text-white space-y-4">
          
          {/* PROMINENT TOP JOIN TELEGRAM CTA BUTTON */}
          <button
            onClick={onOpenTelegram}
            className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-[#0088cc] via-[#0099e6] to-[#0077b5] p-3.5 text-left shadow-lg border border-white/40 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer ring-2 ring-white/30"
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-11 h-11 rounded-xl bg-white text-[#0088cc] flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
                <Send className="w-6 h-6 fill-[#0088cc] stroke-[#0088cc] -ml-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 text-white px-2 py-0.2 rounded-full">
                    OFFICIAL GROUP
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                </div>
                <h3 className="text-sm font-black text-white truncate drop-shadow-xs">
                  JOIN TELEGRAM GROUP
                </h3>
                <p className="text-[11px] text-white/90 truncate font-mono">
                  {telegramGroupLink.replace(/^https?:\/\//, '')}
                </p>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </button>

          {/* Announcement Rules / Guidance Text */}
          <div className="space-y-2 text-xs font-medium leading-relaxed max-h-52 overflow-y-auto pr-1 bg-black/10 p-3 rounded-2xl border border-white/15">
            {announcementNotice ? (
              <p className="bg-white/15 p-2 rounded-xl border border-white/20 text-white font-semibold mb-2">
                📢 {announcementNotice}
              </p>
            ) : null}
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 shrink-0 mt-0.5" />
              <span>Register to receive <strong>₦{signupBonus.toLocaleString()} NGN</strong> instant welcome bonus.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 shrink-0 mt-0.5" />
              <span>Affiliate referral reward: Level 1: <strong>{level1CommissionPct}% instant bonus</strong>, Level 2: 1%, Level 3: 1%.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 shrink-0 mt-0.5" />
              <span>Withdrawals are processed from <strong>9:00 AM to 5:00 PM (Mon–Sat)</strong> and strictly <strong>2:00 PM to 5:00 PM on Sundays</strong> with rapid administrative audit and bank settlement.</span>
            </div>
            <div className="flex items-start gap-1.5 font-bold text-white bg-white/10 p-1.5 rounded-lg">
              <Send className="w-3.5 h-3.5 text-cyan-200 shrink-0 mt-0.5" />
              <span>All bonus codes, redemptions & giveaways are posted inside the official Telegram group!</span>
            </div>
          </div>

          {/* Secondary Action / Dismiss button */}
          <div className="pt-1">
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-[#00c269] text-sm font-extrabold shadow-md active:scale-95 transition-all text-center cursor-pointer"
            >
              I Understand & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
