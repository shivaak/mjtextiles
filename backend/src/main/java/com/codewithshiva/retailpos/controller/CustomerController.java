package com.codewithshiva.retailpos.controller;

import com.codewithshiva.retailpos.dto.ApiResponse;
import com.codewithshiva.retailpos.dto.customer.*;
import com.codewithshiva.retailpos.service.CustomerService;
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
 * Controller for customer management endpoints.
 * Accessible to both ADMIN and EMPLOYEE roles.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
@Tag(name = "Customer Management", description = "Customer CRUD and loyalty points operations")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @Operation(summary = "List Customers", description = "Get all customers with optional search filter")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> listCustomers(
            @RequestParam(required = false) String search) {
        log.debug("List customers request - search: {}", search);
        List<CustomerResponse> customers = customerService.listCustomers(search);
        return ResponseEntity.ok(ApiResponse.success(customers));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Customer by ID", description = "Get a specific customer by ID")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(@PathVariable Long id) {
        log.debug("Get customer request for ID: {}", id);
        CustomerResponse customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(ApiResponse.success(customer));
    }

    @GetMapping("/phone/{phone}")
    @Operation(summary = "Get Customer by Phone", description = "Lookup customer by phone number for billing auto-populate")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerByPhone(@PathVariable String phone) {
        log.debug("Get customer request for phone: {}", phone);
        CustomerResponse customer = customerService.getCustomerByPhone(phone);
        return ResponseEntity.ok(ApiResponse.success(customer));
    }

    @PostMapping
    @Operation(summary = "Create Customer", description = "Create a new customer")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(
            @Valid @RequestBody CreateCustomerRequest request) {
        log.info("Create customer request: {}", request.getPhone());
        CustomerResponse customer = customerService.createCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(customer, "Customer created successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Customer", description = "Update an existing customer")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomerRequest request) {
        log.info("Update customer request for ID: {}", id);
        CustomerResponse customer = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(ApiResponse.success(customer, "Customer updated successfully"));
    }

    @GetMapping("/{id}/points-history")
    @Operation(summary = "Get Points History", description = "Get loyalty points history for a customer")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<CustomerPointsLogResponse>>> getPointsHistory(
            @PathVariable Long id) {
        log.debug("Get points history request for customer ID: {}", id);
        List<CustomerPointsLogResponse> history = customerService.getPointsHistory(id);
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
