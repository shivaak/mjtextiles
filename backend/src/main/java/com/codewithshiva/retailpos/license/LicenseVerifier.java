package com.codewithshiva.retailpos.license;

import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Component
@RequiredArgsConstructor
public class LicenseVerifier {

    private final ObjectMapper objectMapper;

    @Value("${license.public-key-pem:}")
    private String publicKeyPem;

    public boolean hasVerifierKeyConfigured() {
        return publicKeyPem != null && !publicKeyPem.isBlank();
    }

    public boolean verify(SignedLicenseDocument document) {
        if (!hasVerifierKeyConfigured()) {
            return false;
        }

        if (document == null || document.getPayload() == null || document.getSignature() == null) {
            return false;
        }

        try {
            String payloadJson = canonicalPayloadJson(document.getPayload());
            PublicKey publicKey = parsePublicKey(publicKeyPem);

            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initVerify(publicKey);
            signature.update(payloadJson.getBytes(StandardCharsets.UTF_8));
            byte[] signatureBytes = Base64.getDecoder().decode(document.getSignature());
            return signature.verify(signatureBytes);
        } catch (Exception ex) {
            return false;
        }
    }

    public String canonicalPayloadJson(LicensePayload payload) {
        try {
            ObjectMapper canonicalMapper = objectMapper.copy()
                    .configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true)
                    .configure(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY, true);
            return canonicalMapper.writeValueAsString(payload);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to serialize license payload", ex);
        }
    }

    private PublicKey parsePublicKey(String pem) throws Exception {
        String normalized = pem
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s+", "");
        byte[] decoded = Base64.getDecoder().decode(normalized);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(decoded);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePublic(spec);
    }
}

