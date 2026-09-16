import React from 'react';
import { Send } from 'lucide-react';

interface NotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTelegram: () => void;
  announcementNotice?: string;
  signupBonus?: number;
  level1CommissionPct?: number;
}

export const NotifyModal: React.FC<NotifyModalProps> = ({
  isOpen,
  onClose,
  onOpenTelegram,
  announcementNotice,
  signupBonus = 2300,
  level1CommissionPct = 35,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-white border border-white/10 text-white">
        {/* Header with image & large NOTIFY text */}
        <div className="relative h-44 bg-neutral-900 overflow-hidden flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=800&auto=format&fit=crop&q=80"
            alt="Tesla Energy Community"
            className="absolute inset-0 w-full h-full object-cover brightness-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00c269] via-transparent to-black/40" />
          <h2 className="relative z-10 text-4xl font-extrabold tracking-widest text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
            NOTIFY
          </h2>
        </div>

        {/* Green body */}
        <div className="bg-[#00c269] p-5 text-white">
          <div className="space-y-2.5 text-xs sm:text-sm font-medium leading-relaxed max-h-60 overflow-y-auto pr-1">
            {announcementNotice ? (
              <p className="bg-white/10 p-2.5 rounded-lg border border-white/20 text-white font-medium">
                {announcementNotice}
              </p>
            ) : null}
            <p>1. Register to receive {signupBonus.toLocaleString()} NGN as a welcome bonus.</p>
            <p>2. Deposit 4,000 NGN and unlock instant withdrawal.</p>
            <p>3. Referral rewards: Level 1: {level1CommissionPct}% bonus, Level 2: 1%, Level 3: 1% bonus.</p>
            <p>4. Withdrawals are processed daily from 9:00 AM to 5:00 PM with individual administrative audit and settlement.</p>
            <p>5. Please follow the Tesla Telegram channel. All bonus activities are in the Tesla Telegram group. Please join the Tesla Telegram group to receive daily bonuses.</p>
            <p>6. For any questions, please contact customer service through the Tesla platform.</p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 mt-5 pt-2 border-t border-white/20">
            <button
              onClick={onOpenTelegram}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Send className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="truncate">Telegram channel</span>
            </button>

            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-lg bg-white hover:bg-neutral-100 text-[#00c269] text-sm font-bold shadow-md active:scale-95 transition-all text-center"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
