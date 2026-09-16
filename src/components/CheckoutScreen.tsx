import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck, 
  Building2, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  FileClock,
  Sparkles
} from 'lucide-react';
import { CheckoutOrder } from '../types';

interface CheckoutScreenProps {
  order: CheckoutOrder;
  onBack: () => void;
  onGoToRecords?: () => void;
  onConfirmPayment?: (order: CheckoutOrder, senderBank: string, payeeName: string) => void;
  onPaymentConfirmed?: (amount: number, channel: string) => void;
}

const POPULAR_NIGERIAN_BANKS = [
  'OPay (PayCom)',
  'PalmPay',
  'Kuda Microfinance Bank',
  'Moniepoint MFB',
  'Access Bank',
  'Guaranty Trust Bank (GTBank)',
  'Zenith Bank',
  'First Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Stanbic IBTC Bank',
  'Fidelity Bank',
  'First City Monument Bank (FCMB)',
  'Union Bank of Nigeria',
  'Sterling Bank',
  'Wema Bank / ALAT',
  'Polaris Bank',
  'Jaiz Bank',
  'Other Bank',
];

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  order,
  onBack,
  onGoToRecords,
  onConfirmPayment,
  onPaymentConfirmed,
}) => {
  const [currentStep, setCurrentStep] = useState<'instructions' | 'details_form' | 'processing_status'>('instructions');
  const [secondsRemaining, setSecondsRemaining] = useState(900); // 15 mins
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  
  // Payment confirmation form fields
  const [selectedBank, setSelectedBank] = useState('OPay (PayCom)');
  const [customBankName, setCustomBankName] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const copyText = (text: string, isAmount: boolean) => {
    navigator.clipboard.writeText(text);
    if (isAmount) {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else {
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    }
  };

  const finalSenderBank = selectedBank === 'Other Bank' ? customBankName.trim() : selectedBank;

  const handleSubmitPaymentDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBank === 'Other Bank' && !customBankName.trim()) {
      setFormError('Please enter the name of the bank you transferred from.');
      return;
    }
    if (!payeeName.trim() || payeeName.trim().length < 3) {
      setFormError('Please enter the full account name used to make the payment.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const bankResult = finalSenderBank || 'Bank Transfer';
      const nameResult = payeeName.trim();

      if (onConfirmPayment) {
        onConfirmPayment(order, bankResult, nameResult);
      } else if (onPaymentConfirmed) {
        onPaymentConfirmed(order.amount, order.channel);
      }

      setCurrentStep('processing_status');
    }, 1200);
  };

  return (
    <div className="min-h-screen pb-16 bg-neutral-100 text-neutral-900">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100 shadow-2xs">
        <button
          onClick={() => {
            if (currentStep === 'details_form') {
              setCurrentStep('instructions');
            } else {
              onBack();
            }
          }}
          className="p-1 -ml-1 text-neutral-800 hover:bg-neutral-100 rounded-full transition active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <h1 className="text-base font-bold text-neutral-900">
          {currentStep === 'instructions' && 'Tesla Pay Gateway'}
          {currentStep === 'details_form' && 'Confirm Payment Details'}
          {currentStep === 'processing_status' && 'Deposit Processing'}
        </h1>

        <div className="w-7">
          {currentStep === 'processing_status' && onGoToRecords && (
            <button
              onClick={onGoToRecords}
              className="p-1 text-neutral-700 hover:text-emerald-600 transition cursor-pointer"
              title="View Records"
            >
              <FileClock className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Expiry Banner (Instructions / Details Form) */}
      {currentStep !== 'processing_status' && (
        <div className="bg-neutral-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-neutral-300">Session Closes In:</span>
          </div>
          <span className="font-mono text-sm font-extrabold text-emerald-400 bg-neutral-800 px-2.5 py-0.5 rounded-md">
            {formatTimer(secondsRemaining)}
          </span>
        </div>
      )}

      {/* STEP 1: INSTRUCTIONS & BANK DETAILS */}
      {currentStep === 'instructions' && (
        <div className="p-4 space-y-4 max-w-md mx-auto animate-in fade-in duration-200">
          {/* Order Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-neutral-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 text-xs text-neutral-500">
              <span>
                Order Ref: <span className="font-mono font-bold text-neutral-800">{order.orderNo}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                {order.channel}
              </span>
            </div>

            {/* Amount Box */}
            <div className="bg-emerald-50/70 border border-emerald-200/60 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 font-medium block">Exact Transfer Amount:</span>
                <span className="text-2xl font-black text-emerald-700 tracking-tight">
                  ₦ {order.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                onClick={() => copyText(order.amount.toString(), true)}
                className="p-2 text-xs font-bold text-emerald-800 bg-emerald-200/70 hover:bg-emerald-200 rounded-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                {copiedAmount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAmount ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Platform Receiving Bank Details */}
            <div className="space-y-3 text-xs pt-1">
              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-500 font-medium">Destination Bank:</span>
                <span className="font-bold text-neutral-900 text-right">{order.bankName}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                <span className="text-neutral-500 font-medium">Account Name:</span>
                <span className="font-bold text-neutral-900 text-right">{order.accountName}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-neutral-500 font-medium">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-neutral-900 tracking-wider">
                    {order.accountNo}
                  </span>
                  <button
                    onClick={() => copyText(order.accountNo, false)}
                    className="p-1.5 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition active:scale-95 cursor-pointer"
                    title="Copy Account Number"
                  >
                    {copiedAcc ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Automatic Reconciliation Notice */}
          <div className="p-4 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direct Bank Settlement Protocol</span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              1. Transfer the exact amount of <strong className="text-neutral-900">₦ {order.amount.toLocaleString()}</strong> using your banking app or USSD to the receiving account above.
            </p>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              2. After completing the bank transfer, tap <strong className="text-emerald-700">"I Have Made This Payment"</strong> below to submit your payment details for automatic clearance.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setCurrentStep('details_form')}
              className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md active:scale-98 transition text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>I Have Made This Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onBack}
              className="w-full py-2.5 rounded-full text-neutral-600 text-xs font-semibold hover:bg-neutral-200 transition text-center cursor-pointer"
            >
              Cancel Order
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SLEEK PAYMENT DETAILS FORM (No receipt uploads required!) */}
      {currentStep === 'details_form' && (
        <div className="p-4 space-y-4 max-w-md mx-auto animate-in fade-in slide-in-from-right-4 duration-200">
          <form onSubmit={handleSubmitPaymentDetails} className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-neutral-200/80 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-900">Payment Verification</h2>
                  <p className="text-[11px] text-neutral-500">Enter the sender details used to make the transfer</p>
                </div>
              </div>

              {/* Amount reminder chip */}
              <div className="bg-neutral-50 p-3 rounded-xl flex items-center justify-between text-xs">
                <span className="text-neutral-500">Transfer Sum:</span>
                <span className="font-extrabold text-neutral-900">₦ {order.amount.toLocaleString()}</span>
              </div>

              {/* Sender Bank Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-800">
                  Bank You Paid From (Sender Bank)
                </label>
                <div className="relative">
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition appearance-none cursor-pointer"
                  >
                    {POPULAR_NIGERIAN_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {selectedBank === 'Other Bank' && (
                  <input
                    type="text"
                    placeholder="Type name of your bank"
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    className="w-full mt-2 px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}
              </div>

              {/* Payee / Sender Account Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-800">
                  Sender Account Name (Name on Account)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
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
                    className="w-full pl-9 pr-3.5 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-neutral-400"
                  />
                </div>
                <p className="text-[10px] text-neutral-400">
                  Must match the name that appears on your bank debit alert/receipt.
                </p>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}
            </div>

            {/* Notice */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/50 rounded-xl text-[11px] text-emerald-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>
                Once submitted, your payment is logged in the administrative clearance ledger and marked as <strong>Processing</strong>. Balance updates automatically as soon as treasury approves the alert.
              </span>
            </div>

            {/* Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md active:scale-98 transition text-center flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting Payment Details...</span>
                  </>
                ) : (
                  <span>Submit Payment for Verification</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep('instructions')}
                className="w-full py-2.5 rounded-full text-neutral-600 text-xs font-semibold hover:bg-neutral-200 transition text-center cursor-pointer"
              >
                Back to Bank Account Details
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: PAYMENT PROCESSING / SUBMITTED SCREEN */}
      {currentStep === 'processing_status' && (
        <div className="p-4 space-y-4 max-w-md mx-auto animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-200 text-center space-y-4">
            {/* Animated Status Pulse */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-400 flex items-center justify-center text-amber-600 shadow-inner">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Deposit Processing
              </div>
              <h2 className="text-xl font-black text-neutral-900">Payment Submitted</h2>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                Your deposit details have been recorded and sent to the administrative panel for approval.
              </p>
            </div>

            {/* Summary Ticket */}
            <div className="bg-neutral-50 rounded-2xl p-4 text-xs text-left space-y-2.5 border border-neutral-200/70">
              <div className="flex justify-between items-center py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">Order Reference</span>
                <span className="font-mono font-bold text-neutral-900">{order.orderNo}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">Amount</span>
                <span className="font-black text-emerald-700 text-sm">₦ {order.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">Sender Bank</span>
                <span className="font-bold text-neutral-900">{finalSenderBank}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">Payee Account Name</span>
                <span className="font-bold text-neutral-900">{payeeName}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-500">Clearance Queue</span>
                <span className="text-amber-700 font-bold">Awaiting Treasury Match</span>
              </div>
            </div>

            <div className="p-3 bg-neutral-100/80 rounded-xl text-[11px] text-neutral-600 leading-relaxed text-left">
              💡 <strong>What happens next?</strong> Once the treasury auditor confirms the credit alert corresponding to your payee name on the admin panel, your wallet balance will be credited automatically.
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {onGoToRecords && (
                <button
                  onClick={onGoToRecords}
                  className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm active:scale-98 cursor-pointer"
                >
                  View in Transaction Records
                </button>
              )}

              <button
                onClick={onBack}
                className="w-full py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition cursor-pointer"
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
