import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { NIGERIAN_BANKS } from '../data/initialData';
import { BankAccount } from '../types';

interface AddBankScreenProps {
  currentBank: BankAccount | null;
  onBack: () => void;
  onSaveBank: (bank: BankAccount) => void;
}

export const AddBankScreen: React.FC<AddBankScreenProps> = ({
  currentBank,
  onBack,
  onSaveBank,
}) => {
  const [bankName, setBankName] = useState(currentBank?.bankName || '');
  const [name, setName] = useState(currentBank?.accountName || '');
  const [accountNumber, setAccountNumber] = useState(currentBank?.accountNumber || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (currentBank) {
      if (currentBank.bankName) setBankName(currentBank.bankName);
      if (currentBank.accountName) setName(currentBank.accountName);
      if (currentBank.accountNumber) setAccountNumber(currentBank.accountNumber);
    }
  }, [currentBank]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!bankName) {
      setError('Please select your bank');
      return;
    }
    if (!name.trim()) {
      setError('Please fill in your name');
      return;
    }
    if (!accountNumber.trim() || accountNumber.trim().length < 10) {
      setError('Please enter a valid 10-digit bank account number');
      return;
    }

    onSaveBank({
      bankName,
      accountName: name.trim(),
      accountNumber: accountNumber.trim(),
    });

    setSuccess(true);
    setTimeout(() => {
      onBack();
    }, 1200);
  };

  return (
    <div className="min-h-screen pb-16 bg-neutral-100 text-neutral-900">
      {/* Header (Screenshot 14) */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-neutral-800 hover:bg-neutral-100 rounded-full transition active:scale-95"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <h1 className="text-base font-bold text-neutral-900">Add bank account</h1>

        <div className="w-7" />
      </div>

      <div className="p-4 space-y-5">
        {/* Form Container (Screenshot 14) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-xs border border-neutral-200/80 space-y-4">
            {/* Select Bank */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                *Select bank
              </label>
              <div className="relative">
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full appearance-none bg-neutral-200/60 border-0 rounded-md px-3.5 py-3 text-xs text-neutral-800 placeholder:text-neutral-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  <option value="">Please select</option>
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                *Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Please fill in your name"
                className="w-full bg-neutral-200/60 border-0 rounded-md px-3.5 py-3 text-xs text-neutral-800 placeholder:text-neutral-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Bank Account */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1.5">
                *Bank account
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Please fill in the bank account"
                className="w-full bg-neutral-200/60 border-0 rounded-md px-3.5 py-3 text-xs text-neutral-800 placeholder:text-neutral-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Bank account added successfully!</span>
            </div>
          )}

          {/* Add Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-full bg-[#00c269] hover:bg-[#00ad5e] text-white text-sm font-bold shadow-md active:scale-98 transition text-center"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
};
