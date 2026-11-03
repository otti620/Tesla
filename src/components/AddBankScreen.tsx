import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  Send, 
  Copy, 
  Check, 
  Lock,
  ExternalLink
} from 'lucide-react';
import { NIGERIAN_BANKS } from '../data/initialData';
import { BankAccount } from '../types';
import { TeslaLogo } from './TeslaLogo';

interface AddBankScreenProps {
  currentBank: BankAccount | null;
  onBack: () => void;
  onSaveBank: (bank: BankAccount) => void;
  onOpenTelegram?: (channelName: string, customUrl?: string) => void;
  managerTelegramUrl?: string;
}

export const AddBankScreen: React.FC<AddBankScreenProps> = ({
  currentBank,
  onBack,
  onSaveBank,
  onOpenTelegram,
  managerTelegramUrl = 'https://t.me/sallyservice4',
}) => {
  const [bankName, setBankName] = useState(currentBank?.bankName || '');
  const [name, setName] = useState(currentBank?.accountName || '');
  const [accountNumber, setAccountNumber] = useState(currentBank?.accountNumber || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copiedManager, setCopiedManager] = useState(false);

  useEffect(() => {
    if (currentBank) {
      if (currentBank.bankName) setBankName(currentBank.bankName);
      if (currentBank.accountName) setName(currentBank.accountName);
      if (currentBank.accountNumber) setAccountNumber(currentBank.accountNumber);
    }
  }, [currentBank]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!bankName) {
      setError('Please select your registered Nigerian commercial bank');
      return;
    }
    if (!name.trim()) {
      setError('Please fill in your legal bank account name');
      return;
    }
    if (!accountNumber.trim() || accountNumber.trim().length !== 10) {
      setError('Please enter a valid 10-digit Nigerian NUBAN account number');
      return;
    }

    onSaveBank({
      bankName,
      accountName: name.trim().toUpperCase(),
      accountNumber: accountNumber.trim(),
    });

    setSuccess(true);
    setTimeout(() => {
      onBack();
    }, 1400);
  };

  const handleOpenManager = () => {
    if (onOpenTelegram) {
      onOpenTelegram('Customer Service Manager (Sally)', managerTelegramUrl);
    } else {
      window.open(managerTelegramUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyManager = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('@sallyservice4');
    setCopiedManager(true);
    setTimeout(() => setCopiedManager(false), 2000);
  };

  return (
    <div className="min-h-screen pb-20 bg-neutral-950 text-white font-sans">
      {/* Top Header - Ola Cabs Jet Black */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-[#a3e635]/20 shadow-lg backdrop-blur-md">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1 text-white hover:bg-white/10 rounded-full transition active:scale-95 cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h1 className="text-base font-black tracking-wide text-white">
            Payout Methods
          </h1>
          <p className="text-[10px] text-[#a3e635] font-bold tracking-wider uppercase">
            Ola Cabs Bank Settlement
          </p>
        </div>

        <button
          onClick={handleOpenManager}
          className="p-1.5 -mr-1 text-[#a3e635] hover:bg-white/10 rounded-full transition active:scale-95 cursor-pointer flex items-center gap-1"
          title="Contact Manager Sally on Telegram"
        >
          <Send className="w-5 h-5 -rotate-12" />
        </button>
      </div>

      <div className="p-4 space-y-5 max-w-md mx-auto">
        {/* Ola Cabs Member Payout Settlement Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-[#1a2e05] border border-[#a3e635]/30 p-5 shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#a3e635]/20 via-lime-500/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-[#a3e635] via-[#84cc16] to-[#65a30d]" />

          <div className="flex items-start justify-between relative z-10 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-black border border-[#a3e635]/40 flex items-center justify-center p-1.5 shrink-0 shadow-md">
                <TeslaLogo variant="icon" color="#ffffff" className="w-full h-full" />
              </div>
              <div>
                <span className="text-xs font-black text-white tracking-wider uppercase block">
                  Ola Cabs Partner
                </span>
                <span className="text-[10px] text-[#a3e635] font-semibold tracking-wide">
                  OlaCabs Direct Settlement Card
                </span>
              </div>
            </div>

            <div className="px-2.5 py-1 rounded-full bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/40 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#a3e635]" />
              NIBSS Verified
            </div>
          </div>

          {/* EMV Microchip */}
          <div className="flex items-center gap-3 mb-5 relative z-10">
            <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-[#a3e635] via-lime-200 to-[#84cc16] p-1 shadow-md border border-[#a3e635] flex items-center justify-center">
              <div className="w-full h-full border border-neutral-900/40 rounded-xs flex flex-col justify-between p-0.5">
                <div className="h-0.5 bg-neutral-900/40 w-full" />
                <div className="h-0.5 bg-neutral-900/40 w-full" />
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-neutral-300 tracking-widest uppercase">
              INSTANT LIQUIDITY CLEARING
            </span>
          </div>

          {/* Account Number Display */}
          <div className="mb-4 relative z-10">
            <div className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
              Account Number / NUBAN
            </div>
            <div className="text-xl font-black font-mono tracking-widest text-white mt-0.5">
              {accountNumber ? (
                accountNumber.length === 10 ? (
                  `${accountNumber.slice(0, 3)} •••• ${accountNumber.slice(-3)}`
                ) : (
                  accountNumber
                )
              ) : (
                '•••• •••• ••••'
              )}
            </div>
          </div>

          {/* Card Footer: Holder Name and Bank Name */}
          <div className="flex items-end justify-between relative z-10 pt-2 border-t border-white/10 text-xs">
            <div>
              <div className="text-[9px] text-neutral-400 uppercase tracking-wider font-bold">
                Account Holder
              </div>
              <div className="font-bold text-[#a3e635] truncate max-w-[180px]">
                {name || 'OLA CABS MEMBER'}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[9px] text-neutral-400 uppercase tracking-wider font-bold">
                Settlement Bank
              </div>
              <div className="font-bold text-white truncate max-w-[140px]">
                {bankName || 'NOT LINKED'}
              </div>
            </div>
          </div>
        </div>

        {/* Telegram Manager Support Assistance Callout */}
        <div className="bg-neutral-900 rounded-2xl p-3.5 border border-[#a3e635]/25 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-[#a3e635] flex items-center justify-center text-neutral-950 shrink-0 shadow-md">
              <Send className="w-5 h-5 -rotate-12" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate">
                  Manager Sally
                </span>
                <span className="text-[10px] text-[#a3e635] font-semibold">
                  · Online
                </span>
              </div>
              <p className="text-[11px] text-[#a3e635] truncate mt-0.5">
                Telegram: @sallyservice4 (t.me/sallyservice4)
              </p>
              <p className="text-[10px] text-neutral-400 truncate">
                Need help binding or updating bank details? Contact 1-on-1 support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyManager}
              className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title="Copy Telegram Username"
            >
              {copiedManager ? (
                <Check className="w-4 h-4 text-[#a3e635]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <a
              href={managerTelegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (onOpenTelegram) {
                  e.preventDefault();
                  onOpenTelegram('Customer Service Manager (Sally)', managerTelegramUrl);
                }
              }}
              className="px-3 py-2 rounded-xl bg-[#a3e635] hover:bg-[#bef264] text-neutral-950 text-xs font-black transition flex items-center gap-1 shadow-md cursor-pointer active:scale-95"
            >
              <span>Chat</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Add / Edit Bank Account Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-neutral-900 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#a3e635]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Nigerian Commercial Bank Details
                </h3>
              </div>
              <span className="text-[10px] text-neutral-400">10-Digit NUBAN</span>
            </div>

            {/* Select Bank */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                <span className="text-[#a3e635] font-black mr-1">*</span>
                Select Commercial Bank
              </label>
              <div className="relative">
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full appearance-none bg-neutral-950 border border-white/15 focus:border-[#a3e635] rounded-xl px-4 py-3.5 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden transition-colors"
                  required
                >
                  <option value="" className="bg-neutral-950 text-neutral-400">
                    -- Choose your Nigerian bank --
                  </option>
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b} value={b} className="bg-neutral-950 text-white">
                      {b}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-4 top-4 pointer-events-none" />
              </div>
            </div>

            {/* Account Holder Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                <span className="text-[#a3e635] font-black mr-1">*</span>
                Account Holder Legal Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CHUKWUEMEKA OKAFOR"
                className="w-full bg-neutral-950 border border-white/15 focus:border-[#a3e635] rounded-xl px-4 py-3.5 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden uppercase transition-colors"
                required
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                Must match your registered bank verification name for interbank settlement.
              </p>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                <span className="text-[#a3e635] font-black mr-1">*</span>
                10-Digit NUBAN Account Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="e.g. 0123456789"
                className="w-full bg-neutral-950 border border-white/15 focus:border-[#a3e635] rounded-xl px-4 py-3.5 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden font-mono tracking-wider transition-colors"
                required
              />
            </div>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-lime-950/70 border border-[#a3e635]/40 text-[#a3e635] text-xs animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#a3e635]" />
              <span>Bank settlement account saved successfully!</span>
            </div>
          )}

          {/* Submit Button - Ola Cabs Electric Lime */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-[#a3e635] hover:bg-[#bef264] text-neutral-950 text-sm font-black shadow-xl shadow-[#a3e635]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <CreditCard className="w-4 h-4 text-neutral-950" />
            <span>{currentBank ? 'Update Payout Bank Account' : 'Save Payout Bank Account'}</span>
          </button>
        </form>

        {/* Security & Regulatory Notes */}
        <div className="bg-neutral-900/60 rounded-2xl p-4 border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Lock className="w-3.5 h-3.5 text-[#a3e635]" />
            <span>Bank-Grade Encryption &amp; Settlement Protection</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            All banking credentials are encrypted with 256-bit SSL protocol. Disbursed funds are cleared through the Central Bank of Nigeria (CBN) authorized NIBSS interbank clearing gateway directly into your destination bank.
          </p>
        </div>
      </div>
    </div>
  );
};

