import { UserState, TransactionRecord } from '../types';

/**
 * Safely migrates legacy Naira balances (>= 1,000 NGN) to USD ($1.30 USD per 1,000 NGN).
 * Protects existing USD balances ($1 to $10,000+) from being erroneously shrunk.
 * Automatically repairs any balance that was previously shrunk by an incorrect threshold.
 */
export function migrateUserBalanceToUsd(u: UserState): UserState {
  if (!u) return u;
  const copy: UserState & { currencyMigrated?: boolean } = { ...u };

  // If already migrated and marked, do not convert balance again
  if (copy.currencyMigrated) {
    return copy;
  }

  // 1. Repair balance if it was previously erroneously shrunk by dividing a USD balance
  if (Array.isArray(copy.records) && copy.records.length > 0) {
    let netFromRecords = 0;
    for (const r of copy.records) {
      if (r.status === 'success') {
        if (r.type === 'recharge' || r.type === 'bonus' || r.type === 'commission') {
          netFromRecords += Number(r.amount) || 0;
        } else if (r.type === 'withdraw' || r.type === 'purchase') {
          netFromRecords -= Number(r.amount) || 0;
        }
      }
    }
    // If net balance from records is positive and current balance was shrunk to near-zero
    if (netFromRecords > 0 && typeof copy.balance === 'number' && copy.balance < 0.50 && netFromRecords >= 0.50) {
      copy.balance = Number(netFromRecords.toFixed(2));
    }
  }

  // 2. Convert legacy NGN balance (stored as 1000 NGN, 5000 NGN, 13000 NGN, etc.)
  // Legacy NGN balances were strictly >= 1000 NGN. Exchange rate: 1,300 NGN = $1.00 USD
  if (typeof copy.balance === 'number' && copy.balance >= 1000) {
    copy.balance = Number((copy.balance / 1300).toFixed(2));
  }

  if (typeof copy.cumulativeIncome === 'number' && copy.cumulativeIncome >= 1000) {
    copy.cumulativeIncome = Number((copy.cumulativeIncome / 1300).toFixed(2));
  }

  // Ensure logged in users have at least $0.77 USD (₦1,000 equivalent) welcome bonus if they have no spent/withdrawal records
  if (copy.isLoggedIn && typeof copy.balance === 'number' && copy.balance <= 0) {
    const hasSpent = Array.isArray(copy.records) && copy.records.some(r => r.type === 'withdraw' || r.type === 'purchase');
    if (!hasSpent) {
      copy.balance = 0.77; // $0.77 USD (equivalent to ₦1,000 at ₦1,300/$1)
    }
  }

  // Mark as permanently migrated in USD
  copy.currencyMigrated = true;

  return copy;
}
