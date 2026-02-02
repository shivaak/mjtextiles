package com.codewithshiva.retailpos.config;

import com.codewithshiva.retailpos.dao.RefreshTokenDao;
import com.codewithshiva.retailpos.dao.UserDao;
import com.codewithshiva.retailpos.model.Role;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.mapper.ColumnMapper;
import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.sqlobject.SqlObjectPlugin;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.TransactionAwareDataSourceProxy;

import javax.sql.DataSource;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * JDBI configuration with custom type mappings and DAO beans.
 */
@Configuration
public class JdbiConfig {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Bean
    public Jdbi jdbi(DataSource dataSource) {
        // Wrap datasource to make it Spring transaction-aware
        TransactionAwareDataSourceProxy proxy = new TransactionAwareDataSourceProxy(dataSource);
        
        // Create Jdbi instance
        Jdbi jdbi = Jdbi.create(proxy);
        
        // Install plugins
        jdbi.installPlugin(new SqlObjectPlugin());
        
        // Register column mapper for LocalDateTime (SQLite stores as TEXT)
        jdbi.registerColumnMapper(LocalDateTime.class, new LocalDateTimeMapper());
        
        // Register column mapper for Role enum
        jdbi.registerColumnMapper(Role.class, new RoleMapper());
        
        return jdbi;
    }

    // ==========================================
    // DAO Beans
    // ==========================================

    @Bean
    public UserDao userDao(Jdbi jdbi) {
        return jdbi.onDemand(UserDao.class);
    }

    @Bean
    public RefreshTokenDao refreshTokenDao(Jdbi jdbi) {
        return jdbi.onDemand(RefreshTokenDao.class);
    }

    // ==========================================
    // Transaction Manager
    // ==========================================

    @Bean
    public DataSourceTransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }

    // ==========================================
    // Column Mappers
    // ==========================================

    /**
     * Column mapper for LocalDateTime from SQLite TEXT format.
     */
    private static class LocalDateTimeMapper implements ColumnMapper<LocalDateTime> {
        @Override
        public LocalDateTime map(ResultSet rs, int columnNumber, StatementContext ctx) throws SQLException {
            String value = rs.getString(columnNumber);
            if (value == null) {
                return null;
            }
            // Handle both "yyyy-MM-dd HH:mm:ss" and ISO format "yyyy-MM-ddTHH:mm:ss"
            value = value.replace("T", " ");
            if (value.length() > 19) {
                value = value.substring(0, 19);
            }
            return LocalDateTime.parse(value, DATE_FORMATTER);
        }
    }

    /**
     * Column mapper for Role enum.
     */
    private static class RoleMapper implements ColumnMapper<Role> {
        @Override
        public Role map(ResultSet rs, int columnNumber, StatementContext ctx) throws SQLException {
            String value = rs.getString(columnNumber);
            if (value == null) {
                return null;
            }
            return Role.valueOf(value);
        }
    }
}
