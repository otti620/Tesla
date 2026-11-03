import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  AlertTriangle, 
  Send, 
  Headset, 
  CheckCircle2, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Building2, 
  Zap 
} from 'lucide-react';
import { TeslaLogo } from './TeslaLogo';
import { PlatformSettings } from '../types';

interface TemporaryAdministrationLandingScreenProps {
  platformSettings: PlatformSettings;
  onOpenTelegram: (title?: string, link?: string) => void;
}

export const TemporaryAdministrationLandingScreen: React.FC<TemporaryAdministrationLandingScreenProps> = ({
  platformSettings,
  onOpenTelegram,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const telegramLink = platformSettings.telegramGroupLink || platformSettings.telegramLink || 'https://t.me/teslainvestment456';
  const customerServiceLink = platformSettings.customerServiceManagerLink || 'https://t.me/sallyservice4';
  const noticeText = platformSettings.administrationNotice || 
    'The Tesla Clean Energy Fleet platform is currently under temporary administrative oversight for system restructuring, financial audit, and server infrastructure modernization. All user accounts, balances, and purchased VIP assets are safely secured.';

  const faqs = [
    {
      q: 'What is Temporary Administration?',
      a: 'Temporary Administration is a scheduled transition phase where our technical and treasury teams carry out full database verification, liquidity balancing, and next-generation charging grid upgrades to ensure seamless operations.'
    },
    {
      q: 'What will happen to my account balance and VIP assets?',
      a: 'All member records, wallet funds, VIP product activation histories, and team referral networks are permanently archived in our secure cloud Firestore database and will be fully restored upon resumption.'
    },
    {
      q: 'When will normal operations and withdrawals resume?',
      a: 'System relaunch is coming very soon. Exact reactivation timetables, schedule announcements, and bonus relaunch promo codes will be posted live inside our official Telegram community.'
    },
    {
      q: 'How do I contact the administration team?',
      a: 'You can communicate directly with Customer Service Manager Sally on Telegram (@sallyservice4) or join the official Telegram broadcast channel.'
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col items-center selection:bg-amber-500 selection:text-black">
      {/* Background Graphic & Tesla Hero Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <img
          src="https://images.unsplash.com/photo-1698870404396-7c089c2c62c2?w=1600&auto=format&fit=crop&q=80"
          alt="Tesla Fleet Cyber Infrastructure"
          className="w-full h-full object-cover opacity-20 filter brightness-40 saturate-50 scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-radial-at-t from-amber-500/10 via-neutral-950/85 to-neutral-950" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Top Corporate Navigation Bar */}
      <header className="relative z-10 w-full max-w-4xl px-4 py-4 flex items-center justify-between border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-black border border-white/20 flex items-center justify-center shadow-lg shadow-black">
            <TeslaLogo variant="icon" color="#ffffff" className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black tracking-widest text-white uppercase flex items-center gap-1.5">
              <span>TESLA ENERGY</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-neutral-400 font-mono tracking-wider">
              FLEET OPERATING SYSTEM
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>IN ADMINISTRATION</span>
          </span>
        </div>
      </header>

      {/* Main Landing Page Content */}
      <main className="relative z-10 w-full max-w-3xl px-4 py-8 sm:py-12 flex flex-col items-center text-center space-y-6">
        
        {/* Urgent Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="uppercase tracking-wider">OFFICIAL NOTICE • TEMPORARY ADMINISTRATION</span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="space-y-3 max-w-2xl">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase drop-shadow-md">
            IN TEMPORARY <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              ADMINISTRATION
            </span>
          </h1>
          <p className="text-base sm:text-lg text-neutral-300 font-medium">
            COMING SOON
          </p>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
            Tesla Clean Energy member platform has entered scheduled administrative audit, server infrastructure restructuring, and liquidity balancing.
          </p>
        </div>

        {/* Live System Status Badges */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-left">
          <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-2xl backdrop-blur-xs">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Phase</span>
            </div>
            <div className="text-xs font-black text-white">System Audit</div>
            <div className="text-[10px] text-neutral-500">Stage 2 of 3</div>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-2xl backdrop-blur-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>User Assets</span>
            </div>
            <div className="text-xs font-black text-white">100% Preserved</div>
            <div className="text-[10px] text-neutral-500">Database Secured</div>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-2xl backdrop-blur-xs">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold mb-1">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Relaunch</span>
            </div>
            <div className="text-xs font-black text-white">Coming Soon</div>
            <div className="text-[10px] text-neutral-500">Fleet Upgrades</div>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-2xl backdrop-blur-xs">
            <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold mb-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Administration</span>
            </div>
            <div className="text-xs font-black text-white">Active Review</div>
            <div className="text-[10px] text-neutral-500">Executive Team</div>
          </div>
        </div>

        {/* Official Communiqué Card */}
        <div className="w-full bg-gradient-to-b from-neutral-900/90 to-neutral-900/50 border border-neutral-800 rounded-3xl p-5 sm:p-7 text-left space-y-4 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Executive Administration Statement
              </h3>
              <p className="text-[11px] text-neutral-400">
                Tesla Clean Energy Infrastructure Management
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            {noticeText}
          </p>

          <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-neutral-300">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-white block">Important Member Protection Notice:</strong>
              <span>
                Do not transfer funds to unauthorized third parties or unverified bank accounts during this administration period. Official updates will only be broadcast via our verified Telegram channels below.
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {/* Join Telegram Group Button */}
          <button
            onClick={() => onOpenTelegram('Official Telegram Community', telegramLink)}
            className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-[#0088cc] via-[#0099e6] to-[#0077b5] p-4 text-left shadow-xl hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer border border-white/20"
          >
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white text-[#0088cc] flex items-center justify-center shadow-md shrink-0">
                <Send className="w-6 h-6 fill-[#0088cc] stroke-[#0088cc] -ml-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full inline-block mb-1">
                  OFFICIAL UPDATES
                </div>
                <h4 className="text-sm font-black text-white drop-shadow-xs truncate">
                  JOIN TELEGRAM GROUP
                </h4>
                <p className="text-[11px] text-white/90 truncate font-mono">
                  {telegramLink.replace(/^https?:\/\//, '')}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform shrink-0" />
            </div>
          </button>

          {/* Contact Customer Service Manager */}
          <button
            onClick={() => onOpenTelegram('Customer Service Manager', customerServiceLink)}
            className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 p-4 text-left shadow-xl hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer border border-white/20"
          >
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-md shrink-0">
                <Headset className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full inline-block mb-1">
                  DIRECT SUPPORT
                </div>
                <h4 className="text-sm font-black text-white drop-shadow-xs truncate">
                  CUSTOMER SERVICE
                </h4>
                <p className="text-[11px] text-white/90 truncate font-mono">
                  {customerServiceLink.replace(/^https?:\/\//, '')}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform shrink-0" />
            </div>
          </button>
        </div>

        {/* Member FAQ & Briefing Accordion */}
        <div className="w-full text-left space-y-2.5 pt-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
              Frequently Asked Questions
            </h3>
            <span className="text-[10px] text-neutral-500 font-mono">
              Administration FAQ
            </span>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-neutral-900/70 border border-neutral-800 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-neutral-200 hover:text-white cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-neutral-400 leading-relaxed border-t border-neutral-800/60 pt-2 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <footer className="w-full pt-8 pb-4 text-center text-xs text-neutral-500 space-y-1 border-t border-neutral-900">
          <p>© 2026 Tesla Clean Energy Member Network. All rights reserved.</p>
          <p className="text-[10px] font-mono text-neutral-600">
            System Node: WA-LOS-WAT-01 • Temporary Administration Mode Active
          </p>
        </footer>
      </main>
    </div>
  );
};
