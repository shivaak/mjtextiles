-- Allow variant type entries in short_codes master table
ALTER TABLE short_codes
DROP CONSTRAINT IF EXISTS short_codes_type_check;

ALTER TABLE short_codes
ADD CONSTRAINT short_codes_type_check
CHECK (type IN ('CATEGORY', 'BRAND', 'FABRIC', 'SIZE', 'COLOR', 'VARIANT_TYPE'));
