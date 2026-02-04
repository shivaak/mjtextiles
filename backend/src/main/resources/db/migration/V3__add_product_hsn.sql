-- ===========================================
-- V3: Add HSN to products
-- ===========================================

ALTER TABLE products
ADD COLUMN hsn VARCHAR(20);

UPDATE products
SET hsn = 'NA'
WHERE hsn IS NULL;

ALTER TABLE products
ALTER COLUMN hsn SET NOT NULL;

DROP INDEX IF EXISTS idx_products_search;
CREATE INDEX idx_products_search ON products
USING gin(to_tsvector('english', name || ' ' || brand || ' ' || category || ' ' || hsn));
