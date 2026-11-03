import React, { useState, useEffect } from 'react';
import { ChevronLeft, Check, AlertCircle, Sparkles } from 'lucide-react';
import { TeslaLogo } from './TeslaLogo';
import { INITIAL_PRODUCTS } from '../data/initialData';

interface AuthScreenProps {
  mode: 'login' | 'register';
  onSwitchMode: (mode: 'login' | 'register') => void;
  onLogin: (phone: string, password: string) => Promise<void> | void;
  onRegister: (phone: string, password: string, inviteCode: string) => Promise<void> | void;
  initialInviteCode?: string;
}

const REAL_FLEET_CARS = INITIAL_PRODUCTS.filter((p) => p.status === 'available');

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
  const [activeCarIndex, setActiveCarIndex] = useState(0);

  useEffect(() => {
    if (initialInviteCode) {
      setInviteCode(initialInviteCode);
    }
  }, [initialInviteCode]);

  // Smoothly cycle through real car photographs in the background
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCarIndex((prev) => (prev + 1) % REAL_FLEET_CARS.length);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

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
      {/* Full-Screen Real Car Photography Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {REAL_FLEET_CARS.map((car, idx) => (
          <img
            key={car.id}
            src={car.image}
            alt={car.title}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-1000 ${
              idx === activeCarIndex ? 'opacity-75 scale-105' : 'opacity-0 scale-100'
            }`}
            referrerPolicy="no-referrer"
          />
        ))}
        {/* Balanced gradient overlay so the real car background shines through clearly while keeping form inputs legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-neutral-950/65 to-neutral-950/90" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2">
        {mode === 'register' ? (
          <button
            type="button"
            onClick={() => onSwitchMode('login')}
            className="p-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white hover:bg-white/15 active:scale-95 transition cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : (
          <div />
        )}
        <div className="ml-auto bg-black/55 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
          <TeslaLogo variant="wordmark" color="#ffffff" className="h-5" />
        </div>
      </div>

      {/* Main Form Content */}
      <div className="relative z-10 px-6 py-4 w-full my-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
            {mode === 'login' ? 'Ola Cabs Fleet Portal' : 'Create Ola Cabs Account'}
          </h1>
        </div>
        <p className="text-xs text-white/80 mb-4 drop-shadow-xs">
          {mode === 'login'
            ? 'Sign in to monitor your Ola Cabs fleet vehicles, claim daily yield, and manage treasury.'
            : 'Join the Ola Cabs (OlaCabs) mobility ecosystem and receive ₦1,100 welcome bonus.'}
        </p>

        {/* Dynamic Referral Welcome Banner */}
        {mode === 'register' && initialInviteCode && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-neutral-950/95 to-black/85 border border-[#a3e635]/50 text-white text-xs backdrop-blur-md flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#a3e635]/20 text-[#a3e635] flex items-center justify-center shrink-0 border border-[#a3e635]/40">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>VIP Referral Active</span>
                  <span className="text-[10px] bg-[#a3e635] text-neutral-950 font-mono font-black px-1.5 py-0.5 rounded-sm">
                    {initialInviteCode}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-300">
                  You've been invited to join with full VIP benefits!
                </div>
              </div>
            </div>
            <div className="text-[10px] text-[#a3e635] font-bold uppercase tracking-wider bg-[#a3e635]/15 px-2 py-1 rounded-md border border-[#a3e635]/30">
              Verified
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/90 text-white text-xs font-medium backdrop-blur-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone Number Field */}
          <div>
            <label className="block text-[11px] font-semibold text-white/90 mb-1">
              Mobile Phone Number
            </label>
            <div className="flex items-center bg-white/95 backdrop-blur-md rounded-lg overflow-hidden text-neutral-800 shadow-md">
              <span className="px-3 text-neutral-800 font-bold text-sm border-r border-neutral-200 select-none">
                +234
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                className="w-full px-3 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-[11px] font-semibold text-white/90 mb-1">
              Login Password
            </label>
            <div className="bg-white/95 backdrop-blur-md rounded-lg overflow-hidden text-neutral-800 shadow-md">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'login' ? 'Please enter your password' : 'Enter at least 6 characters'}
                className="w-full px-3 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Registration Extra Fields */}
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-white/90 mb-1">
                  Confirm Password
                </label>
                <div className="bg-white/95 backdrop-blur-md rounded-lg overflow-hidden text-neutral-800 shadow-md">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-white/90">
                    Invitation Code
                  </label>
                  {initialInviteCode && (
                    <span className="text-[10px] text-[#a3e635] font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Auto-filled from referral link
                    </span>
                  )}
                </div>
                <div className="bg-white/95 backdrop-blur-md rounded-lg overflow-hidden text-neutral-800 shadow-md flex items-center">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="e.g. P5ZP4S"
                    className="w-full px-3 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden uppercase font-mono tracking-wider font-bold"
                  />
                  {inviteCode && (
                    <div className="pr-3 text-[#65a30d]">
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
                    rememberMe
                      ? 'bg-[#a3e635] border-[#a3e635] text-neutral-950'
                      : 'border-white/60 bg-white/20'
                  }`}
                >
                  {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>Remember password</span>
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
                  className="w-full py-3 rounded-full bg-[#a3e635] hover:bg-[#bef264] disabled:opacity-60 text-neutral-950 text-base font-black shadow-lg active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Log in now</span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => onSwitchMode('register')}
                  className="w-full py-3 rounded-full bg-white/95 hover:bg-white disabled:opacity-60 text-neutral-900 text-base font-bold shadow-lg active:scale-[0.98] transition-all text-center cursor-pointer"
                >
                  To register &gt;
                </button>
              </>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-full bg-[#a3e635] hover:bg-[#bef264] disabled:opacity-60 text-neutral-950 text-base font-black shadow-lg active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <span>Register an account</span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => onSwitchMode('login')}
                  className="w-full py-3 rounded-full bg-white/95 hover:bg-white disabled:opacity-60 text-neutral-900 text-base font-bold shadow-lg active:scale-[0.98] transition-all text-center cursor-pointer"
                >
                  Log in now &gt;
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Bottom spacer */}
      <div className="relative z-10 text-center pb-6 text-white/60 text-[11px]">
        Ola Cabs (OlaCabs) Mobility Ecosystem © 2026. All rights reserved.
      </div>
    </div>
  );
};
