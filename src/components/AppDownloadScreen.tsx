import React, { useState } from 'react';
import { ChevronLeft, Download, Smartphone, ShieldCheck, CheckCircle2, Apple } from 'lucide-react';
import { DangoteLogo } from './DangoteLogo';

interface AppDownloadScreenProps {
  onBack: () => void;
}

export const AppDownloadScreen: React.FC<AppDownloadScreenProps> = ({ onBack }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadComplete(true);
    }, 2200);
  };

  return (
    <div className="min-h-screen pb-16 bg-[#0A192F] text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#002B49] border-b border-white/10 shadow-md">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-white hover:bg-white/10 rounded-full transition active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <h1 className="text-base font-bold text-white">App Download</h1>

        <div className="w-7" />
      </div>

      <div className="p-6 text-center space-y-6 max-w-sm mx-auto">
        <div className="w-24 h-24 bg-gradient-to-br from-[#006837] to-[#002B49] rounded-3xl mx-auto flex items-center justify-center p-4 shadow-xl border border-amber-400/40">
          <DangoteLogo variant="icon" color="#ffffff" className="w-full h-full" />
        </div>

        <div>
          <h2 className="text-xl font-black text-white tracking-wide">
            Dangote Shareholder Mobile App
          </h2>
          <p className="text-xs text-amber-400 mt-1">
            Version 2.4.0 • Official Android &amp; iOS PWA Release
          </p>
        </div>

        <div className="bg-[#002B49]/90 rounded-2xl p-5 shadow-xl border border-white/15 text-left space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">High Speed Experience</h4>
              <p className="text-[11px] text-neutral-300">
                Faster dividend claims, instant payout alerts, and biometric login support.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Secure Encrypted Session</h4>
              <p className="text-[11px] text-neutral-300">
                End-to-end encryption for all share portfolio transactions and bank settlements.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {downloadComplete ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>App downloaded &amp; installed successfully!</span>
            </div>
          ) : (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-sm font-black shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />
                  <span>Downloading PWA Package...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Shareholder App</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400 pt-2">
            <Apple className="w-3.5 h-3.5" />
            <span>Compatible with iOS Safari, Android Chrome &amp; PWA Pinned Shortcut</span>
          </div>
        </div>
      </div>
    </div>
  );
};
