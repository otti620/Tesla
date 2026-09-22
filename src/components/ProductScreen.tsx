import React, { useState, useEffect } from 'react';
import { INITIAL_PRODUCTS } from '../data/initialData';
import { VIPProduct, UserState } from '../types';
import { CheckCircle2, AlertCircle, ShoppingBag, TrendingUp, Clock, Zap } from 'lucide-react';
import { calculateProductMaturity, formatTimeUntilNigerianMidnight } from '../utils/nigerianTime';

interface ProductScreenProps {
  user: UserState;
  products?: VIPProduct[];
  onBuyProduct: (product: VIPProduct) => boolean;
  onNavigateToRecharge: () => void;
  onNavigateToMyStore: () => void;
  onCollectRevenue: () => void;
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
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const myStoreCount = user.purchasedProducts.length;
  const totalRevenue = user.purchasedProducts.reduce(
    (acc, cur) => acc + cur.dailyIncome * cur.daysActive,
    0
  );

  // Check if any product has mature daily yield ready to collect (after 12 midnight Nigerian Time)
  let claimableIncome = 0;
  user.purchasedProducts.forEach((p) => {
    const maturity = calculateProductMaturity(p, now);
    if (maturity.isMature) {
      claimableIncome += maturity.claimableYield;
    }
  });

  const midnightCountdown = formatTimeUntilNigerianMidnight(now);

  const handleBuyClick = (product: VIPProduct) => {
    if (product.status !== 'available') return;
    setSelectedProduct(product);
    setShowConfirmModal(true);
    setFeedback(null);
  };

  const confirmPurchase = () => {
    if (!selectedProduct) return;

    if (user.balance < selectedProduct.price) {
      setFeedback({
        type: 'error',
        message: `Insufficient balance! You need ₦ ${selectedProduct.price.toLocaleString()} but currently have ₦ ${user.balance.toLocaleString()}.`,
      });
      return;
    }

    const success = onBuyProduct(selectedProduct);
    if (success) {
      setFeedback({
        type: 'success',
        message: `Successfully purchased ${selectedProduct.vipLevel} (${selectedProduct.title})!`,
      });
      setTimeout(() => {
        setShowConfirmModal(false);
        setSelectedProduct(null);
        setFeedback(null);
      }, 1400);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-neutral-100 text-neutral-900">
      {/* Top Banner Stats Header (Screenshot 9) */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-20 px-3 py-3 shadow-xs">
        <div className="grid grid-cols-2 gap-2 text-white text-center">
          {/* My Store Button */}
          <button
            onClick={onNavigateToMyStore}
            className="bg-[#00c269] hover:bg-[#00ab5c] rounded-lg py-2 px-3 flex flex-col items-center justify-center shadow-xs active:scale-95 transition cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold leading-tight">{myStoreCount}</span>
              <ShoppingBag className="w-4 h-4 text-emerald-100" />
            </div>
            <span className="text-xs font-semibold">My store</span>
          </button>

          {/* Total Revenue Button */}
          <button
            onClick={onNavigateToMyStore}
            className="bg-[#00c269] hover:bg-[#00ab5c] rounded-lg py-2 px-3 flex flex-col items-center justify-center shadow-xs active:scale-95 transition cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold leading-tight">
                ₦ {totalRevenue.toLocaleString()}
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-100" />
            </div>
            <span className="text-xs font-semibold">Total revenue</span>
          </button>
        </div>

        {myStoreCount > 0 && (
          <div className="mt-2">
            {claimableIncome > 0 ? (
              <button
                type="button"
                onClick={onCollectRevenue}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
              >
                <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>Claim Daily Income (+₦ {claimableIncome.toLocaleString()})</span>
              </button>
            ) : (
              <div className="w-full py-2 bg-neutral-900 text-white text-xs font-medium rounded-lg shadow-2xs border border-neutral-800 flex items-center justify-center gap-2 select-none">
                <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  Next Income Drop (12:00 AM WAT) in:{' '}
                  <strong className="font-mono text-emerald-300 font-semibold">
                    {midnightCountdown.formattedString}
                  </strong>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product List (matching screenshot 9 cards) */}
      <div className="p-3 space-y-3">
        {products.map((prod) => {
          const isAvailable = prod.status === 'available';

          return (
            <div
              key={prod.id}
              className="bg-white rounded-xl overflow-hidden p-3.5 shadow-xs border border-neutral-200/80 transition hover:shadow-md"
            >
              <div className="flex gap-3.5 items-start">
                {/* Product/Facility Image */}
                <div className="relative w-28 h-24 rounded-lg overflow-hidden shrink-0 bg-neutral-900">
                  <img
                    src={prod.image}
                    alt={prod.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded-xs text-[9px] font-bold text-white uppercase tracking-wider">
                    TESLA
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-black text-neutral-900 tracking-tight">
                          {prod.vipLevel}
                        </h3>
                        <span className="text-[10px] px-1.5 py-0.2 bg-neutral-100 text-neutral-600 rounded-sm font-medium">
                          {prod.category}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 font-semibold truncate max-w-[150px] sm:max-w-[200px]">
                        {prod.title}
                      </p>
                    </div>

                    {/* Action Button */}
                    {isAvailable ? (
                      <button
                        onClick={() => handleBuyClick(prod)}
                        className="py-1 px-4 rounded-md bg-[#00c269] hover:bg-[#00ab5c] text-white text-xs font-bold active:scale-95 transition shadow-xs shrink-0 cursor-pointer"
                      >
                        Buy
                      </button>
                    ) : (
                      <button
                        disabled
                        className="py-1 px-2.5 rounded-md bg-neutral-400 text-white text-xs font-medium cursor-not-allowed shrink-0"
                      >
                        Coming soon
                      </button>
                    )}
                  </div>

                  <div className="space-y-0.5 mt-1 text-xs">
                    <div className="flex items-center gap-1 text-neutral-700">
                      <span>Price:</span>
                      <span className="font-bold text-[#00c269]">
                        ₦ {prod.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-neutral-700">
                      <span>Validity period:</span>
                      <span className="font-bold text-[#00c269]">{prod.validityDays}</span>
                      <span>days</span>
                    </div>
                    <div className="flex items-center gap-1 text-neutral-700">
                      <span>Daily income:</span>
                      <span className="font-bold text-[#00c269]">
                        ₦ {prod.dailyIncome.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-neutral-700">
                      <span>Total income:</span>
                      <span className="font-bold text-[#00c269]">
                        ₦ {prod.totalIncome.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Purchase Confirmation Modal */}
      {showConfirmModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-neutral-900 border-b pb-2">
              Purchase {selectedProduct.vipLevel}
            </h3>

            <div className="text-xs space-y-2 text-neutral-600 bg-neutral-50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span>Product:</span>
                <span className="font-semibold text-neutral-800">{selectedProduct.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Cost:</span>
                <span className="font-bold text-[#00c269]">₦ {selectedProduct.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Daily Returns:</span>
                <span className="font-bold text-emerald-600">₦ {selectedProduct.dailyIncome.toLocaleString()}/day</span>
              </div>
              <div className="flex justify-between">
                <span>Validity:</span>
                <span>{selectedProduct.validityDays} days</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span>Your Balance:</span>
                <span className="font-bold text-neutral-800">₦ {user.balance.toLocaleString()}</span>
              </div>
            </div>

            {feedback && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedProduct(null);
                  setFeedback(null);
                }}
                className="flex-1 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-50"
              >
                Cancel
              </button>

              {user.balance >= selectedProduct.price ? (
                <button
                  onClick={confirmPurchase}
                  className="flex-1 py-2.5 rounded-lg bg-[#00c269] hover:bg-[#00ad5e] text-white text-xs font-bold active:scale-95 transition"
                >
                  Confirm Buy
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    onNavigateToRecharge();
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold active:scale-95 transition"
                >
                  Recharge Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
