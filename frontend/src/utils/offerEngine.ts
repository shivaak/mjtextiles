import type { CartItem, Offer } from '../domain/types';

/**
 * Result of applying an offer to a cart item.
 */
export interface OfferApplication {
  variantId: number;
  offerId: number;
  offerName: string;
  discountPercent: number;
}

/**
 * Evaluate all active offers against the cart and return the best non-conflicting
 * offer applications (one per cart item, highest savings wins).
 */
export function evaluateOffers(
  cart: CartItem[],
  offers: Offer[]
): OfferApplication[] {
  if (cart.length === 0 || offers.length === 0) return [];

  // Collect all candidate applications from all offers
  const allCandidates: OfferApplication[] = [];

  for (const offer of offers) {
    const apps = evaluateSingleOffer(cart, offer);
    allCandidates.push(...apps);
  }

  // Pick the best offer per variant (highest discountPercent)
  const bestByVariant = new Map<number, OfferApplication>();
  for (const app of allCandidates) {
    if (app.discountPercent <= 0) continue;
    const existing = bestByVariant.get(app.variantId);
    if (!existing || app.discountPercent > existing.discountPercent) {
      bestByVariant.set(app.variantId, app);
    }
  }

  return Array.from(bestByVariant.values());
}

/**
 * Evaluate a single offer against the cart.
 */
function evaluateSingleOffer(cart: CartItem[], offer: Offer): OfferApplication[] {
  switch (offer.offerType) {
    case 'QUANTITY_PRICE':
      return evaluateQuantityPrice(cart, offer);
    case 'QUANTITY_DISCOUNT':
      return evaluateQuantityDiscount(cart, offer);
    case 'COMBO':
      return evaluateCombo(cart, offer);
    case 'BOGO':
      return evaluateBogo(cart, offer);
    default:
      return [];
  }
}

/**
 * Check if a cart item matches an offer item (by product or variant).
 * Uses Number() to handle potential string/number type mismatches from JSON.
 */
function itemMatchesRule(
  cartItem: CartItem,
  ruleProductId?: number,
  ruleVariantId?: number
): boolean {
  if (ruleVariantId != null) {
    return Number(cartItem.variantId) === Number(ruleVariantId);
  }
  if (ruleProductId != null) {
    return Number(cartItem.variant.productId) === Number(ruleProductId);
  }
  return false;
}

/**
 * Get total quantity in cart for items matching a rule.
 */
function getMatchingQty(
  cart: CartItem[],
  ruleProductId?: number,
  ruleVariantId?: number
): number {
  return cart
    .filter((item) => itemMatchesRule(item, ruleProductId, ruleVariantId))
    .reduce((sum, item) => sum + item.qty, 0);
}

/**
 * QUANTITY_PRICE: Buy minQty of product -> each at offerPrice.
 * Only complete groups of minQty qualify.
 * E.g., minQty=3, offerPrice=999, qty=4 -> 3 at 999, 1 at regular.
 * Computes blended discount across all units for correct total.
 * Supports multiple offer items: each rule is evaluated independently.
 */
function evaluateQuantityPrice(cart: CartItem[], offer: Offer): OfferApplication[] {
  const results: OfferApplication[] = [];

  for (const rule of offer.items) {
    if (rule.offerPrice == null) continue;

    const totalQty = getMatchingQty(cart, rule.productId, rule.variantId);
    if (totalQty < rule.minQty) continue;

    for (const item of cart) {
      if (!itemMatchesRule(item, rule.productId, rule.variantId)) continue;

      // Calculate how many of THIS item's units qualify for the offer
      // Distribute qualifying qty proportionally if multiple variants match
      const offerQty = Math.min(
        item.qty,
        Math.floor(totalQty / rule.minQty) * rule.minQty
      );
      const regularQty = item.qty - offerQty;

      if (offerQty <= 0) continue;

      // Blended discount: total with offer vs total without
      const totalWithOffer = offerQty * rule.offerPrice + regularQty * item.unitPrice;
      const totalWithout = item.qty * item.unitPrice;
      const blendedDiscPct = totalWithout > 0
        ? ((totalWithout - totalWithOffer) / totalWithout) * 100
        : 0;

      if (blendedDiscPct <= 0) continue;

      results.push({
        variantId: item.variantId,
        offerId: offer.id,
        offerName: offer.name,
        discountPercent: blendedDiscPct,
      });
    }
  }

  return results;
}

/**
 * QUANTITY_DISCOUNT: Buy >= minQty -> get X% off each.
 * Only complete groups of minQty qualify.
 * Supports multiple offer items: each rule is evaluated independently.
 */
function evaluateQuantityDiscount(cart: CartItem[], offer: Offer): OfferApplication[] {
  const results: OfferApplication[] = [];

  for (const rule of offer.items) {
    if (rule.discountPercent == null) continue;

    const totalQty = getMatchingQty(cart, rule.productId, rule.variantId);
    if (totalQty < rule.minQty) continue;

    for (const item of cart) {
      if (!itemMatchesRule(item, rule.productId, rule.variantId)) continue;

      const offerQty = Math.min(
        item.qty,
        Math.floor(totalQty / rule.minQty) * rule.minQty
      );

      if (offerQty <= 0) continue;

      // Blended discount
      const blendedDiscPct = (offerQty * rule.discountPercent) / item.qty;

      if (blendedDiscPct <= 0) continue;

      results.push({
        variantId: item.variantId,
        offerId: offer.id,
        offerName: offer.name,
        discountPercent: blendedDiscPct,
      });
    }
  }

  return results;
}

/**
 * COMBO: All required products in cart with min quantities -> combo price.
 * Distribute savings proportionally based on original prices.
 *
 * Uses consumption-based matching: each cart unit can only satisfy ONE rule.
 * This prevents the same item from being double-counted across rules.
 */
function evaluateCombo(cart: CartItem[], offer: Offer): OfferApplication[] {
  if (!offer.comboPrice || offer.items.length < 2) return [];

  // Track remaining available quantities per variant (consumption-based)
  const remainingQty = new Map<number, number>();
  for (const item of cart) {
    remainingQty.set(item.variantId, (remainingQty.get(item.variantId) || 0) + item.qty);
  }

  // Try to satisfy each rule by consuming from available cart quantities
  let originalTotal = 0;
  const matchedItems: { cartItem: CartItem; consumedQty: number }[] = [];

  for (const rule of offer.items) {
    const minQty = rule.minQty || 1;
    let needed = minQty;
    let ruleSatisfied = false;

    for (const item of cart) {
      if (!itemMatchesRule(item, rule.productId, rule.variantId)) continue;

      const available = remainingQty.get(item.variantId) || 0;
      if (available <= 0) continue;

      const consume = Math.min(available, needed);
      remainingQty.set(item.variantId, available - consume);
      needed -= consume;

      originalTotal += item.unitPrice * consume;
      matchedItems.push({ cartItem: item, consumedQty: consume });

      if (needed <= 0) { ruleSatisfied = true; break; }
    }

    // If this rule can't be satisfied, combo doesn't apply
    if (!ruleSatisfied) return [];
  }

  if (originalTotal <= 0 || offer.comboPrice >= originalTotal) return [];

  // Distribute savings proportionally based on each item's share of the original total
  const totalSavings = originalTotal - offer.comboPrice;
  const results: OfferApplication[] = [];

  // Aggregate consumed quantities per variant for discount calculation
  const consumedPerVariant = new Map<number, { cartItem: CartItem; totalConsumed: number; consumedValue: number }>();
  for (const { cartItem, consumedQty } of matchedItems) {
    const existing = consumedPerVariant.get(cartItem.variantId);
    if (existing) {
      existing.totalConsumed += consumedQty;
      existing.consumedValue += cartItem.unitPrice * consumedQty;
    } else {
      consumedPerVariant.set(cartItem.variantId, {
        cartItem,
        totalConsumed: consumedQty,
        consumedValue: cartItem.unitPrice * consumedQty,
      });
    }
  }

  for (const [, { cartItem, consumedValue }] of consumedPerVariant) {
    const itemShare = consumedValue / originalTotal;
    const itemSavings = totalSavings * itemShare;

    // Blended discount across ALL units of this item (including non-combo extra units)
    const totalItemValue = cartItem.unitPrice * cartItem.qty;
    const blendedDiscPct = totalItemValue > 0
      ? (itemSavings / totalItemValue) * 100
      : 0;

    if (blendedDiscPct <= 0) continue;

    results.push({
      variantId: cartItem.variantId,
      offerId: offer.id,
      offerName: offer.name,
      discountPercent: blendedDiscPct,
    });
  }

  return results;
}

/**
 * BOGO: "Buy X Get Y Free" — each product evaluated independently.
 * - offer.buyQty (X) = number of items the customer pays for
 * - offer.freeQty (Y) = number of cheapest items that are free
 * - offer.items defines which products/variants are eligible
 *
 * Each product rule is evaluated independently against its matching cart items.
 * Within a product, the customer needs X+Y units; they pay for the X most
 * expensive (e.g. different variant prices) and the Y cheapest are free.
 * Products are NOT combined across rules.
 */
function evaluateBogo(cart: CartItem[], offer: Offer): OfferApplication[] {
  const buyQty = offer.buyQty;
  const offerFreeQty = offer.freeQty;
  if (!buyQty || buyQty <= 0 || !offerFreeQty || offerFreeQty <= 0) return [];

  const groupSize = buyQty + offerFreeQty;
  const results: OfferApplication[] = [];

  // Evaluate each offer item (product/variant rule) independently
  for (const rule of offer.items) {
    // Find cart items matching this specific rule
    const matchingItems = cart.filter((ci) => itemMatchesRule(ci, rule.productId, rule.variantId));
    if (matchingItems.length === 0) continue;

    const totalQty = matchingItems.reduce((sum, item) => sum + item.qty, 0);
    if (totalQty < groupSize) continue;

    // How many complete groups and total free units
    const completeGroups = Math.floor(totalQty / groupSize);
    const totalFreeUnits = completeGroups * offerFreeQty;
    if (totalFreeUnits <= 0) continue;

    // Expand into individual units sorted by price ascending (cheapest first)
    const units: { variantId: number; unitPrice: number }[] = [];
    for (const item of matchingItems) {
      for (let i = 0; i < item.qty; i++) {
        units.push({ variantId: item.variantId, unitPrice: item.unitPrice });
      }
    }
    units.sort((a, b) => a.unitPrice - b.unitPrice);

    // The cheapest totalFreeUnits units are free
    const freeCountPerVariant = new Map<number, number>();
    for (let i = 0; i < totalFreeUnits && i < units.length; i++) {
      const vid = units[i].variantId;
      freeCountPerVariant.set(vid, (freeCountPerVariant.get(vid) || 0) + 1);
    }

    // Calculate discount per cart item based on how many of its units are free
    for (const item of matchingItems) {
      const freeUnits = freeCountPerVariant.get(item.variantId) || 0;
      if (freeUnits <= 0) continue;

      // Effective discount: value of free units / total value of this item
      const discountPercent = (freeUnits / item.qty) * 100;

      results.push({
        variantId: item.variantId,
        offerId: offer.id,
        offerName: offer.name,
        discountPercent,
      });
    }
  }

  return results;
}
