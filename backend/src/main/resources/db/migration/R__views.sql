-- ===========================================
-- Repeatable Migration: Views
-- ===========================================

-- ===========================================
-- v_variants_with_products
-- Variant details with product information
-- ===========================================
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
    END AS markup_percent,
    p.hsn AS product_hsn,
    COALESCE(v.default_discount_percent, p.default_discount_percent) AS effective_discount_percent
FROM variants v
JOIN products p ON v.product_id = p.id;

-- ===========================================
-- v_sales_with_details
-- Sales with user and item count
-- ===========================================
CREATE OR REPLACE VIEW v_sales_with_details AS
SELECT 
    s.*,
    u.full_name AS created_by_name,
    vu.full_name AS voided_by_name,
    (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS item_count
FROM sales s
LEFT JOIN users u ON s.created_by = u.id
LEFT JOIN users vu ON s.voided_by = vu.id;

-- ===========================================
-- v_purchases_with_details
-- Purchases with supplier and user details
-- ===========================================
DROP VIEW IF EXISTS v_purchases_with_details;
CREATE VIEW v_purchases_with_details AS
SELECT 
    p.id AS id,
    p.supplier_id AS supplierId,
    p.invoice_no AS invoiceNo,
    p.purchased_at AS purchasedAt,
    p.total_cost AS totalCost,
    p.notes AS notes,
    p.status AS status,
    p.voided_at AS voidedAt,
    p.voided_by AS voidedBy,
    p.void_reason AS voidReason,
    p.created_by AS createdBy,
    p.created_at AS createdAt,
    p.updated_at AS updatedAt,
    sup.name AS supplierName,
    u.full_name AS createdByName,
    vu.full_name AS voidedByName,
    (SELECT COUNT(*) FROM purchase_items pi WHERE pi.purchase_id = p.id) AS itemCount
FROM purchases p
JOIN suppliers sup ON p.supplier_id = sup.id
LEFT JOIN users u ON p.created_by = u.id
LEFT JOIN users vu ON p.voided_by = vu.id;

-- ===========================================
-- v_low_stock_variants
-- Variants below low stock threshold
-- ===========================================
DROP VIEW IF EXISTS v_low_stock_variants;
CREATE VIEW v_low_stock_variants AS
SELECT 
    v.*,
    p.name AS product_name,
    p.brand AS product_brand,
    p.category AS product_category,
    s.low_stock_threshold,
    p.hsn AS product_hsn
FROM variants v
JOIN products p ON v.product_id = p.id
CROSS JOIN settings s
WHERE v.status = 'ACTIVE' 
  AND v.stock_qty <= s.low_stock_threshold;

-- ===========================================
-- v_daily_sales_summary
-- Daily sales aggregation for dashboard
-- ===========================================
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

-- ===========================================
-- v_stock_movements
-- Unified view of all stock movements
-- ===========================================
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
