package com.codewithshiva.retailpos.config;

import com.codewithshiva.retailpos.dao.SettingsDao;
import com.codewithshiva.retailpos.dao.UserDao;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Initializes default data on application startup.
 * Creates default admin user and settings if they don't exist.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserDao userDao;
    private final SettingsDao settingsDao;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createDefaultUsers();
        createDefaultSettings();
    }

    private void createDefaultUsers() {
        // Create admin user if not exists
        if (userDao.findByUsername("admin").isEmpty()) {
            String adminPasswordHash = passwordEncoder.encode("admin123");
            userDao.create("admin", adminPasswordHash, "Admin User", "ADMIN");
            log.info("Created default admin user (username: admin, password: admin123)");
        }

        /*
            // Create employee user if not exists
            if (userDao.findByUsername("employee").isEmpty()) {
                String employeePasswordHash = passwordEncoder.encode("employee123");
                userDao.create("employee", employeePasswordHash, "Employee User", "EMPLOYEE");
                log.info("Created default employee user (username: employee, password: employee123)");
            }
        */
    }

    private void createDefaultSettings() {
        // Create default settings if not exists
        if (settingsDao.get().isEmpty()) {
            settingsDao.insertDefault("My Shop", "₹", BigDecimal.ZERO, "INV", 10);
            log.info("Created default settings");
        }
    }
}
