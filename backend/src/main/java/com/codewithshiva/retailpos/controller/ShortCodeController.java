package com.codewithshiva.retailpos.controller;

import com.codewithshiva.retailpos.dto.ApiResponse;
import com.codewithshiva.retailpos.dto.shortcode.CreateShortCodeRequest;
import com.codewithshiva.retailpos.dto.shortcode.UpdateShortCodeRequest;
import com.codewithshiva.retailpos.dto.shortcode.ShortCodeResponse;
import com.codewithshiva.retailpos.service.ShortCodeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for short code management endpoints.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/short-codes")
@RequiredArgsConstructor
@Tag(name = "Short Codes", description = "Short code management for SKU generation")
public class ShortCodeController {

    private final ShortCodeService shortCodeService;

    @GetMapping
    @Operation(summary = "List Short Codes", description = "Get all short codes, optionally filtered by type")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<ShortCodeResponse>>> getShortCodes(
            @RequestParam(required = false) String type) {
        log.debug("Get short codes request - type: {}", type);
        List<ShortCodeResponse> shortCodes = shortCodeService.getShortCodes(type);
        return ResponseEntity.ok(ApiResponse.success(shortCodes));
    }

    @PostMapping
    @Operation(summary = "Create Short Code", description = "Create a new short code for category, brand, fabric, size, or color")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<ShortCodeResponse>> createShortCode(
            @Valid @RequestBody CreateShortCodeRequest request) {
        log.info("Create short code request: {} - {} ({})", request.getType(), request.getName(), request.getShortCode());
        ShortCodeResponse shortCode = shortCodeService.createShortCode(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(shortCode, "Short code created successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Short Code", description = "Update an existing short code's name and/or code")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<ShortCodeResponse>> updateShortCode(
            @PathVariable Long id,
            @Valid @RequestBody UpdateShortCodeRequest request) {
        log.info("Update short code request: ID {} - {} ({})", id, request.getName(), request.getShortCode());
        ShortCodeResponse shortCode = shortCodeService.updateShortCode(id, request);
        return ResponseEntity.ok(ApiResponse.success(shortCode, "Short code updated successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Short Code", description = "Delete a short code if it is not in use")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Void>> deleteShortCode(@PathVariable Long id) {
        log.info("Delete short code request: ID {}", id);
        shortCodeService.deleteShortCode(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Short code deleted successfully"));
    }
}
