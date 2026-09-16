/**
 * Admin Security Verification
 * ONLY these two numbers should ever be able to see or access the Admin Panel:
 * - 07077599057
 * - 09011711470
 */

export const ADMIN_PHONE_NUMBERS = ['07077599057', '09011711470'] as const;

export function isAdminUser(phone?: string | null): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return false;
  const last10 = digits.slice(-10);
  return last10 === '7077599057' || last10 === '9011711470';
}
