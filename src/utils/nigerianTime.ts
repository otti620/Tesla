/**
 * Nigerian Time (WAT - West Africa Time, UTC+1) Daily Settlement Utilities
 * 
 * In this system, VIP product income drops at every next calendar day after 12:00 midnight WAT (00:00 UTC+1),
 * rather than waiting a strict 24 hours from arbitrary purchase times.
 */

import { PurchasedProductItem } from '../types';
import { getCanonicalProduct } from './productUtils';

export const WAT_OFFSET_MS = 1 * 60 * 60 * 1000; // 1 hour in ms (UTC+1)
export const MS_PER_DAY = 24 * 60 * 60 * 1000; // 86,400,000 ms

/**
 * Returns the integer day index in Nigerian Time (UTC+1).
 * Day 0 started at 1970-01-01 00:00:00 WAT (1969-12-31 23:00:00 UTC).
 */
export function getNigerianDayIndex(timestampMs: number = Date.now()): number {
  return Math.floor((timestampMs + WAT_OFFSET_MS) / MS_PER_DAY);
}

/**
 * Returns the timestamp for midnight (00:00:00.000 WAT) of the current day in Nigerian Time.
 */
export function getNigerianMidnight(timestampMs: number = Date.now()): number {
  const dayIndex = getNigerianDayIndex(timestampMs);
  return dayIndex * MS_PER_DAY - WAT_OFFSET_MS;
}

/**
 * Returns the timestamp for the NEXT 12:00 Midnight (00:00:00.000 WAT) in Nigerian Time.
 */
export function getNextNigerianMidnight(timestampMs: number = Date.now()): number {
  const dayIndex = getNigerianDayIndex(timestampMs);
  return (dayIndex + 1) * MS_PER_DAY - WAT_OFFSET_MS;
}

/**
 * Calculates maturity, claimable yield, and countdown until the next midnight drop for a purchased product.
 * 
 * STRICT RULES:
 * 1. Product daily yield rate is strictly the canonical rate (VIP 1 = ₦800, VIP 2 = ₦2,300, VIP 3 = ₦4,800, VIP 4 = ₦10,000, etc.).
 * 2. Users CANNOT accumulate or back-claim for missed days. Each mature drop is strictly 1 day's income.
 * 3. A drop becomes mature when the current Nigerian day index (UTC+1) is greater than the day index of the last claim/purchase.
 * 4. Runtime (daysActive) increments permanently upon each successful claim until reaching validityDays (100 days).
 */
export function calculateProductMaturity(product: PurchasedProductItem, nowMs: number = Date.now()): {
  matureDays: number;
  claimableYield: number;
  isMature: boolean;
  isExpired: boolean;
  remainingMsToNextDrop: number;
  hoursLeft: number;
  minutesLeft: number;
  secondsLeft: number;
  currentIncome: number;
  progressPct: number;
} {
  const currentDayIndex = getNigerianDayIndex(nowMs);
  const canonical = getCanonicalProduct(product.productId) || getCanonicalProduct(product.vipLevel);
  const dailyIncome = canonical ? canonical.dailyIncome : (product.dailyIncome || 800);
  const validityDays = canonical ? canonical.validityDays : (product.validityDays || 100);

  const daysActive = Math.min(validityDays, Math.max(0, Number(product.daysActive) || 0));
  const isExpired = daysActive >= validityDays;

  // Determine the baseline day index when this product was last claimed or purchased
  let lastDayIndex: number;
  if (product.lastClaimDate) {
    lastDayIndex = getNigerianDayIndex(product.lastClaimDate);
  } else if (product.purchaseDate) {
    lastDayIndex = getNigerianDayIndex(product.purchaseDate);
  } else {
    lastDayIndex = currentDayIndex;
  }

  // A drop is mature only if a new calendar day has started since last claim/purchase.
  // Rule: Users CANNOT claim for days they missed. If mature, they can claim strictly 1 day's drop.
  const isNewDay = currentDayIndex > lastDayIndex;
  const isMature = !isExpired && isNewDay;
  const matureDays = isMature ? 1 : 0;
  const claimableYield = isMature ? dailyIncome : 0;

  // Next drop occurs at next 12 midnight WAT (00:00 WAT)
  const nextMidnight = getNextNigerianMidnight(nowMs);
  const remainingMsToNextDrop = isExpired ? 0 : Math.max(0, nextMidnight - nowMs);

  const hoursLeft = Math.floor(remainingMsToNextDrop / (1000 * 60 * 60));
  const minutesLeft = Math.floor((remainingMsToNextDrop % (1000 * 60 * 60)) / (1000 * 60));
  const secondsLeft = Math.floor((remainingMsToNextDrop % (1000 * 60)) / 1000);

  const currentIncome = dailyIncome * daysActive;
  const progressPct = Math.min(100, (daysActive / validityDays) * 100);

  return {
    matureDays,
    claimableYield,
    isMature,
    isExpired,
    remainingMsToNextDrop,
    hoursLeft,
    minutesLeft,
    secondsLeft,
    currentIncome,
    progressPct,
  };
}

/**
 * Returns formatted time remaining until the next Nigerian midnight (00:00 WAT).
 */
export function formatTimeUntilNigerianMidnight(nowMs: number = Date.now()): {
  hours: string;
  minutes: string;
  seconds: string;
  formattedString: string;
} {
  const nextMidnight = getNextNigerianMidnight(nowMs);
  const remainingMs = Math.max(0, nextMidnight - nowMs);

  const h = Math.floor(remainingMs / (1000 * 60 * 60));
  const m = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((remainingMs % (1000 * 60)) / 1000);

  const hours = String(h).padStart(2, '0');
  const minutes = String(m).padStart(2, '0');
  const seconds = String(s).padStart(2, '0');

  return {
    hours,
    minutes,
    seconds,
    formattedString: `${hours}h ${minutes}m ${seconds}s`,
  };
}
