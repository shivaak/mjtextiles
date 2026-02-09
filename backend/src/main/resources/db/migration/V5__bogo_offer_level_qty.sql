-- ===========================================
-- V5: BOGO offer-level buy_qty and free_qty
-- Moves BOGO configuration from per-item to offer level.
-- Items now define the eligible product pool;
-- the cheapest free_qty items in the pool are free.
-- ===========================================

ALTER TABLE offers ADD COLUMN buy_qty INT;
ALTER TABLE offers ADD COLUMN free_qty INT;

-- Migrate existing BOGO offers: copy values from their first offer_item
UPDATE offers o
SET buy_qty = sub.min_qty,
    free_qty = sub.free_qty
FROM (
    SELECT DISTINCT ON (offer_id) offer_id, min_qty, free_qty
    FROM offer_items
    ORDER BY offer_id, id
) sub
WHERE sub.offer_id = o.id
  AND o.offer_type = 'BOGO';

-- Add constraints for BOGO fields
ALTER TABLE offers ADD CONSTRAINT offers_buy_qty_positive CHECK (buy_qty IS NULL OR buy_qty >= 1);
ALTER TABLE offers ADD CONSTRAINT offers_free_qty_positive CHECK (free_qty IS NULL OR free_qty >= 1);
