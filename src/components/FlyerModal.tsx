import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  QrCode, 
  Flame, 
  ShieldCheck, 
  Zap, 
  Send,
  Eye,
  Crown,
  Palette
} from 'lucide-react';
import QRCode from 'qrcode';
import { UserState, PlatformSettings } from '../types';
import { getDynamicReferralLink, getReferralShareMessage } from '../utils/referral';
import { DangoteLogo } from './DangoteLogo';

interface FlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserState;
  platformSettings: PlatformSettings;
}

type FlyerTheme = 'cyber_red' | 'solar_green' | 'royal_gold';

export const FlyerModal: React.FC<FlyerModalProps> = ({
  isOpen,
  onClose,
  user,
  platformSettings,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<FlyerTheme>('royal_gold');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const inviteLink = getDynamicReferralLink(user.inviteCode);
  const l1Commission = platformSettings?.level1CommissionPct || 15;
  const signupBonus = platformSettings?.signupBonus || 1000;

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(inviteLink, {
      width: 240,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Error generating QR code for flyer:', err));
  }, [isOpen, inviteLink]);

  const downloadFlyerImage = async () => {
    setIsGeneratingImage(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = 800;
      const height = 1200;
      canvas.width = width;
      canvas.height = height;

      // Theme color palettes
      let bgGradTop = '#002B49';
      let bgGradBottom = '#0A192F';
      let accentColor = '#FFC72C';
      let cardBg = 'rgba(0, 43, 73, 0.85)';

      if (selectedTheme === 'cyber_red') {
        bgGradTop = '#1a0505';
        bgGradBottom = '#080101';
        accentColor = '#f43f5e';
        cardBg = 'rgba(40, 10, 15, 0.9)';
      } else if (selectedTheme === 'solar_green') {
        bgGradTop = '#022c22';
        bgGradBottom = '#02100a';
        accentColor = '#34d399';
        cardBg = 'rgba(4, 47, 32, 0.9)';
      }

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, bgGradTop);
      bgGrad.addColorStop(1, bgGradBottom);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Decorative lighting circles
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.arc(width / 2, 180, 220, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Top Header Badge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(width / 2 - 190, 45, 380, 46, 23);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = accentColor;
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌟 OFFICIAL DANGOTE REFINERY SHAREHOLDER PORTAL 🌟', width / 2, 74);

      // Main Title
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('INVEST IN 650,000 BPD REFINERY', width / 2, 148);

      ctx.fillStyle = accentColor;
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Earn Up to ₦3.5M Bounties + ${l1Commission}% Dividends`, width / 2, 184);

      // Perks Container
      const perksY = 220;
      const perkWidth = 210;
      const perkHeight = 110;
      const perkGap = 16;
      const startX = (width - (perkWidth * 3 + perkGap * 2)) / 2;

      const perks = [
        { title: `₦${signupBonus.toLocaleString()} NGN`, subtitle: 'Welcome Bonus' },
        { title: `${l1Commission}% Instant`, subtitle: 'Direct Commission' },
        { title: '24/7 Liquidity', subtitle: 'Instant Bank Payouts' },
      ];

      perks.forEach((p, idx) => {
        const px = startX + idx * (perkWidth + perkGap);
        ctx.fillStyle = cardBg;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15);';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(px, perksY, perkWidth, perkHeight, 18);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = accentColor;
        ctx.font = '800 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(p.title, px + perkWidth / 2, perksY + 42);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(p.subtitle, px + perkWidth / 2, perksY + 74);
      });

      // Milestone Ladder Highlights
      const ladderY = 355;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(60, ladderY, width - 120, 160, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('🏆 PROMOTER MILESTONE BOUNTY LADDER', width / 2, ladderY + 32);

      const milestonesSummary = [
        '• Invite 5 VIP Buyers  ➔ ₦2,500 Cash Bounty',
        '• Invite 20 VIP Buyers ➔ ₦20,000 Cash Bounty',
        '• Invite 50 VIP Buyers ➔ ₦50,000 Cash Bounty',
        '• Invite 100 VIPs ➔ ₦100k  |  Invite 2500 VIPs ➔ ₦3.5 Million',
      ];

      ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#e2e8f0';
      milestonesSummary.forEach((text, i) => {
        ctx.fillText(text, width / 2, ladderY + 62 + i * 24);
      });

      // QR Code & Join Section
      const qrSectionY = 545;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.roundRect(60, qrSectionY, width - 120, 390, 24);
      ctx.fill();
      ctx.stroke();

      // Draw QR Code Image
      if (qrCodeDataUrl) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(width / 2 - 90, qrSectionY + 20, 180, 180, 12);
            ctx.fill();
            ctx.drawImage(img, width / 2 - 75, qrSectionY + 35, 150, 150);
            resolve();
          };
          img.src = qrCodeDataUrl;
        });
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Scan QR Code or Use Invitation Code:', width / 2, qrSectionY + 230);

      ctx.fillStyle = accentColor;
      ctx.font = '900 28px monospace';
      ctx.fillText(`CODE: ${user.inviteCode}`, width / 2, qrSectionY + 270);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Official Dangote Petroleum Refinery Shareholder Portal © 2026', width / 2, qrSectionY + 315);

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Dangote_Shareholder_Flyer_${user.inviteCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download flyer:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(user.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const flyerShareText = `⚡ *DANGOTE PETROLEUM REFINERY SHAREHOLDER PORTAL* ⚡\n\n🎉 Register to receive an instant *₦1,000 Welcome Bonus*!\n🚀 Earn up to *₦3,500,000 Cash Bounties* + *${l1Commission}% Direct Commissions*.\n💰 Daily Withdrawable Dividends (9AM-5PM).\n\n📌 *My VIP Referral Code:* ${user.inviteCode}\n📲 *Direct Registration Link:* ${inviteLink}`;

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(flyerShareText)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(flyerShareText)}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-sky-400/40 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-white my-auto">
        {/* Modal Header */}
        <div className="sticky top-0 z-20 bg-[#0f172a]/95 backdrop-blur-md px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black shadow-sm">
              <Sparkles className="w-4 h-4 text-sky-300" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                Advertising Flyer Studio
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  HD Export
                </span>
              </h3>
              <p className="text-[11px] text-neutral-300">Custom branded promotional flyer with your active QR code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Theme Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              Choose Flyer Design &amp; Theme:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTheme('royal_gold')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedTheme === 'royal_gold'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm scale-[1.02]'
                    : 'bg-neutral-950/60 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-xs" />
                <span>Royal Gold</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTheme('cyber_red')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedTheme === 'cyber_red'
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-sm scale-[1.02]'
                    : 'bg-neutral-950/60 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-xs" />
                <span>Refinery Red</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTheme('solar_green')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedTheme === 'solar_green'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm scale-[1.02]'
                    : 'bg-neutral-950/60 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-xs" />
                <span>Petro Green</span>
              </button>
            </div>
          </div>

          {/* Flyer Live Preview Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-amber-400/30 bg-gradient-to-b from-[#002B49] to-[#0A192F] p-5 text-center space-y-4">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              Official Shareholder Flyer
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                DANGOTE REFINERY IPO PORTAL
              </h2>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                Earn Up to ₦3.5M Bounties + {l1Commission}% Dividends
              </p>
            </div>

            {/* Perks mini grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-neutral-950/60 p-2.5 rounded-xl border border-white/10">
                <div className="text-amber-400 font-black text-sm">₦{signupBonus.toLocaleString()}</div>
                <div className="text-[10px] text-neutral-300">Welcome Bonus</div>
              </div>
              <div className="bg-neutral-950/60 p-2.5 rounded-xl border border-white/10">
                <div className="text-amber-400 font-black text-sm">{l1Commission}%</div>
                <div className="text-[10px] text-neutral-300">Commission</div>
              </div>
              <div className="bg-neutral-950/60 p-2.5 rounded-xl border border-white/10">
                <div className="text-amber-400 font-black text-sm">24/7</div>
                <div className="text-[10px] text-neutral-300">Liquidity</div>
              </div>
            </div>

            {/* QR code preview */}
            <div className="bg-white p-3 rounded-2xl w-32 h-32 mx-auto shadow-md flex items-center justify-center">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="w-6 h-6 border-2 border-neutral-800 border-t-amber-500 rounded-full animate-spin" />
              )}
            </div>

            <div>
              <div className="text-[11px] text-neutral-300">Invitation Code</div>
              <div className="text-base font-black font-mono text-amber-400 tracking-wider">
                {user.inviteCode}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={downloadFlyerImage}
              disabled={isGeneratingImage}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGeneratingImage ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />
                  <span>Rendering HD PNG Flyer...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download HD Flyer Image</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share WhatsApp</span>
              </a>

              <a
                href={telegramShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Share Telegram</span>
              </a>
            </div>
          </div>

          {/* Hidden Canvas for High-Resolution Export */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};
