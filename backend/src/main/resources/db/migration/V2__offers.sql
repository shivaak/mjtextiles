-- ===========================================
-- V2: Promotional Offers Feature
-- ===========================================

-- Offers table
CREATE TABLE offers (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    offer_type      VARCHAR(20) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    start_date      DATE,
    end_date        DATE,
    combo_price     DECIMAL(12, 2),
    priority        INT NOT NULL DEFAULT 0,
    created_by      BIGINT REFERENCES users(id),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT offers_type_check CHECK (offer_type IN ('QUANTITY_PRICE', 'QUANTITY_DISCOUNT', 'COMBO', 'BOGO')),
    CONSTRAINT offers_combo_price_positive CHECK (combo_price IS NULL OR combo_price >= 0),
    CONSTRAINT offers_date_range_check CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_offers_is_active ON offers(is_active);
CREATE INDEX idx_offers_type ON offers(offer_type);
CREATE INDEX idx_offers_dates ON offers(start_date, end_date);

-- Offer items table
CREATE TABLE offer_items (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    offer_id        BIGINT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    product_id      BIGINT REFERENCES products(id),
    variant_id      BIGINT REFERENCES variants(id),
    min_qty         INT NOT NULL DEFAULT 1,
    offer_price     DECIMAL(12, 2),
    discount_percent DECIMAL(5, 2),
    free_qty        INT NOT NULL DEFAULT 0,

    CONSTRAINT offer_items_scope CHECK (
        (product_id IS NOT NULL AND variant_id IS NULL) OR
        (product_id IS NULL AND variant_id IS NOT NULL)
    ),
    CONSTRAINT offer_items_min_qty_positive CHECK (min_qty >= 1),
    CONSTRAINT offer_items_offer_price_positive CHECK (offer_price IS NULL OR offer_price >= 0),
    CONSTRAINT offer_items_discount_range CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100)),
    CONSTRAINT offer_items_free_qty_positive CHECK (free_qty >= 0)
);

CREATE INDEX idx_offer_items_offer_id ON offer_items(offer_id);
CREATE INDEX idx_offer_items_product_id ON offer_items(product_id);
CREATE INDEX idx_offer_items_variant_id ON offer_items(variant_id);

-- Add applied_offer_id to sale_items for tracking
ALTER TABLE sale_items ADD COLUMN applied_offer_id BIGINT REFERENCES offers(id);
CREATE INDEX idx_sale_items_applied_offer_id ON sale_items(applied_offer_id);
