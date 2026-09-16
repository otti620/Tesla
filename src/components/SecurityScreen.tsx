import React, { useState } from 'react';
import { ChevronLeft, Lock, ShieldCheck, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { UserState } from '../types';

interface SecurityScreenProps {
  user: UserState;
  onBack: () => void;
  onUpdatePassword: (newPass: string) => void;
  onUpdateFundPin: (newPin: string) => void;
}

export const SecurityScreen: React.FC<SecurityScreenProps> = ({
  user,
  onBack,
  onUpdatePassword,
  onUpdateFundPin,
}) => {
  const [activeTab, setActiveTab] = useState<'login_pass' | 'fund_pin'>('login_pass');

  // Login Pass
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Fund PIN
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPass.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    if (newPass !== confirmPass) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    onUpdatePassword(newPass);
    setMessage({ type: 'success', text: 'Login password updated successfully' });
    setOldPass('');
    setNewPass('');
    setConfirmPass('');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      setMessage({ type: 'error', text: 'Fund PIN must be exactly 6 numeric digits' });
      return;
    }
    if (pin !== confirmPin) {
      setMessage({ type: 'error', text: 'Fund PINs do not match' });
      return;
    }

    onUpdateFundPin(pin);
    setMessage({ type: 'success', text: 'Withdrawal Fund PIN saved successfully' });
    setPin('');
    setConfirmPin('');
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

        <h1 className="text-base font-bold text-neutral-900">Security Center</h1>

        <div className="w-7" />
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-neutral-200 grid grid-cols-2 text-center text-xs font-bold">
        <button
          onClick={() => {
            setActiveTab('login_pass');
            setMessage(null);
          }}
          className={`py-3 transition border-b-2 ${
            activeTab === 'login_pass'
              ? 'border-[#00c269] text-[#00c269] font-black'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Change Login Password
        </button>
        <button
          onClick={() => {
            setActiveTab('fund_pin');
            setMessage(null);
          }}
          className={`py-3 transition border-b-2 ${
            activeTab === 'fund_pin'
              ? 'border-[#00c269] text-[#00c269] font-black'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Withdrawal Fund PIN
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {message && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2 text-xs ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {activeTab === 'login_pass' ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-neutral-200 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Old Password
                </label>
                <input
                  type="password"
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-neutral-100 border border-neutral-200 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full bg-neutral-100 border border-neutral-200 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-neutral-100 border border-neutral-200 rounded-lg p-2.5 text-xs text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#00c269] hover:bg-[#00ad5e] text-white text-xs font-bold shadow-md active:scale-98 transition"
            >
              Update Password
            </button>
          </form>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-neutral-200 space-y-3">
              <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg text-emerald-800 text-[11px]">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>
                  {user.fundPin
                    ? 'Your account has a fund PIN enabled.'
                    : 'Set a 6-digit withdrawal PIN to protect your balance.'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  6-Digit Fund PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit PIN"
                  className="w-full bg-neutral-100 border border-neutral-200 rounded-lg p-2.5 text-xs text-neutral-900 font-mono tracking-widest text-center focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Confirm 6-Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Repeat 6-digit PIN"
                  className="w-full bg-neutral-100 border border-neutral-200 rounded-lg p-2.5 text-xs text-neutral-900 font-mono tracking-widest text-center focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#00c269] hover:bg-[#00ad5e] text-white text-xs font-bold shadow-md active:scale-98 transition"
            >
              {user.fundPin ? 'Update Fund PIN' : 'Activate Fund PIN'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
