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

type OfferOp = {
  offerId: number;
  offerName: string;
  consumedByItemIdx: Map<number, number>;
  offeredCost: number;
  savingsByItemIdx: Map<number, number>;
};

type PlanStep = {
  op: OfferOp;
  nextKey: string;
};

type PlanResult = {
  cost: number;
  steps: PlanStep[];
};

/**
 * Evaluate all active offers against the cart and return the best non-conflicting
 * offer applications (one per cart item, highest savings wins).
 */
export function evaluateOffers(
  cart: CartItem[],
  offers: Offer[]
): OfferApplication[] {
  if (cart.length === 0 || offers.length === 0) return [];
  const relevantQty = cart.reduce(
    (sum, item) => sum + (offers.some((offer) => offerTouchesCartItem(offer, item)) ? item.qty : 0),
    0
  );

  // Keep large baskets responsive with the previous per-variant approach.
  if (relevantQty > 40) {
    return evaluateOffersLegacy(cart, offers);
  }

  try {
    return evaluateOffersOptimized(cart, offers);
  } catch {
    return evaluateOffersLegacy(cart, offers);
  }
}

function evaluateOffersLegacy(cart: CartItem[], offers: Offer[]): OfferApplication[] {
  const allCandidates: OfferApplication[] = [];
  for (const offer of offers) {
    const apps = evaluateSingleOffer(cart, offer);
    allCandidates.push(...apps);
  }

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

function evaluateOffersOptimized(cart: CartItem[], offers: Offer[]): OfferApplication[] {
  const relevantItemIndexes = cart
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => offers.some((offer) => offerTouchesCartItem(offer, item)))
    .map(({ idx }) => idx);

  if (relevantItemIndexes.length === 0) return [];

  const initialState = relevantItemIndexes.map((idx) => cart[idx].qty);
  const memo = new Map<string, PlanResult>();

  const getKey = (state: number[]) => state.join('|');

  const regularCost = (state: number[]) =>
    state.reduce((sum, qty, pos) => sum + qty * cart[relevantItemIndexes[pos]].unitPrice, 0);

  const solve = (state: number[]): PlanResult => {
    const key = getKey(state);
    const cached = memo.get(key);
    if (cached) return cached;

    let best: PlanResult = { cost: regularCost(state), steps: [] };
    const ops = generateApplicableOps(cart, offers, relevantItemIndexes, state);

    for (const op of ops) {
      const nextState = state.slice();
      let isApplicable = true;
      for (const [itemIdx, consumeQty] of op.consumedByItemIdx) {
        const pos = relevantItemIndexes.indexOf(itemIdx);
        if (pos < 0 || nextState[pos] < consumeQty) {
          isApplicable = false;
          break;
        }
        nextState[pos] -= consumeQty;
      }
      if (!isApplicable) continue;

      const nextResult = solve(nextState);
      const candidateCost = op.offeredCost + nextResult.cost;
      if (candidateCost + 1e-9 < best.cost) {
        best = {
          cost: candidateCost,
          steps: [{ op, nextKey: getKey(nextState) }, ...nextResult.steps],
        };
      }
    }

    memo.set(key, best);
    return best;
  };

  const bestPlan = solve(initialState);
  if (bestPlan.steps.length === 0) return [];

  const savingsByVariant = new Map<number, number>();
  const savingsByVariantAndOffer = new Map<number, Map<number, { savings: number; offerName: string }>>();

  for (const step of bestPlan.steps) {
    for (const [itemIdx, savings] of step.op.savingsByItemIdx) {
      if (savings <= 0) continue;
      const variantId = cart[itemIdx].variantId;
      savingsByVariant.set(variantId, (savingsByVariant.get(variantId) || 0) + savings);

      let byOffer = savingsByVariantAndOffer.get(variantId);
      if (!byOffer) {
        byOffer = new Map();
        savingsByVariantAndOffer.set(variantId, byOffer);
      }
      const existing = byOffer.get(step.op.offerId);
      byOffer.set(step.op.offerId, {
        savings: (existing?.savings || 0) + savings,
        offerName: step.op.offerName,
      });
    }
  }

  const applications: OfferApplication[] = [];
  for (let i = 0; i < cart.length; i++) {
    const item = cart[i];
    const baseValue = item.unitPrice * item.qty;
    const savings = savingsByVariant.get(item.variantId) || 0;
    if (baseValue <= 0 || savings <= 0) continue;

    const discountPercent = (savings / baseValue) * 100;
    if (discountPercent <= 0) continue;

    const byOffer = savingsByVariantAndOffer.get(item.variantId);
    let primaryOfferId = 0;
    let primaryOfferName = '';
    let maxSavings = -1;
    if (byOffer) {
      for (const [offerId, offerData] of byOffer.entries()) {
        if (offerData.savings > maxSavings) {
          maxSavings = offerData.savings;
          primaryOfferId = offerId;
          primaryOfferName = offerData.offerName;
        }
      }
    }

    if (primaryOfferId > 0) {
      applications.push({
        variantId: item.variantId,
        offerId: primaryOfferId,
        offerName: primaryOfferName,
        discountPercent,
      });
    }
  }

  return applications;
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

function offerTouchesCartItem(offer: Offer, cartItem: CartItem): boolean {
  if (offer.items.length === 0) return false;
  return offer.items.some((rule) => itemMatchesRule(cartItem, rule.productId, rule.variantId));
}

function createConsumedMap(
  itemIdxsInPriority: number[],
  stateByItemIdx: Map<number, number>,
  neededQty: number
): Map<number, number> | null {
  let remaining = neededQty;
  const consumed = new Map<number, number>();

  for (const itemIdx of itemIdxsInPriority) {
    if (remaining <= 0) break;
    const available = stateByItemIdx.get(itemIdx) || 0;
    if (available <= 0) continue;
    const take = Math.min(available, remaining);
    if (take > 0) {
      consumed.set(itemIdx, take);
      remaining -= take;
    }
  }

  return remaining > 0 ? null : consumed;
}

function generateApplicableOps(
  cart: CartItem[],
  offers: Offer[],
  relevantItemIndexes: number[],
  state: number[]
): OfferOp[] {
  const ops: OfferOp[] = [];
  const stateByItemIdx = new Map<number, number>();
  for (let i = 0; i < relevantItemIndexes.length; i++) {
    stateByItemIdx.set(relevantItemIndexes[i], state[i]);
  }

  for (const offer of offers) {
    if (!offer.items || offer.items.length === 0) continue;

    if (offer.offerType === 'QUANTITY_PRICE') {
      for (const rule of offer.items) {
        if (rule.offerPrice == null || rule.minQty <= 0) continue;

        const matching = relevantItemIndexes
          .filter((idx) => itemMatchesRule(cart[idx], rule.productId, rule.variantId))
          .sort((a, b) => cart[b].unitPrice - cart[a].unitPrice);
        const totalQty = matching.reduce((sum, idx) => sum + (stateByItemIdx.get(idx) || 0), 0);
        if (totalQty < rule.minQty) continue;

        const consumed = createConsumedMap(matching, stateByItemIdx, rule.minQty);
        if (!consumed) continue;

        let regularCost = 0;
        const savingsByItemIdx = new Map<number, number>();
        for (const [idx, qty] of consumed.entries()) {
          const lineRegular = qty * cart[idx].unitPrice;
          regularCost += lineRegular;
          const offeredLine = qty * rule.offerPrice;
          savingsByItemIdx.set(idx, Math.max(0, lineRegular - offeredLine));
        }

        const offeredCost = rule.minQty * rule.offerPrice;
        if (offeredCost >= regularCost) continue;

        ops.push({
          offerId: offer.id,
          offerName: offer.name,
          consumedByItemIdx: consumed,
          offeredCost,
          savingsByItemIdx,
        });
      }
    } else if (offer.offerType === 'QUANTITY_DISCOUNT') {
      for (const rule of offer.items) {
        if (rule.discountPercent == null || rule.minQty <= 0 || rule.discountPercent <= 0) continue;

        const matching = relevantItemIndexes
          .filter((idx) => itemMatchesRule(cart[idx], rule.productId, rule.variantId))
          .sort((a, b) => cart[b].unitPrice - cart[a].unitPrice);
        const totalQty = matching.reduce((sum, idx) => sum + (stateByItemIdx.get(idx) || 0), 0);
        if (totalQty < rule.minQty) continue;

        const consumed = createConsumedMap(matching, stateByItemIdx, rule.minQty);
        if (!consumed) continue;

        let regularCost = 0;
        let offeredCost = 0;
        const savingsByItemIdx = new Map<number, number>();
        const factor = 1 - rule.discountPercent / 100;
        for (const [idx, qty] of consumed.entries()) {
          const lineRegular = qty * cart[idx].unitPrice;
          const lineOffer = lineRegular * factor;
          regularCost += lineRegular;
          offeredCost += lineOffer;
          savingsByItemIdx.set(idx, Math.max(0, lineRegular - lineOffer));
        }
        if (offeredCost >= regularCost) continue;

        ops.push({
          offerId: offer.id,
          offerName: offer.name,
          consumedByItemIdx: consumed,
          offeredCost,
          savingsByItemIdx,
        });
      }
    } else if (offer.offerType === 'COMBO') {
      if (offer.comboPrice == null || offer.comboPrice <= 0) continue;

      const consumed = new Map<number, number>();
      const localRemaining = new Map<number, number>(stateByItemIdx);
      let regularCost = 0;
      let valid = true;

      for (const rule of offer.items) {
        const minQty = rule.minQty || 1;
        if (minQty <= 0) continue;
        const matching = relevantItemIndexes
          .filter((idx) => itemMatchesRule(cart[idx], rule.productId, rule.variantId))
          .sort((a, b) => cart[b].unitPrice - cart[a].unitPrice);
        const consumedForRule = createConsumedMap(matching, localRemaining, minQty);
        if (!consumedForRule) {
          valid = false;
          break;
        }

        for (const [idx, qty] of consumedForRule.entries()) {
          consumed.set(idx, (consumed.get(idx) || 0) + qty);
          localRemaining.set(idx, (localRemaining.get(idx) || 0) - qty);
        }
      }

      if (!valid || consumed.size === 0) continue;

      for (const [idx, qty] of consumed.entries()) {
        regularCost += qty * cart[idx].unitPrice;
      }
      if (offer.comboPrice >= regularCost) continue;

      const totalSavings = regularCost - offer.comboPrice;
      const savingsByItemIdx = new Map<number, number>();
      for (const [idx, qty] of consumed.entries()) {
        const lineRegular = qty * cart[idx].unitPrice;
        const share = regularCost > 0 ? lineRegular / regularCost : 0;
        savingsByItemIdx.set(idx, totalSavings * share);
      }

      ops.push({
        offerId: offer.id,
        offerName: offer.name,
        consumedByItemIdx: consumed,
        offeredCost: offer.comboPrice,
        savingsByItemIdx,
      });
    } else if (offer.offerType === 'BOGO') {
      const buyQty = offer.buyQty || 0;
      const freeQty = offer.freeQty || 0;
      const groupSize = buyQty + freeQty;
      if (buyQty <= 0 || freeQty <= 0 || groupSize <= 0) continue;

      for (const rule of offer.items) {
        const matching = relevantItemIndexes
          .filter((idx) => itemMatchesRule(cart[idx], rule.productId, rule.variantId));
        const totalQty = matching.reduce((sum, idx) => sum + (stateByItemIdx.get(idx) || 0), 0);
        if (totalQty < groupSize) continue;

        const units: { itemIdx: number; price: number }[] = [];
        for (const idx of matching) {
          const qty = stateByItemIdx.get(idx) || 0;
          for (let i = 0; i < qty; i++) units.push({ itemIdx: idx, price: cart[idx].unitPrice });
        }
        if (units.length < groupSize) continue;
        units.sort((a, b) => b.price - a.price); // Desc, keep highest-value group.
        const group = units.slice(0, groupSize);

        const consumed = new Map<number, number>();
        for (const u of group) consumed.set(u.itemIdx, (consumed.get(u.itemIdx) || 0) + 1);

        const groupAsc = group.slice().sort((a, b) => a.price - b.price);
        const freeUnits = groupAsc.slice(0, freeQty);
        const paidUnits = groupAsc.slice(freeQty);
        const offeredCost = paidUnits.reduce((sum, u) => sum + u.price, 0);
        const regularCost = group.reduce((sum, u) => sum + u.price, 0);
        if (offeredCost >= regularCost) continue;

        const savingsByItemIdx = new Map<number, number>();
        for (const u of freeUnits) {
          savingsByItemIdx.set(u.itemIdx, (savingsByItemIdx.get(u.itemIdx) || 0) + u.price);
        }

        ops.push({
          offerId: offer.id,
          offerName: offer.name,
          consumedByItemIdx: consumed,
          offeredCost,
          savingsByItemIdx,
        });
      }
    }
  }

  return ops;
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

    // Shared pool of qualifying units across all matching variants
    const totalOfferQty = Math.floor(totalQty / rule.minQty) * rule.minQty;
    let remainingOfferQty = totalOfferQty;

    for (const item of cart) {
      if (!itemMatchesRule(item, rule.productId, rule.variantId)) continue;
      if (remainingOfferQty <= 0) continue;

      // Consume from the shared qualifying pool
      const offerQty = Math.min(item.qty, remainingOfferQty);
      remainingOfferQty -= offerQty;
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

    // Shared pool of qualifying units across all matching variants
    const totalOfferQty = Math.floor(totalQty / rule.minQty) * rule.minQty;
    let remainingOfferQty = totalOfferQty;

    for (const item of cart) {
      if (!itemMatchesRule(item, rule.productId, rule.variantId)) continue;
      if (remainingOfferQty <= 0) continue;

      // Consume from the shared qualifying pool
      const offerQty = Math.min(item.qty, remainingOfferQty);
      remainingOfferQty -= offerQty;

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
