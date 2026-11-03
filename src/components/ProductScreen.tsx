import React, { useState, useEffect } from 'react';
import { INITIAL_PRODUCTS } from '../data/initialData';
import { VIPProduct, UserState } from '../types';
import {
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  TrendingUp,
  Clock,
  Zap,
  Car,
  ShieldCheck,
  Sparkles,
  LayoutGrid,
  Rows3,
  Users,
  Gauge,
  Calendar,
  ArrowUpRight,
  Lock,
} from 'lucide-react';
import { calculateProductMaturity, formatTimeUntilNigerianMidnight } from '../utils/nigerianTime';

interface ProductScreenProps {
  user: UserState;
  products?: VIPProduct[];
  onBuyProduct: (product: VIPProduct) => boolean;
  onNavigateToRecharge: () => void;
  onNavigateToMyStore: () => void;
  onCollectRevenue: () => void;
}

const FLEET_SPECS: Record<string, { seats: string; tierClass: string; routeZone: string }> = {
  VIP1: { seats: '4 Seats • Compact AC', tierClass: 'City Hop', routeZone: 'Metro Zone A' },
  VIP2: { seats: '4 Seats • Executive AC', tierClass: 'Prime Sedan', routeZone: 'Business District' },
  VIP3: { seats: '4 Seats • Comfort Plus', tierClass: 'Prime Plus', routeZone: 'Airport & Express' },
  VIP4: { seats: '6 Seats • XL Cabin', tierClass: 'Prime SUV', routeZone: 'Inter-City & VIP' },
  VIP5: { seats: '4 Seats • Chauffeur', tierClass: 'Ola Lux', routeZone: ' Diplomat & Hotel' },
  VIP6: { seats: 'Zero-Emission EV', tierClass: 'Electric Fleet', routeZone: 'Smart Green Grid' },
  VIP7: { seats: 'Autonomous Pod', tierClass: 'AI Mobility', routeZone: 'Tech Corridor' },
  VIP8: { seats: '18 Seats • Sprinter', tierClass: 'Express Transit', routeZone: 'Regional Highway' },
  VIP9: { seats: 'Multi-Unit Hub', tierClass: 'Mega Terminal', routeZone: 'National Network' },
};

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
  const [filterTab, setFilterTab] = useState<'all' | 'available' | 'upcoming'>('all');
  const [viewMode, setViewMode] = useState<'showroom' | 'grid'>('showroom');

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

  const filteredProducts = products.filter((prod) => {
    if (filterTab === 'available') return prod.status === 'available';
    if (filterTab === 'upcoming') return prod.status !== 'available';
    return true;
  });

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
        message: `Successfully deployed ${selectedProduct.vipLevel} (${selectedProduct.title}) to your fleet!`,
      });
      setTimeout(() => {
        setShowConfirmModal(false);
        setSelectedProduct(null);
        setFeedback(null);
      }, 1400);
    }
  };

  return (
    <div className="min-h-screen pb-28 bg-[#f4f6f0] text-neutral-900">
      {/* Top Fleet Command Header */}
      <div className="bg-neutral-950 text-white sticky top-0 z-20 px-3.5 pt-3.5 pb-3 border-b border-[#a3e635]/30 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#a3e635] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#a3e635]">
                Ola Cabs Fleet Showroom
              </span>
            </div>
            <h1 className="text-base font-black text-white tracking-tight">
              Deploy Ride-Hailing Vehicles
            </h1>
          </div>

          {/* Layout Toggle */}
          <div className="flex items-center bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
            <button
              type="button"
              onClick={() => setViewMode('showroom')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'showroom'
                  ? 'bg-[#a3e635] text-neutral-950'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Showroom Cards"
            >
              <Rows3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#a3e635] text-neutral-950'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="2-Column Dispatch Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Fleet Garage & Revenue Summary */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onNavigateToMyStore}
            className="bg-neutral-900 hover:bg-neutral-800 border border-[#a3e635]/35 text-white rounded-xl py-2 px-3 flex items-center justify-between shadow-xs active:scale-95 transition cursor-pointer"
          >
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Active Garage
              </span>
              <span className="text-base font-black text-[#a3e635]">
                {myStoreCount} {myStoreCount === 1 ? 'Cab' : 'Cabs'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#a3e635]/15 border border-[#a3e635]/30 flex items-center justify-center">
              <Car className="w-4 h-4 text-[#a3e635]" />
            </div>
          </button>

          <button
            onClick={onNavigateToMyStore}
            className="bg-[#a3e635] hover:bg-[#84cc16] border border-[#84cc16] text-neutral-950 rounded-xl py-2 px-3 flex items-center justify-between shadow-xs active:scale-95 transition cursor-pointer"
          >
            <div className="text-left min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-800 block">
                Fleet Revenue
              </span>
              <span className="text-base font-black text-neutral-950 truncate block">
                ₦ {totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-neutral-950/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-neutral-950" />
            </div>
          </button>
        </div>

        {/* Daily Yield Claim / Countdown Strip */}
        {myStoreCount > 0 && (
          <div className="mt-2.5">
            {claimableIncome > 0 ? (
              <button
                type="button"
                onClick={onCollectRevenue}
                className="w-full py-2 bg-[#a3e635] hover:bg-[#84cc16] text-neutral-950 text-xs font-black rounded-lg shadow-md active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
              >
                <Zap className="w-4 h-4 fill-neutral-950 text-neutral-950" />
                <span>Claim Daily Fleet Fare (+₦ {claimableIncome.toLocaleString()})</span>
              </button>
            ) : (
              <div className="w-full py-1.5 bg-neutral-900 text-white text-[11px] font-medium rounded-lg border border-neutral-800 flex items-center justify-center gap-2 select-none">
                <Clock className="w-3.5 h-3.5 text-[#a3e635] shrink-0" />
                <span>
                  Next Fare Settlement (12:00 AM WAT) in:{' '}
                  <strong className="font-mono text-[#a3e635] font-bold">
                    {midnightCountdown.formattedString}
                  </strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 mt-3">
          {[
            { id: 'all', label: `All Fleets (${products.length})` },
            {
              id: 'available',
              label: `Active Dispatch (${products.filter((p) => p.status === 'available').length})`,
            },
            {
              id: 'upcoming',
              label: `Upcoming (${products.filter((p) => p.status !== 'available').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as 'all' | 'available' | 'upcoming')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-[#a3e635] text-neutral-950 shadow-2xs'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fleet Catalog Content */}
      <div className="p-3.5">
        {viewMode === 'showroom' ? (
          /* SHOWROOM BANNER CARDS VIEW */
          <div className="space-y-4">
            {filteredProducts.map((prod) => {
              const isAvailable = prod.status === 'available';
              const ownedCount = user.purchasedProducts.filter((p) => p.id === prod.id).length;
              const dailyRoiPct = ((prod.dailyIncome / prod.price) * 100).toFixed(1);
              const specs = FLEET_SPECS[prod.vipLevel] || {
                seats: '4 Seats • AC Cab',
                tierClass: prod.category,
                routeZone: 'Metro Zone',
              };

              return (
                <div
                  key={prod.id}
                  className={`rounded-2xl overflow-hidden bg-white border transition shadow-sm ${
                    isAvailable
                      ? 'border-neutral-200/90 hover:border-[#65a30d]'
                      : 'border-neutral-200 opacity-85'
                  }`}
                >
                  {/* Top Vehicle Showroom Hero Banner */}
                  <div className="relative h-44 w-full bg-neutral-950 overflow-hidden">
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className={`w-full h-full object-cover transition-transform duration-500 ${
                        isAvailable ? 'hover:scale-105' : 'grayscale-[35%]'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/35 to-black/30" />

                    {/* Top Left Badges: VIP Level + Category */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-md bg-[#a3e635] text-neutral-950 text-xs font-black tracking-wider shadow-sm">
                        {prod.vipLevel}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-neutral-950/85 backdrop-blur-md text-white border border-white/15 text-[10px] font-bold">
                        {prod.category}
                      </span>
                    </div>

                    {/* Top Right Status / Daily Yield Badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {ownedCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-[#a3e635]/20 border border-[#a3e635] text-[#a3e635] text-[10px] font-black backdrop-blur-md">
                          {ownedCount} Owned
                        </span>
                      )}
                      {isAvailable ? (
                        <span className="px-2.5 py-1 rounded-md bg-neutral-950/90 border border-[#a3e635]/50 text-[#a3e635] text-[10px] font-black flex items-center gap-1 backdrop-blur-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-ping" />
                          {dailyRoiPct}% / DAY
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md bg-neutral-900/90 border border-white/20 text-neutral-300 text-[10px] font-bold flex items-center gap-1 backdrop-blur-md">
                          <Lock className="w-3 h-3" />
                          RESERVED
                        </span>
                      )}
                    </div>

                    {/* Bottom Overlay: Vehicle Title & Ride Specs */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2">
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-xs">
                          {prod.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-neutral-300 font-semibold">
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3 text-[#a3e635]" />
                            {specs.seats}
                          </span>
                          <span className="text-neutral-600">•</span>
                          <span className="inline-flex items-center gap-1">
                            <Gauge className="w-3 h-3 text-[#a3e635]" />
                            {specs.routeZone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Metrics Bento Row */}
                  <div className="p-3.5 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {/* Daily Income */}
                      <div className="bg-lime-50/90 border border-lime-200/80 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                          Daily Fare
                        </span>
                        <span className="text-sm sm:text-base font-black text-[#4d7c0f] mt-0.5 block">
                          ₦ {prod.dailyIncome.toLocaleString()}
                        </span>
                      </div>

                      {/* Contract Cycle */}
                      <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                          Fleet Cycle
                        </span>
                        <span className="text-sm sm:text-base font-black text-neutral-900 mt-0.5 block">
                          {prod.validityDays} Days
                        </span>
                      </div>

                      {/* Total Return */}
                      <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                          Total Yield
                        </span>
                        <span className="text-sm sm:text-base font-black text-[#a3e635] mt-0.5 block">
                          ₦ {prod.totalIncome.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Activation Footer Bar */}
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                          Fleet Activation Cost
                        </span>
                        <div className="text-lg font-black text-neutral-950 tracking-tight">
                          ₦ {prod.price.toLocaleString()}
                        </div>
                      </div>

                      {isAvailable ? (
                        <button
                          onClick={() => handleBuyClick(prod)}
                          className="px-5 py-2.5 rounded-xl bg-[#a3e635] hover:bg-[#84cc16] text-neutral-950 text-xs font-black active:scale-95 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Deploy Fleet</span>
                          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2.5 rounded-xl bg-neutral-200 text-neutral-500 text-xs font-bold cursor-not-allowed flex items-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Coming Soon</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* COMPACT 2-COLUMN DISPATCH GRID VIEW */
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((prod) => {
              const isAvailable = prod.status === 'available';
              const ownedCount = user.purchasedProducts.filter((p) => p.id === prod.id).length;

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-28 bg-neutral-950 overflow-hidden">
                      <img
                        src={prod.image}
                        alt={prod.title}
                        className={`w-full h-full object-cover ${
                          !isAvailable ? 'grayscale-[40%]' : ''
                        }`}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/30" />

                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-sm bg-[#a3e635] text-neutral-950 text-[10px] font-black">
                        {prod.vipLevel}
                      </span>

                      {ownedCount > 0 && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-sm bg-neutral-950/90 text-[#a3e635] border border-[#a3e635]/40 text-[9px] font-black">
                          x{ownedCount}
                        </span>
                      )}

                      <div className="absolute bottom-1.5 left-2 right-2">
                        <p className="text-[11px] font-black text-white truncate leading-tight">
                          {prod.title}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center bg-lime-50 px-2 py-1 rounded-md border border-lime-200/70">
                        <span className="text-neutral-600 font-semibold">Daily:</span>
                        <span className="font-black text-[#4d7c0f]">
                          +₦{prod.dailyIncome.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center px-1">
                        <span className="text-neutral-500">Total ({prod.validityDays}d):</span>
                        <span className="font-bold text-neutral-800">
                          ₦{prod.totalIncome.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center px-1 pt-0.5 border-t border-neutral-100">
                        <span className="text-neutral-500">Cost:</span>
                        <span className="font-black text-neutral-950">
                          ₦{prod.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 pt-0">
                    {isAvailable ? (
                      <button
                        onClick={() => handleBuyClick(prod)}
                        className="w-full py-2 rounded-lg bg-[#a3e635] hover:bg-[#84cc16] text-neutral-950 text-xs font-black active:scale-95 transition cursor-pointer"
                      >
                        Deploy • ₦{prod.price.toLocaleString()}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2 rounded-lg bg-neutral-200 text-neutral-500 text-xs font-bold cursor-not-allowed"
                      >
                        Coming Soon
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Purchase Confirmation Modal */}
      {showConfirmModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-neutral-200">
            {/* Modal Vehicle Header */}
            <div className="relative h-32 bg-neutral-950">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.title}
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-0.5 rounded-md bg-[#a3e635] text-neutral-950 text-xs font-black">
                  {selectedProduct.vipLevel} DISPATCH
                </span>
              </div>
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-base font-black text-white leading-tight">
                  {selectedProduct.title}
                </h3>
                <p className="text-[11px] text-[#a3e635] font-bold">
                  {selectedProduct.category}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs space-y-2 text-neutral-600 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80">
                <div className="flex justify-between">
                  <span>Activation Cost:</span>
                  <span className="font-black text-neutral-950">
                    ₦ {selectedProduct.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Fare Yield:</span>
                  <span className="font-black text-[#4d7c0f]">
                    +₦ {selectedProduct.dailyIncome.toLocaleString()} / day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Contract Duration:</span>
                  <span className="font-bold text-neutral-800">
                    {selectedProduct.validityDays} Days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Contract Payout:</span>
                  <span className="font-black text-[#4d7c0f]">
                    ₦ {selectedProduct.totalIncome.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-2 mt-1">
                  <span>Available Wallet Balance:</span>
                  <span className="font-black text-neutral-900">
                    ₦ {user.balance.toLocaleString()}
                  </span>
                </div>
              </div>

              {feedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 font-semibold ${
                    feedback.type === 'success'
                      ? 'bg-lime-100 text-lime-950 border border-lime-300'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#4d7c0f]" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedProduct(null);
                    setFeedback(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>

                {user.balance >= selectedProduct.price ? (
                  <button
                    onClick={confirmPurchase}
                    className="flex-1 py-2.5 rounded-xl bg-[#a3e635] hover:bg-[#84cc16] text-neutral-950 text-xs font-black active:scale-95 transition cursor-pointer shadow-sm"
                  >
                    Confirm Deploy
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      onNavigateToRecharge();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-900 text-[#a3e635] border border-[#a3e635]/40 text-xs font-black active:scale-95 transition cursor-pointer"
                  >
                    Recharge Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
