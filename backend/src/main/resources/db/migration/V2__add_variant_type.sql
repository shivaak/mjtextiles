-- Add optional variant type attribute for variants
ALTER TABLE variants
ADD COLUMN IF NOT EXISTS variant_type VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_variants_variant_type ON variants(variant_type);
