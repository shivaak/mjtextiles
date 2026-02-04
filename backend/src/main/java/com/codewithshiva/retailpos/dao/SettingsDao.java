package com.codewithshiva.retailpos.dao;

import com.codewithshiva.retailpos.model.Settings;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * JDBI DAO for Settings operations.
 * The settings table is a single-row table (id = 1).
 */
@RegisterConstructorMapper(Settings.class)
public interface SettingsDao {

    @SqlQuery("""
        SELECT id, shop_name as shopName, address, phone, email, gst_number as gstNumber,
               currency, tax_percent as taxPercent, invoice_prefix as invoicePrefix,
               last_bill_number as lastBillNumber, low_stock_threshold as lowStockThreshold,
               created_at as createdAt, updated_at as updatedAt
        FROM settings
        WHERE id = 1
        """)
    Optional<Settings> get();

    @SqlUpdate("""
        UPDATE settings
        SET shop_name = :shopName,
            address = :address,
            phone = :phone,
            email = :email,
            gst_number = :gstNumber,
            currency = :currency,
            tax_percent = :taxPercent,
            invoice_prefix = :invoicePrefix,
            low_stock_threshold = :lowStockThreshold
        WHERE id = 1
        """)
    void update(@Bind("shopName") String shopName,
                @Bind("address") String address,
                @Bind("phone") String phone,
                @Bind("email") String email,
                @Bind("gstNumber") String gstNumber,
                @Bind("currency") String currency,
                @Bind("taxPercent") BigDecimal taxPercent,
                @Bind("invoicePrefix") String invoicePrefix,
                @Bind("lowStockThreshold") Integer lowStockThreshold);

    @SqlUpdate("""
        INSERT INTO settings (id, shop_name, currency, tax_percent, invoice_prefix, low_stock_threshold)
        VALUES (1, :shopName, :currency, :taxPercent, :invoicePrefix, :lowStockThreshold)
        ON CONFLICT (id) DO NOTHING
        """)
    void insertDefault(@Bind("shopName") String shopName,
                       @Bind("currency") String currency,
                       @Bind("taxPercent") BigDecimal taxPercent,
                       @Bind("invoicePrefix") String invoicePrefix,
                       @Bind("lowStockThreshold") Integer lowStockThreshold);
}
