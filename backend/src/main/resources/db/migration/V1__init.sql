-- ===========================================
-- V1: Initial Schema for Retail POS
-- ===========================================

-- Users table
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at   TIMESTAMP
);

-- Refresh tokens table (stateful for revocation support)
CREATE TABLE refresh_tokens (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL,
    token           VARCHAR(255) NOT NULL UNIQUE,
    expires_at      TIMESTAMP NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked         BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for refresh_tokens
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- ===========================================
-- Products table
-- ===========================================
CREATE TABLE products (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    brand           VARCHAR(100) NOT NULL,
    category        VARCHAR(100) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      BIGINT REFERENCES users(id),
    
    CONSTRAINT products_name_brand_unique UNIQUE (name, brand)
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || brand || ' ' || category));

-- ===========================================
-- Variants table
-- ===========================================
CREATE TABLE variants (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    sku             VARCHAR(50) NOT NULL,
    barcode         VARCHAR(50),
    size            VARCHAR(20),
    color           VARCHAR(50),
    selling_price   DECIMAL(12, 2) NOT NULL DEFAULT 0,
    avg_cost        DECIMAL(12, 2) NOT NULL DEFAULT 0,
    stock_qty       INTEGER NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      BIGINT REFERENCES users(id),
    
    CONSTRAINT variants_sku_unique UNIQUE (sku),
    CONSTRAINT variants_barcode_unique UNIQUE (barcode),
    CONSTRAINT variants_status_check CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT variants_selling_price_positive CHECK (selling_price >= 0),
    CONSTRAINT variants_avg_cost_positive CHECK (avg_cost >= 0),
    CONSTRAINT variants_stock_qty_non_negative CHECK (stock_qty >= 0)
);

CREATE INDEX idx_variants_product_id ON variants(product_id);
CREATE INDEX idx_variants_barcode ON variants(barcode);
CREATE INDEX idx_variants_sku ON variants(sku);
CREATE INDEX idx_variants_status ON variants(status);
CREATE INDEX idx_variants_stock_qty ON variants(stock_qty);
CREATE INDEX idx_variants_low_stock ON variants(stock_qty) WHERE status = 'ACTIVE';

-- ===========================================
-- Suppliers table
-- ===========================================
CREATE TABLE suppliers (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    phone           VARCHAR(20),
    email           VARCHAR(100),
    address         TEXT,
    gst_number      VARCHAR(20),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      BIGINT REFERENCES users(id),
    
    CONSTRAINT suppliers_name_unique UNIQUE (name)
);

CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_is_active ON suppliers(is_active);

-- ===========================================
-- Purchases table
-- ===========================================
CREATE TABLE purchases (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    supplier_id     BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    invoice_no      VARCHAR(50),
    purchased_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    total_cost      DECIMAL(12, 2) NOT NULL DEFAULT 0,
    notes           TEXT,
    created_by      BIGINT NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT purchases_total_cost_positive CHECK (total_cost >= 0)
);

CREATE INDEX idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX idx_purchases_purchased_at ON purchases(purchased_at);
CREATE INDEX idx_purchases_invoice_no ON purchases(invoice_no);
CREATE INDEX idx_purchases_created_by ON purchases(created_by);
CREATE INDEX idx_purchases_created_at ON purchases(created_at);

-- ===========================================
-- Purchase Items table
-- ===========================================
CREATE TABLE purchase_items (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    purchase_id     BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    variant_id      BIGINT NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
    qty             INTEGER NOT NULL,
    unit_cost       DECIMAL(12, 2) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT purchase_items_qty_positive CHECK (qty > 0),
    CONSTRAINT purchase_items_unit_cost_positive CHECK (unit_cost >= 0)
);

CREATE INDEX idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_variant_id ON purchase_items(variant_id);

-- ===========================================
-- Sales table
-- ===========================================
CREATE TABLE sales (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    bill_no             VARCHAR(20) NOT NULL,
    sold_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    customer_name       VARCHAR(100),
    customer_phone      VARCHAR(20),
    payment_mode        VARCHAR(20) NOT NULL DEFAULT 'CASH',
    subtotal            DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount_percent    DECIMAL(5, 2) NOT NULL DEFAULT 0,
    discount_amount     DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_percent         DECIMAL(5, 2) NOT NULL DEFAULT 0,
    tax_amount          DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total               DECIMAL(12, 2) NOT NULL DEFAULT 0,
    profit              DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    voided_at           TIMESTAMP WITH TIME ZONE,
    voided_by           BIGINT REFERENCES users(id),
    void_reason         TEXT,
    created_by          BIGINT NOT NULL REFERENCES users(id),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT sales_bill_no_unique UNIQUE (bill_no),
    CONSTRAINT sales_payment_mode_check CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT')),
    CONSTRAINT sales_status_check CHECK (status IN ('COMPLETED', 'VOIDED')),
    CONSTRAINT sales_subtotal_positive CHECK (subtotal >= 0),
    CONSTRAINT sales_discount_percent_range CHECK (discount_percent >= 0 AND discount_percent <= 100),
    CONSTRAINT sales_discount_amount_positive CHECK (discount_amount >= 0),
    CONSTRAINT sales_tax_percent_range CHECK (tax_percent >= 0 AND tax_percent <= 100),
    CONSTRAINT sales_tax_amount_positive CHECK (tax_amount >= 0),
    CONSTRAINT sales_total_positive CHECK (total >= 0)
);

CREATE INDEX idx_sales_bill_no ON sales(bill_no);
CREATE INDEX idx_sales_sold_at ON sales(sold_at);
CREATE INDEX idx_sales_customer_phone ON sales(customer_phone);
CREATE INDEX idx_sales_payment_mode ON sales(payment_mode);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_created_by ON sales(created_by);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_sold_at_status ON sales(sold_at, status);

-- ===========================================
-- Sale Items table
-- ===========================================
CREATE TABLE sale_items (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sale_id             BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    variant_id          BIGINT NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
    qty                 INTEGER NOT NULL,
    unit_price          DECIMAL(12, 2) NOT NULL,
    unit_cost_at_sale   DECIMAL(12, 2) NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT sale_items_qty_positive CHECK (qty > 0),
    CONSTRAINT sale_items_unit_price_positive CHECK (unit_price >= 0),
    CONSTRAINT sale_items_unit_cost_positive CHECK (unit_cost_at_sale >= 0)
);

CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_variant_id ON sale_items(variant_id);

-- ===========================================
-- Stock Adjustments table
-- ===========================================
CREATE TABLE stock_adjustments (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    variant_id      BIGINT NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
    delta_qty       INTEGER NOT NULL,
    reason          VARCHAR(20) NOT NULL,
    notes           TEXT,
    created_by      BIGINT NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT stock_adjustments_reason_check CHECK (reason IN ('OPENING_STOCK', 'DAMAGE', 'THEFT', 'CORRECTION', 'RETURN', 'OTHER')),
    CONSTRAINT stock_adjustments_delta_qty_non_zero CHECK (delta_qty != 0)
);

CREATE INDEX idx_stock_adjustments_variant_id ON stock_adjustments(variant_id);
CREATE INDEX idx_stock_adjustments_created_at ON stock_adjustments(created_at);
CREATE INDEX idx_stock_adjustments_reason ON stock_adjustments(reason);

-- ===========================================
-- Settings table (single row)
-- ===========================================
CREATE TABLE settings (
    id                  INTEGER PRIMARY KEY DEFAULT 1,
    shop_name           VARCHAR(200) NOT NULL DEFAULT 'MJ Textiles',
    address             TEXT,
    phone               VARCHAR(20),
    email               VARCHAR(100),
    gst_number          VARCHAR(20),
    currency            VARCHAR(5) NOT NULL DEFAULT '₹',
    tax_percent         DECIMAL(5, 2) NOT NULL DEFAULT 0,
    invoice_prefix      VARCHAR(10) NOT NULL DEFAULT 'MJT',
    last_bill_number    INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT settings_single_row CHECK (id = 1),
    CONSTRAINT settings_tax_percent_range CHECK (tax_percent >= 0 AND tax_percent <= 100),
    CONSTRAINT settings_last_bill_number_positive CHECK (last_bill_number >= 0),
    CONSTRAINT settings_low_stock_threshold_positive CHECK (low_stock_threshold >= 0)
);
