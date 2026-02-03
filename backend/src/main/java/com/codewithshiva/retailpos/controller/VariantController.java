package com.codewithshiva.retailpos.controller;

import com.codewithshiva.retailpos.dto.ApiResponse;
import com.codewithshiva.retailpos.dto.PagedResponse;
import com.codewithshiva.retailpos.dto.variant.*;
import com.codewithshiva.retailpos.security.CustomUserDetails;
import com.codewithshiva.retailpos.service.VariantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for variant management endpoints.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/variants")
@RequiredArgsConstructor
@Tag(name = "Variant Management", description = "Variant CRUD operations and POS search")
public class VariantController {

    private final VariantService variantService;

    @GetMapping
    @Operation(summary = "List Variants", description = "Get all variants with optional filters and pagination")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<PagedResponse<VariantListResponse>>> listVariants(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean lowStock,
            @RequestParam(required = false) Boolean outOfStock,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.debug("List variants request - productId: {}, category: {}, brand: {}, status: {}, lowStock: {}, outOfStock: {}, search: {}, page: {}, size: {}",
                productId, category, brand, status, lowStock, outOfStock, search, page, size);
        List<VariantListResponse> variants = variantService.listVariants(
                productId, category, brand, status, lowStock, outOfStock, search);
        PagedResponse<VariantListResponse> pagedResponse = PagedResponse.of(variants, page, size);
        return ResponseEntity.ok(ApiResponse.success(pagedResponse));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Variant by ID", description = "Get variant with product information")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<VariantDetailResponse>> getVariantById(@PathVariable Long id) {
        log.debug("Get variant request for ID: {}", id);
        VariantDetailResponse variant = variantService.getVariantById(id);
        return ResponseEntity.ok(ApiResponse.success(variant));
    }

    @GetMapping("/barcode/{barcode}")
    @Operation(summary = "Get Variant by Barcode", description = "Get variant by barcode (for POS scanning)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<VariantSearchResponse>> getVariantByBarcode(@PathVariable String barcode) {
        log.debug("Get variant request for barcode: {}", barcode);
        VariantSearchResponse variant = variantService.getVariantByBarcode(barcode);
        return ResponseEntity.ok(ApiResponse.success(variant));
    }

    @GetMapping("/search")
    @Operation(summary = "Search Variants", description = "Search variants by SKU, barcode, or product name (for POS autocomplete)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<VariantSearchResponse>>> searchVariants(
            @RequestParam String q,
            @RequestParam(defaultValue = "10") int limit) {
        log.debug("Search variants request - query: {}, limit: {}", q, limit);
        List<VariantSearchResponse> variants = variantService.searchVariants(q, limit);
        return ResponseEntity.ok(ApiResponse.success(variants));
    }

    @PostMapping
    @Operation(summary = "Create Variant", description = "Create a new variant for a product")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<VariantDetailResponse>> createVariant(
            @Valid @RequestBody CreateVariantRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        log.info("Create variant request - SKU: {}, productId: {}", request.getSku(), request.getProductId());
        VariantDetailResponse variant = variantService.createVariant(request, userDetails.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(variant, "Variant created successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Variant", description = "Update an existing variant")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<VariantDetailResponse>> updateVariant(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVariantRequest request) {
        log.info("Update variant request for ID: {}", id);
        VariantDetailResponse variant = variantService.updateVariant(id, request);
        return ResponseEntity.ok(ApiResponse.success(variant, "Variant updated successfully"));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update Variant Status", description = "Activate or deactivate a variant")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Void>> updateVariantStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVariantStatusRequest request) {
        log.info("Update variant status request for ID: {} to: {}", id, request.getStatus());
        variantService.updateVariantStatus(id, request.getStatus());
        String message = "ACTIVE".equals(request.getStatus()) 
                ? "Variant activated successfully" 
                : "Variant deactivated successfully";
        return ResponseEntity.ok(ApiResponse.success(message));
    }
}
