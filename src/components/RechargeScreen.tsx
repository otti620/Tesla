import React, { useState } from 'react';
import { 
  ChevronLeft, 
  FileClock, 
  AlertCircle, 
  ShieldCheck, 
  CreditCard,
  Building2,
  Sparkles
} from 'lucide-react';
import { UserState, CheckoutOrder, PlatformSettings } from '../types';
import { DangoteLogo } from './DangoteLogo';

interface RechargeScreenProps {
  user: UserState;
  platformSettings?: PlatformSettings;
  onBack: () => void;
  onGoToRecords: () => void;
  onProceedToCheckout: (order: CheckoutOrder) => void;
}

export const RechargeScreen: React.FC<RechargeScreenProps> = ({
  user,
  platformSettings,
  onBack,
  onGoToRecords,
  onProceedToCheckout,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(5000);
  const [customAmount, setCustomAmount] = useState<string>('5000');
  const [selectedChannel, setSelectedChannel] = useState<'channel_3' | 'channel_2'>('channel_3');
  const [errorMessage, setErrorMessage] = useState('');

  const quickAmounts = [5000, 10000, 20000, 40000, 70000, 100000];

  const handleSelectQuick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toString());
    setErrorMessage('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && quickAmounts.includes(num)) {
      setSelectedAmount(num);
    } else {
      setSelectedAmount(null);
    }
    setErrorMessage('');
  };

  const handleRechargeClick = () => {
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount < 5000) {
      setErrorMessage('Minimum capital deposit amount is ₦ 5,000');
      return;
    }

    const depositBankName = platformSettings?.depositBankName || 'CARBON';
    const depositAccountNo = platformSettings?.depositAccountNo || '1581957640';
    const depositAccountName = platformSettings?.depositAccountName || 'DANGOTE REFINERY SHAREHOLDER ESCROW';

    const order: CheckoutOrder = {
      orderNo: `DAN${Date.now().toString().slice(-8)}`,
      amount,
      channel: selectedChannel === 'channel_3' ? 'Direct Bank Transfer (Instant Automated)' : 'Commercial Settlement Gateway',
      bankName: depositBankName,
      accountNo: depositAccountNo,
      accountName: depositAccountName,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000,
    };

    onProceedToCheckout(order);
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 text-slate-900 font-sans">
      {/* Top Header - Blue Corporate Theme */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white shadow-md">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1 text-white hover:bg-white/10 rounded-full transition active:scale-95 cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h1 className="text-base font-black tracking-wide text-white">
            Capital Deposit
          </h1>
          <p className="text-[10px] text-sky-300 font-bold tracking-wider uppercase">
            Dangote Depository Gateway
          </p>
        </div>

        <button
          onClick={onGoToRecords}
          className="p-1.5 -mr-1 text-sky-300 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer flex items-center gap-1"
          title="Transaction History"
        >
          <FileClock className="w-5 h-5" />
        </button>
      </div>

      {/* Account Balance Card */}
      <div className="p-4 pb-0 max-w-md mx-auto">
        <div className="bg-gradient-to-br from-[#1e40af] via-[#1d4ed8] to-[#0f172a] text-white rounded-3xl p-5 border border-sky-400/30 shadow-md flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-xs text-sky-200 uppercase tracking-wider font-bold">
              Account Available Balance
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
              ₦ {user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-sky-300 mt-1 font-medium flex items-center gap-1.5">
              <span>Withdrawable Liquid Balance</span>
              <span className="text-sky-300 font-bold">• 24/7 Depository</span>
            </div>
          </div>
          <div className="opacity-95 shrink-0 pl-2 relative z-10">
            <DangoteLogo variant="badge" className="w-14 h-14" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Quick Amount Section */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              Deposit Amount (NGN)
            </span>
            <span className="text-[11px] text-blue-700 font-bold font-mono">
              Min: ₦ 5,000
            </span>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((amt) => {
              const isSelected = selectedAmount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSelectQuick(amt)}
                  className={`py-2.5 px-1.5 text-center rounded-xl text-xs font-black transition-all cursor-pointer font-mono border ${
                    isSelected
                      ? 'bg-blue-600 border-blue-700 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  ₦ {amt.toLocaleString()}
                </button>
              );
            })}
          </div>

          {/* Amount Input Field */}
          <div className="relative mt-2">
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 shadow-2xs focus-within:border-blue-600 transition-colors">
              <span className="text-base font-black text-blue-700 mr-2 font-mono">₦</span>
              <input
                type="text"
                value={customAmount}
                onChange={handleCustomChange}
                placeholder="Enter deposit amount (min 5,000)"
                className="w-full text-sm text-slate-900 bg-transparent placeholder:text-slate-400 focus:outline-hidden font-bold font-mono"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Payment Channels */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5">
          <div className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-700" />
            Verified Transfer Channels
          </div>

          <div className="space-y-2">
            {/* Channel 3 */}
            <button
              type="button"
              onClick={() => setSelectedChannel('channel_3')}
              className={`w-full p-3 rounded-xl text-xs font-bold text-left border transition-all flex items-center justify-between cursor-pointer ${
                selectedChannel === 'channel_3'
                  ? 'bg-sky-50 border-blue-600 text-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                  selectedChannel === 'channel_3' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  01
                </div>
                <div>
                  <div className="font-black text-slate-900">Direct Bank Transfer (Instant)</div>
                  <div className="text-[10px] text-blue-700 font-bold">Automated Escrow Clearing • 0% Fee</div>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                selectedChannel === 'channel_3' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
              }`}>
                {selectedChannel === 'channel_3' && <span className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>

            {/* Channel 2 */}
            <button
              type="button"
              onClick={() => setSelectedChannel('channel_2')}
              className={`w-full p-3 rounded-xl text-xs font-bold text-left border transition-all flex items-center justify-between cursor-pointer ${
                selectedChannel === 'channel_2'
                  ? 'bg-sky-50 border-blue-600 text-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                  selectedChannel === 'channel_2' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  02
                </div>
                <div>
                  <div className="font-black text-slate-900">Commercial Settlement Gateway</div>
                  <div className="text-[10px] text-slate-500 font-bold">Fast Bank Deposit • Nigerian Naira</div>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                selectedChannel === 'channel_2' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
              }`}>
                {selectedChannel === 'channel_2' && <span className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          </div>
        </div>

        {/* Primary CTA Button */}
        <button
          onClick={handleRechargeClick}
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-500"
        >
          <CreditCard className="w-4 h-4 text-sky-300" />
          <span>Proceed To Depository Funding</span>
        </button>

        {/* Shareholder Depository Instructions */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5 shadow-2xs">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            Shareholder Funding Terms
          </h3>
          <ol className="space-y-1.5 text-[11px] text-slate-600 leading-relaxed font-medium">
            <li>• <strong>Minimum Capital</strong>: ₦5,000 NGN; funding window is active 24/7 daily.</li>
            <li>• <strong>Reference Match</strong>: Use the exact dynamic account generated on the checkout page to guarantee automated instant crediting.</li>
            <li>• <strong>Security Protocol</strong>: Never share payment slips or OTPs with unauthorized third parties.</li>
            <li>• <strong>Settlement Support</strong>: Our 24/7 Shareholder Support desk is on standby for payment assistance.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
