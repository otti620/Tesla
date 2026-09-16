import React, { useState } from 'react';
import { ChevronLeft, ArrowDownRight, ArrowUpRight, Gift, ShoppingCart, Zap } from 'lucide-react';
import { TransactionRecord } from '../types';

interface RecordsModalProps {
  records: TransactionRecord[];
  onBack: () => void;
}

export const RecordsModal: React.FC<RecordsModalProps> = ({ records, onBack }) => {
  const [filter, setFilter] = useState<'all' | 'recharge' | 'withdraw' | 'income'>('all');

  const filtered = records.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'recharge') return r.type === 'recharge';
    if (filter === 'withdraw') return r.type === 'withdraw';
    if (filter === 'income') return r.type === 'income' || r.type === 'bonus' || r.type === 'gift';
    return true;
  });

  return (
    <div className="min-h-screen pb-16 bg-neutral-100 text-neutral-900">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-neutral-800 hover:bg-neutral-100 rounded-full transition active:scale-95"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <h1 className="text-base font-bold text-neutral-900">Account records</h1>

        <div className="w-7" />
      </div>

      {/* Filter Tabs */}
      <div className="bg-white px-4 py-2 flex gap-2 border-b border-neutral-200 overflow-x-auto">
        {(['all', 'recharge', 'withdraw', 'income'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
              filter === tab
                ? 'bg-[#00c269] text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-xs">
            No records found.
          </div>
        ) : (
          filtered.map((item) => {
            const isCredit = item.type === 'recharge' || item.type === 'bonus' || item.type === 'income' || item.type === 'gift';
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl p-3.5 shadow-2xs border border-neutral-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      isCredit
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-orange-50 text-orange-600'
                    }`}
                  >
                    {item.type === 'recharge' && <ArrowDownRight className="w-5 h-5" />}
                    {item.type === 'withdraw' && <ArrowUpRight className="w-5 h-5" />}
                    {item.type === 'income' && <Zap className="w-5 h-5" />}
                    {item.type === 'gift' && <Gift className="w-5 h-5" />}
                    {item.type === 'purchase' && <ShoppingCart className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-neutral-900">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                    {item.details && (
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {item.details}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-sm font-extrabold ${
                      isCredit ? 'text-[#00c269]' : 'text-neutral-900'
                    }`}
                  >
                    {isCredit ? '+' : '-'}₦ {item.amount.toLocaleString()}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      item.status === 'success'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                    {item.status === 'pending' ? 'Processing' : item.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
