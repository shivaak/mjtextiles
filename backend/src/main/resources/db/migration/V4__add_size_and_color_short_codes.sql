-- ===========================================
-- V4: Add SIZE and COLOR to short_codes
-- ===========================================

-- Drop existing type check constraint and add updated one
ALTER TABLE short_codes DROP CONSTRAINT short_codes_type_check;
ALTER TABLE short_codes ADD CONSTRAINT short_codes_type_check
    CHECK (type IN ('CATEGORY', 'BRAND', 'FABRIC', 'SIZE', 'COLOR'));

-- Auto-populate SIZE entries from existing variants
INSERT INTO short_codes (type, name, short_code)
SELECT DISTINCT 'SIZE', size,
    CASE
        WHEN LENGTH(size) <= 10 THEN UPPER(size)
        ELSE UPPER(SUBSTRING(size FROM 1 FOR 10))
    END
FROM variants
WHERE size IS NOT NULL AND size != ''
ON CONFLICT DO NOTHING;

-- Handle duplicate short codes for sizes
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
        WHERE type = 'SIZE'
    ) LOOP
        IF rec.rn > 1 THEN
            counter := rec.rn;
            new_code := SUBSTRING(rec.short_code FROM 1 FOR 8) || counter::TEXT;
            UPDATE short_codes SET short_code = new_code WHERE type = rec.type AND name = rec.name;
        END IF;
    END LOOP;
END $$;

-- Auto-populate COLOR entries from existing variants
INSERT INTO short_codes (type, name, short_code)
SELECT DISTINCT 'COLOR', color,
    CASE
        WHEN LENGTH(color) <= 3 THEN UPPER(color)
        ELSE UPPER(SUBSTRING(color FROM 1 FOR 3))
    END
FROM variants
WHERE color IS NOT NULL AND color != ''
ON CONFLICT DO NOTHING;

-- Handle duplicate short codes for colors
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
        WHERE type = 'COLOR'
    ) LOOP
        IF rec.rn > 1 THEN
            counter := rec.rn;
            new_code := SUBSTRING(rec.short_code FROM 1 FOR 2) || counter::TEXT;
            UPDATE short_codes SET short_code = new_code WHERE type = rec.type AND name = rec.name;
        END IF;
    END LOOP;
END $$;
