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
 */
function evaluateQuantityPrice(cart: CartItem[], offer: Offer): OfferApplication[] {
  const rule = offer.items[0];
  if (!rule || rule.offerPrice == null) return [];

  const totalQty = getMatchingQty(cart, rule.productId, rule.variantId);
  if (totalQty < rule.minQty) return [];

  const results: OfferApplication[] = [];
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
      discountPercent: Math.round(blendedDiscPct * 100) / 100,
    });
  }
  return results;
}

/**
 * QUANTITY_DISCOUNT: Buy >= minQty -> get X% off each.
 * Only complete groups of minQty qualify.
 */
function evaluateQuantityDiscount(cart: CartItem[], offer: Offer): OfferApplication[] {
  const rule = offer.items[0];
  if (!rule || rule.discountPercent == null) return [];

  const totalQty = getMatchingQty(cart, rule.productId, rule.variantId);
  if (totalQty < rule.minQty) return [];

  const results: OfferApplication[] = [];
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
      discountPercent: Math.round(blendedDiscPct * 100) / 100,
    });
  }
  return results;
}

/**
 * COMBO: All required products in cart with min quantities -> combo price.
 * Distribute savings proportionally based on original prices.
 */
function evaluateCombo(cart: CartItem[], offer: Offer): OfferApplication[] {
  if (!offer.comboPrice || offer.items.length < 2) return [];

  // Check all required items are present with min quantities
  for (const rule of offer.items) {
    const totalQty = getMatchingQty(cart, rule.productId, rule.variantId);
    if (totalQty < rule.minQty) return [];
  }

  // Calculate the original total of matching items (one unit per rule)
  let originalTotal = 0;
  const matchedItems: { cartItem: CartItem; ruleMinQty: number }[] = [];

  for (const rule of offer.items) {
    for (const item of cart) {
      if (itemMatchesRule(item, rule.productId, rule.variantId)) {
        originalTotal += item.unitPrice * rule.minQty;
        matchedItems.push({ cartItem: item, ruleMinQty: rule.minQty });
        break; // Take first matching variant for this rule
      }
    }
  }

  if (originalTotal <= 0 || offer.comboPrice >= originalTotal) return [];

  // Distribute savings proportionally
  const results: OfferApplication[] = [];
  for (const { cartItem, ruleMinQty } of matchedItems) {
    const itemShare = (cartItem.unitPrice * ruleMinQty) / originalTotal;
    const itemSavings = (originalTotal - offer.comboPrice) * itemShare;

    // Blended discount considering extra qty beyond ruleMinQty
    const totalItemValue = cartItem.unitPrice * cartItem.qty;
    const blendedDiscPct = totalItemValue > 0
      ? (itemSavings / totalItemValue) * 100
      : 0;

    if (blendedDiscPct <= 0) continue;

    results.push({
      variantId: cartItem.variantId,
      offerId: offer.id,
      offerName: offer.name,
      discountPercent: Math.round(blendedDiscPct * 100) / 100,
    });
  }

  return results;
}

/**
 * BOGO: Buy minQty, get freeQty free.
 * For every (minQty + freeQty) items, freeQty items are free.
 * Blended as effective discount across all units.
 */
function evaluateBogo(cart: CartItem[], offer: Offer): OfferApplication[] {
  const rule = offer.items[0];
  if (!rule || !rule.freeQty || rule.freeQty <= 0) return [];

  const totalQty = getMatchingQty(cart, rule.productId, rule.variantId);
  const groupSize = rule.minQty + rule.freeQty;
  if (totalQty < groupSize) return [];

  // Number of complete groups
  const completeGroups = Math.floor(totalQty / groupSize);
  const freeItems = completeGroups * rule.freeQty;

  if (freeItems <= 0) return [];

  // Effective discount = (freeItems / totalQty) * 100
  const effectiveDiscPct = (freeItems / totalQty) * 100;

  const results: OfferApplication[] = [];
  for (const item of cart) {
    if (!itemMatchesRule(item, rule.productId, rule.variantId)) continue;
    results.push({
      variantId: item.variantId,
      offerId: offer.id,
      offerName: offer.name,
      discountPercent: Math.round(effectiveDiscPct * 100) / 100,
    });
  }
  return results;
}
