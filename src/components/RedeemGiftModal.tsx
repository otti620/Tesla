import React, { useState } from 'react';
import { Gift, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface RedeemGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedeem: (code: string) => { success: boolean; amount?: number; message: string };
}

export const RedeemGiftModal: React.FC<RedeemGiftModalProps> = ({
  isOpen,
  onClose,
  onRedeem,
}) => {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

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
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xs rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2 text-neutral-900 font-bold text-sm">
            <Gift className="w-5 h-5 text-emerald-600" />
            <span>Redeem Gift Code</span>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleRedeem} className="space-y-3">
          <p className="text-xs text-neutral-500">
            Enter an official Tesla gift bonus code to receive instant cash into your balance. Gift codes can only be issued by platform administrators.
          </p>

          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter admin gift code"
            className="w-full bg-neutral-100 border border-neutral-300 rounded-lg px-3 py-2.5 text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono uppercase"
            required
          />

          {result && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-1.5 ${
                result.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {result.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{result.message}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-neutral-300 text-neutral-600 text-xs font-semibold hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-[#00c269] hover:bg-[#00ad5e] text-white text-xs font-bold active:scale-95 transition"
            >
              Redeem Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
