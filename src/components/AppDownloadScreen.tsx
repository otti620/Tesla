import React, { useState } from 'react';
import { ChevronLeft, Download, Smartphone, ShieldCheck, CheckCircle2, Apple } from 'lucide-react';
import { TeslaLogo } from './TeslaLogo';

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
    <div className="min-h-screen pb-16 bg-neutral-100 text-neutral-900">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100 shadow-2xs">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-neutral-800 hover:bg-neutral-100 rounded-full transition active:scale-95"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <h1 className="text-base font-bold text-neutral-900">App Download</h1>

        <div className="w-7" />
      </div>

      <div className="p-6 text-center space-y-6 max-w-sm mx-auto">
        <div className="w-24 h-24 bg-black rounded-3xl mx-auto flex items-center justify-center p-4 shadow-xl border border-white/20">
          <TeslaLogo variant="icon" color="#ffffff" className="w-full h-full" />
        </div>

        <div>
          <h2 className="text-xl font-black text-neutral-900 tracking-wide">
            Tesla Energy App
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Version 2.4.0 • Official Android &amp; iOS PWA Release
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xs border border-neutral-200 text-left space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00c269] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900">High Speed Experience</h4>
              <p className="text-[11px] text-neutral-500">
                Faster loading, instant push notices, and biometric login support.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00c269] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900">Enhanced Fund Security</h4>
              <p className="text-[11px] text-neutral-500">
                Hardware-level encrypted session tokens and withdrawal verification.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-3.5 rounded-full bg-[#00c269] hover:bg-[#00ad5e] text-white text-sm font-bold shadow-md active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Downloading Tesla.apk (18.4 MB)...</span>
              </>
            ) : downloadComplete ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Download Complete! Click to Install</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Android APK</span>
              </>
            )}
          </button>

          <button
            onClick={() => alert('To install on iOS: Tap the Share button in Safari and choose "Add to Home Screen".')}
            className="w-full py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs active:scale-98 transition flex items-center justify-center gap-2"
          >
            <Apple className="w-4 h-4" />
            <span>Install on iOS (Safari Web App)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
