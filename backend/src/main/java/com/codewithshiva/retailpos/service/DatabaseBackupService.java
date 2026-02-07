package com.codewithshiva.retailpos.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.zip.GZIPOutputStream;

/**
 * Scheduled database backup service.
 * Runs pg_dump on a configurable cron schedule, compresses the output,
 * and manages backup retention.
 */
@Slf4j
@Service
public class DatabaseBackupService {

    private static final DateTimeFormatter TIMESTAMP_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss");
    private static final Pattern JDBC_URL_PATTERN = Pattern.compile("jdbc:postgresql://([^:/]+)(?::(\\d+))?/(.+)");

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    @Value("${spring.datasource.password}")
    private String datasourcePassword;

    @Value("${app.backup.directory:backups}")
    private String backupDirectory;

    @Value("${app.backup.retention-count:7}")
    private int retentionCount;

    @Value("${app.backup.pg-dump-path:}")
    private String pgDumpPath;

    private String dbHost;
    private String dbPort;
    private String dbName;

    @PostConstruct
    public void init() {
        parseJdbcUrl();
        createBackupDirectory();
        log.info("Database backup service initialized - directory: {}, retention: {} backups", backupDirectory, retentionCount);
    }

    @Scheduled(cron = "${app.backup.cron:0 0 12,20 * * *}")
    public void performScheduledBackup() {
        log.info("Starting scheduled database backup...");
        performBackup();
    }

    /**
     * Performs a database backup. Can be called programmatically for on-demand backups.
     *
     * @return the path to the created backup file, or null if backup failed
     */
    public Path performBackup() {
        String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        String fileName = String.format("retailpos_%s.sql.gz", timestamp);
        Path backupPath = Path.of(backupDirectory, fileName);

        try {
            createBackupDirectory();

            String pgDumpExecutable = resolvePgDumpPath();
            ProcessBuilder processBuilder = new ProcessBuilder(
                    pgDumpExecutable,
                    "-h", dbHost,
                    "-p", dbPort,
                    "-U", datasourceUsername,
                    "-d", dbName,
                    "--no-password"
            );

            // Use PGPASSWORD environment variable for authentication
            processBuilder.environment().put("PGPASSWORD", datasourcePassword);
            processBuilder.redirectErrorStream(false);

            Process process = processBuilder.start();

            // Pipe pg_dump stdout through gzip to file
            try (InputStream pgDumpOutput = process.getInputStream();
                 FileOutputStream fileOut = new FileOutputStream(backupPath.toFile());
                 GZIPOutputStream gzipOut = new GZIPOutputStream(fileOut)) {

                pgDumpOutput.transferTo(gzipOut);
            }

            // Capture any error output
            String errorOutput;
            try (BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                errorOutput = errorReader.lines().collect(Collectors.joining("\n"));
            }

            int exitCode = process.waitFor();

            if (exitCode != 0) {
                log.error("pg_dump failed with exit code {}. Error: {}", exitCode, errorOutput);
                // Clean up failed backup file
                Files.deleteIfExists(backupPath);
                return null;
            }

            long fileSizeKB = Files.size(backupPath) / 1024;
            log.info("Database backup completed successfully: {} ({}KB)", backupPath, fileSizeKB);

            // Clean up old backups
            cleanupOldBackups();

            return backupPath;

        } catch (Exception e) {
            log.error("Database backup failed: {}", e.getMessage(), e);
            // Clean up partial backup file
            try {
                Files.deleteIfExists(backupPath);
            } catch (IOException ignored) {
            }
            return null;
        }
    }

    private void cleanupOldBackups() {
        try {
            Path backupDir = Path.of(backupDirectory);
            if (!Files.exists(backupDir)) {
                return;
            }

            List<Path> backupFiles;
            try (Stream<Path> stream = Files.list(backupDir)) {
                backupFiles = stream
                        .filter(p -> p.getFileName().toString().matches("retailpos_.*\\.sql\\.gz"))
                        .sorted(Comparator.comparing(p -> p.getFileName().toString()))
                        .collect(Collectors.toList());
            }

            if (backupFiles.size() > retentionCount) {
                int toDelete = backupFiles.size() - retentionCount;
                for (int i = 0; i < toDelete; i++) {
                    Path oldBackup = backupFiles.get(i);
                    Files.delete(oldBackup);
                    log.info("Deleted old backup: {}", oldBackup.getFileName());
                }
            }
        } catch (IOException e) {
            log.warn("Failed to clean up old backups: {}", e.getMessage());
        }
    }

    private String resolvePgDumpPath() {
        if (pgDumpPath != null && !pgDumpPath.isBlank()) {
            return pgDumpPath;
        }
        return "pg_dump";
    }

    private void parseJdbcUrl() {
        Matcher matcher = JDBC_URL_PATTERN.matcher(datasourceUrl);
        if (!matcher.matches()) {
            throw new IllegalArgumentException("Cannot parse JDBC URL for backup: " + datasourceUrl);
        }
        dbHost = matcher.group(1);
        dbPort = matcher.group(2) != null ? matcher.group(2) : "5432";
        dbName = matcher.group(3);
    }

    private void createBackupDirectory() {
        try {
            Path dir = Path.of(backupDirectory);
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
                log.info("Created backup directory: {}", dir.toAbsolutePath());
            }
        } catch (IOException e) {
            log.error("Failed to create backup directory: {}", e.getMessage());
        }
    }
}
