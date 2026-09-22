/**
 * Dynamic Referral Link and Social Sharing Utilities
 * Generates dynamic shareable URLs based on the current origin and environment.
 */

export const REFERRAL_STORAGE_KEY = 'tesla_referral_code';

/**
 * Returns the current application base URL dynamically from the browser window.
 */
export function getBaseAppUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin || '';
    const pathname = window.location.pathname || '';
    // Strip trailing slash if present
    const cleanPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    return `${origin}${cleanPath}`;
  }
  return 'https://tesla-energy-vip.web.app';
}

/**
 * Builds the dynamic referral link containing the user's invite code
 */
export function getDynamicReferralLink(inviteCode: string): string {
  const baseUrl = getBaseAppUrl();
  const cleanCode = (inviteCode || '').trim().toUpperCase();
  return `${baseUrl}?invite=${encodeURIComponent(cleanCode)}`;
}

/**
 * Inspects URL search params or hash for referral / invite codes and stores in cache.
 */
export function extractReferralCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const code = 
      urlParams.get('invite') || 
      urlParams.get('ref') || 
      urlParams.get('code') || 
      urlParams.get('invitation');

    if (code && code.trim()) {
      const clean = code.trim().toUpperCase();
      try {
        localStorage.setItem(REFERRAL_STORAGE_KEY, clean);
        sessionStorage.setItem(REFERRAL_STORAGE_KEY, clean);
      } catch {
        // non-blocking
      }
      return clean;
    }

    // Check hash for #invite= or #ref=
    if (window.location.hash && window.location.hash.includes('=')) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const hashCode = hashParams.get('invite') || hashParams.get('ref') || hashParams.get('code');
      if (hashCode && hashCode.trim()) {
        const clean = hashCode.trim().toUpperCase();
        try {
          localStorage.setItem(REFERRAL_STORAGE_KEY, clean);
          sessionStorage.setItem(REFERRAL_STORAGE_KEY, clean);
        } catch {}
        return clean;
      }
    }

    // Fallback to cached referral in storage
    const cached = localStorage.getItem(REFERRAL_STORAGE_KEY) || sessionStorage.getItem(REFERRAL_STORAGE_KEY);
    if (cached && cached.trim()) {
      return cached.trim().toUpperCase();
    }
  } catch {
    // non-blocking
  }

  return null;
}

/**
 * Standard invite message template
 */
export function getReferralShareMessage(inviteCode: string, referralUrl?: string): string {
  const url = referralUrl || getDynamicReferralLink(inviteCode);
  return `⚡ Join Tesla Clean Energy VIP Investment! Get an instant ₦1,500 Welcome Bonus + earn up to 25% daily affiliate cash on clean energy VIP fleet units.\n\nUse my VIP Invitation Code: ${inviteCode}\n\nRegister dynamically here: ${url}`;
}

/**
 * Native or Web Share API trigger with clipboard copy fallback
 */
export async function shareReferralLink(
  inviteCode: string, 
  customUrl?: string
): Promise<{ success: boolean; method: 'native' | 'clipboard' | 'failed'; error?: string }> {
  const url = customUrl || getDynamicReferralLink(inviteCode);
  const text = getReferralShareMessage(inviteCode, url);
  const title = 'Tesla Energy VIP Invitation';

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return { success: true, method: 'native' };
    } catch (err: any) {
      // User cancelled share dialog or unsupported platform
      if (err.name === 'AbortError') {
        return { success: false, method: 'failed', error: 'Share cancelled' };
      }
    }
  }

  // Fallback to copying URL to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url);
      return { success: true, method: 'clipboard' };
    } catch {
      // fallback
    }
  }

  return { success: false, method: 'failed' };
}
