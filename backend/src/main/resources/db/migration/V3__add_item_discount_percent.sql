-- ===========================================
-- V3: Add item-level discount percent to sale_items
-- ===========================================

ALTER TABLE sale_items ADD COLUMN item_discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0;
ALTER TABLE sale_items ADD CONSTRAINT sale_items_discount_range
    CHECK (item_discount_percent >= 0 AND item_discount_percent <= 100);
