package com.codewithshiva.retailpos.controller;

import com.codewithshiva.retailpos.dto.ApiResponse;
import com.codewithshiva.retailpos.dto.purchase.CreatePurchaseRequest;
import com.codewithshiva.retailpos.dto.purchase.PurchaseDetailResponse;
import com.codewithshiva.retailpos.dto.purchase.PurchaseListResponse;
import com.codewithshiva.retailpos.security.CustomUserDetails;
import com.codewithshiva.retailpos.service.PurchaseService;
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
 * Controller for purchase management endpoints.
 * All endpoints require ADMIN role.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/purchases")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Purchase Management", description = "Purchase order operations (Admin only)")
public class PurchaseController {

    private final PurchaseService purchaseService;

    @GetMapping
    @Operation(summary = "List Purchases", description = "Get all purchases with optional filters")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<PurchaseListResponse>>> listPurchases(
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String search) {
        log.debug("List purchases request - supplierId: {}, startDate: {}, endDate: {}, search: {}", 
                supplierId, startDate, endDate, search);
        List<PurchaseListResponse> purchases = purchaseService.listPurchases(
                supplierId, startDate, endDate, search);
        return ResponseEntity.ok(ApiResponse.success(purchases));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Purchase by ID", description = "Get purchase with all items")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<PurchaseDetailResponse>> getPurchaseById(@PathVariable Long id) {
        log.debug("Get purchase request for ID: {}", id);
        PurchaseDetailResponse purchase = purchaseService.getPurchaseById(id);
        return ResponseEntity.ok(ApiResponse.success(purchase));
    }

    @PostMapping
    @Operation(summary = "Create Purchase", description = "Create a new purchase order. Updates variant stock and calculates weighted average cost.")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<PurchaseDetailResponse>> createPurchase(
            @Valid @RequestBody CreatePurchaseRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        log.info("Create purchase request for supplier ID: {} with {} items", 
                request.getSupplierId(), request.getItems().size());
        PurchaseDetailResponse purchase = purchaseService.createPurchase(request, userDetails.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(purchase, "Purchase created successfully. Stock updated."));
    }
}
