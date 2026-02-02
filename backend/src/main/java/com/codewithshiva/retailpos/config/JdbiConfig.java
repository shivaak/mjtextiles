package com.codewithshiva.retailpos.config;

import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.sqlobject.SqlObjectPlugin;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.TransactionAwareDataSourceProxy;

import javax.sql.DataSource;

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
        
        return jdbi;
    }

    @Bean
    public DataSourceTransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
