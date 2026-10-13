import React, { useState, useEffect } from 'react';
import { INITIAL_PRODUCTS } from '../data/initialData';
import { VIPProduct, UserState } from '../types';
import { CheckCircle2, AlertCircle, Zap, Factory, ShieldCheck } from 'lucide-react';
import { DangoteLogo } from './DangoteLogo';

interface ProductScreenProps {
  user: UserState;
  products?: VIPProduct[];
  onBuyProduct: (product: VIPProduct) => void;
  onNavigateToRecharge: () => void;
  onNavigateToMyStore: () => void;
  onCollectRevenue?: () => void;
}

export const ProductScreen: React.FC<ProductScreenProps> = ({
  user,
  products = INITIAL_PRODUCTS,
  onBuyProduct,
  onNavigateToRecharge,
  onNavigateToMyStore,
  onCollectRevenue,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<VIPProduct | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (productId: string) => {
    setImageErrors((prev) => ({ ...prev, [productId]: true }));
  };

  const handleBuyClick = (product: VIPProduct) => {
    setSelectedProduct(product);
    setErrorMsg(null);
    setShowConfirmModal(true);
  };

  const handleConfirmPurchase = () => {
    if (!selectedProduct) return;

    if (user.balance < selectedProduct.price) {
      setErrorMsg(
        `Insufficient balance (₦${user.balance.toLocaleString()}). You need ₦${selectedProduct.price.toLocaleString()} to acquire this share tranche.`
      );
      return;
    }

    onBuyProduct(selectedProduct);
    setShowConfirmModal(false);
    setSelectedProduct(null);
  };

  const hasPurchases = (user.purchasedProducts || []).length > 0;
  const claimableIncome = (user.purchasedProducts || []).reduce(
    (sum, p) => sum + (p.dailyIncome || 0),
    0
  );

  return (
    <div className="min-h-screen pb-24 bg-slate-50 text-slate-900 font-sans">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <DangoteLogo variant="wordmark" color="#1d4ed8" className="h-6" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-blue-700 uppercase tracking-wider bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
            Share Tranches
          </span>
        </div>
      </div>

      {/* Claim Dividends Banner if User Has Purchases */}
      {hasPurchases && onCollectRevenue && (
        <div className="p-4 max-w-md mx-auto">
          <button
            onClick={onCollectRevenue}
            className="w-full py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 hover:brightness-110 text-white text-xs font-black rounded-2xl shadow-md active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer border border-sky-400/30"
          >
            <Zap className="w-4 h-4 fill-sky-300 text-sky-300" />
            <span>Claim Daily Share Dividends (+₦ {claimableIncome.toLocaleString()})</span>
          </button>
        </div>
      )}

      {/* Uncluttered Product / Share Tranche Cards */}
      <div className="p-4 space-y-4 max-w-md mx-auto">
        {products.map((prod) => {
          const isAvailable = prod.status === 'available';
          const hasImgError = imageErrors[prod.id];

          return (
            <div
              key={prod.id}
              className="bg-white rounded-2xl overflow-hidden p-4 shadow-sm border border-slate-200 space-y-3 relative hover-butter-lift transition-butter"
            >
              {/* Clean Top Tier & Price Indicator */}
              <div className="flex items-center justify-between">
                <span className="bg-sky-100 text-sky-950 border border-sky-300 text-xs font-black px-3 py-1 rounded-full font-mono">
                  {prod.vipLevel} · ₦{prod.price.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-mono font-bold">
                  ≈ ${(prod.price / 1500).toFixed(2)} USD
                </span>
              </div>

              {/* Title & Authentic Refinery Image Row */}
              <div className="flex gap-3.5 items-center">
                <div className="relative w-28 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-sky-500/30 flex items-center justify-center shadow-xs">
                  {!hasImgError ? (
                    <img
                      src={prod.image}
                      alt={prod.title}
                      onError={() => handleImageError(prod.id)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-butter"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-[#0f172a] via-[#1e3a8a] to-[#0284c7] flex flex-col items-center justify-center text-sky-300 p-2 text-center">
                      <Factory className="w-6 h-6 mb-1 text-sky-300" />
                      <span className="text-[9px] font-bold text-white uppercase leading-none">
                        LEKKI REFINERY
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-1">
                    <span className="text-[8px] font-black text-sky-300 uppercase tracking-wider bg-black/80 px-1.5 py-0.5 rounded-xs border border-sky-400/30">
                      LEKKI REFINERY
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-slate-900 leading-snug">
                    {prod.title}
                  </h3>
                  <div className="text-lg font-black text-blue-700 font-mono mt-1">
                    ₦{prod.price.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="text-slate-700 text-xs font-black uppercase">Total Return</div>
                  <div className="font-black text-blue-700 font-mono mt-0.5">
                    ₦{prod.totalIncome.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="text-slate-700 text-xs font-black uppercase">Daily Dividend</div>
                  <div className="font-black text-sky-700 font-mono mt-0.5">
                    ₦{prod.dailyIncome.toLocaleString()}/day
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="text-slate-700 text-xs font-black uppercase">Yield Duration</div>
                  <div className="font-black text-slate-900 font-mono mt-0.5">
                    {prod.validityDays} Days
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="text-slate-700 text-xs font-black uppercase">Investor Quota</div>
                  <div className="font-black text-slate-900 font-mono mt-0.5">
                    5 Units / Account
                  </div>
                </div>
              </div>

              {/* Footer Allotment CTA Action */}
              <div className="pt-1 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-800 font-bold truncate flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>650,000 BPD Refinery Assets</span>
                </span>

                {isAvailable ? (
                  <button
                    onClick={() => handleBuyClick(prod)}
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-300 hover:to-cyan-400 text-slate-950 text-xs font-black shadow-sm spring-press transition-butter flex items-center gap-1.5 cursor-pointer shrink-0 border border-sky-200"
                  >
                    <Zap className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Acquire Tranche</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="py-2.5 px-4 rounded-xl bg-slate-200 text-slate-500 text-xs font-bold cursor-not-allowed shrink-0"
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription / Allotment Confirmation Modal */}
      {showConfirmModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 text-slate-900 space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-500" />

            <h3 className="text-lg font-black text-slate-900 text-center pt-1">
              Confirm Share Allotment
            </h3>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Tranche:</span>
                <span className="font-bold text-slate-900 text-right">{selectedProduct.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Price:</span>
                <span className="font-black text-blue-700 font-mono">₦{selectedProduct.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Daily Dividend:</span>
                <span className="font-black text-sky-700 font-mono">₦{selectedProduct.dailyIncome.toLocaleString()}/day</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Yield Validity:</span>
                <span className="font-bold text-slate-900">{selectedProduct.validityDays} Days</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold space-y-2">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    onNavigateToRecharge();
                  }}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg text-xs transition cursor-pointer shadow-xs"
                >
                  Deposit Funds Now
                </button>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurchase}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-md"
              >
                Confirm Acquisition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
