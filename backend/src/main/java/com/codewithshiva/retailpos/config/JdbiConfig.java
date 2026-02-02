package com.codewithshiva.retailpos.config;

import com.codewithshiva.retailpos.dao.ProductDao;
import com.codewithshiva.retailpos.dao.RefreshTokenDao;
import com.codewithshiva.retailpos.dao.SettingsDao;
import com.codewithshiva.retailpos.dao.UserDao;
import com.codewithshiva.retailpos.model.Role;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.mapper.ColumnMapper;
import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.postgres.PostgresPlugin;
import org.jdbi.v3.sqlobject.SqlObjectPlugin;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.TransactionAwareDataSourceProxy;

import javax.sql.DataSource;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * JDBI configuration with custom type mappings and DAO beans.
 */
@Configuration
public class JdbiConfig {

    @Bean
    public Jdbi jdbi(DataSource dataSource) {
        // Wrap datasource to make it Spring transaction-aware
        TransactionAwareDataSourceProxy proxy = new TransactionAwareDataSourceProxy(dataSource);
        
        // Create Jdbi instance
        Jdbi jdbi = Jdbi.create(proxy);
        
        // Install plugins
        jdbi.installPlugin(new SqlObjectPlugin());
        jdbi.installPlugin(new PostgresPlugin());
        
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

    @Bean
    public SettingsDao settingsDao(Jdbi jdbi) {
        return jdbi.onDemand(SettingsDao.class);
    }

    @Bean
    public ProductDao productDao(Jdbi jdbi) {
        return jdbi.onDemand(ProductDao.class);
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
