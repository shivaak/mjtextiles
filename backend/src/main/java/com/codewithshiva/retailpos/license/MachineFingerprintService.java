package com.codewithshiva.retailpos.license;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.*;

@Slf4j
@Service
public class MachineFingerprintService {

    public MachineFingerprint getCurrentFingerprint() {
        Map<String, String> rawFactors = new LinkedHashMap<>();
        rawFactors.put("os.name", System.getProperty("os.name", ""));
        rawFactors.put("os.arch", System.getProperty("os.arch", ""));
        rawFactors.put("os.version", System.getProperty("os.version", ""));
        rawFactors.put("hostname", resolveHostName());
        rawFactors.put("machine.id", resolveMachineId());
        rawFactors.put("mac.list", resolveMacAddresses());

        Map<String, String> factorHashes = new TreeMap<>();
        for (Map.Entry<String, String> entry : rawFactors.entrySet()) {
            String normalized = normalize(entry.getValue());
            if (!normalized.isBlank()) {
                factorHashes.put(entry.getKey(), sha256(normalized));
            }
        }

        String machineHash = sha256(String.join("|", factorHashes.values()));
        return MachineFingerprint.builder()
                .machineHash(machineHash)
                .factorHashes(factorHashes)
                .build();
    }

    private String resolveHostName() {
        try {
            String envHostname = System.getenv("HOSTNAME");
            if (envHostname != null && !envHostname.isBlank()) {
                return envHostname;
            }
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception ex) {
            log.debug("Unable to resolve hostname", ex);
            return "";
        }
    }

    private String resolveMachineId() {
        List<Path> candidates = List.of(
                Path.of("/etc/machine-id"),
                Path.of("/var/lib/dbus/machine-id")
        );

        for (Path candidate : candidates) {
            try {
                if (Files.exists(candidate)) {
                    return Files.readString(candidate).trim();
                }
            } catch (Exception ignored) {
                // Continue fallback resolution
            }
        }
        return "";
    }

    private String resolveMacAddresses() {
        try {
            List<String> macs = new ArrayList<>();
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces != null && interfaces.hasMoreElements()) {
                NetworkInterface networkInterface = interfaces.nextElement();
                if (networkInterface.isLoopback() || networkInterface.isVirtual() || !networkInterface.isUp()) {
                    continue;
                }

                byte[] mac = networkInterface.getHardwareAddress();
                if (mac == null || mac.length == 0) {
                    continue;
                }
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < mac.length; i++) {
                    builder.append(String.format("%02X", mac[i]));
                    if (i < mac.length - 1) {
                        builder.append("-");
                    }
                }
                macs.add(builder.toString());
            }
            Collections.sort(macs);
            return String.join(",", macs);
        } catch (Exception ex) {
            log.debug("Unable to resolve mac addresses", ex);
            return "";
        }
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte b : hash) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to compute machine fingerprint hash", ex);
        }
    }
}

