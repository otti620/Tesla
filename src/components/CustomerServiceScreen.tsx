import React from 'react';
import { ChevronLeft, ChevronRight, Send, Clock } from 'lucide-react';

interface CustomerServiceScreenProps {
  onBack: () => void;
  onOpenTelegram: (channelName: string) => void;
}

export const CustomerServiceScreen: React.FC<CustomerServiceScreenProps> = ({
  onBack,
  onOpenTelegram,
}) => {
  return (
    <div className="min-h-screen pb-16 bg-neutral-100 text-neutral-900">
      {/* Header (Screenshot 13) */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-neutral-800 hover:bg-neutral-100 rounded-full transition active:scale-95"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <h1 className="text-base font-bold text-neutral-900">Customer service</h1>

        <div className="w-7" />
      </div>

      {/* Top Banner Image (Screenshot 13) */}
      <div className="relative h-48 w-full overflow-hidden bg-neutral-900">
        <img
          src="https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=800&auto=format&fit=crop&q=80"
          alt="Tesla Service"
          className="w-full h-full object-cover brightness-70"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
            Tesla Official Support
          </span>
          <h2 className="text-lg font-bold">24/7 Global Member Care</h2>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Contact Links Card (Screenshot 13) */}
        <div className="bg-white rounded-xl overflow-hidden shadow-xs border border-neutral-200 divide-y divide-neutral-100">
          {/* Telegram */}
          <button
            onClick={() => onOpenTelegram('Tesla Official 1-on-1 Support')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-50 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0088cc] flex items-center justify-center text-white shadow-xs">
                <Send className="w-5 h-5 fill-white -ml-0.5" />
              </div>
              <span className="text-sm font-semibold text-neutral-800">Telegram</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          </button>

          {/* Telegram Channel */}
          <button
            onClick={() => onOpenTelegram('Tesla Energy Official Channel')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-50 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0088cc] flex items-center justify-center text-white shadow-xs">
                <Send className="w-5 h-5 fill-white -ml-0.5" />
              </div>
              <span className="text-sm font-semibold text-neutral-800">Telegram channel</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          </button>

          {/* Telegram Group */}
          <button
            onClick={() => onOpenTelegram('Tesla Global Community Group')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-50 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0088cc] flex items-center justify-center text-white shadow-xs">
                <Send className="w-5 h-5 fill-white -ml-0.5" />
              </div>
              <span className="text-sm font-semibold text-neutral-800">Telegram group</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Customer Service Hours & Notice (Screenshot 13) */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-neutral-200 space-y-3">
          <div className="text-center pb-2 border-b border-neutral-100">
            <div className="inline-flex items-center gap-1.5 text-base font-extrabold text-neutral-900">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>9:00-20:00</span>
            </div>
            <div className="text-xs text-neutral-600 font-medium mt-0.5">
              Customer service time online
            </div>
          </div>

          <ol className="space-y-2 text-xs text-neutral-600 leading-relaxed">
            <li>
              1. If you cannot open the official Telegram page mentioned above, please use a different browser.
            </li>
            <li>
              2. If you have any questions about our platform, please contact our online customer service. They will answer all your questions.
            </li>
            <li>
              3. If our online customer service does not reply to your message immediately, please be patient. This is because there are many messages. Our online customer service will reply to your message as soon as possible. Thank you for your understanding and support!
            </li>
            <li className="font-semibold text-neutral-800">
              4. If you want to earn more money, be sure to join our official Telegram group!
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
