import React, { useState } from 'react';
import { Send, X, Copy, Check, Users, ShieldCheck, Sparkles, ExternalLink, Flame, MessageCircle, ArrowRight } from 'lucide-react';
import { DangoteLogo } from './DangoteLogo';

interface TelegramGroupFlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupLink?: string;
}

export const TelegramGroupFlyerModal: React.FC<TelegramGroupFlyerModalProps> = ({
  isOpen,
  onClose,
  groupLink = 'https://t.me/teslainvestment456',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const targetUrl = groupLink.startsWith('http') ? groupLink : `https://${groupLink}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 text-slate-900 shadow-2xl relative overflow-hidden flex flex-col">
        {/* Top Accent Strip */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-800 shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900/80 transition active:scale-95 cursor-pointer z-20 shadow-md"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Rich Hero Poster Graphic Header */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-900 shrink-0">
          <img
            src="/Rfnry-Blog.png"
            alt="Dangote Refinery"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=900&auto=format&fit=crop&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-black/30" />

          {/* Floating Glassmorphism Badge */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-sky-400/50 text-[10px] font-black text-sky-200 uppercase tracking-wider shadow-lg">
            <Flame className="w-3.5 h-3.5 text-sky-400 fill-sky-400 animate-pulse" />
            <span>Official Community Syndicate</span>
          </div>

          {/* Overlaid Branding & Logo */}
          <div className="absolute bottom-3 left-4 right-4 z-10 flex items-end justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <DangoteLogo variant="icon" color="#ffffff" className="w-6 h-6 shrink-0" />
                <span className="text-xs font-black text-sky-300 uppercase tracking-widest font-mono">
                  DANGOTE REFINERY
                </span>
              </div>
              <h2 className="text-lg font-black text-white leading-tight drop-shadow-md">
                SHAREHOLDER SYNDICATE
              </h2>
            </div>
            <span className="text-[10px] bg-blue-600 text-white font-black px-2 py-0.5 rounded-full uppercase shadow-md shrink-0">
              45K+ Members
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 bg-slate-50 flex-1">
          {/* Highlight Group URL Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-600 tracking-wider">
                Official Telegram Handle
              </span>
              <span className="text-xs font-black text-blue-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-300">
                Verified
              </span>
            </div>

            <div className="bg-slate-950 rounded-xl p-3.5 flex items-center justify-between text-white font-mono text-xs font-black shadow-inner">
              <div className="flex items-center gap-2 text-sky-300">
                <Send className="w-4 h-4 fill-sky-400 shrink-0" />
                <span className="tracking-wide">t.me/teslainvestment456</span>
              </div>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-sky-300 transition cursor-pointer"
                title="Copy Link"
              >
                {copied ? <Check className="w-4 h-4 text-sky-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Perks Grid */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-0.5">
              <Sparkles className="w-4 h-4 text-sky-500 mx-auto" />
              <div className="font-black text-slate-900 text-xs pt-1">Daily Signals</div>
              <div className="text-[10px] text-slate-600 font-bold">Yield Updates</div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-0.5">
              <Users className="w-4 h-4 text-blue-600 mx-auto" />
              <div className="font-black text-slate-900 text-xs pt-1">1-on-1 Support</div>
              <div className="text-[10px] text-slate-600 font-bold">Managers</div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-0.5">
              <ShieldCheck className="w-4 h-4 text-cyan-600 mx-auto" />
              <div className="font-black text-slate-900 text-xs pt-1">Giveaways</div>
              <div className="text-[10px] text-slate-600 font-bold">Free Vouchers</div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleJoin}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 hover:brightness-105 text-white text-xs font-black shadow-lg spring-press transition-butter flex items-center justify-center gap-2 cursor-pointer border border-sky-400/40"
            >
              <Send className="w-4 h-4 fill-white" />
              <span>JOIN TELEGRAM GROUP NOW</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-butter spring-press flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-butter spring-press cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
