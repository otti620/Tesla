import React, { useState } from 'react';
import { ChevronLeft, FileClock, AlertCircle } from 'lucide-react';
import { UserState, CheckoutOrder } from '../types';
import { TeslaLogo } from './TeslaLogo';

interface RechargeScreenProps {
  user: UserState;
  onBack: () => void;
  onGoToRecords: () => void;
  onProceedToCheckout: (order: CheckoutOrder) => void;
}

export const RechargeScreen: React.FC<RechargeScreenProps> = ({
  user,
  onBack,
  onGoToRecords,
  onProceedToCheckout,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(4000);
  const [customAmount, setCustomAmount] = useState<string>('4000');
  const [selectedChannel, setSelectedChannel] = useState<'channel_3' | 'channel_2'>('channel_3');
  const [errorMessage, setErrorMessage] = useState('');

  const quickAmounts = [4000, 10000, 20000, 40000, 70000, 100000];

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
    if (isNaN(amount) || amount < 4000) {
      setErrorMessage('Minimum recharge amount is ₦ 4,000');
      return;
    }

    const order: CheckoutOrder = {
      orderNo: `TSL${Date.now().toString().slice(-8)}`,
      amount,
      channel: selectedChannel === 'channel_3' ? 'Recharge Channel 3' : 'Recharge Channel 2',
      bankName: selectedChannel === 'channel_3' ? 'Wema Bank (ALAT)' : 'Moniepoint MFB',
      accountNo: selectedChannel === 'channel_3' ? '0123984712' : '8139201948',
      accountName: 'Tesla Clean Energy Limited',
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000,
    };

    onProceedToCheckout(order);
  };

  return (
    <div className="min-h-screen pb-16 bg-white text-neutral-900">
      {/* Header (Screenshot 5) */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-neutral-800 hover:bg-neutral-100 rounded-full transition active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <h1 className="text-base font-bold text-neutral-900">Recharge</h1>

        <button
          onClick={onGoToRecords}
          className="p-1 -mr-1 text-orange-500 hover:bg-orange-50 rounded-full transition active:scale-95 cursor-pointer"
        >
          <FileClock className="w-6 h-6 stroke-[1.8]" />
        </button>
      </div>

      {/* Top Banner with Balance and Tesla Logo (Screenshots 5 & 6) */}
      <div className="relative h-40 w-full overflow-hidden bg-neutral-900 text-white">
        <img
          src="https://images.unsplash.com/photo-1571127236794-81c0bbfe1ce3?w=800&auto=format&fit=crop&q=80"
          alt="Tesla Supercharger"
          className="w-full h-full object-cover brightness-[0.55]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

        <div className="absolute inset-0 p-5 flex items-center justify-between">
          <div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              ₦ {user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-neutral-300 mt-1 font-medium">
              Account balance
            </div>
          </div>

          <div className="opacity-90">
            <TeslaLogo variant="icon" color="#ffffff" className="w-12 h-12" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Recharge Amount Section */}
        <div>
          <div className="flex items-baseline gap-1.5 mb-2.5">
            <span className="text-sm font-bold text-neutral-900">Recharge amount</span>
            <span className="text-xs text-neutral-500">(Minimum ₦ 4,000)</span>
          </div>

          {/* Quick Amount Chips (5000, 10000, 20000, 40000, 70000, 100000) */}
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((amt) => {
              const isSelected = selectedAmount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSelectQuick(amt)}
                  className={`py-2 px-1 text-center rounded-md text-xs font-semibold border transition cursor-pointer ${
                    isSelected
                      ? 'border-[#00c269] text-[#00c269] bg-emerald-50/50'
                      : 'border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50'
                  }`}
                >
                  {amt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recharge Channels (Screenshots 5 & 6) */}
        <div>
          <h3 className="text-sm font-bold text-neutral-900 mb-2.5">Recharge channels</h3>
          <div className="space-y-2">
            {/* Recharge Channel 3 */}
            <button
              type="button"
              onClick={() => setSelectedChannel('channel_3')}
              className={`w-full py-3 px-4 rounded-lg text-xs font-bold text-center border transition cursor-pointer ${
                selectedChannel === 'channel_3'
                  ? 'bg-gradient-to-r from-amber-200 to-amber-300 text-amber-950 border-amber-400 shadow-xs'
                  : 'bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              Recharge Channel 3
            </button>

            {/* Recharge Channel 2 */}
            <button
              type="button"
              onClick={() => setSelectedChannel('channel_2')}
              className={`w-full py-3 px-4 rounded-lg text-xs font-bold text-center border transition cursor-pointer ${
                selectedChannel === 'channel_2'
                  ? 'bg-gradient-to-r from-amber-200 to-amber-300 text-amber-950 border-amber-400 shadow-xs'
                  : 'bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              Recharge Channel 2
            </button>
          </div>
        </div>

        {/* Input Field */}
        <div className="flex items-center border border-neutral-200 rounded-lg px-3 py-2.5 bg-neutral-50/50 shadow-2xs">
          <span className="text-sm font-bold text-neutral-700 mr-2">₦</span>
          <input
            type="text"
            value={customAmount}
            onChange={handleCustomChange}
            placeholder="Please enter the recharge amount"
            className="w-full text-sm text-neutral-900 bg-transparent placeholder:text-neutral-400 focus:outline-hidden font-medium"
          />
        </div>

        {errorMessage && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Recharge Now Button */}
        <button
          onClick={handleRechargeClick}
          className="w-full py-3 rounded-full bg-[#00c269] hover:bg-[#00ad5e] text-white text-sm font-bold shadow-md active:scale-98 transition text-center cursor-pointer"
        >
          Recharge now
        </button>

        {/* Recharge Instructions (Screenshots 6 & 7) */}
        <div className="pt-2 border-t border-neutral-100">
          <h3 className="text-sm font-bold text-neutral-900 mb-2.5">
            Recharge instructions
          </h3>

          <ol className="space-y-2 text-xs text-neutral-600 leading-relaxed font-normal">
            <li>1. Minimum deposit is 4000ngn, recharge time: (7*24)</li>
            <li>2. For any recharge issues, please contact platform customer service promptly.</li>
            <li>3. Please carefully verify your account information before transferring funds to avoid payment errors.</li>
            <li>4. For your fund security, please do not transfer funds to strangers.</li>
            <li>5. Official staff will not proactively ask for your account or password.</li>
            <li>
              6. Important Note: Please do not disclose your recharge payment screenshots and your transaction ID to anyone; they will steal your recharge funds.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
