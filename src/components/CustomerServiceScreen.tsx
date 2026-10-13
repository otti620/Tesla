import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Send, Clock, UserCheck, Users, Copy, Check, MessageSquare } from 'lucide-react';
import { PlatformSettings } from '../types';

interface CustomerServiceScreenProps {
  onBack: () => void;
  onOpenTelegram: (channelName: string, customUrl?: string) => void;
  platformSettings?: PlatformSettings;
}

export const CustomerServiceScreen: React.FC<CustomerServiceScreenProps> = ({
  onBack,
  onOpenTelegram,
  platformSettings,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const groupUrl = platformSettings?.telegramGroupLink || platformSettings?.telegramLink || 'https://t.me/dangote_ipo';
  const managerUrl = platformSettings?.customerServiceManagerLink || 'https://t.me/Abigail_faith56';
  const managerHandle = platformSettings?.customerServiceUsername || 'Abigail_faith56';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen pb-16 bg-[#0A192F] text-white font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#002B49] border-b border-white/10 shadow-lg">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-white hover:bg-white/10 rounded-full transition active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <h1 className="text-base font-black text-white">Shareholder Customer Service</h1>

        <div className="w-7" />
      </div>

      {/* Top Banner Image */}
      <div className="relative h-48 w-full overflow-hidden bg-neutral-900 border-b border-white/10">
        <img
          src="https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=800&auto=format&fit=crop&q=80"
          alt="Dangote Shareholder Support Services"
          className="w-full h-full object-cover brightness-65"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F] via-[#002B49]/70 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-amber-400/30 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            24/7 Official Support
          </span>
          <h2 className="text-xl font-black tracking-tight text-white">Dangote Shareholder Support</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Instant assistance from dedicated refinery account managers
          </p>
        </div>
      </div>

      <div className="p-3.5 space-y-3.5">
        {/* Primary Contact Options */}
        <div className="bg-[#002B49]/90 rounded-2xl overflow-hidden shadow-xl border border-white/10 divide-y divide-white/10">
          
          {/* Customer Service Manager (Abigail Faith) */}
          <div className="p-4 hover:bg-white/5 transition group">
            <div className="flex items-center justify-between gap-3">
              <a
                href={managerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onOpenTelegram('Customer Service Manager (Abigail Faith)', managerUrl)}
                className="flex items-center gap-3.5 flex-1 min-w-0"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0088cc] to-cyan-400 flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">
                      Customer Service Manager
                    </span>
                    <span className="px-2 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30">
                      ONLINE
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-cyan-300 truncate flex items-center gap-1 mt-0.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    @{managerHandle} (Abigail Faith)
                  </p>
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">
                    Fast 1-on-1 private chat, recharge & withdrawal verification
                  </p>
                </div>
              </a>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleCopy(`@${managerHandle}`, 'manager')}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                  title="Copy Telegram Username"
                >
                  {copiedKey === 'manager' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={managerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onOpenTelegram('Customer Service Manager (Abigail Faith)', managerUrl)}
                  className="p-2 text-slate-300 hover:text-cyan-300 transition cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Official Telegram Group */}
          <div className="p-4 hover:bg-white/5 transition group">
            <div className="flex items-center justify-between gap-3">
              <a
                href={groupUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onOpenTelegram('Dangote Official Shareholder Group', groupUrl)}
                className="flex items-center gap-3.5 flex-1 min-w-0"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0088cc] to-blue-500 flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">
                      Official Shareholder Group
                    </span>
                    <span className="px-2 py-0.2 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-full border border-blue-500/30">
                      COMMUNITY
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-cyan-300 truncate mt-0.5">
                    {groupUrl.replace(/^https?:\/\//, '')}
                  </p>
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">
                    Daily bonus events, community discussions & dividend payout proofs
                  </p>
                </div>
              </a>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleCopy(groupUrl, 'group')}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                  title="Copy Group Link"
                >
                  {copiedKey === 'group' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={groupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onOpenTelegram('Dangote Official Shareholder Group', groupUrl)}
                  className="p-2 text-slate-300 hover:text-cyan-300 transition cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Telegram Announcements Channel */}
          <div className="p-4 hover:bg-white/5 transition group">
            <div className="flex items-center justify-between gap-3">
              <a
                href={groupUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onOpenTelegram('Dangote Refinery Announcements Channel', groupUrl)}
                className="flex items-center gap-3.5 flex-1 min-w-0"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#0088cc] flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  <Send className="w-5 h-5 fill-white -ml-0.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">
                      Telegram Announcements
                    </span>
                    <span className="px-2 py-0.2 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded-full border border-purple-500/30">
                      OFFICIAL
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-cyan-300 truncate mt-0.5">
                    {groupUrl.replace(/^https?:\/\//, '')}
                  </p>
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">
                    Official announcements, IPO tranches & dividend updates
                  </p>
                </div>
              </a>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={groupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onOpenTelegram('Dangote Refinery Announcements Channel', groupUrl)}
                  className="p-2 text-slate-300 hover:text-cyan-300 transition cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Customer Service Hours & Notice */}
        <div className="bg-[#002B49]/90 rounded-2xl p-4.5 shadow-xl border border-white/10 space-y-3">
          <div className="text-center pb-3 border-b border-white/10">
            <div className="inline-flex items-center gap-1.5 text-base font-extrabold text-amber-400">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>9:00 - 20:00 (WAT)</span>
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">
              Customer Support Service Hours (Monday – Sunday)
            </div>
          </div>

          <ol className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <li className="flex items-start gap-1.5">
              <span className="font-bold text-amber-400">1.</span>
              <span>For 1-on-1 private inquiry and fast resolution, message Manager Abigail Faith directly on Telegram (<strong className="text-white font-semibold">@Abigail_faith56</strong>).</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="font-bold text-amber-400">2.</span>
              <span>Join our official community group for live member discussions, withdrawal proofs, and daily bonus codes.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="font-bold text-amber-400">3.</span>
              <span>If online support is replying with a slight delay during peak hours, please be patient as requests are answered in sequence.</span>
            </li>
            <li className="flex items-start gap-1.5 font-semibold text-white bg-amber-400/10 p-2.5 rounded-xl border border-amber-400/20">
              <span className="font-bold text-amber-400">4.</span>
              <span>Never share your 6-digit Fund PIN or password with anyone. Official staff will never ask for your account password.</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

