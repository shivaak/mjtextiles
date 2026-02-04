package com.codewithshiva.retailpos.controller;

import com.codewithshiva.retailpos.dto.ApiResponse;
import com.codewithshiva.retailpos.dto.inventory.*;
import com.codewithshiva.retailpos.security.CustomUserDetails;
import com.codewithshiva.retailpos.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for inventory management endpoints.
 * All endpoints require ADMIN role.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory Management", description = "Inventory summary, stock movements, and adjustments (Admin only)")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/summary")
    @Operation(summary = "Get Inventory Summary", description = "Get aggregated inventory statistics")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE')")
    public ResponseEntity<ApiResponse<InventorySummaryResponse>> getInventorySummary() {
        log.debug("Get inventory summary request");
        InventorySummaryResponse summary = inventoryService.getInventorySummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/movements/{variantId}")
    @Operation(summary = "Get Stock Movements", description = "Get stock movement history for a variant")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getStockMovements(
            @PathVariable Long variantId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String type) {
        log.debug("Get stock movements request for variant ID: {} with filters - startDate: {}, endDate: {}, type: {}", 
                variantId, startDate, endDate, type);
        List<StockMovementResponse> movements = inventoryService.getStockMovements(
                variantId, startDate, endDate, type);
        return ResponseEntity.ok(ApiResponse.success(movements));
    }

    @GetMapping("/suppliers/{variantId}")
    @Operation(summary = "Get Supplier Summary", description = "Get all suppliers who have supplied a particular variant")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<SupplierSummaryResponse>>> getSupplierSummary(
            @PathVariable Long variantId) {
        log.debug("Get supplier summary request for variant ID: {}", variantId);
        List<SupplierSummaryResponse> summaries = inventoryService.getSupplierSummary(variantId);
        return ResponseEntity.ok(ApiResponse.success(summaries));
    }

    @PostMapping("/adjustments")
    @Operation(summary = "Create Stock Adjustment", description = "Manually adjust stock for damage, theft, correction, etc.")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StockAdjustmentResponse>> createStockAdjustment(
            @Valid @RequestBody CreateStockAdjustmentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        log.info("Create stock adjustment request for variant ID: {} with delta: {}", 
                request.getVariantId(), request.getDeltaQty());
        StockAdjustmentResponse adjustment = inventoryService.createStockAdjustment(
                request, userDetails.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(adjustment, "Stock adjusted successfully"));
    }
}
