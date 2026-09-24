import { UserState } from '../types';
import { isAdminUser } from './adminAuth';

/**
 * Checks if a user has been credited by the admin or has official executive privileges
 * allowing them direct withdrawal access.
 */
export function isUserCreditedByAdmin(user: Partial<UserState> | null | undefined): boolean {
  if (!user) return false;

  // Direct admin accounts are inherently authorized
  if (user.phone && isAdminUser(user.phone)) {
    return true;
  }

  // Explicit flag set in Firestore / state
  if (
    user.creditedByAdmin === true ||
    (user as any).isCreditedByAdmin === true ||
    (user as any).adminCredited === true
  ) {
    return true;
  }

  // Check user transaction history for admin-initiated credits, adjustments, or grants
  if (Array.isArray(user.records) && user.records.length > 0) {
    const hasAdminRecord = user.records.some((r) => {
      const id = (r.id || '').toLowerCase();
      const title = (r.title || '').toLowerCase();
      const details = (r.details || '').toLowerCase();

      return (
        id.startsWith('adm_') ||
        id.startsWith('rec_adm_') ||
        title.includes('admin') ||
        title.includes('executive') ||
        title.includes('grant') ||
        title.includes('special incentive') ||
        title.includes('balance adjustment') ||
        title.includes('deposit approved') ||
        details.includes('admin') ||
        details.includes('master console') ||
        details.includes('executive') ||
        details.includes('credited') ||
        details.includes('treasury auditor') ||
        details.includes('calibration') ||
        (r.type === 'bonus' && title.includes('incentive'))
      );
    });

    if (hasAdminRecord) {
      return true;
    }
  }

  return false;
}

export interface WithdrawalEligibilityResult {
  isCreditedByAdmin: boolean;
  hasPurchasedProduct: boolean;
  hasMadeDeposit: boolean;
  isEligible: boolean;
  bypassReason?: string;
}

/**
 * Evaluates whether a user is allowed to submit a withdrawal request.
 * Users credited by the admin have all deposit/product purchase prerequisites waived.
 */
export function checkWithdrawalEligibility(user: UserState): WithdrawalEligibilityResult {
  const isCredited = isUserCreditedByAdmin(user);

  const rawPurchasedProduct =
    (user.purchasedProducts && user.purchasedProducts.length > 0) ||
    user.records?.some((r) => r.type === 'purchase');

  const rawMadeDeposit =
    user.records?.some((r) => r.type === 'recharge' && r.status === 'success') ||
    user.records?.some((r) => r.type === 'recharge');

  // If credited by admin, both prerequisites are unconditionally fulfilled
  const hasPurchasedProduct = isCredited || Boolean(rawPurchasedProduct);
  const hasMadeDeposit = isCredited || Boolean(rawMadeDeposit);
  const isEligible = isCredited || (Boolean(rawPurchasedProduct) && Boolean(rawMadeDeposit));

  return {
    isCreditedByAdmin: isCredited,
    hasPurchasedProduct,
    hasMadeDeposit,
    isEligible,
    bypassReason: isCredited ? 'Admin Executive Credit Authorization Active' : undefined,
  };
}
