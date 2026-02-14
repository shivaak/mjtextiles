package com.codewithshiva.retailpos.controller;

import com.codewithshiva.retailpos.dto.ApiResponse;
import com.codewithshiva.retailpos.dto.license.ActivateLicenseRequest;
import com.codewithshiva.retailpos.dto.license.LicenseInstallationResponse;
import com.codewithshiva.retailpos.dto.license.LicenseStatusResponse;
import com.codewithshiva.retailpos.exception.BadRequestException;
import com.codewithshiva.retailpos.license.LicenseValidationResult;
import com.codewithshiva.retailpos.license.LicenseValidationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/license")
@RequiredArgsConstructor
@Tag(name = "License", description = "Offline licensing and activation endpoints")
public class LicenseController {

    private final LicenseValidationService licenseValidationService;

    @GetMapping("/installation-id")
    @Operation(summary = "Get Installation Info", description = "Get installation id and machine fingerprint")
    public ResponseEntity<ApiResponse<LicenseInstallationResponse>> getInstallationInfo() {
        String installationId = licenseValidationService.getInstallationId();
        LicenseInstallationResponse response = LicenseInstallationResponse.of(
                installationId,
                licenseValidationService.getCurrentMachineFingerprint()
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/status")
    @Operation(summary = "Get License Status", description = "Validate current license status")
    public ResponseEntity<ApiResponse<LicenseStatusResponse>> getStatus() {
        LicenseValidationResult result = licenseValidationService.validateCurrentLicense();
        return ResponseEntity.ok(ApiResponse.success(LicenseStatusResponse.from(result)));
    }

    @PostMapping("/activate")
    @Operation(summary = "Activate License", description = "Install and validate a signed license document")
    public ResponseEntity<ApiResponse<LicenseStatusResponse>> activate(
            @Valid @RequestBody ActivateLicenseRequest request) {
        try {
            LicenseValidationResult result = licenseValidationService.activateLicense(request.getLicenseDocument());
            return ResponseEntity.ok(ApiResponse.success(
                    LicenseStatusResponse.from(result),
                    "License activated successfully"
            ));
        } catch (IllegalArgumentException ex) {
            log.warn("License activation rejected: {}", ex.getMessage());
            throw new BadRequestException("LICENSE_ACTIVATION_FAILED", ex.getMessage());
        } catch (IllegalStateException ex) {
            log.error("License activation failed due to configuration", ex);
            throw new BadRequestException("LICENSE_CONFIG_ERROR", ex.getMessage());
        }
    }

    @DeleteMapping
    @Operation(summary = "Remove License", description = "Remove installed license from this machine")
    public ResponseEntity<ApiResponse<LicenseStatusResponse>> removeLicense() {
        LicenseValidationResult result = licenseValidationService.removeLicense();
        return ResponseEntity.ok(ApiResponse.success(
                LicenseStatusResponse.from(result),
                "License removed successfully"
        ));
    }
}

