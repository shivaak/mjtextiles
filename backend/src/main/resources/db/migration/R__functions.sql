-- ===========================================
-- Repeatable Migration: Functions & Triggers
-- ===========================================

-- ===========================================
-- 1. Update Timestamp Trigger Function
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers before recreating (for repeatability)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_variants_updated_at ON variants;
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;

-- Apply trigger to all tables with updated_at
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

-- ===========================================
-- 2. Generate Bill Number Function
-- ===========================================
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

-- ===========================================
-- 3. Update Variant Stock on Purchase Function
-- ===========================================
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

-- ===========================================
-- 4. Decrease Variant Stock on Sale Function
-- ===========================================
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

-- ===========================================
-- 5. Restore Stock on Void Function
-- ===========================================
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

-- ===========================================
-- 6. Get Inventory Summary Function
-- ===========================================
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
