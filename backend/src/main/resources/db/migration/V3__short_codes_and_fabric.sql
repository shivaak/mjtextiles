-- ===========================================
-- V3: Short Codes and Fabric support
-- ===========================================

-- Short codes table for category, brand, fabric
CREATE TABLE short_codes (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type            VARCHAR(20) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    short_code      VARCHAR(10) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT short_codes_type_check CHECK (type IN ('CATEGORY', 'BRAND', 'FABRIC')),
    CONSTRAINT short_codes_type_name_unique UNIQUE (type, name),
    CONSTRAINT short_codes_type_code_unique UNIQUE (type, short_code)
);

CREATE INDEX idx_short_codes_type ON short_codes(type);

-- Add fabric column to variants
ALTER TABLE variants ADD COLUMN fabric VARCHAR(50);

-- Auto-populate existing categories with short codes (first 3 chars uppercase)
INSERT INTO short_codes (type, name, short_code)
SELECT DISTINCT 'CATEGORY', category,
    CASE
        WHEN LENGTH(category) <= 3 THEN UPPER(category)
        ELSE UPPER(SUBSTRING(category FROM 1 FOR 3))
    END
FROM products
WHERE category IS NOT NULL AND category != ''
ON CONFLICT DO NOTHING;

-- Handle duplicate short codes for categories by appending a number
DO $$
DECLARE
    rec RECORD;
    new_code VARCHAR(10);
    counter INTEGER;
BEGIN
    FOR rec IN (
        SELECT type, name, short_code,
               ROW_NUMBER() OVER (PARTITION BY type, short_code ORDER BY name) AS rn
        FROM short_codes
        WHERE type = 'CATEGORY'
    ) LOOP
        IF rec.rn > 1 THEN
            counter := rec.rn;
            new_code := SUBSTRING(rec.short_code FROM 1 FOR 2) || counter::TEXT;
            UPDATE short_codes SET short_code = new_code WHERE type = rec.type AND name = rec.name;
        END IF;
    END LOOP;
END $$;

-- Auto-populate existing brands with short codes
INSERT INTO short_codes (type, name, short_code)
SELECT DISTINCT 'BRAND', brand,
    CASE
        WHEN LENGTH(brand) <= 3 THEN UPPER(brand)
        ELSE UPPER(SUBSTRING(brand FROM 1 FOR 3))
    END
FROM products
WHERE brand IS NOT NULL AND brand != ''
ON CONFLICT DO NOTHING;

-- Handle duplicate short codes for brands
DO $$
DECLARE
    rec RECORD;
    new_code VARCHAR(10);
    counter INTEGER;
BEGIN
    FOR rec IN (
        SELECT type, name, short_code,
               ROW_NUMBER() OVER (PARTITION BY type, short_code ORDER BY name) AS rn
        FROM short_codes
        WHERE type = 'BRAND'
    ) LOOP
        IF rec.rn > 1 THEN
            counter := rec.rn;
            new_code := SUBSTRING(rec.short_code FROM 1 FOR 2) || counter::TEXT;
            UPDATE short_codes SET short_code = new_code WHERE type = rec.type AND name = rec.name;
        END IF;
    END LOOP;
END $$;
