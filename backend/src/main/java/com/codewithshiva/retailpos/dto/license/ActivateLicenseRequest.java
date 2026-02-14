package com.codewithshiva.retailpos.dto.license;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivateLicenseRequest {
    @NotBlank(message = "License document is required")
    private String licenseDocument;
}

