import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  Building2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  User,
  CreditCard,
} from 'lucide-react';
import { CheckoutOrder } from '../types';
import { DangoteLogo } from './DangoteLogo';
import { NIGERIAN_BANKS } from '../data/initialData';

interface CheckoutScreenProps {
  order: CheckoutOrder;
  userEmail?: string;
  onBack: () => void;
  onSubmitPayment?: (
    senderBank: string,
    payeeName: string,
    proofNote?: string
  ) => Promise<boolean | void> | boolean | void;
  onConfirmPayment?: (
    order: CheckoutOrder,
    senderBank: string,
    payeeName: string
  ) => Promise<boolean | void> | boolean | void;
  onGoToRecords?: () => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  order,
  onBack,
  onSubmitPayment,
  onConfirmPayment,
  onGoToRecords,
}) => {
  const [currentStep, setCurrentStep] = useState<'instructions' | 'proof_form' | 'processing_status'>('instructions');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedAccountName, setCopiedAccountName] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

  // Form state
  const [senderBank, setSenderBank] = useState<string>('Access Bank');
  const [customBank, setCustomBank] = useState<string>('');
  const [payeeName, setPayeeName] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(order.accountNo || '1581957640');
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleCopyAccountName = () => {
    navigator.clipboard.writeText(order.accountName || 'LEVIATHAN HYPERMARKET');
    setCopiedAccountName(true);
    setTimeout(() => setCopiedAccountName(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(order.amount.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const finalSenderBank = senderBank === 'Other' ? customBank.trim() || 'Commercial Bank' : senderBank;
  const displayBankName = order.bankName || 'CARBON';
  const displayAccountName = order.accountName || 'LEVIATHAN HYPERMARKET';
  const displayAccountNo = order.accountNo || '1581957640';

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (senderBank === 'Other' && !customBank.trim()) {
      setFormError('Please type your bank name.');
      return;
    }
    if (!payeeName.trim() || payeeName.trim().length < 3) {
      setFormError('Please enter the full account name used to make the payment.');
      return;
    }

    setIsSubmitting(true);
    try {
      let isSuccess = true;
      if (onConfirmPayment) {
        const res = await onConfirmPayment(order, finalSenderBank, payeeName.trim());
        if (res === false) isSuccess = false;
      } else if (onSubmitPayment) {
        const res = await onSubmitPayment(finalSenderBank, payeeName.trim());
        if (res === false) isSuccess = false;
      }
      if (isSuccess) {
        setCurrentStep('processing_status');
      } else {
        setFormError('Failed to record payment. Please try again.');
      }
    } catch {
      setFormError('An error occurred submitting payment details. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 text-slate-900 font-sans animate-page-in">
      {/* Top Header - Executive Blue Theme */}
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
            Escrow Depository Checkout
          </h1>
          <p className="text-[10px] text-sky-300 font-bold tracking-wider uppercase">
            Order Ref: {order.orderNo}
          </p>
        </div>

        <div className="w-8" />
      </div>

      {/* Progress Step Indicator */}
      <div className="px-4 pt-3 max-w-md mx-auto">
        <div className="flex items-center justify-between bg-slate-200 p-1.5 rounded-2xl border border-slate-300 text-[11px] font-bold">
          <button
            onClick={() => setCurrentStep('instructions')}
            className={`flex-1 py-1.5 rounded-xl transition-butter text-center cursor-pointer ${
              currentStep === 'instructions'
                ? 'bg-blue-600 text-white font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Bank Details
          </button>
          <button
            onClick={() => setCurrentStep('proof_form')}
            className={`flex-1 py-1.5 rounded-xl transition-butter text-center cursor-pointer ${
              currentStep === 'proof_form'
                ? 'bg-blue-600 text-white font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Verify Payment
          </button>
          <div
            className={`flex-1 py-1.5 rounded-xl text-center ${
              currentStep === 'processing_status'
                ? 'bg-blue-600 text-white font-black shadow-xs'
                : 'text-slate-400'
            }`}
          >
            3. Processing
          </div>
        </div>
      </div>

      {/* STEP 1: INSTRUCTIONS SCREEN */}
      {currentStep === 'instructions' && (
        <div className="p-4 space-y-4 max-w-md mx-auto animate-page-in">
          {/* Timer Notice Banner */}
          <div className="bg-sky-50 border border-sky-300 rounded-2xl p-3.5 flex items-center justify-between text-xs text-blue-900 font-bold">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 text-blue-600 animate-pulse" />
              <span>Transfer Session Active</span>
            </div>
            <div className="font-mono font-black text-sm text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-sky-300 shadow-2xs">
              {formatTimer(timeLeft)}
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center space-y-1 relative overflow-hidden">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">
              Exact Amount To Transfer
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-black text-blue-700 font-mono">
                ₦ {order.amount.toLocaleString()}
              </span>
              <button
                type="button"
                onClick={handleCopyAmount}
                className="p-1.5 rounded-lg bg-sky-100 text-blue-900 hover:bg-sky-200 transition cursor-pointer"
                title="Copy Amount"
              >
                {copiedAmount ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-700" />}
              </button>
            </div>
            <p className="text-[10px] text-blue-700 font-bold pt-1">
              • Transfer exact amount to avoid automated settlement delays
            </p>
          </div>

          {/* Bank Escrow Details Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 via-blue-600 to-indigo-800" />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-700" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Official Escrow Depository
                </h3>
              </div>
              <DangoteLogo variant="icon" color="#1d4ed8" className="w-6 h-6" />
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3.5">
              {/* Destination Bank Name - Large & Clear */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-blue-700 uppercase font-black tracking-wider">Destination Bank</div>
                    <div className="text-base font-black text-slate-900 tracking-wide font-mono">
                      {displayBankName}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase border border-blue-300">
                  Verified
                </span>
              </div>

              {/* Account Number */}
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Escrow Account Number
                </div>
                <div className="flex items-center justify-between bg-sky-50/80 border border-blue-300 rounded-2xl p-3.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-blue-700 tracking-widest">
                    {displayAccountNo}
                  </span>
                  <button
                    onClick={handleCopyAccount}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-2xs transition-butter spring-press flex items-center gap-1.5 cursor-pointer border border-blue-500 shrink-0"
                  >
                    {copiedAccount ? (
                      <>
                        <Check className="w-4 h-4 text-sky-200" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Account Name - Leviathan Hypermarket Prominent */}
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Beneficiary Account Name
                </div>
                <div className="flex items-center justify-between bg-white border border-slate-300 rounded-2xl p-3.5 shadow-2xs">
                  <span className="text-sm sm:text-base font-black text-slate-900 uppercase font-mono tracking-tight">
                    {displayAccountName}
                  </span>
                  <button
                    onClick={handleCopyAccountName}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-butter flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedAccountName ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                        <span>Copy Name</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Instruction List */}
            <div className="space-y-2 text-xs text-slate-600 pt-1">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 border border-blue-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span>Open your bank app or USSD portal and transfer <strong>₦{order.amount.toLocaleString()}</strong> to <strong>{displayBankName}</strong> account: <strong>{displayAccountNo}</strong> ({displayAccountName}).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 border border-blue-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span>After completing the transfer, click <strong>"I Have Completed Transfer"</strong> below to enter your sender account details.</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setCurrentStep('proof_form')}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow-md spring-press transition-butter flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider border border-blue-500"
            >
              <span>I Have Completed Transfer</span>
              <ArrowRight className="w-4 h-4 text-sky-200" />
            </button>
          </div>

          {/* Security Disclaimer */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2.5 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0" />
            <span>Encrypted depository protocol. Balance updates instantly upon treasury credit confirmation.</span>
          </div>
        </div>
      )}

      {/* STEP 2: PROOF FORM SCREEN */}
      {currentStep === 'proof_form' && (
        <div className="p-4 space-y-4 max-w-md mx-auto animate-page-in">
          <form onSubmit={handleFormSubmit} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 via-blue-600 to-indigo-800" />

            <div className="pt-1">
              <h2 className="text-base font-black text-slate-900">Payment Verification Form</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter the bank and account name you sent the ₦{order.amount.toLocaleString()} from so our treasury panel matches your deposit to <strong>{displayAccountName}</strong>.
              </p>
            </div>

            <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {/* Bank Name Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  <span className="text-rose-600 font-black mr-1">*</span>
                  Sender Bank Name
                </label>
                <select
                  value={senderBank}
                  onChange={(e) => setSenderBank(e.target.value)}
                  className="w-full px-3.5 py-3.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition-colors cursor-pointer"
                >
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b} value={b} className="text-slate-900">
                      {b}
                    </option>
                  ))}
                  <option value="Other" className="text-blue-700 font-bold">
                    Other Commercial / Microfinance Bank...
                  </option>
                </select>

                {senderBank === 'Other' && (
                  <input
                    type="text"
                    placeholder="Type your bank name e.g. Moniepoint, VFD, Sparkle"
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    className="w-full mt-2 px-3.5 py-3 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                )}
              </div>

              {/* Payee / Sender Account Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  <span className="text-rose-600 font-black mr-1">*</span>
                  Sender Account Name (Name on Account)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. John Chukwuemeka Okafor"
                    value={payeeName}
                    onChange={(e) => {
                      setPayeeName(e.target.value);
                      if (formError) setFormError('');
                    }}
                    className="w-full pl-9 pr-3.5 py-3.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 placeholder:text-slate-400 uppercase transition-colors"
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Must match the name that appears on your bank debit alert or transfer receipt.
                </p>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black shadow-md spring-press transition-butter flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 uppercase tracking-wider border border-blue-500"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-sky-200" />
                    <span>Transmitting Payment Details...</span>
                  </>
                ) : (
                  <span>Submit Payment for Verification</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep('instructions')}
                className="w-full py-2.5 rounded-xl text-slate-500 text-xs font-bold hover:text-slate-800 transition text-center cursor-pointer"
              >
                Back to Bank Account Details
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: PAYMENT PROCESSING SCREEN */}
      {currentStep === 'processing_status' && (
        <div className="p-4 space-y-4 max-w-md mx-auto animate-page-in">
          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200 text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 via-blue-600 to-indigo-800" />

            <div className="relative w-16 h-16 mx-auto flex items-center justify-center pt-2">
              <div className="relative w-14 h-14 rounded-full bg-blue-50 border-2 border-blue-400 flex items-center justify-center text-blue-700 shadow-2xs">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-300 text-blue-800 text-xs font-bold mb-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                Deposit Processing
              </div>
              <h2 className="text-xl font-black text-slate-900">Payment Submitted</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Your deposit details have been recorded and sent to the administrative panel for approval.
              </p>
            </div>

            {/* Summary Ticket */}
            <div className="bg-slate-50 rounded-2xl p-4 text-xs text-left space-y-2.5 border border-slate-200 font-medium">
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">Order Reference</span>
                <span className="font-mono font-black text-slate-900">{order.orderNo}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">Amount</span>
                <span className="font-black text-blue-700 text-sm font-mono">₦ {order.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">Destination Bank</span>
                <span className="font-bold text-slate-900 font-mono">{displayBankName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">Beneficiary Name</span>
                <span className="font-bold text-slate-900 font-mono uppercase">{displayAccountName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">Sender Bank</span>
                <span className="font-bold text-slate-900">{finalSenderBank}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">Sender Account Name</span>
                <span className="font-bold text-slate-900 uppercase">{payeeName}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Clearance Queue</span>
                <span className="text-blue-700 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Awaiting Treasury Audit
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {onGoToRecords && (
                <button
                  onClick={onGoToRecords}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition shadow-md spring-press cursor-pointer uppercase tracking-wider border border-blue-500"
                >
                  View in Transaction Records
                </button>
              )}
              <button
                onClick={onBack}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

