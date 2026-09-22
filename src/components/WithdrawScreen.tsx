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
  ShieldAlert
} from 'lucide-react';
import { UserState } from '../types';
import { TeslaLogo } from './TeslaLogo';
import { isWithinWithdrawalHours } from '../utils/withdrawalHours';

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
  minWithdrawal = 800,
  withdrawalStartHour = 9,
  withdrawalEndHour = 17,
  allowAdminBypassHours = false,
}) => {
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const numAmount = parseFloat(withdrawAmount) || 0;
  const taxDeduction = numAmount * taxRate;
  const receivedAmount = Math.max(0, numAmount - taxDeduction);

  const hoursCheck = isWithinWithdrawalHours(withdrawalStartHour, withdrawalEndHour);

  // Prerequisites checks: User must purchase a product and make a deposit before withdrawal
  const hasPurchasedProduct = 
    (user.purchasedProducts && user.purchasedProducts.length > 0) ||
    user.records.some((r) => r.type === 'purchase');

  const hasMadeDeposit = 
    user.records.some((r) => r.type === 'recharge');

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

    // Prerequisite 1: Must purchase a VIP product
    if (!hasPurchasedProduct) {
      setError('Withdrawal Requirement: You must purchase and activate at least one VIP Power Generator product before withdrawing funds.');
      return;
    }

    // Prerequisite 2: Must make a deposit/recharge
    if (!hasMadeDeposit) {
      setError('Withdrawal Requirement: You must make an account deposit/recharge before requesting withdrawal.');
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

    executeWithdrawal();
  };

  const executeWithdrawal = () => {
    onSuccessWithdraw(numAmount, taxDeduction);
    setSuccessMsg(`Withdrawal of ₦ ${numAmount.toLocaleString()} submitted successfully! ₦ ${receivedAmount.toLocaleString()} will be credited to ${user.bankAccount?.bankName}.`);
    setWithdrawAmount('');
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

        {/* Withdrawal Eligibility Requirements Card */}
        <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              <span>Withdrawal Requirements</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
              hasPurchasedProduct && hasMadeDeposit
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {hasPurchasedProduct && hasMadeDeposit ? 'Eligible' : 'Action Required'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Requirement 1: VIP Product */}
            <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
              hasPurchasedProduct ? 'bg-white border-emerald-200' : 'bg-amber-50/60 border-amber-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                  hasPurchasedProduct ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-800 text-[11px]">VIP Product Purchase</div>
                  <div className="text-[10px] text-neutral-500">
                    {hasPurchasedProduct 
                      ? `${user.purchasedProducts.length} Active Unit(s)` 
                      : 'Requires 1 active product'}
                  </div>
                </div>
              </div>

              {hasPurchasedProduct ? (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </span>
              ) : (
                onGoToProducts && (
                  <button
                    type="button"
                    onClick={onGoToProducts}
                    className="text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded-md transition flex items-center gap-0.5 cursor-pointer active:scale-95"
                  >
                    <span>Buy VIP</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                )
              )}
            </div>

            {/* Requirement 2: Account Deposit */}
            <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
              hasMadeDeposit ? 'bg-white border-emerald-200' : 'bg-amber-50/60 border-amber-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                  hasMadeDeposit ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-800 text-[11px]">Account Deposit</div>
                  <div className="text-[10px] text-neutral-500">
                    {hasMadeDeposit ? 'Deposit Verified' : 'Requires at least 1 deposit'}
                  </div>
                </div>
              </div>

              {hasMadeDeposit ? (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </span>
              ) : (
                onGoToRecharge && (
                  <button
                    type="button"
                    onClick={onGoToRecharge}
                    className="text-[10px] font-bold bg-[#00c269] hover:bg-[#00ad5e] text-white px-2 py-1 rounded-md transition flex items-center gap-0.5 cursor-pointer active:scale-95"
                  >
                    <span>Deposit</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                )
              )}
            </div>
          </div>
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
            <li>1. <strong>Prerequisites</strong>: You must purchase and activate at least one VIP Power Generator product and make a verified deposit before submitting withdrawal requests.</li>
            <li>2. Minimum withdrawal amount: ₦{minWithdrawal.toLocaleString()}; maximum withdrawal amount: no limit.</li>
            <li>3. Withdrawal operating hours are strictly <strong>9:00 AM – 5:00 PM daily</strong>. Requests submitted outside this timeframe will be queued for the next operational window.</li>
            <li>4. Every withdrawal request is reviewed and audited individually by the Tesla administrative risk and settlement system before bank dispatch.</li>
            <li>5. {(taxRate * 100).toFixed(0)}% of the withdrawal amount will be deducted for statutory handling and banking fees.</li>
            <li>6. Multiple withdrawals per day are supported during operational hours once eligibility prerequisites are fulfilled.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
