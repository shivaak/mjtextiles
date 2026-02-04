-- ===========================================
-- V4: Purchase void status fields
-- ===========================================

ALTER TABLE purchases
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN voided_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN voided_by BIGINT REFERENCES users(id),
    ADD COLUMN void_reason TEXT;

ALTER TABLE purchases
    ADD CONSTRAINT purchases_status_check CHECK (status IN ('ACTIVE', 'VOIDED'));

CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_voided_at ON purchases(voided_at);
