package com.codewithshiva.retailpos.controller;

import com.codewithshiva.retailpos.dto.ApiResponse;
import com.codewithshiva.retailpos.dto.supplier.CreateSupplierRequest;
import com.codewithshiva.retailpos.dto.supplier.SupplierResponse;
import com.codewithshiva.retailpos.dto.supplier.UpdateSupplierRequest;
import com.codewithshiva.retailpos.security.CustomUserDetails;
import com.codewithshiva.retailpos.service.SupplierService;
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
 * Controller for supplier management endpoints.
 * All endpoints require ADMIN role.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/suppliers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Supplier Management", description = "Supplier CRUD operations (Admin only)")
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    @Operation(summary = "List Suppliers", description = "Get all suppliers with optional search filter")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<SupplierResponse>>> listSuppliers(
            @RequestParam(required = false) String search) {
        log.debug("List suppliers request - search: {}", search);
        List<SupplierResponse> suppliers = supplierService.listSuppliers(search);
        return ResponseEntity.ok(ApiResponse.success(suppliers));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Supplier by ID", description = "Get a specific supplier by ID")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<SupplierResponse>> getSupplierById(@PathVariable Long id) {
        log.debug("Get supplier request for ID: {}", id);
        SupplierResponse supplier = supplierService.getSupplierById(id);
        return ResponseEntity.ok(ApiResponse.success(supplier));
    }

    @PostMapping
    @Operation(summary = "Create Supplier", description = "Create a new supplier")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<SupplierResponse>> createSupplier(
            @Valid @RequestBody CreateSupplierRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        log.info("Create supplier request: {}", request.getName());
        SupplierResponse supplier = supplierService.createSupplier(request, userDetails.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(supplier, "Supplier created successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Supplier", description = "Update an existing supplier")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<SupplierResponse>> updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSupplierRequest request) {
        log.info("Update supplier request for ID: {}", id);
        SupplierResponse supplier = supplierService.updateSupplier(id, request);
        return ResponseEntity.ok(ApiResponse.success(supplier, "Supplier updated successfully"));
    }
}
