# MJ Textiles - Database Schema

This document contains the complete SQL database schema for the MJ Textiles Billing & Stock Management System.

## Database: PostgreSQL 15+

> **Note:** This schema is designed for PostgreSQL. Minor modifications may be needed for MySQL/MariaDB.

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Table Definitions](#table-definitions)
4. [Indexes](#indexes)
5. [Views](#views)
6. [Functions & Triggers](#functions--triggers)
7. [Initial Data](#initial-data)
8. [Migration Notes](#migration-notes)

---

## Schema Overview

| Table | Description | Estimated Rows |
|-------|-------------|----------------|
| users | User accounts | 10-50 |
| products | Product master | 100-500 |
| variants | Product variants (SKU level) | 500-2000 |
| suppliers | Supplier master | 20-100 |
| purchases | Purchase orders (header) | 500-5000 |
| purchase_items | Purchase line items | 2000-20000 |
| sales | Sales transactions (header) | 5000-50000 |
| sale_items | Sales line items | 20000-200000 |
| stock_adjustments | Manual stock adjustments | 100-1000 |
| settings | Shop configuration | 1 |
| refresh_tokens | JWT refresh tokens | 10-100 |

### ID Strategy: Auto-Increment BIGINT

This schema uses **auto-increment BIGINT** for primary keys instead of UUID because:
- Single database application (no distributed systems)
- Better index performance (sequential IDs)
- Easier debugging and support
- Smaller storage footprint
- BIGINT supports up to 9.2 quintillion records

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   users     │       │  products   │       │  suppliers  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ username    │       │ name        │       │ name        │
│ password    │       │ brand       │       │ phone       │
│ full_name   │       │ category    │       │ email       │
│ role        │       │ description │       │ address     │
│ is_active   │       │ created_at  │       │ created_at  │
│ created_at  │       │ updated_at  │       └──────┬──────┘
└──────┬──────┘       └──────┬──────┘              │
       │                     │                     │
       │              ┌──────┴──────┐              │
       │              │  variants   │              │
       │              ├─────────────┤              │
       │              │ id (PK)     │              │
       │              │ product_id  │──────────────┘
       │              │ sku         │              │
       │              │ barcode     │              │
       │              │ size        │              │
       │              │ color       │              │
       │              │ selling_price│             │
       │              │ avg_cost    │              │
       │              │ stock_qty   │              │
       │              │ status      │              │
       │              └──────┬──────┘              │
       │                     │                     │
       │    ┌────────────────┼────────────────┐    │
       │    │                │                │    │
       │    ▼                ▼                ▼    │
┌──────┴────────┐   ┌───────────────┐   ┌─────┴───────┐
│    sales      │   │stock_adjustments│ │  purchases  │
├───────────────┤   ├───────────────┤   ├─────────────┤
│ id (PK)       │   │ id (PK)       │   │ id (PK)     │
│ bill_no       │   │ variant_id    │   │ supplier_id │
│ sold_at       │   │ delta_qty     │   │ invoice_no  │
│ customer_name │   │ reason        │   │ purchased_at│
│ payment_mode  │   │ notes         │   │ total_cost  │
│ subtotal      │   │ created_by    │   │ created_by  │
│ discount_%    │   │ created_at    │   │ created_at  │
│ tax_%         │   └───────────────┘   └──────┬──────┘
│ total         │                              │
│ profit        │                              │
│ status        │                              │
│ created_by    │                              │
└───────┬───────┘                              │
        │                                      │
        ▼                                      ▼
┌───────────────┐                     ┌───────────────┐
│  sale_items   │                     │purchase_items │
├───────────────┤                     ├───────────────┤
│ id (PK)       │                     │ id (PK)       │
│ sale_id (FK)  │                     │ purchase_id   │
│ variant_id    │                     │ variant_id    │
│ qty           │                     │ qty           │
│ unit_price    │                     │ unit_cost     │
│ unit_cost_at_sale│                  └───────────────┘
└───────────────┘
```

---

## Table Definitions

### 1. users

Stores user accounts for authentication and authorization.

```sql
CREATE TABLE users (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username        VARCHAR(50) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at   TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT users_username_unique UNIQUE (username),
    CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'EMPLOYEE'))
);

-- Index for login queries
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);

COMMENT ON TABLE users IS 'User accounts for authentication';
COMMENT ON COLUMN users.password_hash IS 'BCrypt hashed password';
COMMENT ON COLUMN users.role IS 'ADMIN = full access, EMPLOYEE = limited access';
```

---

### 2. products

Product master table storing product information.

```sql
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

-- Indexes for filtering and searching
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || brand || ' ' || category));

COMMENT ON TABLE products IS 'Product master - each product can have multiple variants';
```

---

### 3. variants

Product variants at SKU level with stock tracking.

```sql
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

-- Indexes for common queries
CREATE INDEX idx_variants_product_id ON variants(product_id);
CREATE INDEX idx_variants_barcode ON variants(barcode);
CREATE INDEX idx_variants_sku ON variants(sku);
CREATE INDEX idx_variants_status ON variants(status);
CREATE INDEX idx_variants_stock_qty ON variants(stock_qty);
CREATE INDEX idx_variants_low_stock ON variants(stock_qty) WHERE status = 'ACTIVE';

COMMENT ON TABLE variants IS 'Product variants at SKU level with stock tracking';
COMMENT ON COLUMN variants.avg_cost IS 'Weighted average cost, updated on each purchase';
COMMENT ON COLUMN variants.stock_qty IS 'Current stock quantity, updated on purchase/sale/adjustment';
```

---

### 4. suppliers

Supplier master table.

```sql
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

-- Indexes
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_is_active ON suppliers(is_active);

COMMENT ON TABLE suppliers IS 'Supplier master for purchase orders';
```

---

### 5. purchases

Purchase order header.

```sql
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

-- Indexes
CREATE INDEX idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX idx_purchases_purchased_at ON purchases(purchased_at);
CREATE INDEX idx_purchases_invoice_no ON purchases(invoice_no);
CREATE INDEX idx_purchases_created_by ON purchases(created_by);
CREATE INDEX idx_purchases_created_at ON purchases(created_at);

COMMENT ON TABLE purchases IS 'Purchase order header - stock-in transactions';
COMMENT ON COLUMN purchases.total_cost IS 'Sum of all purchase items (qty * unit_cost)';
```

---

### 6. purchase_items

Purchase order line items.

```sql
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

-- Indexes
CREATE INDEX idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_variant_id ON purchase_items(variant_id);

COMMENT ON TABLE purchase_items IS 'Purchase order line items';
COMMENT ON COLUMN purchase_items.unit_cost IS 'Cost per unit at time of purchase';
```

---

### 7. sales

Sales transaction header.

```sql
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

-- Indexes for common queries
CREATE INDEX idx_sales_bill_no ON sales(bill_no);
CREATE INDEX idx_sales_sold_at ON sales(sold_at);
CREATE INDEX idx_sales_customer_phone ON sales(customer_phone);
CREATE INDEX idx_sales_payment_mode ON sales(payment_mode);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_created_by ON sales(created_by);
CREATE INDEX idx_sales_created_at ON sales(created_at);

-- Composite index for date range queries with status
CREATE INDEX idx_sales_sold_at_status ON sales(sold_at, status);

COMMENT ON TABLE sales IS 'Sales transaction header';
COMMENT ON COLUMN sales.bill_no IS 'Unique bill number: prefix + sequence (e.g., MJT000001)';
COMMENT ON COLUMN sales.profit IS 'Total profit = sum of (unit_price - unit_cost_at_sale) * qty';
```

---

### 8. sale_items

Sales line items.

```sql
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

-- Indexes
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_variant_id ON sale_items(variant_id);

COMMENT ON TABLE sale_items IS 'Sales line items';
COMMENT ON COLUMN sale_items.unit_cost_at_sale IS 'Snapshot of avg_cost at time of sale for profit calculation';
```

---

### 9. stock_adjustments

Manual stock adjustments (damage, theft, corrections, opening stock).

```sql
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

-- Indexes
CREATE INDEX idx_stock_adjustments_variant_id ON stock_adjustments(variant_id);
CREATE INDEX idx_stock_adjustments_created_at ON stock_adjustments(created_at);
CREATE INDEX idx_stock_adjustments_reason ON stock_adjustments(reason);

COMMENT ON TABLE stock_adjustments IS 'Manual stock adjustments with audit trail';
COMMENT ON COLUMN stock_adjustments.delta_qty IS 'Positive = add stock, Negative = remove stock';
```

---

### 10. settings

Shop configuration (single row table).

```sql
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
    
    -- Ensure only one row exists
    CONSTRAINT settings_single_row CHECK (id = 1),
    CONSTRAINT settings_tax_percent_range CHECK (tax_percent >= 0 AND tax_percent <= 100),
    CONSTRAINT settings_last_bill_number_positive CHECK (last_bill_number >= 0),
    CONSTRAINT settings_low_stock_threshold_positive CHECK (low_stock_threshold >= 0)
);

COMMENT ON TABLE settings IS 'Shop configuration - single row table';
COMMENT ON COLUMN settings.last_bill_number IS 'Auto-increment counter for bill number generation';
```

---

### 11. refresh_tokens

JWT refresh tokens for authentication.

```sql
CREATE TABLE refresh_tokens (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at      TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT refresh_tokens_token_hash_unique UNIQUE (token_hash)
);

-- Indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for session management';
```

---

## Indexes

### Summary of All Indexes

```sql
-- Users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Products
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || brand || ' ' || category));

-- Variants
CREATE INDEX idx_variants_product_id ON variants(product_id);
CREATE INDEX idx_variants_barcode ON variants(barcode);
CREATE INDEX idx_variants_sku ON variants(sku);
CREATE INDEX idx_variants_status ON variants(status);
CREATE INDEX idx_variants_stock_qty ON variants(stock_qty);
CREATE INDEX idx_variants_low_stock ON variants(stock_qty) WHERE status = 'ACTIVE';

-- Suppliers
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_is_active ON suppliers(is_active);

-- Purchases
CREATE INDEX idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX idx_purchases_purchased_at ON purchases(purchased_at);
CREATE INDEX idx_purchases_invoice_no ON purchases(invoice_no);
CREATE INDEX idx_purchases_created_by ON purchases(created_by);
CREATE INDEX idx_purchases_created_at ON purchases(created_at);

-- Purchase Items
CREATE INDEX idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_variant_id ON purchase_items(variant_id);

-- Sales
CREATE INDEX idx_sales_bill_no ON sales(bill_no);
CREATE INDEX idx_sales_sold_at ON sales(sold_at);
CREATE INDEX idx_sales_customer_phone ON sales(customer_phone);
CREATE INDEX idx_sales_payment_mode ON sales(payment_mode);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_created_by ON sales(created_by);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_sold_at_status ON sales(sold_at, status);

-- Sale Items
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_variant_id ON sale_items(variant_id);

-- Stock Adjustments
CREATE INDEX idx_stock_adjustments_variant_id ON stock_adjustments(variant_id);
CREATE INDEX idx_stock_adjustments_created_at ON stock_adjustments(created_at);
CREATE INDEX idx_stock_adjustments_reason ON stock_adjustments(reason);

-- Refresh Tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

---

## Views

### 1. v_variants_with_products

Variant details with product information (commonly used view).

```sql
CREATE OR REPLACE VIEW v_variants_with_products AS
SELECT 
    v.id,
    v.product_id,
    p.name AS product_name,
    p.brand AS product_brand,
    p.category AS product_category,
    v.sku,
    v.barcode,
    v.size,
    v.color,
    v.selling_price,
    v.avg_cost,
    v.stock_qty,
    v.status,
    v.created_at,
    v.updated_at,
    -- Calculated fields
    (v.stock_qty * v.avg_cost) AS stock_value,
    CASE 
        WHEN v.selling_price > 0 THEN 
            ROUND(((v.selling_price - v.avg_cost) / v.selling_price * 100)::numeric, 2)
        ELSE 0 
    END AS margin_percent,
    CASE 
        WHEN v.avg_cost > 0 THEN 
            ROUND(((v.selling_price - v.avg_cost) / v.avg_cost * 100)::numeric, 2)
        ELSE 0 
    END AS markup_percent
FROM variants v
JOIN products p ON v.product_id = p.id;

COMMENT ON VIEW v_variants_with_products IS 'Variants with product details and calculated fields';
```

---

### 2. v_sales_with_details

Sales with user and item count.

```sql
CREATE OR REPLACE VIEW v_sales_with_details AS
SELECT 
    s.*,
    u.full_name AS created_by_name,
    vu.full_name AS voided_by_name,
    (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS item_count
FROM sales s
LEFT JOIN users u ON s.created_by = u.id
LEFT JOIN users vu ON s.voided_by = vu.id;

COMMENT ON VIEW v_sales_with_details IS 'Sales with user names and item count';
```

---

### 3. v_purchases_with_details

Purchases with supplier and user details.

```sql
CREATE OR REPLACE VIEW v_purchases_with_details AS
SELECT 
    p.*,
    sup.name AS supplier_name,
    u.full_name AS created_by_name,
    (SELECT COUNT(*) FROM purchase_items pi WHERE pi.purchase_id = p.id) AS item_count
FROM purchases p
JOIN suppliers sup ON p.supplier_id = sup.id
LEFT JOIN users u ON p.created_by = u.id;

COMMENT ON VIEW v_purchases_with_details IS 'Purchases with supplier and user names';
```

---

### 4. v_low_stock_variants

Variants below low stock threshold.

```sql
CREATE OR REPLACE VIEW v_low_stock_variants AS
SELECT 
    v.*,
    p.name AS product_name,
    p.brand AS product_brand,
    p.category AS product_category,
    s.low_stock_threshold
FROM variants v
JOIN products p ON v.product_id = p.id
CROSS JOIN settings s
WHERE v.status = 'ACTIVE' 
  AND v.stock_qty <= s.low_stock_threshold;

COMMENT ON VIEW v_low_stock_variants IS 'Active variants at or below low stock threshold';
```

---

### 5. v_daily_sales_summary

Daily sales aggregation for dashboard.

```sql
CREATE OR REPLACE VIEW v_daily_sales_summary AS
SELECT 
    DATE(sold_at) AS sale_date,
    COUNT(*) AS transaction_count,
    SUM(CASE WHEN status = 'COMPLETED' THEN total ELSE 0 END) AS total_sales,
    SUM(CASE WHEN status = 'COMPLETED' THEN profit ELSE 0 END) AS total_profit,
    COUNT(CASE WHEN status = 'VOIDED' THEN 1 END) AS voided_count,
    COUNT(CASE WHEN payment_mode = 'CASH' AND status = 'COMPLETED' THEN 1 END) AS cash_count,
    COUNT(CASE WHEN payment_mode = 'CARD' AND status = 'COMPLETED' THEN 1 END) AS card_count,
    COUNT(CASE WHEN payment_mode = 'UPI' AND status = 'COMPLETED' THEN 1 END) AS upi_count,
    COUNT(CASE WHEN payment_mode = 'CREDIT' AND status = 'COMPLETED' THEN 1 END) AS credit_count
FROM sales
GROUP BY DATE(sold_at);

COMMENT ON VIEW v_daily_sales_summary IS 'Daily aggregated sales for reporting';
```

---

### 6. v_stock_movements

Unified view of all stock movements.

```sql
CREATE OR REPLACE VIEW v_stock_movements AS
-- Purchases (stock in)
SELECT 
    pi.id,
    pi.variant_id,
    'PURCHASE' AS movement_type,
    p.purchased_at AS movement_date,
    pi.qty AS delta_qty,
    p.id AS reference_id,
    p.invoice_no AS reference_no,
    sup.name AS supplier_name,
    pi.unit_cost,
    NULL AS notes,
    p.created_by,
    pi.created_at
FROM purchase_items pi
JOIN purchases p ON pi.purchase_id = p.id
JOIN suppliers sup ON p.supplier_id = sup.id

UNION ALL

-- Sales (stock out)
SELECT 
    si.id,
    si.variant_id,
    CASE WHEN s.status = 'VOIDED' THEN 'VOID_RESTORE' ELSE 'SALE' END AS movement_type,
    s.sold_at AS movement_date,
    CASE WHEN s.status = 'VOIDED' THEN si.qty ELSE -si.qty END AS delta_qty,
    s.id AS reference_id,
    s.bill_no AS reference_no,
    NULL AS supplier_name,
    si.unit_cost_at_sale AS unit_cost,
    NULL AS notes,
    s.created_by,
    si.created_at
FROM sale_items si
JOIN sales s ON si.sale_id = s.id

UNION ALL

-- Stock Adjustments
SELECT 
    sa.id,
    sa.variant_id,
    'ADJUSTMENT' AS movement_type,
    sa.created_at AS movement_date,
    sa.delta_qty,
    sa.id AS reference_id,
    NULL AS reference_no,
    NULL AS supplier_name,
    NULL AS unit_cost,
    sa.reason || COALESCE(': ' || sa.notes, '') AS notes,
    sa.created_by,
    sa.created_at
FROM stock_adjustments sa;

COMMENT ON VIEW v_stock_movements IS 'Unified view of all stock movements (purchases, sales, adjustments)';
```

---

## Functions & Triggers

### 1. Update Timestamp Trigger

Automatically update `updated_at` column.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variants_updated_at
    BEFORE UPDATE ON variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
    BEFORE UPDATE ON purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### 2. Generate Bill Number Function

Generate unique bill number with prefix.

```sql
CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    v_prefix VARCHAR(10);
    v_next_number INTEGER;
    v_bill_no VARCHAR(20);
BEGIN
    -- Get prefix and increment counter atomically
    UPDATE settings 
    SET last_bill_number = last_bill_number + 1
    WHERE id = 1
    RETURNING invoice_prefix, last_bill_number INTO v_prefix, v_next_number;
    
    -- Format bill number with zero-padding
    v_bill_no := v_prefix || LPAD(v_next_number::TEXT, 6, '0');
    
    RETURN v_bill_no;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_bill_number IS 'Generates unique bill number: prefix + 6-digit sequence';
```

---

### 3. Update Variant Stock Function

Update variant stock and avg_cost after purchase.

```sql
CREATE OR REPLACE FUNCTION update_variant_stock_on_purchase(
    p_variant_id BIGINT,
    p_qty INTEGER,
    p_unit_cost DECIMAL(12, 2)
)
RETURNS VOID AS $$
DECLARE
    v_current_stock INTEGER;
    v_current_avg_cost DECIMAL(12, 2);
    v_new_avg_cost DECIMAL(12, 2);
BEGIN
    -- Get current values
    SELECT stock_qty, avg_cost INTO v_current_stock, v_current_avg_cost
    FROM variants WHERE id = p_variant_id FOR UPDATE;
    
    -- Calculate new weighted average cost
    IF v_current_stock + p_qty > 0 THEN
        v_new_avg_cost := ((v_current_stock * v_current_avg_cost) + (p_qty * p_unit_cost)) 
                          / (v_current_stock + p_qty);
    ELSE
        v_new_avg_cost := p_unit_cost;
    END IF;
    
    -- Update variant
    UPDATE variants 
    SET 
        stock_qty = stock_qty + p_qty,
        avg_cost = ROUND(v_new_avg_cost, 2),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_variant_stock_on_purchase IS 'Updates stock quantity and weighted average cost on purchase';
```

---

### 4. Decrease Variant Stock Function

Decrease variant stock after sale.

```sql
CREATE OR REPLACE FUNCTION decrease_variant_stock_on_sale(
    p_variant_id BIGINT,
    p_qty INTEGER
)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
    v_current_stock INTEGER;
    v_avg_cost DECIMAL(12, 2);
BEGIN
    -- Get current values with lock
    SELECT stock_qty, avg_cost INTO v_current_stock, v_avg_cost
    FROM variants WHERE id = p_variant_id FOR UPDATE;
    
    -- Validate stock
    IF v_current_stock < p_qty THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_current_stock, p_qty;
    END IF;
    
    -- Update stock
    UPDATE variants 
    SET 
        stock_qty = stock_qty - p_qty,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_variant_id;
    
    -- Return avg_cost for profit calculation
    RETURN v_avg_cost;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION decrease_variant_stock_on_sale IS 'Decreases stock and returns avg_cost for profit calculation';
```

---

### 5. Restore Stock on Void Function

Restore stock when sale is voided.

```sql
CREATE OR REPLACE FUNCTION restore_stock_on_void(p_sale_id BIGINT)
RETURNS VOID AS $$
BEGIN
    -- Restore stock for each sale item
    UPDATE variants v
    SET 
        stock_qty = v.stock_qty + si.qty,
        updated_at = CURRENT_TIMESTAMP
    FROM sale_items si
    WHERE si.sale_id = p_sale_id 
      AND si.variant_id = v.id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION restore_stock_on_void IS 'Restores stock quantities when a sale is voided';
```

---

### 6. Get Inventory Summary Function

```sql
CREATE OR REPLACE FUNCTION get_inventory_summary()
RETURNS TABLE (
    total_skus BIGINT,
    total_items BIGINT,
    total_cost_value DECIMAL(14, 2),
    total_retail_value DECIMAL(14, 2),
    low_stock_count BIGINT,
    out_of_stock_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT AS total_skus,
        COALESCE(SUM(v.stock_qty), 0)::BIGINT AS total_items,
        COALESCE(SUM(v.stock_qty * v.avg_cost), 0)::DECIMAL(14, 2) AS total_cost_value,
        COALESCE(SUM(v.stock_qty * v.selling_price), 0)::DECIMAL(14, 2) AS total_retail_value,
        COUNT(CASE WHEN v.stock_qty > 0 AND v.stock_qty <= s.low_stock_threshold THEN 1 END)::BIGINT AS low_stock_count,
        COUNT(CASE WHEN v.stock_qty = 0 THEN 1 END)::BIGINT AS out_of_stock_count
    FROM variants v
    CROSS JOIN settings s
    WHERE v.status = 'ACTIVE';
END;
$$ LANGUAGE plpgsql;
```

---

## Initial Data

### Insert Default Settings

```sql
INSERT INTO settings (
    id, 
    shop_name, 
    address, 
    phone, 
    currency, 
    tax_percent, 
    invoice_prefix, 
    last_bill_number, 
    low_stock_threshold
) VALUES (
    1,
    'MJ Textiles',
    '123 Main Street, City',
    '9876543210',
    '₹',
    5.00,
    'MJT',
    0,
    10
);
```

---

### Insert Default Admin User

```sql
-- Password: admin123 (BCrypt hash)
INSERT INTO users (
    username, 
    password_hash, 
    full_name, 
    role, 
    is_active
) VALUES (
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqGvbmqGqhpCPVEJJOFhY.U2FXoN9.K', -- admin123
    'Mahesh Joshi',
    'ADMIN',
    TRUE
);

-- Password: cashier123 (BCrypt hash)
INSERT INTO users (
    username, 
    password_hash, 
    full_name, 
    role, 
    is_active
) VALUES (
    'cashier',
    '$2a$10$WrEUvGq1GKjmTj2GqYUPbOa0l2n0cEWN/QKHVjOPnHPmGkJrU1rXG', -- cashier123
    'Ramesh Kumar',
    'EMPLOYEE',
    TRUE
);
```

---

## Migration Notes

### For MySQL/MariaDB Compatibility

If using MySQL instead of PostgreSQL, make these modifications:

1. **Auto-Increment:**
   ```sql
   -- PostgreSQL
   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
   
   -- MySQL
   id BIGINT AUTO_INCREMENT PRIMARY KEY
   ```

2. **Timestamp:**
   ```sql
   -- PostgreSQL
   TIMESTAMP WITH TIME ZONE
   
   -- MySQL
   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   ```

3. **Text Search:**
   ```sql
   -- PostgreSQL GIN index
   CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || brand));
   
   -- MySQL FULLTEXT index
   CREATE FULLTEXT INDEX idx_products_search ON products(name, brand, category);
   ```

4. **Boolean:**
   ```sql
   -- PostgreSQL
   BOOLEAN NOT NULL DEFAULT TRUE
   
   -- MySQL
   TINYINT(1) NOT NULL DEFAULT 1
   ```

5. **RETURNING clause:**
   - PostgreSQL supports `RETURNING`
   - MySQL requires `SELECT LAST_INSERT_ID()` or separate query

---

## Complete Schema Script

For convenience, here's a quick reference to create all tables in order:

```sql
-- Execution order (respects foreign key dependencies):
-- 1. users (no dependencies)
-- 2. settings (no dependencies)
-- 3. products (depends on users)
-- 4. suppliers (depends on users)
-- 5. variants (depends on products, users)
-- 6. purchases (depends on suppliers, users)
-- 7. purchase_items (depends on purchases, variants)
-- 8. sales (depends on users)
-- 9. sale_items (depends on sales, variants)
-- 10. stock_adjustments (depends on variants, users)
-- 11. refresh_tokens (depends on users)

-- To reset database:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then run all CREATE statements above
```

---

## Schema Statistics

| Category | Count |
|----------|-------|
| Tables | 11 |
| Indexes | 30+ |
| Views | 6 |
| Functions | 6 |
| Triggers | 7 |
| Constraints | 25+ |

---

## Data Types Summary

| Column Type | PostgreSQL | MySQL Equivalent |
|-------------|------------|------------------|
| Primary Key | `BIGINT GENERATED ALWAYS AS IDENTITY` | `BIGINT AUTO_INCREMENT` |
| Foreign Key | `BIGINT REFERENCES table(id)` | `BIGINT, FOREIGN KEY` |
| Money | `DECIMAL(12, 2)` | `DECIMAL(12, 2)` |
| Percentage | `DECIMAL(5, 2)` | `DECIMAL(5, 2)` |
| Timestamp | `TIMESTAMP WITH TIME ZONE` | `TIMESTAMP` |
| Boolean | `BOOLEAN` | `TINYINT(1)` |
| Text | `TEXT` | `TEXT` |

---

*Document Version: 1.1*  
*Last Updated: February 2026*  
*Compatible with: PostgreSQL 15+, MySQL 8+ (with modifications)*
