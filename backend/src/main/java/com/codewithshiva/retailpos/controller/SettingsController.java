package com.codewithshiva.retailpos.controller;

import com.codewithshiva.retailpos.dto.ApiResponse;
import com.codewithshiva.retailpos.dto.settings.SettingsResponse;
import com.codewithshiva.retailpos.dto.settings.UpdateSettingsRequest;
import com.codewithshiva.retailpos.service.SettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for shop settings endpoints.
 * All endpoints require ADMIN role.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Settings", description = "Shop settings management")
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    @Operation(summary = "Get Settings", description = "Get shop settings")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<SettingsResponse>> getSettings() {
        log.debug("Get settings request received");
        SettingsResponse response = settingsService.getSettings();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping
    @Operation(summary = "Update Settings", description = "Update shop settings")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<SettingsResponse>> updateSettings(
            @Valid @RequestBody UpdateSettingsRequest request) {
        log.info("Update settings request received");
        SettingsResponse response = settingsService.updateSettings(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Settings updated successfully"));
    }
}
