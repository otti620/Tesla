import React, { useState } from 'react';
import { 
  ChevronLeft, 
  FileClock, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShoppingBag, 
  Wallet, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { UserState } from '../types';
import { DangoteLogo } from './DangoteLogo';
import { isWithinWithdrawalHours } from '../utils/withdrawalHours';
import { checkWithdrawalEligibility } from '../utils/withdrawalEligibility';

interface WithdrawScreenProps {
  user: UserState;
  onBack: () => void;
  onGoToRecords: () => void;
  onGoToAddBank: () => void;
  onGoToProducts?: () => void;
  onGoToRecharge?: () => void;
  onSuccessWithdraw: (amount: number, fee: number) => void;
  taxRate?: number;
  minWithdrawal?: number;
  withdrawalStartHour?: number;
  withdrawalEndHour?: number;
  sundayWithdrawalStartHour?: number;
  sundayWithdrawalEndHour?: number;
  allowAdminBypassHours?: boolean;
}

export const WithdrawScreen: React.FC<WithdrawScreenProps> = ({
  user,
  onBack,
  onGoToRecords,
  onGoToAddBank,
  onGoToProducts,
  onGoToRecharge,
  onSuccessWithdraw,
  taxRate = 0.18,
  minWithdrawal = 1500,
  withdrawalStartHour = 9,
  withdrawalEndHour = 17,
  sundayWithdrawalStartHour = 14,
  sundayWithdrawalEndHour = 17,
  allowAdminBypassHours = false,
}) => {
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const numAmount = parseFloat(withdrawAmount) || 0;
  const taxDeduction = numAmount * taxRate;
  const receivedAmount = Math.max(0, numAmount - taxDeduction);

  const hoursCheck = isWithinWithdrawalHours(
    withdrawalStartHour,
    withdrawalEndHour,
    undefined,
    sundayWithdrawalStartHour,
    sundayEndHourFallback(sundayWithdrawalEndHour)
  );

  function sundayEndHourFallback(val?: number) {
    return val ?? 17;
  }

  // Dynamic eligibility evaluation with admin-credit bypass
  const eligibility = checkWithdrawalEligibility(user);
  const { isCreditedByAdmin, hasPurchasedProduct, hasMadeDeposit, isEligible } = eligibility;

  const rawPurchasedProduct = 
    Boolean(user.purchasedProducts && user.purchasedProducts.length > 0);

  const rawMadeDeposit = 
    Boolean(user.records && user.records.some((r) => r.type === 'recharge' && r.status === 'success')) || 
    user.balance >= 5000;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d.]/g, '');
    setWithdrawAmount(val);
    setError('');
    setSuccessMsg('');
  };

  const handleInitialClick = () => {
    setError('');
    setSuccessMsg('');

    if (!user.bankAccount) {
      setError('Please bind a Nigerian commercial bank account first.');
      return;
    }

    if (!hoursCheck.isAllowed && !allowAdminBypassHours) {
      setError(
        `Withdrawals are only processed during official hours: ${hoursCheck.isSunday ? '2:00 PM – 5:00 PM on Sundays' : '9:00 AM – 5:00 PM (Mon–Sat)'} (WAT). Current time: ${hoursCheck.formattedCurrentTime}.`
      );
      return;
    }

    if (!isEligible && !allowAdminBypassHours) {
      setError(
        'Requirement Incomplete: You must have at least 1 active share tranche and 1 completed deposit to withdraw dividends.'
      );
      return;
    }

    if (isNaN(numAmount) || numAmount < minWithdrawal) {
      setError(`Minimum withdrawal amount is ₦ ${minWithdrawal.toLocaleString()}`);
      return;
    }

    if (numAmount > user.balance) {
      setError(`Insufficient balance. Your liquid balance is ₦ ${user.balance.toLocaleString()}`);
      return;
    }

    executeWithdrawal();
  };

  const executeWithdrawal = () => {
    onSuccessWithdraw(numAmount, taxDeduction);
    setSuccessMsg(`Withdrawal of ₦ ${numAmount.toLocaleString()} submitted successfully! ₦ ${receivedAmount.toLocaleString()} will be settled to ${user.bankAccount?.bankName}.`);
    setWithdrawAmount('');
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 text-slate-900 font-sans">
      {/* Top Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#006837] text-white shadow-md">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1 text-white hover:bg-white/10 rounded-full transition active:scale-95 cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h1 className="text-base font-black tracking-wide text-white">
            Dividend Withdrawal
          </h1>
          <p className="text-[10px] text-amber-300 font-bold tracking-wider uppercase">
            Dangote Direct Bank Settlement
          </p>
        </div>

        <button
          onClick={onGoToRecords}
          className="p-1.5 -mr-1 text-amber-300 hover:bg-white/10 rounded-full transition active:scale-95 cursor-pointer flex items-center gap-1"
          title="Withdrawal Records"
        >
          <FileClock className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

      {/* Top Banner with Balance */}
      <div className="relative h-44 w-full overflow-hidden bg-[#006837] border-b border-emerald-600 shadow-md">
        <img
          src="/images-2.jpeg"
          alt="Dangote Refinery"
          className="w-full h-full object-cover brightness-[0.45]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#006837] via-[#006837]/60 to-transparent" />

        <div className="absolute inset-0 p-5 flex items-center justify-between z-10 text-white">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider mb-1.5 shadow-xs">
              <ShieldCheck className="w-3 h-3 text-slate-950" />
              Available Shareholder Balance
            </div>
            <div className="text-3xl font-black tracking-tight text-white font-mono">
              ₦ {user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-100 mt-1 font-medium flex items-center gap-1.5">
              <span>Account balance</span>
              {isCreditedByAdmin && (
                <span className="bg-amber-400 text-slate-950 px-2 py-0.2 rounded-full text-[10px] font-black flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Admin Authorized
                </span>
              )}
            </div>
          </div>

          <div className="opacity-95 shrink-0 pl-2">
            <DangoteLogo variant="badge" className="w-14 h-14" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Operating Hours Alert */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs shadow-xs ${
          hoursCheck.isAllowed 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
            : 'bg-amber-50 border-amber-300 text-amber-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              hoursCheck.isAllowed ? 'bg-emerald-100 text-[#006837]' : 'bg-amber-100 text-amber-800'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-black flex items-center gap-1.5 text-slate-900">
                <span>{hoursCheck.isSunday ? 'Sunday Hours: 2:00 PM – 5:00 PM' : 'Operating Hours: 9:00 AM – 5:00 PM'}</span>
                {hoursCheck.isSunday && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    Sunday
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                WAT Time: {hoursCheck.formattedCurrentTime} ({hoursCheck.statusText})
              </div>
            </div>
          </div>
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase shrink-0 border ${
            hoursCheck.isAllowed 
              ? 'bg-[#006837] text-white border-emerald-600' 
              : 'bg-amber-400 text-slate-950 border-amber-300'
          }`}>
            {hoursCheck.isAllowed ? 'Disbursing' : 'Closed'}
          </span>
        </div>

        {/* Withdrawal Eligibility Checklist Card */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#006837]" />
              <span>Shareholder Verification Status</span>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
              isEligible
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}>
              {isCreditedByAdmin 
                ? 'Admin Approved' 
                : isEligible 
                  ? 'Ready to Settle' 
                  : 'Requirements Incomplete'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Requirement 1: VIP Share Tranche */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
              hasPurchasedProduct ? 'bg-slate-50 border-emerald-300' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  hasPurchasedProduct ? 'bg-emerald-100 text-[#006837]' : 'bg-slate-200 text-slate-600'
                }`}>
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-black text-slate-900 text-[11px]">Tranche Subscription</div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {rawPurchasedProduct 
                      ? `${user.purchasedProducts?.length || 1} Active Shareholdings` 
                      : isCreditedByAdmin 
                        ? 'Admin Authorized'
                        : 'Requires 1 active tranche'}
                  </div>
                </div>
              </div>

              {hasPurchasedProduct ? (
                <span className="text-[10px] font-black text-[#006837] flex items-center gap-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </span>
              ) : (
                onGoToProducts && (
                  <button
                    type="button"
                    onClick={onGoToProducts}
                    className="text-[10px] font-black bg-[#006837] hover:bg-[#00522B] text-white px-2 py-1 rounded-lg transition flex items-center gap-0.5 cursor-pointer shadow-xs"
                  >
                    <span>Subscribe</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                )
              )}
            </div>

            {/* Requirement 2: Account Deposit */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
              hasMadeDeposit ? 'bg-slate-50 border-emerald-300' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  hasMadeDeposit ? 'bg-emerald-100 text-[#006837]' : 'bg-slate-200 text-slate-600'
                }`}>
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-black text-slate-900 text-[11px]">Depository Funding</div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {rawMadeDeposit 
                      ? 'Deposit Verified' 
                      : isCreditedByAdmin 
                        ? 'Admin Authorized'
                        : 'Requires 1 deposit'}
                  </div>
                </div>
              </div>

              {hasMadeDeposit ? (
                <span className="text-[10px] font-black text-[#006837] flex items-center gap-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </span>
              ) : (
                onGoToRecharge && (
                  <button
                    type="button"
                    onClick={onGoToRecharge}
                    className="text-[10px] font-black bg-[#006837] hover:bg-[#00522B] text-white px-2 py-1 rounded-lg transition flex items-center gap-0.5 cursor-pointer shadow-xs"
                  >
                    <span>Fund</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Bank Account Selector Card */}
        <button
          onClick={onGoToAddBank}
          className="w-full border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 bg-white hover:bg-slate-50 transition active:scale-[0.99] text-left cursor-pointer shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0 font-bold">
            <Building2 className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            {user.bankAccount ? (
              <div>
                <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <span>{user.bankAccount.bankName}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9px] font-black">
                    Active
                  </span>
                </div>
                <div className="text-[11px] text-[#006837] font-mono font-bold mt-0.5">
                  {user.bankAccount.accountNumber} • {user.bankAccount.accountName}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs font-black text-slate-900">Select Destination Bank Account</div>
                <div className="text-[11px] text-slate-500 font-medium">Tap to bind your Nigerian commercial bank account</div>
              </div>
            )}
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {/* Withdrawal Amount Input Section */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Withdrawal Amount (NGN)
            </h3>
            <span className="text-[11px] text-[#006837] font-bold font-mono">
              Min: ₦ {minWithdrawal.toLocaleString()}
            </span>
          </div>

          <div className="relative">
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 shadow-2xs focus-within:border-[#006837] transition-colors">
              <span className="text-base font-black text-[#006837] mr-2 font-mono">₦</span>
              <input
                type="text"
                value={withdrawAmount}
                onChange={handleAmountChange}
                placeholder="Enter withdrawal amount"
                className="w-full text-sm text-slate-900 bg-transparent placeholder:text-slate-400 focus:outline-hidden font-bold font-mono"
              />
            </div>
          </div>

          {/* Subtext: Received amount and Statutory handling fee */}
          <div className="flex items-center justify-between text-xs text-slate-700 font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span>
              Net Settleable: <strong className="text-[#006837] font-mono">₦ {receivedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </span>
            <span className="text-slate-500 text-[11px]">Tax / Stamp: {(taxRate * 100).toFixed(0)}%</span>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Primary CTA Button */}
        <button
          onClick={handleInitialClick}
          className="w-full py-4 rounded-2xl bg-[#006837] hover:bg-[#00522B] text-white text-sm font-black shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-600 uppercase tracking-wider"
        >
          <CreditCard className="w-4 h-4 text-amber-300" />
          <span>Confirm Dividend Withdrawal</span>
        </button>

        {/* Shareholder Settlement Instructions */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5 shadow-2xs">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#006837]" />
            Shareholder Settlement Terms
          </h3>

          <ol className="space-y-1.5 text-[11px] text-slate-600 leading-relaxed font-medium">
            <li>• <strong>Prerequisites</strong>: Shareholder members must maintain an active Dangote Share Tranche and verified funding deposit. Executive admin authorized accounts have prerequisites waived.</li>
            <li>• <strong>Schedule</strong>: Operational window is strictly <strong>9:00 AM – 5:00 PM (Mon–Sat)</strong> and <strong>2:00 PM – 5:00 PM on Sundays (WAT)</strong>.</li>
            <li>• <strong>Bank Dispatch</strong>: All disbursements are routed through the automated Nigerian interbank clearing network to your verified commercial account.</li>
            <li>• <strong>Statutory Levy</strong>: {(taxRate * 100).toFixed(0)}% handling and capital transfer stamp duty is deducted at final settlement.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
