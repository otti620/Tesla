import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ArrowDownRight, 
  ArrowUpRight, 
  Gift, 
  ShoppingCart, 
  Zap, 
  Send, 
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { TransactionRecord } from '../types';
import { TeslaLogo } from './TeslaLogo';

interface RecordsModalProps {
  records: TransactionRecord[];
  onBack: () => void;
  onOpenTelegram?: (channelName: string, customUrl?: string) => void;
  managerTelegramUrl?: string;
}

export const RecordsModal: React.FC<RecordsModalProps> = ({ 
  records, 
  onBack,
  onOpenTelegram,
  managerTelegramUrl = 'https://t.me/sallyservice4',
}) => {
  const [filter, setFilter] = useState<'all' | 'recharge' | 'withdraw' | 'income' | 'gift'>('all');

  const filtered = records.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'recharge') return r.type === 'recharge';
    if (filter === 'withdraw') return r.type === 'withdraw';
    if (filter === 'income') return r.type === 'income';
    if (filter === 'gift') return r.type === 'gift' || r.type === 'bonus';
    return true;
  });

  const totalCredit = records
    .filter((r) => r.type === 'recharge' || r.type === 'bonus' || r.type === 'income' || r.type === 'gift' || r.type === 'commission')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const totalDebit = records
    .filter((r) => r.type === 'withdraw' || r.type === 'purchase')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const handleOpenManager = () => {
    if (onOpenTelegram) {
      onOpenTelegram('Customer Service Manager (Sally)', managerTelegramUrl);
    } else {
      window.open(managerTelegramUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-neutral-950 text-white font-sans">
      {/* Top Header - Ola Cabs Jet Black & Lime */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-[#a3e635]/20 shadow-lg backdrop-blur-md">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1 text-white hover:bg-white/10 rounded-full transition active:scale-95 cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h1 className="text-base font-black tracking-wide text-white">
            Account Records
          </h1>
          <p className="text-[10px] text-[#a3e635] font-bold tracking-wider uppercase">
            Ola Cabs Member Ledger
          </p>
        </div>

        <button
          onClick={handleOpenManager}
          className="p-1.5 -mr-1 text-[#a3e635] hover:bg-white/10 rounded-full transition active:scale-95 cursor-pointer flex items-center gap-1"
          title="Contact Manager Sally on Telegram"
        >
          <Send className="w-5 h-5 -rotate-12" />
        </button>
      </div>

      {/* Financial Portfolio Summary Banner */}
      <div className="p-4 max-w-lg mx-auto space-y-4">
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-[#1a2e05] rounded-3xl p-4 border border-[#a3e635]/25 shadow-xl relative overflow-hidden">
          <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-[#a3e635] via-[#84cc16] to-[#65a30d]" />

          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-black border border-[#a3e635]/40 flex items-center justify-center p-1.5 shrink-0">
                <TeslaLogo variant="icon" color="#ffffff" className="w-full h-full" />
              </div>
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Transaction Audit
                </span>
                <p className="text-[10px] text-neutral-300">
                  Real-time Ola Cabs Fleet Settlement History
                </p>
              </div>
            </div>

            <span className="text-xs font-black font-mono text-[#a3e635]">
              {records.length} Records
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <div className="bg-black/50 rounded-2xl p-2.5 border border-white/10">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Total Credits / Inflow
              </div>
              <div className="text-base font-black text-[#a3e635] font-mono mt-0.5">
                +₦ {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-black/50 rounded-2xl p-2.5 border border-white/10">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Total Outflows / Debits
              </div>
              <div className="text-base font-black text-white font-mono mt-0.5">
                -₦ {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Telegram Manager Support Banner */}
        <div className="bg-neutral-900 rounded-2xl p-3 border border-[#a3e635]/25 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#a3e635] flex items-center justify-center text-neutral-950 shrink-0 shadow-sm">
              <Send className="w-4 h-4 -rotate-12" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                <span>Record Inquiries &amp; Verification</span>
              </div>
              <p className="text-[11px] text-[#a3e635] truncate">
                Contact Telegram Manager Sally (@sallyservice4)
              </p>
            </div>
          </div>

          <a
            href={managerTelegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (onOpenTelegram) {
                e.preventDefault();
                onOpenTelegram('Customer Service Manager (Sally)', managerTelegramUrl);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-[#a3e635] hover:bg-[#bef264] text-neutral-950 text-[11px] font-black transition flex items-center gap-1 shrink-0 active:scale-95 shadow-xs"
          >
            <span>Contact</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Filter Tabs - Ola Cabs Colours */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Records' },
            { id: 'recharge', label: 'Deposits' },
            { id: 'income', label: 'Fleet Yield' },
            { id: 'withdraw', label: 'Payouts' },
            { id: 'gift', label: 'Gifts & Bonus' },
          ].map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as typeof filter)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition shrink-0 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#a3e635] text-neutral-950 font-black shadow-md shadow-[#a3e635]/20'
                    : 'bg-neutral-900 text-neutral-300 hover:text-white border border-white/10 hover:bg-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Transaction Records List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-neutral-900/60 rounded-3xl p-8 border border-white/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#a3e635]">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No Records Found</h3>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                No transaction records match the current filter. Future Ola Cabs fleet yields and deposits will automatically appear here.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const isCredit = 
                item.type === 'recharge' || 
                item.type === 'bonus' || 
                item.type === 'income' || 
                item.type === 'gift' || 
                item.type === 'commission';

              return (
                <div
                  key={item.id}
                  className="bg-neutral-900 rounded-2xl p-3.5 border border-white/10 shadow-lg hover:border-[#a3e635]/30 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        item.type === 'recharge'
                          ? 'bg-[#a3e635]/15 text-[#a3e635] border-[#a3e635]/30'
                          : item.type === 'withdraw'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : item.type === 'income'
                          ? 'bg-[#a3e635]/20 text-[#a3e635] border-[#a3e635]/40'
                          : item.type === 'gift' || item.type === 'bonus'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-white/10 text-white border-white/20'
                      }`}
                    >
                      {item.type === 'recharge' && <ArrowDownRight className="w-5 h-5 stroke-[2.2]" />}
                      {item.type === 'withdraw' && <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />}
                      {item.type === 'income' && <Zap className="w-5 h-5 stroke-[2.2]" />}
                      {(item.type === 'gift' || item.type === 'bonus') && <Gift className="w-5 h-5 stroke-[2.2]" />}
                      {item.type === 'purchase' && <ShoppingCart className="w-5 h-5 stroke-[2.2]" />}
                      {item.type === 'commission' && <Sparkles className="w-5 h-5 stroke-[2.2]" />}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        {new Date(item.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      {item.details && (
                        <div className="text-[10px] text-[#a3e635]/85 font-mono truncate mt-0.5">
                          {item.details}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-black font-mono ${
                        isCredit ? 'text-[#a3e635]' : 'text-white'
                      }`}
                    >
                      {isCredit ? '+' : '-'}₦ {item.amount.toLocaleString()}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border mt-1 ${
                        item.status === 'success'
                          ? 'bg-[#a3e635]/20 text-[#a3e635] border-[#a3e635]/30'
                          : item.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                      }`}
                    >
                      {item.status === 'pending' ? 'Processing' : item.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

