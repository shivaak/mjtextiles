package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.dao.SupplierDao;
import com.codewithshiva.retailpos.dto.supplier.CreateSupplierRequest;
import com.codewithshiva.retailpos.dto.supplier.SupplierResponse;
import com.codewithshiva.retailpos.dto.supplier.UpdateSupplierRequest;
import com.codewithshiva.retailpos.exception.ConflictException;
import com.codewithshiva.retailpos.exception.ResourceNotFoundException;
import com.codewithshiva.retailpos.model.Supplier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for supplier management operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierDao supplierDao;

    /**
     * List suppliers with optional search filter.
     */
    @Transactional(readOnly = true)
    public List<SupplierResponse> listSuppliers(String search) {
        log.debug("Listing suppliers with search: {}", search);

        List<Supplier> suppliers;
        if (search == null || search.trim().isEmpty()) {
            suppliers = supplierDao.findAllActive();
        } else {
            suppliers = supplierDao.findWithSearch(search.trim());
        }

        return suppliers.stream()
                .map(SupplierResponse::fromSupplier)
                .collect(Collectors.toList());
    }

    /**
     * Get supplier by ID.
     */
    @Transactional(readOnly = true)
    public SupplierResponse getSupplierById(Long id) {
        log.debug("Getting supplier by ID: {}", id);

        Supplier supplier = supplierDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SUPPLIER_NOT_FOUND",
                        "Supplier not found with ID: " + id
                ));

        return SupplierResponse.fromSupplier(supplier);
    }

    /**
     * Create a new supplier.
     */
    @Transactional
    public SupplierResponse createSupplier(CreateSupplierRequest request, Long createdBy) {
        log.info("Creating supplier: {}", request.getName());

        // Check for duplicate name
        if (supplierDao.findByName(request.getName()).isPresent()) {
            log.warn("Duplicate supplier name: {}", request.getName());
            throw new ConflictException(
                    "DUPLICATE_SUPPLIER",
                    "Supplier with name '" + request.getName() + "' already exists"
            );
        }

        // Create supplier
        Long supplierId = supplierDao.create(
                request.getName(),
                request.getPhone(),
                request.getEmail(),
                request.getAddress(),
                request.getGstNumber(),
                createdBy
        );

        log.info("Supplier created successfully with ID: {}", supplierId);

        // Fetch and return created supplier
        return getSupplierById(supplierId);
    }

    /**
     * Update an existing supplier.
     */
    @Transactional
    public SupplierResponse updateSupplier(Long id, UpdateSupplierRequest request) {
        log.info("Updating supplier with ID: {}", id);

        // Verify supplier exists
        Supplier existingSupplier = supplierDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SUPPLIER_NOT_FOUND",
                        "Supplier not found with ID: " + id
                ));

        // Check for duplicate name (excluding self)
        if (!existingSupplier.getName().equals(request.getName())) {
            Optional<Supplier> duplicate = supplierDao.findByNameExcludingId(request.getName(), id);
            if (duplicate.isPresent()) {
                log.warn("Duplicate supplier name: {}", request.getName());
                throw new ConflictException(
                        "DUPLICATE_SUPPLIER",
                        "Supplier with name '" + request.getName() + "' already exists"
                );
            }
        }

        // Determine isActive value (keep existing if not provided)
        boolean isActive = request.getIsActive() != null ? request.getIsActive() : existingSupplier.isActive();

        // Update supplier
        supplierDao.update(
                id,
                request.getName(),
                request.getPhone(),
                request.getEmail(),
                request.getAddress(),
                request.getGstNumber(),
                isActive
        );

        log.info("Supplier updated successfully: {}", id);

        // Fetch and return updated supplier
        return getSupplierById(id);
    }
}
