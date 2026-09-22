/**
 * Admin Security Verification
 * ONLY these two numbers should ever be able to see or access the Admin Panel:
 * - 07077599057 (also accommodates 070777599057 typo from user input)
 * - 09011711470
 */

export const ADMIN_PHONE_NUMBERS = ['07077599057', '09011711470'] as const;

export function cleanNigerianPhoneDigits(raw?: string | null): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length > 10) {
    digits = digits.slice(3);
  }
  while (digits.startsWith('0') && digits.length > 10) {
    digits = digits.slice(1);
  }
  // Accommodate user's 3-sevens typo '070777599057' or '70777599057' or similar
  if (digits.includes('70777599057') || digits.includes('7077599057') || digits === '0777599057' || digits === '777599057') {
    return '7077599057';
  }
  if (digits.includes('9011711470')) {
    return '9011711470';
  }
  if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits;
}

export function isAdminUser(phone?: string | null): boolean {
  if (!phone) return false;
  const digits = cleanNigerianPhoneDigits(phone);
  return digits === '7077599057' || digits === '9011711470';
}

