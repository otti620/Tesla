import React from 'react';
import { ChevronLeft, ShieldCheck, Zap, Globe, Lock, CreditCard } from 'lucide-react';
import { DangoteLogo } from './DangoteLogo';

interface InfoModalProps {
  type: 'about' | 'rules';
  onBack: () => void;
}

export const InfoModals: React.FC<InfoModalProps> = ({ type, onBack }) => {
  return (
    <div className="min-h-screen pb-16 bg-slate-950 text-white font-sans animate-page-in">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 border-b border-sky-400/20 shadow-md">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1 text-white hover:bg-white/10 rounded-full transition active:scale-95 cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <h1 className="text-base font-black text-white">
          {type === 'about' ? 'About Dangote Refinery' : 'Shareholder Regulations & Policy'}
        </h1>

        <div className="w-6" />
      </div>

      <div className="p-5 space-y-5 max-w-md mx-auto">
        {type === 'about' ? (
          <>
            <div className="text-center py-4 space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-800 to-indigo-950 text-white flex items-center justify-center mx-auto mb-3 shadow-lg border border-sky-400/40">
                <DangoteLogo variant="icon" color="#ffffff" className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-black text-white tracking-wider">
                DANGOTE PETROLEUM REFINERY
              </h2>
              <p className="text-xs text-sky-400 font-bold uppercase tracking-wider">
                650,000 BPD Integrated Refinery &amp; Petrochemical Complex
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-blue-950/60 p-4 rounded-2xl border border-sky-400/20 shadow-sm">
              <p>
                Dangote Petroleum Refinery Shareholder Portal provides approved members and institutional investors with direct access to distributed share tranches, Lekki single-train refining dividends, and petrochemical yield pools.
              </p>
              <p>
                Shareholders can activate share allotments across VIP tiers, generating guaranteed daily dividends calculated automatically and withdrawable 24/7 directly to local Nigerian bank accounts.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-sky-500/30">
                <ShieldCheck className="w-5 h-5 text-sky-400 mb-1" />
                <div className="text-xs font-bold text-white">Secured Dividends</div>
                <div className="text-[11px] text-slate-400">60-day fixed cycle returns</div>
              </div>
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-blue-500/30">
                <Globe className="w-5 h-5 text-blue-400 mb-1" />
                <div className="text-xs font-bold text-white">Shareholder Liquidity</div>
                <div className="text-[11px] text-slate-400">Instant withdrawals to Nigerian banks</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4 text-xs text-slate-200 leading-relaxed">
              <div className="bg-blue-950/70 p-4 rounded-2xl border border-sky-400/20 shadow-sm">
                <h3 className="font-black text-sky-300 mb-1 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-sky-400" />
                  1. Shareholder Activation &amp; Welcome Bonus
                </h3>
                <p className="text-slate-300">
                  Every newly registered shareholder receives a welcome bonus of <strong>₦1,000</strong> credited immediately upon account verification and onboarding.
                </p>
              </div>

              <div className="bg-blue-950/70 p-4 rounded-2xl border border-sky-400/20 shadow-sm">
                <h3 className="font-black text-sky-300 mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-sky-400" />
                  2. Deposit &amp; Capital Guidelines
                </h3>
                <p className="text-slate-300">
                  The minimum deposit amount is <strong>₦5,000</strong>. Capital deposits are processed 24/7 through official commercial bank transfer channels.
                </p>
              </div>

              <div className="bg-blue-950/70 p-4 rounded-2xl border border-sky-400/20 shadow-sm">
                <h3 className="font-black text-sky-300 mb-1 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-sky-400" />
                  3. Withdrawal Rules &amp; Operating Hours
                </h3>
                <p className="text-slate-300">
                  Minimum withdrawal amount is <strong>₦1,500</strong>. Operating hours are <strong>9:00 AM – 5:00 PM (Monday – Saturday)</strong> and <strong>2:00 PM – 5:00 PM on Sundays (WAT)</strong>. A statutory tax &amp; processing fee of 18% is applied automatically.
                </p>
              </div>

              <div className="bg-blue-950/70 p-4 rounded-2xl border border-sky-400/20 shadow-sm">
                <h3 className="font-black text-sky-300 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  4. Referral Commissions &amp; Tiers
                </h3>
                <p className="text-slate-300">
                  Earn 15% instant commission for Level 1 direct share activations, 3% for Level 2 downlines, and 1% for Level 3 downlines.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

