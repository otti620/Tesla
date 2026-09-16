import React, { useState } from 'react';
import { ChevronLeft, FileClock, CreditCard, AlertCircle, CheckCircle2, Lock, Clock } from 'lucide-react';
import { UserState } from '../types';
import { TeslaLogo } from './TeslaLogo';
import { isWithinWithdrawalHours } from '../utils/withdrawalHours';

interface WithdrawScreenProps {
  user: UserState;
  onBack: () => void;
  onGoToRecords: () => void;
  onGoToAddBank: () => void;
  onSuccessWithdraw: (amount: number, fee: number) => void;
  taxRate?: number;
  minWithdrawal?: number;
  withdrawalStartHour?: number;
  withdrawalEndHour?: number;
  allowAdminBypassHours?: boolean;
}

export const WithdrawScreen: React.FC<WithdrawScreenProps> = ({
  user,
  onBack,
  onGoToRecords,
  onGoToAddBank,
  onSuccessWithdraw,
  taxRate = 0.18,
  minWithdrawal = 2300,
  withdrawalStartHour = 9,
  withdrawalEndHour = 17,
  allowAdminBypassHours = false,
}) => {
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');

  const numAmount = parseFloat(withdrawAmount) || 0;
  const taxDeduction = numAmount * taxRate;
  const receivedAmount = Math.max(0, numAmount - taxDeduction);

  const hoursCheck = isWithinWithdrawalHours(withdrawalStartHour, withdrawalEndHour);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setWithdrawAmount(val);
    setError('');
    setSuccessMsg('');
  };

  const handleInitialClick = () => {
    setError('');
    setSuccessMsg('');

    // Check operating hours: 9:00 AM to 5:00 PM
    if (!hoursCheck.isAllowed && !allowAdminBypassHours) {
      setError(
        `Withdrawals are only processed from 9:00 AM to 5:00 PM daily. Current time is ${hoursCheck.formattedCurrentTime}. Please request within operating hours.`
      );
      return;
    }

    if (!user.bankAccount) {
      setError('Please add a bank account first before requesting withdrawal');
      return;
    }

    if (numAmount < minWithdrawal) {
      setError(`Minimum withdrawal amount is ₦ ${minWithdrawal.toLocaleString()}`);
      return;
    }

    if (numAmount > user.balance) {
      setError(`Insufficient balance! Your current balance is ₦ ${user.balance.toLocaleString()}`);
      return;
    }

    if (user.fundPin) {
      setShowPinModal(true);
    } else {
      executeWithdrawal();
    }
  };

  const executeWithdrawal = () => {
    onSuccessWithdraw(numAmount, taxDeduction);
    setSuccessMsg(`Withdrawal of ₦ ${numAmount.toLocaleString()} submitted successfully! ₦ ${receivedAmount.toLocaleString()} will be credited to ${user.bankAccount?.bankName}.`);
    setWithdrawAmount('');
    setShowPinModal(false);
    setEnteredPin('');
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin !== user.fundPin) {
      setError('Incorrect withdrawal Fund PIN. Please try again.');
      setShowPinModal(false);
      return;
    }
    executeWithdrawal();
  };

  return (
    <div className="min-h-screen pb-16 bg-white text-neutral-900">
      {/* Header (Screenshot 8) */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-neutral-800 hover:bg-neutral-100 rounded-full transition active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <h1 className="text-base font-bold text-neutral-900">Withdrawal</h1>

        <button
          onClick={onGoToRecords}
          className="p-1 -mr-1 text-orange-500 hover:bg-orange-50 rounded-full transition active:scale-95 cursor-pointer"
        >
          <FileClock className="w-6 h-6 stroke-[1.8]" />
        </button>
      </div>

      {/* Top Banner with Balance and Tesla Logo (Screenshot 8) */}
      <div className="relative h-40 w-full overflow-hidden bg-neutral-900 text-white">
        <img
          src="https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80"
          alt="Tesla Fleet"
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
        {/* Operating Hours Alert / Status */}
        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
          hoursCheck.isAllowed 
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 shrink-0 ${hoursCheck.isAllowed ? 'text-[#00c269]' : 'text-amber-600'}`} />
            <div>
              <div className="font-bold">
                Withdrawal Hours: 9:00 AM – 5:00 PM Daily
              </div>
              <div className="text-[11px] opacity-85">
                Current Time: {hoursCheck.formattedCurrentTime} ({hoursCheck.isAllowed ? 'Operational' : 'Outside Window'})
              </div>
            </div>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
            hoursCheck.isAllowed ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
          }`}>
            {hoursCheck.isAllowed ? 'Open' : 'Closed'}
          </span>
        </div>

        {/* Bank Account Selector (Screenshot 8) */}
        <button
          onClick={onGoToAddBank}
          className="w-full border border-neutral-200 rounded-lg p-3.5 flex items-center gap-3 bg-neutral-50/50 hover:bg-neutral-50 transition active:scale-[0.99] text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-md bg-emerald-50 text-[#00c269] flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            {user.bankAccount ? (
              <div>
                <div className="text-xs font-bold text-neutral-900">
                  {user.bankAccount.bankName}
                </div>
                <div className="text-[11px] text-neutral-600 font-mono">
                  {user.bankAccount.accountNumber} • {user.bankAccount.accountName}
                </div>
              </div>
            ) : (
              <span className="text-xs text-neutral-600 font-medium">
                Please select bank account to withdraw
              </span>
            )}
          </div>
        </button>

        {/* Withdrawal Amount Section */}
        <div>
          <h3 className="text-sm font-bold text-neutral-900 mb-2">Withdrawal amount</h3>

          <div className="flex items-center border border-neutral-200 rounded-lg px-3 py-2.5 bg-neutral-50/50 shadow-2xs">
            <span className="text-sm font-bold text-neutral-700 mr-2">₦</span>
            <input
              type="text"
              value={withdrawAmount}
              onChange={handleAmountChange}
              placeholder="Please enter the withdrawal amount"
              className="w-full text-sm text-neutral-900 bg-transparent placeholder:text-neutral-400 focus:outline-hidden font-medium"
            />
          </div>

          {/* Subtext: Received amount and Tax % (Screenshot 8) */}
          <div className="flex items-center justify-between text-xs text-neutral-700 mt-2 px-1 font-medium">
            <span>
              Received amount: ₦{' '}
              {receivedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="font-semibold text-neutral-500">Tax: {(taxRate * 100).toFixed(0)}%</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Withdraw Button */}
        <button
          onClick={handleInitialClick}
          className="w-full py-3 rounded-full bg-[#00c269] hover:bg-[#00ad5e] text-white text-sm font-bold shadow-md active:scale-98 transition text-center cursor-pointer"
        >
          Withdraw money now
        </button>

        {/* Instructions (Screenshot 8) */}
        <div className="pt-2 border-t border-neutral-100">
          <h3 className="text-sm font-bold text-neutral-900 mb-2.5">
            Withdrawal instructions
          </h3>

          <ol className="space-y-2 text-xs text-neutral-600 leading-relaxed font-normal">
            <li>1. Minimum withdrawal amount: ₦{minWithdrawal.toLocaleString()}; maximum withdrawal amount: no limit.</li>
            <li>2. Withdrawal operating hours are strictly <strong>9:00 AM – 5:00 PM daily</strong>. Requests submitted outside this timeframe will be queued for the next operational window.</li>
            <li>3. Every withdrawal request is reviewed and audited individually by the Tesla administrative risk and settlement system before bank dispatch.</li>
            <li>4. {(taxRate * 100).toFixed(0)}% of the withdrawal amount will be deducted for statutory handling and banking fees.</li>
            <li>5. Multiple withdrawals per day are supported during operational hours.</li>
          </ol>
        </div>
      </div>

      {/* Fund PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmPin}
            className="bg-white w-full max-w-xs rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2 border-b pb-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-neutral-900">Enter Fund PIN</h3>
            </div>

            <p className="text-xs text-neutral-500">
              Please enter your 6-digit withdrawal fund PIN to authenticate this transaction.
            </p>

            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full bg-neutral-100 border border-neutral-300 rounded-lg p-3 text-center text-lg tracking-widest font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              autoFocus
              required
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false);
                  setEnteredPin('');
                }}
                className="flex-1 py-2 rounded-lg border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-[#00c269] text-white text-xs font-bold shadow-xs active:scale-95"
              >
                Confirm
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
