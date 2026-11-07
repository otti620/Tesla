import { PurchasedProductItem, VIPProduct, TransactionRecord } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialData';

/**
 * Safely merges two arrays of TransactionRecord items by ID, preserving settled statuses
 * ('success' or 'failed') over 'pending', preventing duplicate welcome bonus entries,
 * and sorting newest-first.
 */
export function mergeTransactionRecords(
  primary?: TransactionRecord[] | null,
  secondary?: TransactionRecord[] | null
): TransactionRecord[] {
  const map = new Map<string, TransactionRecord>();
  let hasWelcomeBonus = false;

  const addRecord = (r: TransactionRecord) => {
    if (!r || !r.id) return;
    const isWelcome =
      r.title === 'Registration Welcome Bonus' ||
      r.id.startsWith('reg_') ||
      (r.type === 'bonus' && r.details?.includes('Welcome Grant'));

    if (isWelcome) {
      if (hasWelcomeBonus && !map.has(r.id)) {
        return;
      }
      hasWelcomeBonus = true;
    }

    const existing = map.get(r.id);
    if (!existing) {
      map.set(r.id, {
        ...r,
        amount: Number(r.amount) || 0,
        timestamp: Number(r.timestamp) || Date.now(),
        status: r.status || 'success',
      });
    } else {
      // Prefer settled status ('success' or 'failed') over 'pending'
      const resolvedStatus =
        existing.status !== 'pending'
          ? existing.status
          : r.status !== 'pending'
          ? r.status
          : existing.status;

      map.set(r.id, {
        ...existing,
        ...r,
        status: resolvedStatus,
        amount: Math.max(Number(existing.amount) || 0, Number(r.amount) || 0),
        timestamp: Math.max(Number(existing.timestamp) || 0, Number(r.timestamp) || 0),
        details:
          (r.details && r.details.length >= (existing.details?.length || 0))
            ? r.details
            : existing.details,
      });
    }
  };

  (primary || []).forEach(addRecord);
  (secondary || []).forEach(addRecord);

  return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

/**
 * Returns canonical product details matching a given product ID or VIP Level.
 */
export function getCanonicalProduct(productIdOrVip?: string): VIPProduct | undefined {
  if (!productIdOrVip) return undefined;
  const clean = productIdOrVip.trim().toLowerCase();
  return INITIAL_PRODUCTS.find(
    (p) => p.id.toLowerCase() === clean || p.vipLevel.toLowerCase() === clean
  );
}

/**
 * Normalizes an array of purchased product items to ensure:
 * 1. Daily income exactly matches official rates (e.g. VIP 1 = ₦800/day, VIP 2 = ₦2,300/day, etc.)
 * 2. Deduplication of cloned/double-registered instances
 * 3. Consistent totalIncome, validityDays, and titles across all views
 */
export function normalizePurchasedProducts(
  items: PurchasedProductItem[] | undefined | null
): PurchasedProductItem[] {
  if (!items || !Array.isArray(items)) return [];

  const seenInstanceIds = new Set<string>();
  const normalized: PurchasedProductItem[] = [];

  for (const item of items) {
    if (!item) continue;

    const canonical = getCanonicalProduct(item.productId) || getCanonicalProduct(item.vipLevel);
    const instanceId = item.instanceId || `inst_${item.productId || 'vip'}_${item.purchaseDate || Date.now()}`;

    // Prevent duplicate instances with identical instance ID
    if (seenInstanceIds.has(instanceId)) {
      continue;
    }
    seenInstanceIds.add(instanceId);

    const dailyIncome = canonical ? canonical.dailyIncome : Number(item.dailyIncome) || 800;
    const validityDays = canonical ? canonical.validityDays : Number(item.validityDays) || 100;
    const totalIncome = canonical ? canonical.totalIncome : Number(item.totalIncome) || dailyIncome * validityDays;
    const title = canonical ? canonical.title : item.title;
    const vipLevel = canonical ? canonical.vipLevel : item.vipLevel || 'VIP1';
    const image = canonical ? canonical.image : item.image;
    const productId = canonical ? canonical.id : item.productId;

    normalized.push({
      ...item,
      instanceId,
      productId,
      title,
      vipLevel,
      dailyIncome,
      totalIncome,
      validityDays,
      image,
      daysActive: Math.min(validityDays, Math.max(0, Number(item.daysActive) || 0)),
      purchaseDate: Number(item.purchaseDate) || Date.now(),
      lastClaimDate: item.lastClaimDate ? Number(item.lastClaimDate) : Number(item.purchaseDate) || Date.now(),
    });
  }

  return normalized;
}

/**
 * Safely merges two lists of purchased products, preserving the highest daysActive,
 * latest lastClaimDate, and preventing duplicate instances.
 */
export function mergePurchasedProducts(
  primary: PurchasedProductItem[] | undefined | null,
  secondary: PurchasedProductItem[] | undefined | null
): PurchasedProductItem[] {
  const list1 = normalizePurchasedProducts(primary);
  const list2 = normalizePurchasedProducts(secondary);

  const map = new Map<string, PurchasedProductItem>();

  for (const item of list1) {
    map.set(item.instanceId, item);
  }

  for (const item of list2) {
    if (map.has(item.instanceId)) {
      const existing = map.get(item.instanceId)!;
      map.set(item.instanceId, {
        ...existing,
        daysActive: Math.max(Number(existing.daysActive) || 0, Number(item.daysActive) || 0),
        lastClaimDate: Math.max(Number(existing.lastClaimDate) || 0, Number(item.lastClaimDate) || 0),
        purchaseDate: Math.min(Number(existing.purchaseDate) || Date.now(), Number(item.purchaseDate) || Date.now()),
      });
    } else {
      map.set(item.instanceId, item);
    }
  }

  return normalizePurchasedProducts(Array.from(map.values()));
}

/**
 * Normalizes system VIP catalog products to ensure correct canonical rates
 */
export function normalizeProductCatalog(products: VIPProduct[] | undefined | null): VIPProduct[] {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return INITIAL_PRODUCTS;
  }

  return products.map((p) => {
    const canonical = getCanonicalProduct(p.id) || getCanonicalProduct(p.vipLevel);
    if (canonical) {
      return {
        ...p,
        price: canonical.price,
        dailyIncome: canonical.dailyIncome,
        totalIncome: canonical.totalIncome,
        validityDays: canonical.validityDays,
        vipLevel: canonical.vipLevel,
        title: canonical.title,
        category: canonical.category,
        image: canonical.image,
        status: p.status || canonical.status,
      };
    }
    return p;
  });
}
