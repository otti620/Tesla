import React, { useState } from 'react';
import { Gift, CheckCircle2, AlertCircle, X, Sparkles, Send, Copy, Check } from 'lucide-react';
import { DangoteLogo } from './DangoteLogo';

interface RedeemGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedeem: (code: string) => { success: boolean; amount?: number; message: string };
  onOpenTelegram?: (channelName: string, customUrl?: string) => void;
  managerTelegramUrl?: string;
}

export const RedeemGiftModal: React.FC<RedeemGiftModalProps> = ({
  isOpen,
  onClose,
  onRedeem,
  onOpenTelegram,
  managerTelegramUrl = 'https://t.me/Abigail_faith56',
}) => {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedManager, setCopiedManager] = useState(false);

  if (!isOpen) return null;

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const res = onRedeem(code.trim().toUpperCase());
    setResult(res);
    if (res.success) {
      setTimeout(() => {
        setCode('');
        setResult(null);
        onClose();
      }, 1600);
    }
  };

  const handleContactManager = () => {
    if (onOpenTelegram) {
      onOpenTelegram('Customer Service Manager (Abigail Faith)', managerTelegramUrl);
    } else {
      window.open(managerTelegramUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyManager = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('@Abigail_faith56');
    setCopiedManager(true);
    setTimeout(() => setCopiedManager(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A192F] w-full max-w-sm rounded-3xl shadow-2xl border border-white/15 overflow-hidden text-white relative flex flex-col max-h-[92vh]">
        {/* Dangote Corporate Brand Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#C8102E] via-amber-400 to-[#C8102E]" />

        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-b from-[#002B49] to-[#0A192F] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <DangoteLogo variant="icon" className="w-9 h-9 shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white tracking-wide">
                  Redemption Voucher
                </span>
                <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  VIP Bonus
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium">
                Dangote Petroleum Refinery &amp; Petrochemicals
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Information Notice */}
          <div className="bg-[#002B49]/80 rounded-2xl p-3.5 border border-white/10 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0 mt-0.5">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <div className="text-white font-bold text-[11px] uppercase tracking-wider mb-0.5">
                Shareholder Dividend Bonus
              </div>
              <p className="text-[11px] text-slate-300">
                Enter an authorized Dangote Shareholder redemption gift code to claim instant cash directly into your dividend portfolio balance.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleRedeem} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                Enter Redemption Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (result) setResult(null);
                  }}
                  placeholder="e.g. DANGOTE-BONUS-2026"
                  className="w-full bg-[#002B49]/90 border border-white/20 focus:border-amber-400 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-hidden font-mono uppercase tracking-wider text-center font-bold shadow-inner transition-colors"
                  required
                />
              </div>
            </div>

            {/* Validation Feedback */}
            {result && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in duration-150 ${
                  result.success
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span className="font-medium text-[11px] leading-tight">{result.message}</span>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-white/15 text-slate-300 hover:text-white hover:bg-white/5 text-xs font-bold transition active:scale-98 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#C8102E] to-[#A50D24] hover:from-[#D71920] hover:to-[#B50E28] text-white text-xs font-black shadow-lg shadow-red-950/50 active:scale-98 transition flex items-center justify-center gap-1.5 border border-red-500/30 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Redeem Now</span>
              </button>
            </div>
          </form>

          {/* Telegram Manager Support Assistance Box */}
          <div className="pt-2 border-t border-white/10">
            <div className="bg-[#002B49]/60 rounded-2xl p-3 border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0088cc] to-cyan-400 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Send className="w-4 h-4 -rotate-12" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate">
                      Manager Abigail Faith
                    </span>
                    <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[8px] font-bold rounded-full border border-emerald-500/30 shrink-0">
                      ONLINE
                    </span>
                  </div>
                  <p className="text-[10px] text-cyan-300 truncate font-mono">
                    @Abigail_faith56
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyManager}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  title="Copy Handle"
                >
                  {copiedManager ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleContactManager}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white text-[10px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                >
                  <span>Chat</span>
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-1.5">
              Need a redemption code? Contact your assigned manager on Telegram:{' '}
              <a
                href={managerTelegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 underline font-mono"
              >
                t.me/Abigail_faith56
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
