package com.codewithshiva.retailpos.license.tool;

import com.codewithshiva.retailpos.license.LicensePayload;
import com.codewithshiva.retailpos.license.SignedLicenseDocument;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Offline license generator helper.
 *
 * Usage:
 * java -cp backend.jar com.codewithshiva.retailpos.license.tool.LicenseGeneratorCli \
 *   --private-key=/path/private_key.pem \
 *   --installation-id=<id> \
 *   --machine-hash=<hash> \
 *   --machine-factors-json='{"os.name":"..."}' \
 *   --customer-name='MJ Textiles' \
 *   --issued-at=2026-02-13T00:00:00Z \
 *   --expires-at=2027-02-13T00:00:00Z \
 *   --output=/tmp/license.lic
 */
public final class LicenseGeneratorCli {

    private LicenseGeneratorCli() {}

    public static void main(String[] args) throws Exception {
        ObjectMapper mapper = new ObjectMapper()
                .findAndRegisterModules()
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        Map<String, String> params = parseArgs(args);
        LicenseGenerationConfig config = loadConfigIfProvided(mapper, params);

        String privateKeyPath = required(params, config.privateKeyPath, "private-key");
        String installationId = required(params, config.installationId, "installation-id");
        String machineHash = required(params, config.machineHash, "machine-hash");
        String customerName = valueOrDefault(params.get("customer-name"), config.customerName, "Licensed Customer");
        String issuedAtString = required(params, config.issuedAt, "issued-at");
        String expiresAtString = required(params, config.expiresAt, "expires-at");
        String outputPath = required(params, config.outputPath, "output");

        Instant issuedAt = Instant.parse(issuedAtString);
        Instant expiresAt = Instant.parse(expiresAtString);
        Map<String, String> factors = valueFromArgsOrConfigMap(mapper, params.get("machine-factors-json"), config.machineFactors);
        Map<String, String> features = valueFromArgsOrConfigMap(mapper, params.get("features-json"), config.features);

        LicensePayload payload = LicensePayload.builder()
                .customerName(customerName)
                .installationId(installationId)
                .machineHash(machineHash)
                .machineFactors(factors)
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .features(features)
                .nonce(UUID.randomUUID().toString())
                .build();

        String canonicalPayload = mapper.copy()
                .configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true)
                .configure(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY, true)
                .writeValueAsString(payload);

        PrivateKey privateKey = loadPrivateKey(Path.of(privateKeyPath));
        String signature = sign(privateKey, canonicalPayload);

        SignedLicenseDocument document = SignedLicenseDocument.builder()
                .payload(payload)
                .signature(signature)
                .build();

        String outputJson = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(document);
        Path output = Path.of(outputPath);
        if (output.getParent() != null) {
            Files.createDirectories(output.getParent());
        }
        Files.writeString(output, outputJson, StandardCharsets.UTF_8);
        System.out.println("License file generated at: " + output.toAbsolutePath());
    }

    private static LicenseGenerationConfig loadConfigIfProvided(ObjectMapper mapper, Map<String, String> params) throws Exception {
        String configPath = params.get("config-file");
        if (configPath == null || configPath.isBlank()) {
            return new LicenseGenerationConfig();
        }

        String rawConfig = Files.readString(Path.of(configPath), StandardCharsets.UTF_8);
        return mapper.readValue(rawConfig, LicenseGenerationConfig.class);
    }

    private static PrivateKey loadPrivateKey(Path pemPath) throws Exception {
        String pem = Files.readString(pemPath, StandardCharsets.UTF_8)
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s+", "");
        byte[] keyBytes = Base64.getDecoder().decode(pem);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        return KeyFactory.getInstance("RSA").generatePrivate(spec);
    }

    private static String sign(PrivateKey privateKey, String payloadJson) throws Exception {
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(privateKey);
        signature.update(payloadJson.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(signature.sign());
    }

    private static Map<String, String> parseStringMap(ObjectMapper mapper, String json) throws Exception {
        if (json == null || json.isBlank()) {
            return new LinkedHashMap<>();
        }
        return mapper.readValue(json, mapper.getTypeFactory().constructMapType(LinkedHashMap.class, String.class, String.class));
    }

    private static Map<String, String> valueFromArgsOrConfigMap(ObjectMapper mapper,
                                                                 String argJson,
                                                                 Map<String, String> configMap) throws Exception {
        if (argJson != null && !argJson.isBlank()) {
            return parseStringMap(mapper, argJson);
        }
        return configMap != null ? configMap : new LinkedHashMap<>();
    }

    private static String required(Map<String, String> params, String configValue, String key) {
        String value = params.getOrDefault(key, configValue);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Missing required argument --" + key);
        }
        return value;
    }

    private static String valueOrDefault(String argValue, String configValue, String fallbackValue) {
        if (argValue != null && !argValue.isBlank()) {
            return argValue;
        }
        if (configValue != null && !configValue.isBlank()) {
            return configValue;
        }
        return fallbackValue;
    }

    private static Map<String, String> parseArgs(String[] args) {
        Map<String, String> params = new LinkedHashMap<>();
        for (String arg : args) {
            if (!arg.startsWith("--") || !arg.contains("=")) {
                continue;
            }
            int idx = arg.indexOf('=');
            params.put(arg.substring(2, idx), arg.substring(idx + 1));
        }
        return params;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class LicenseGenerationConfig {
        public String privateKeyPath;
        public String installationId;
        public String machineHash;
        public Map<String, String> machineFactors;
        public String customerName;
        public String issuedAt;
        public String expiresAt;
        public Map<String, String> features;
        public String outputPath;
    }
}

