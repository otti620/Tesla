import React, { useState, useEffect } from 'react';
import { ChevronLeft, Check, AlertCircle, Sparkles } from 'lucide-react';
import { TeslaLogo } from './TeslaLogo';

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
    <div className="relative min-h-screen w-full max-w-md mx-auto overflow-hidden bg-neutral-900 text-white flex flex-col justify-between">
      {/* Background with Tesla futuristic vehicle & lifestyle backdrop */}
      <img
        src="https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=900&auto=format&fit=crop&q=80"
        alt="Tesla"
        className="absolute inset-0 w-full h-full object-cover brightness-[0.55]"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/75" />

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
          <TeslaLogo variant="wordmark" color="#ffffff" className="h-6" />
        </div>
      </div>

      {/* Main Form Content */}
      <div className="relative z-10 px-6 py-6 w-full my-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white">
            {mode === 'login' ? 'Always be yourself' : 'Create Account'}
          </h1>
        </div>
        <p className="text-xs text-white/70 mb-6">
          {mode === 'login' 
            ? 'Sign in to monitor fleet units, claim daily yield, and manage treasury.'
            : 'Join the Tesla Clean Energy ecosystem and receive ₦1,500 welcome bonus.'}
        </p>

        {/* Dynamic Referral Welcome Banner */}
        {mode === 'register' && initialInviteCode && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-emerald-950/90 to-black/80 border border-emerald-500/50 text-white text-xs backdrop-blur-md flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/40">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>VIP Referral Active</span>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-mono px-1.5 py-0.5 rounded-sm">
                    {initialInviteCode}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-300">
                  You've been invited to join with full VIP benefits!
                </div>
              </div>
            </div>
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-900/60 px-2 py-1 rounded-md border border-emerald-500/30">
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
            <div className="flex items-center bg-white rounded-md overflow-hidden text-neutral-800 shadow-md">
              <span className="px-3 text-neutral-800 font-medium text-sm border-r border-neutral-200 select-none">
                +234
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                className="w-full px-3 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-[11px] font-medium text-white/80 mb-1">
              Login Password
            </label>
            <div className="bg-white rounded-md overflow-hidden text-neutral-800 shadow-md">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'login' ? 'Please enter your password' : 'Enter at least 6 characters'}
                className="w-full px-3 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-hidden"
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
                <div className="bg-white rounded-md overflow-hidden text-neutral-800 shadow-md">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-medium text-white/80">
                    Invitation Code
                  </label>
                  {initialInviteCode && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Auto-filled from referral link
                    </span>
                  )}
                </div>
                <div className="bg-white rounded-md overflow-hidden text-neutral-800 shadow-md flex items-center">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="e.g. P5ZP4S"
                    className="w-full px-3 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-hidden uppercase font-mono tracking-wider font-bold"
                  />
                  {inviteCode && (
                    <div className="pr-3 text-emerald-600">
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
                    rememberMe ? 'bg-white border-white text-[#00c269]' : 'border-white/60 bg-white/20'
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
                  className="w-full py-3 rounded-full bg-[#00c269] hover:bg-[#00ad5e] disabled:opacity-60 text-white text-base font-semibold shadow-lg active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                  className="w-full py-3 rounded-full bg-white hover:bg-neutral-100 disabled:opacity-60 text-neutral-900 text-base font-semibold shadow-lg active:scale-[0.98] transition-all text-center cursor-pointer"
                >
                  To register &gt;
                </button>
              </>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-full bg-black hover:bg-neutral-900 disabled:opacity-60 text-white text-base font-semibold shadow-lg active:scale-[0.98] transition-all text-center border border-white/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                  className="w-full py-3 rounded-full bg-white hover:bg-neutral-100 disabled:opacity-60 text-neutral-900 text-base font-semibold shadow-lg active:scale-[0.98] transition-all text-center cursor-pointer"
                >
                  Log in now&gt;
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Bottom spacer */}
      <div className="relative z-10 text-center pb-8 text-white/50 text-[11px]">
        Tesla Energy Ecosystem © 2026. All rights reserved.
      </div>
    </div>
  );
};
