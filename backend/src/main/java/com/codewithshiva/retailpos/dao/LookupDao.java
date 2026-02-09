package com.codewithshiva.retailpos.dao;

import org.jdbi.v3.sqlobject.statement.SqlQuery;

import java.util.List;

/**
 * JDBI DAO for Lookup operations.
 */
public interface LookupDao {

    @SqlQuery("""
        SELECT name 
        FROM short_codes 
        WHERE type = 'CATEGORY' 
        ORDER BY name
        """)
    List<String> findAllCategories();

    @SqlQuery("""
        SELECT name 
        FROM short_codes 
        WHERE type = 'BRAND' 
        ORDER BY name
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

    @SqlQuery("""
        SELECT DISTINCT name 
        FROM short_codes 
        WHERE type = 'FABRIC' 
        ORDER BY name
        """)
    List<String> findAllFabrics();
}
