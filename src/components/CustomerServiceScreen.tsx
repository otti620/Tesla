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

  const groupUrl = platformSettings?.telegramGroupLink || platformSettings?.telegramLink || 'https://t.me/teslainvestment456';
  const managerUrl = platformSettings?.customerServiceManagerLink || 'https://t.me/sallyservice4';
  const managerHandle = platformSettings?.customerServiceUsername || 'sallyservice4';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen pb-16 bg-neutral-100 text-neutral-900 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100 shadow-2xs">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-neutral-800 hover:bg-neutral-100 rounded-full transition active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <h1 className="text-base font-bold text-neutral-900">Customer Service</h1>

        <div className="w-7" />
      </div>

      {/* Top Banner Image */}
      <div className="relative h-48 w-full overflow-hidden bg-neutral-900">
        <img
          src="https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=800&auto=format&fit=crop&q=80"
          alt="Tesla Support Services"
          className="w-full h-full object-cover brightness-65"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-500/30 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            24/7 Official Support
          </span>
          <h2 className="text-xl font-black tracking-tight">Tesla Member Support</h2>
          <p className="text-xs text-neutral-300 mt-0.5">
            Instant assistance from dedicated account managers
          </p>
        </div>
      </div>

      <div className="p-3.5 space-y-3.5">
        {/* Primary Contact Options */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-neutral-200 divide-y divide-neutral-100">
          
          {/* Customer Service Manager (Sally) */}
          <div className="p-4 hover:bg-neutral-50/80 transition group">
            <div className="flex items-center justify-between gap-3">
              <a
                href={managerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onOpenTelegram('Customer Service Manager (Sally)', managerUrl)}
                className="flex items-center gap-3.5 flex-1 min-w-0"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0088cc] to-cyan-400 flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900 truncate">
                      Customer Service Manager
                    </span>
                    <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                      ONLINE
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#0088cc] truncate flex items-center gap-1 mt-0.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    @{managerHandle} (Sally)
                  </p>
                  <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                    Fast 1-on-1 private chat, recharge & withdrawal verification
                  </p>
                </div>
              </a>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleCopy(`@${managerHandle}`, 'manager')}
                  className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition cursor-pointer"
                  title="Copy Telegram Username"
                >
                  {copiedKey === 'manager' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={managerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onOpenTelegram('Customer Service Manager (Sally)', managerUrl)}
                  className="p-2 text-neutral-400 hover:text-[#0088cc] transition cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Official Telegram Group */}
          <div className="p-4 hover:bg-neutral-50/80 transition group">
            <div className="flex items-center justify-between gap-3">
              <a
                href={groupUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onOpenTelegram('Tesla Official Telegram Group', groupUrl)}
                className="flex items-center gap-3.5 flex-1 min-w-0"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0088cc] to-blue-500 flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900 truncate">
                      Official Telegram Group
                    </span>
                    <span className="px-2 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full border border-blue-200">
                      COMMUNITY
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#0088cc] truncate mt-0.5">
                    t.me/teslainvestment456
                  </p>
                  <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                    Daily bonus events, community discussions & fleet yield proof
                  </p>
                </div>
              </a>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleCopy(groupUrl, 'group')}
                  className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition cursor-pointer"
                  title="Copy Group Link"
                >
                  {copiedKey === 'group' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={groupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onOpenTelegram('Tesla Official Telegram Group', groupUrl)}
                  className="p-2 text-neutral-400 hover:text-[#0088cc] transition cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Telegram Announcements Channel */}
          <div className="p-4 hover:bg-neutral-50/80 transition group">
            <div className="flex items-center justify-between gap-3">
              <a
                href={groupUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onOpenTelegram('Tesla Energy Announcements Channel', groupUrl)}
                className="flex items-center gap-3.5 flex-1 min-w-0"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#0088cc] flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  <Send className="w-5 h-5 fill-white -ml-0.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900 truncate">
                      Telegram Announcements
                    </span>
                    <span className="px-2 py-0.2 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full border border-purple-200">
                      OFFICIAL
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#0088cc] truncate mt-0.5">
                    t.me/teslainvestment456
                  </p>
                  <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                    Official announcements, maintenance schedules & dividend updates
                  </p>
                </div>
              </a>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={groupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onOpenTelegram('Tesla Energy Announcements Channel', groupUrl)}
                  className="p-2 text-neutral-400 hover:text-[#0088cc] transition cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Customer Service Hours & Notice */}
        <div className="bg-white rounded-2xl p-4.5 shadow-xs border border-neutral-200 space-y-3">
          <div className="text-center pb-3 border-b border-neutral-100">
            <div className="inline-flex items-center gap-1.5 text-base font-extrabold text-neutral-900">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>9:00 - 20:00 (WAT)</span>
            </div>
            <div className="text-xs text-neutral-600 font-medium mt-0.5">
              Customer Support Service Hours (Monday – Sunday)
            </div>
          </div>

          <ol className="space-y-2 text-xs text-neutral-600 leading-relaxed">
            <li className="flex items-start gap-1.5">
              <span className="font-bold text-emerald-600">1.</span>
              <span>For 1-on-1 private inquiry and fast resolution, message Manager Sally directly on Telegram (<strong className="text-neutral-800 font-semibold">@sallyservice4</strong>).</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="font-bold text-emerald-600">2.</span>
              <span>Join our official community group (<strong className="text-neutral-800 font-semibold">t.me/teslainvestment456</strong>) for live member discussions, withdrawal proofs, and daily bonus codes.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="font-bold text-emerald-600">3.</span>
              <span>If online support is replying with a slight delay during peak hours, please be patient as requests are answered in sequence.</span>
            </li>
            <li className="flex items-start gap-1.5 font-semibold text-neutral-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
              <span className="font-bold text-emerald-700">4.</span>
              <span>Never share your 6-digit Fund PIN or password with anyone. Official staff will never ask for your account password.</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

