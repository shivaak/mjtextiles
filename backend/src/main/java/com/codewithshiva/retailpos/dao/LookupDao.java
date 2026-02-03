package com.codewithshiva.retailpos.dao;

import org.jdbi.v3.sqlobject.statement.SqlQuery;

import java.util.List;

/**
 * JDBI DAO for Lookup operations.
 */
public interface LookupDao {

    @SqlQuery("""
        SELECT DISTINCT category 
        FROM products 
        WHERE is_active = true AND category IS NOT NULL 
        ORDER BY category
        """)
    List<String> findAllCategories();

    @SqlQuery("""
        SELECT DISTINCT brand 
        FROM products 
        WHERE is_active = true AND brand IS NOT NULL 
        ORDER BY brand
        """)
    List<String> findAllBrands();

    @SqlQuery("""
        SELECT DISTINCT size 
        FROM variants 
        WHERE status = 'ACTIVE' AND size IS NOT NULL 
        ORDER BY size
        """)
    List<String> findAllSizes();

    @SqlQuery("""
        SELECT DISTINCT color 
        FROM variants 
        WHERE status = 'ACTIVE' AND color IS NOT NULL 
        ORDER BY color
        """)
    List<String> findAllColors();
}
