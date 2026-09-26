import React from 'react';
import { ChevronLeft, ShieldCheck, Zap, Globe, Lock } from 'lucide-react';
import { TeslaLogo } from './TeslaLogo';

interface InfoModalProps {
  type: 'about' | 'rules';
  onBack: () => void;
}

export const InfoModals: React.FC<InfoModalProps> = ({ type, onBack }) => {
  return (
    <div className="min-h-screen pb-16 bg-white text-neutral-900">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-neutral-800 hover:bg-neutral-100 rounded-full transition active:scale-95"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <h1 className="text-base font-bold text-neutral-900">
          {type === 'about' ? 'About Tesla Platform' : 'Platform Rules'}
        </h1>

        <div className="w-7" />
      </div>

      <div className="p-5 space-y-5 max-w-md mx-auto">
        {type === 'about' ? (
          <>
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center mx-auto mb-3 shadow-md">
                <TeslaLogo variant="icon" color="#ffffff" className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-black text-neutral-900 tracking-wider">
                TESLA ENERGY
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                Accelerating the World's Transition to Sustainable Energy
              </p>
            </div>

            <div className="space-y-3 text-xs text-neutral-600 leading-relaxed">
              <p>
                Tesla Energy Member Ecosystem provides users in emerging markets with direct access to distributed renewable micro-investments, Supercharger revenue-sharing networks, and high-efficiency Megapack utility yield pools.
              </p>
              <p>
                Members can activate localized charging infrastructure and Megapack utility nodes across VIP tiers, generating guaranteed daily returns calculated automatically and withdrawable 24/7 directly to local Nigerian bank accounts.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mb-1" />
                <div className="text-xs font-bold text-neutral-900">Secured Returns</div>
                <div className="text-[11px] text-neutral-500">100-day fixed cycle dividends</div>
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <Globe className="w-5 h-5 text-[#00c269] mb-1" />
                <div className="text-xs font-bold text-neutral-900">24/7 Liquidity</div>
                <div className="text-[11px] text-neutral-500">Instant withdrawals to Nigerian banks</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4 text-xs text-neutral-700 leading-relaxed">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <h3 className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  1. Member Activation &amp; Welcome Bonus
                </h3>
                <p>
                  Every newly registered member receives a welcome gift of ₦ 1,500 immediately upon account verification.
                </p>
              </div>

              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <h3 className="font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-[#00c269]" />
                  2. Recharge &amp; Deposit Guidelines
                </h3>
                <p>
                  The minimum deposit amount is ₦ 4,000. Deposits are processed 24/7 through official channels (Channel 2 and Channel 3). Always use your personal account and never transfer funds to unverified individuals.
                </p>
              </div>

              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <h3 className="font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#00c269]" />
                  3. Withdrawal Rules &amp; Schedule
                </h3>
                <p>
                  Minimum withdrawal is ₦ 800. Operating hours are strictly <strong>9:00 AM – 5:00 PM (Monday – Saturday)</strong> and strictly <strong>2:00 PM – 5:00 PM on Sundays (WAT)</strong>. Accounts credited or approved by administration enjoy direct prerequisite waiver. A statutory platform maintenance &amp; tax fee of 18% is deducted automatically.
                </p>
              </div>

              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <h3 className="font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#00c269]" />
                  4. Referral Commissions &amp; Tiers
                </h3>
                <p>
                  Level 1 direct referrals reward 25% cash bonus on initial investment. Level 2 and Level 3 team investments yield 1% ongoing commission bonuses credited directly to your balance.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
