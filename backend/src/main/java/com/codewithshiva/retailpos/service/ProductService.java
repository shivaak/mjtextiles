package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.audit.Auditable;
import com.codewithshiva.retailpos.audit.AuditAction;
import com.codewithshiva.retailpos.audit.EntityType;
import com.codewithshiva.retailpos.dao.ProductDao;
import com.codewithshiva.retailpos.dto.product.*;
import com.codewithshiva.retailpos.exception.ConflictException;
import com.codewithshiva.retailpos.exception.ResourceNotFoundException;
import com.codewithshiva.retailpos.model.Product;
import com.codewithshiva.retailpos.model.Variant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for product management operations.
 */
@Slf4j
@Service
public class ProductService {

    private final ProductDao productDao;
    private final LookupService lookupService;

    public ProductService(ProductDao productDao, @Lazy LookupService lookupService) {
        this.productDao = productDao;
        this.lookupService = lookupService;
    }

    /**
     * List products with optional filters.
     */
    @Transactional(readOnly = true)
    public List<ProductResponse> listProducts(String category, String brand, String search) {
        log.debug("Listing products with filters - category: {}, brand: {}, search: {}", category, brand, search);

        List<Product> products;
        if (category == null && brand == null && search == null) {
            products = productDao.findAllActive();
        } else {
            products = productDao.findWithFilters(category, brand, search);
        }

        return products.stream()
                .map(product -> {
                    int variantCount = productDao.countVariantsByProductId(product.getId());
                    return ProductResponse.fromProduct(product, variantCount);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get product by ID with all its variants.
     */
    @Transactional(readOnly = true)
    public ProductDetailResponse getProductById(Long id) {
        log.debug("Getting product by ID: {}", id);

        Product product = productDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "PRODUCT_NOT_FOUND",
                        "Product not found with ID: " + id
                ));

        List<Variant> variants = productDao.findVariantsByProductId(id);

        return ProductDetailResponse.fromProduct(product, variants);
    }

    /**
     * Create a new product.
     */
    @Transactional
    @Auditable(entity = EntityType.PRODUCT, action = AuditAction.CREATE)
    public ProductResponse createProduct(CreateProductRequest request, Long createdBy) {
        log.info("Creating product: {} - {}", request.getBrand(), request.getName());

        // Check for duplicate product (name + brand combination)
        Optional<Product> existing = productDao.findByNameAndBrand(request.getName(), request.getBrand());
        if (existing.isPresent()) {
            log.warn("Product already exists: {} - {}", request.getBrand(), request.getName());
            throw new ConflictException(
                    "DUPLICATE_PRODUCT",
                    "Product with same name and brand already exists"
            );
        }

        // Create product and get ID
        Long productId = productDao.create(
                request.getName(),
                request.getBrand(),
                request.getCategory(),
                request.getDescription(),
                createdBy
        );

        log.info("Product created successfully with ID: {}", productId);

        // Evict lookup cache since categories/brands may have changed
        lookupService.evictLookupCache();

        // Fetch and return created product
        Product product = productDao.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "PRODUCT_NOT_FOUND",
                        "Failed to retrieve created product"
                ));

        return ProductResponse.fromProduct(product);
    }

    /**
     * Update an existing product.
     */
    @Transactional
    @Auditable(entity = EntityType.PRODUCT, action = AuditAction.UPDATE)
    public ProductResponse updateProduct(Long id, UpdateProductRequest request) {
        log.info("Updating product with ID: {}", id);

        // Verify product exists
        Product existingProduct = productDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "PRODUCT_NOT_FOUND",
                        "Product not found with ID: " + id
                ));

        // Check for duplicate if name or brand changed
        if (!existingProduct.getName().equals(request.getName()) || 
            !existingProduct.getBrand().equals(request.getBrand())) {
            Optional<Product> duplicate = productDao.findByNameAndBrand(request.getName(), request.getBrand());
            if (duplicate.isPresent() && !duplicate.get().getId().equals(id)) {
                log.warn("Duplicate product found: {} - {}", request.getBrand(), request.getName());
                throw new ConflictException(
                        "DUPLICATE_PRODUCT",
                        "Product with same name and brand already exists"
                );
            }
        }

        // Update product
        productDao.update(
                id,
                request.getName(),
                request.getBrand(),
                request.getCategory(),
                request.getDescription()
        );

        log.info("Product updated successfully: {}", id);

        // Evict lookup cache since categories/brands may have changed
        lookupService.evictLookupCache();

        // Fetch and return updated product
        Product updatedProduct = productDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "PRODUCT_NOT_FOUND",
                        "Failed to retrieve updated product"
                ));

        int variantCount = productDao.countVariantsByProductId(id);
        return ProductResponse.fromProduct(updatedProduct, variantCount);
    }

    /**
     * Get all unique product categories.
     */
    @Transactional(readOnly = true)
    public List<String> getAllCategories() {
        log.debug("Getting all product categories");
        return productDao.findAllCategories();
    }

    /**
     * Get all unique product brands.
     */
    @Transactional(readOnly = true)
    public List<String> getAllBrands() {
        log.debug("Getting all product brands");
        return productDao.findAllBrands();
    }
}
