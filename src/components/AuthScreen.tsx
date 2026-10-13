import React, { useState, useEffect } from 'react';
import { ChevronLeft, Check, AlertCircle, Sparkles } from 'lucide-react';
import { DangoteLogo } from './DangoteLogo';

interface AuthScreenProps {
  mode: 'login' | 'register';
  onSwitchMode: (mode: 'login' | 'register') => void;
  onLogin: (phone: string, password: string) => Promise<void> | void;
  onRegister: (phone: string, password: string, inviteCode: string) => Promise<void> | void;
  initialInviteCode?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  mode,
  onSwitchMode,
  onLogin,
  onRegister,
  initialInviteCode,
}) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState(initialInviteCode || '');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialInviteCode) {
      setInviteCode(initialInviteCode);
    }
  }, [initialInviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanPhoneDigits = phone.replace(/\D/g, '');
    if (!cleanPhoneDigits || cleanPhoneDigits.length < 8) {
      setErrorMessage('Please enter a valid phone number (at least 8 digits)');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match');
          setIsLoading(false);
          return;
        }
        await onRegister(cleanPhoneDigits, password, inviteCode);
      } else {
        await onLogin(cleanPhoneDigits, password);
      }
    } catch (err: any) {
      console.warn('Authentication attempt result:', err?.code || err?.message);
      let message = err?.message || 'Authentication failed. Please try again.';
      if (
        message.includes('auth/invalid-credential') || 
        message.includes('auth/wrong-password') || 
        message.includes('auth/user-not-found') || 
        message.includes('sign up first') || 
        message.includes('register first')
      ) {
        message = 'Account does not exist or password is incorrect. Please verify or register.';
      } else if (message.includes('auth/email-already-in-use') || message.includes('already registered')) {
        message = 'This phone number is already registered. Please log in with your password.';
      } else if (message.includes('auth/weak-password')) {
        message = 'Password is too weak. Please use at least 6 characters.';
      } else if (message.includes('auth/network-request-failed')) {
        message = 'Network connection issue. Offline local fallback engaged.';
      }
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full max-w-md mx-auto overflow-hidden bg-neutral-950 text-white flex flex-col justify-between">
      {/* Background with Dangote Refinery industrial backdrop */}
      <img
        src="/images-2.jpeg"
        alt="Dangote Petroleum Refinery FZE Billboard"
        className="absolute inset-0 w-full h-full object-cover brightness-[0.55]"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/90 via-[#1e3a8a]/60 to-black/90" />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-10 pb-4">
        {mode === 'register' ? (
          <button
            type="button"
            onClick={() => onSwitchMode('login')}
            className="p-1 rounded-full text-white hover:bg-white/10 active:scale-95 transition cursor-pointer"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        ) : (
          <div />
        )}
        <div className="ml-auto">
          <DangoteLogo variant="wordmark" color="#ffffff" className="h-7" />
        </div>
      </div>

      {/* Main Form Content */}
      <div className="relative z-10 px-6 py-6 w-full my-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-1.5 drop-shadow-md">
            {mode === 'login' ? 'Account Log In' : 'Create Account'}
          </h1>
          <p className="text-xs font-bold text-sky-300 tracking-wider uppercase drop-shadow-xs">
            Dangote Petroleum Refinery Shareholder Portal
          </p>
        </div>

        {/* ₦1,000 Shareholder Welcome Bonus Banner */}
        {mode === 'register' && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-blue-950/90 via-indigo-950/90 to-black/80 border border-sky-400/50 text-white text-xs backdrop-blur-md flex items-center justify-between shadow-lg animate-float-slow">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0 border border-sky-400/40 font-mono font-black text-xs">
                ₦1k
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>Instant ₦1,000 Welcome Bonus</span>
                  <span className="text-[10px] bg-sky-400 text-slate-950 font-black px-1.5 py-0.2 rounded-sm uppercase">
                    Free
                  </span>
                </div>
                <div className="text-[11px] text-sky-100 font-medium">
                  Credited to your wallet balance instantly upon account creation!
                </div>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-sky-300 shrink-0" />
          </div>
        )}

        {/* Dynamic Referral Welcome Banner */}
        {mode === 'register' && initialInviteCode && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-sky-950/90 to-black/80 border border-sky-500/50 text-white text-xs backdrop-blur-md flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0 border border-sky-400/40">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>Shareholder Invitation Active</span>
                  <span className="text-[10px] bg-sky-500/30 text-sky-300 font-mono px-1.5 py-0.5 rounded-sm">
                    {initialInviteCode}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-300">
                  You've been invited with full VIP Shareholder benefits!
                </div>
              </div>
            </div>
            <div className="text-[10px] text-sky-300 font-bold uppercase tracking-wider bg-sky-900/60 px-2 py-1 rounded-md border border-sky-500/30">
              Verified
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/90 text-white text-xs font-medium backdrop-blur-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              {errorMessage}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone Number Field */}
          <div>
            <label className="block text-[11px] font-medium text-white/80 mb-1">
              Mobile Phone Number
            </label>
            <div className="flex items-center bg-white/90 backdrop-blur-md rounded-xl overflow-hidden text-neutral-900 shadow-lg border border-white/20">
              <span className="px-3 text-neutral-800 font-bold text-xs border-r border-neutral-300 select-none">
                +234
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                className="w-full px-3 py-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-hidden font-mono"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-[11px] font-medium text-white/80 mb-1">
              Login Password
            </label>
            <div className="bg-white/90 backdrop-blur-md rounded-xl overflow-hidden text-neutral-900 shadow-lg border border-white/20">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'login' ? 'Please enter your password' : 'Enter at least 6 characters'}
                className="w-full px-3 py-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Registration Extra Fields */}
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-white/80 mb-1">
                  Confirm Password
                </label>
                <div className="bg-white/90 backdrop-blur-md rounded-xl overflow-hidden text-neutral-900 shadow-lg border border-white/20">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-medium text-white/80">
                    Invitation Code (Optional)
                  </label>
                  {initialInviteCode && (
                    <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Auto-filled from referral link
                    </span>
                  )}
                </div>
                <div className="bg-white/90 backdrop-blur-md rounded-xl overflow-hidden text-neutral-900 shadow-lg border border-white/20 flex items-center">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="e.g. P5ZP4S"
                    className="w-full px-3 py-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-hidden uppercase font-mono tracking-wider font-bold"
                  />
                  {inviteCode && (
                    <div className="pr-3 text-amber-600">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Remember Password Checkbox (Login mode) */}
          {mode === 'login' && (
            <div className="flex items-center justify-between pt-1 pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-white/90">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="hidden"
                />
                <div
                  className={`w-4 h-4 rounded-xs flex items-center justify-center border transition-colors ${
                    rememberMe ? 'bg-sky-400 border-sky-400 text-neutral-950 font-bold' : 'border-white/60 bg-white/20'
                  }`}
                >
                  {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>Remember account</span>
              </label>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 space-y-3">
            {mode === 'login' ? (
              <>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 hover:brightness-110 disabled:opacity-60 text-white text-base font-extrabold shadow-xl spring-press transition-butter text-center flex items-center justify-center gap-2 cursor-pointer border border-sky-300/30"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating Shareholder...</span>
                    </>
                  ) : (
                    <span>Log In</span>
                  )}
                </button>
                <div className="text-center pt-2 text-xs text-white/80">
                  <span>Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => onSwitchMode('register')}
                    className="text-sky-300 font-bold hover:underline cursor-pointer"
                  >
                    Register here
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 hover:brightness-110 disabled:opacity-60 text-white text-base font-extrabold shadow-xl spring-press transition-butter text-center border border-sky-300/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Shareholder Account...</span>
                    </>
                  ) : (
                    <span>Register Account</span>
                  )}
                </button>
                <div className="text-center pt-2 text-xs text-white/80">
                  <span>Already registered? </span>
                  <button
                    type="button"
                    onClick={() => onSwitchMode('login')}
                    className="text-sky-300 font-bold hover:underline cursor-pointer"
                  >
                    Log In here
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Bottom footer */}
      <div className="relative z-10 text-center pb-8 text-white/50 text-[11px]">
        Dangote Petroleum Refinery Shareholder Portal © 2026. All rights reserved.
      </div>
    </div>
  );
};
