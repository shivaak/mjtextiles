package com.codewithshiva.retailpos.license;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Signed license document structure stored in .lic file.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignedLicenseDocument {
    private LicensePayload payload;
    private String signature;
}

