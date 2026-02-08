-- ===========================================
-- V2: Add default discount percent to products and variants
-- ===========================================

-- Product-level default discount (applies to all variants unless overridden)
ALTER TABLE products ADD COLUMN default_discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD CONSTRAINT products_default_discount_range
    CHECK (default_discount_percent >= 0 AND default_discount_percent <= 100);

-- Variant-level discount override (NULL means inherit from product)
ALTER TABLE variants ADD COLUMN default_discount_percent DECIMAL(5, 2);
ALTER TABLE variants ADD CONSTRAINT variants_default_discount_range
    CHECK (default_discount_percent IS NULL OR (default_discount_percent >= 0 AND default_discount_percent <= 100));
