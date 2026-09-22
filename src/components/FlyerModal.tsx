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
import { TeslaLogo } from './TeslaLogo';

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
  const [selectedTheme, setSelectedTheme] = useState<FlyerTheme>('cyber_red');
  const [promoterAlias, setPromoterAlias] = useState<string>(user.phone ? `Agent ${user.phone.slice(0, 4)}***${user.phone.slice(-3)}` : 'VIP Agent');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const inviteLink = getDynamicReferralLink(user.inviteCode);
  const l1Commission = platformSettings?.level1CommissionPct ?? 25;
  const signupBonus = platformSettings?.signupBonus ?? 1500;

  // Generate QR Code data URL whenever inviteLink changes
  useEffect(() => {
    if (inviteLink) {
      QRCode.toDataURL(inviteLink, {
        width: 320,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Failed to generate QR Code:', err));
    }
  }, [inviteLink]);

  if (!isOpen) return null;

  // Render high-res flyer onto HTML5 canvas for crisp export
  const generateCanvasImage = async (): Promise<string | null> => {
    const canvas = document.createElement('canvas');
    const width = 800;
    const height = 1200;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background Gradient based on theme
    if (selectedTheme === 'cyber_red') {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0a0a0a');
      grad.addColorStop(0.3, '#171717');
      grad.addColorStop(0.7, '#260c14');
      grad.addColorStop(1, '#050505');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle accent glow
      const glow = ctx.createRadialGradient(width / 2, 250, 50, width / 2, 250, 450);
      glow.addColorStop(0, 'rgba(225, 29, 72, 0.25)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    } else if (selectedTheme === 'solar_green') {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#022c1b');
      grad.addColorStop(0.35, '#064e3b');
      grad.addColorStop(0.8, '#06281e');
      grad.addColorStop(1, '#02150e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Radial glow
      const glow = ctx.createRadialGradient(width / 2, 250, 50, width / 2, 250, 450);
      glow.addColorStop(0, 'rgba(0, 194, 105, 0.3)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Royal Gold
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#111111');
      grad.addColorStop(0.35, '#1c1917');
      grad.addColorStop(0.75, '#291b00');
      grad.addColorStop(1, '#0a0a0a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(width / 2, 250, 50, width / 2, 250, 450);
      glow.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }

    // Outer decorative border
    ctx.strokeStyle = selectedTheme === 'cyber_red' ? '#e11d48' : selectedTheme === 'solar_green' ? '#00c269' : '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 32, width - 64, height - 64);

    // Header Top Tag
    ctx.fillStyle = selectedTheme === 'cyber_red' ? '#e11d48' : selectedTheme === 'solar_green' ? '#00c269' : '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 160, 50, 320, 36, 18);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFFICIAL CLEAN ENERGY AFFILIATE', width / 2, 74);

    // Main Logo & Brand
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('TESLA ENERGY', width / 2, 145);

    ctx.fillStyle = selectedTheme === 'cyber_red' ? '#fb7185' : selectedTheme === 'solar_green' ? '#6ee7b7' : '#fde68a';
    ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('VIP CLEAN ENERGY FLEET & PROMOTER NETWORK', width / 2, 178);

    // Big Headline Box
    const boxY = 210;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(60, boxY, width - 120, 180, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('EARN DAILY PASSIVE INCOME & BOUNTIES', width / 2, boxY + 45);

    ctx.fillStyle = selectedTheme === 'cyber_red' ? '#fda4af' : selectedTheme === 'solar_green' ? '#86efac' : '#fde047';
    ctx.font = '900 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`UP TO ₦3,500,000 CASH`, width / 2, boxY + 105);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`+ ${l1Commission}% Instant Direct Referral Commission Per Fleet Activation`, width / 2, boxY + 145);

    // Key Highlights Grid
    const perksY = 420;
    const perkWidth = 210;
    const perks = [
      { top: `₦${signupBonus.toLocaleString()}`, label: 'Welcome Bonus', sub: 'Instant On Signup' },
      { top: `${l1Commission}%`, label: 'Direct Commission', sub: 'Instant Payout' },
      { top: '9AM - 5PM', label: 'Daily Withdrawals', sub: 'Direct Bank Settlement' },
    ];

    perks.forEach((p, idx) => {
      const px = 60 + idx * (perkWidth + 25);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.roundRect(px, perksY, perkWidth, 100, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = selectedTheme === 'cyber_red' ? '#ff4d6d' : selectedTheme === 'solar_green' ? '#10b981' : '#fbbf24';
      ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(p.top, px + perkWidth / 2, perksY + 38);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(p.label, px + perkWidth / 2, perksY + 64);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(p.sub, px + perkWidth / 2, perksY + 84);
    });

    // Milestone Ladder Highlights
    const ladderY = 545;
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
    const qrSectionY = 730;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(60, qrSectionY, width - 120, 360, 24);
    ctx.fill();
    ctx.stroke();

    // Draw QR Code Image
    if (qrCodeDataUrl) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          // White square background for QR
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(width / 2 - 95, qrSectionY + 30, 190, 190, 12);
          ctx.fill();
          ctx.drawImage(img, width / 2 - 85, qrSectionY + 40, 170, 170);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = qrCodeDataUrl;
      });
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('SCAN QR CODE TO REGISTER & CLAIM ₦1,500', width / 2, qrSectionY + 250);

    // Invitation Code Badge Box
    const codeBoxY = qrSectionY + 270;
    ctx.fillStyle = selectedTheme === 'cyber_red' ? '#e11d48' : selectedTheme === 'solar_green' ? '#00c269' : '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 180, codeBoxY, 360, 50, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('OFFICIAL INVITATION CODE', width / 2, codeBoxY + 20);

    ctx.font = '900 22px monospace';
    ctx.fillText(user.inviteCode, width / 2, codeBoxY + 42);

    // Footer Promoter Info & Legal
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Certified Promoter: ${promoterAlias} • Instant Bank Audited Payouts`, width / 2, height - 60);

    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Tesla Clean Energy Fleet Africa • All Rights Reserved', width / 2, height - 40);

    return canvas.toDataURL('image/png');
  };

  const handleDownloadFlyer = async () => {
    try {
      setIsGeneratingImage(true);
      const dataUrl = await generateCanvasImage();
      if (!dataUrl) throw new Error('Could not create canvas');

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Tesla_Promoter_Flyer_${user.inviteCode}.png`;
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

  const flyerShareText = `⚡ *TESLA CLEAN ENERGY OFFICIAL PROMOTER FLYER* ⚡\n\n🎉 Register to receive an instant *₦1,500 Welcome Bonus*!\n🚀 Earn up to *₦3,500,000 Cash Bounties* + *${l1Commission}% Direct Commissions*.\n💰 Daily Withdrawable Cashouts (9AM-5PM).\n\n📌 *My VIP Referral Code:* ${user.inviteCode}\n📲 *Direct Registration Link:* ${inviteLink}`;

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(flyerShareText)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(flyerShareText)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-white my-auto">
        {/* Modal Header */}
        <div className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-md px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                Advertising Flyer Studio
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  HD Export
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">Custom branded promotional flyer with your active QR code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Theme Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              Choose Flyer Design & Theme:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTheme('cyber_red')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedTheme === 'cyber_red'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-300 shadow-sm shadow-rose-950/40 scale-[1.02]'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-xs" />
                <span>Cyber Red</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTheme('solar_green')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedTheme === 'solar_green'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-950/40 scale-[1.02]'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-xs" />
                <span>Solar Green</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTheme('royal_gold')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedTheme === 'royal_gold'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-sm shadow-amber-950/40 scale-[1.02]'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-xs" />
                <span>Royal Gold</span>
              </button>
            </div>
          </div>

          {/* Live Flyer Visual Card (Interactive Preview) */}
          <div
            className={`rounded-2xl p-4 sm:p-5 border text-white transition-all shadow-xl relative overflow-hidden ${
              selectedTheme === 'cyber_red'
                ? 'bg-gradient-to-b from-neutral-950 via-neutral-900 to-rose-950/90 border-rose-500/40'
                : selectedTheme === 'solar_green'
                ? 'bg-gradient-to-b from-neutral-950 via-emerald-950 to-neutral-950 border-emerald-500/40'
                : 'bg-gradient-to-b from-neutral-950 via-stone-900 to-amber-950/80 border-amber-500/40'
            }`}
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <TeslaLogo className="w-5 h-5 text-white" />
                <span className="text-xs font-black tracking-wider uppercase text-white">Tesla Energy</span>
              </div>
              <span
                className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white ${
                  selectedTheme === 'cyber_red'
                    ? 'bg-rose-600'
                    : selectedTheme === 'solar_green'
                    ? 'bg-emerald-600'
                    : 'bg-amber-600'
                }`}
              >
                VIP Partner Flyer
              </span>
            </div>

            {/* Poster Headline */}
            <div className="text-center py-3">
              <h2 className="text-lg font-black tracking-tight text-white">
                Earn Up To <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-red-400">₦3,500,000</span> Bounties
              </h2>
              <p className="text-[11px] text-neutral-300 mt-0.5">
                + {l1Commission}% Instant Direct Referral Commission Per Fleet Activation
              </p>
            </div>

            {/* Value Badges 3-Col */}
            <div className="grid grid-cols-3 gap-1.5 my-2 text-center">
              <div className="bg-white/5 border border-white/10 rounded-xl p-2">
                <div className="text-xs font-black text-amber-300">₦{signupBonus.toLocaleString()}</div>
                <div className="text-[9px] text-neutral-300">Welcome Bonus</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2">
                <div className="text-xs font-black text-emerald-400">{l1Commission}%</div>
                <div className="text-[9px] text-neutral-300">Level 1 Buy Bonus</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2">
                <div className="text-xs font-black text-rose-300">9AM-5PM</div>
                <div className="text-[9px] text-neutral-300">Daily Cashout</div>
              </div>
            </div>

            {/* QR Code & Code Box */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-3 my-3 flex items-center justify-between gap-3">
              <div className="bg-white p-1.5 rounded-lg shrink-0 shadow-md">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="Referral QR Code" className="w-18 h-18 object-contain" />
                ) : (
                  <div className="w-18 h-18 flex items-center justify-center bg-neutral-100 text-neutral-400">
                    <QrCode className="w-6 h-6 animate-pulse" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-[10px] text-neutral-400 uppercase font-bold">Invite Code:</div>
                <div className="text-base font-mono font-black text-amber-300 tracking-wider">
                  {user.inviteCode}
                </div>
                <div className="text-[10px] text-neutral-300 leading-tight">
                  Scan with any camera or WhatsApp to register directly!
                </div>
              </div>
            </div>

            {/* Promoter Footer */}
            <div className="text-center pt-1 text-[10px] text-neutral-400 flex items-center justify-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Promoter: <strong className="text-neutral-200">{promoterAlias}</strong></span>
            </div>
          </div>

          {/* Quick Actions & Download */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleDownloadFlyer}
              disabled={isGeneratingImage}
              className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isGeneratingImage ? 'Generating HD Flyer...' : 'Download HD Flyer Image (PNG)'}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Share on WhatsApp
              </a>
              <a
                href={telegramShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Share on Telegram
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Link Copied!' : 'Copy Invite Link'}
              </button>
              <button
                type="button"
                onClick={handleCopyCode}
                className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Code Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
