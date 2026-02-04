package com.codewithshiva.retailpos.controller;

import com.codewithshiva.retailpos.dto.ApiResponse;
import com.codewithshiva.retailpos.dto.PagedResponse;
import com.codewithshiva.retailpos.dto.product.*;
import com.codewithshiva.retailpos.security.CustomUserDetails;
import com.codewithshiva.retailpos.service.ProductService;
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
 * Controller for product management endpoints.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Tag(name = "Product Management", description = "Product CRUD operations")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "List Products", description = "Get all products with optional filters and pagination")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<PagedResponse<ProductResponse>>> listProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.debug("List products request - category: {}, brand: {}, search: {}, page: {}, size: {}", 
                category, brand, search, page, size);
        List<ProductResponse> products = productService.listProducts(category, brand, search);
        PagedResponse<ProductResponse> pagedResponse = PagedResponse.of(products, page, size);
        return ResponseEntity.ok(ApiResponse.success(pagedResponse));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Product by ID", description = "Get product with all its variants")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getProductById(@PathVariable Long id) {
        log.debug("Get product request for ID: {}", id);
        ProductDetailResponse product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @PostMapping
    @Operation(summary = "Create Product", description = "Create a new product")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody CreateProductRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        log.info("Create product request: {} - {}", request.getBrand(), request.getName());
        ProductResponse product = productService.createProduct(request, userDetails.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(product, "Product created successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Product", description = "Update an existing product")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductRequest request) {
        log.info("Update product request for ID: {}", id);
        ProductResponse product = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success(product, "Product updated successfully"));
    }

    @GetMapping("/categories")
    @Operation(summary = "Get Categories", description = "Get all unique product categories")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        log.debug("Get categories request");
        List<String> categories = productService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/brands")
    @Operation(summary = "Get Brands", description = "Get all unique product brands")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<String>>> getBrands() {
        log.debug("Get brands request");
        List<String> brands = productService.getAllBrands();
        return ResponseEntity.ok(ApiResponse.success(brands));
    }
}
