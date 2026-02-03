package com.codewithshiva.retailpos.controller;

import com.codewithshiva.retailpos.dto.ApiResponse;
import com.codewithshiva.retailpos.dto.PagedResponse;
import com.codewithshiva.retailpos.dto.sale.*;
import com.codewithshiva.retailpos.security.CustomUserDetails;
import com.codewithshiva.retailpos.service.SaleService;
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
 * Controller for sale management endpoints.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/sales")
@RequiredArgsConstructor
@Tag(name = "Sales Management", description = "Sales operations and POS transactions")
public class SaleController {

    private final SaleService saleService;

    @GetMapping
    @Operation(summary = "List Sales", description = "Get all sales with optional filters and pagination")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<PagedResponse<SaleListResponse>>> listSales(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String paymentMode,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long createdBy,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.debug("List sales request - startDate: {}, endDate: {}, paymentMode: {}, status: {}, createdBy: {}, search: {}, page: {}, size: {}",
                startDate, endDate, paymentMode, status, createdBy, search, page, size);
        List<SaleListResponse> sales = saleService.listSales(
                startDate, endDate, paymentMode, status, createdBy, search);
        PagedResponse<SaleListResponse> pagedResponse = PagedResponse.of(sales, page, size);
        return ResponseEntity.ok(ApiResponse.success(pagedResponse));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Sale by ID", description = "Get sale with all items")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<SaleDetailResponse>> getSaleById(@PathVariable Long id) {
        log.debug("Get sale request for ID: {}", id);
        SaleDetailResponse sale = saleService.getSaleById(id);
        return ResponseEntity.ok(ApiResponse.success(sale));
    }

    @PostMapping
    @Operation(summary = "Create Sale", description = "Create a new sale. Generates bill number, deducts stock, and calculates profit.")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<SaleDetailResponse>> createSale(
            @Valid @RequestBody CreateSaleRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        log.info("Create sale request with {} items, payment mode: {}", 
                request.getItems().size(), request.getPaymentMode());
        SaleDetailResponse sale = saleService.createSale(request, userDetails.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(sale, "Sale completed successfully"));
    }

    @PutMapping("/{id}/void")
    @Operation(summary = "Void Sale", description = "Void a completed sale. Restores stock to inventory.")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<SaleDetailResponse>> voidSale(
            @PathVariable Long id,
            @Valid @RequestBody VoidSaleRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        log.info("Void sale request for ID: {} with reason: {}", id, request.getReason());
        SaleDetailResponse sale = saleService.voidSale(id, request, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success(sale, "Sale voided successfully. Stock restored."));
    }
}
