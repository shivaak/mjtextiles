package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.audit.Auditable;
import com.codewithshiva.retailpos.audit.AuditAction;
import com.codewithshiva.retailpos.audit.EntityType;
import com.codewithshiva.retailpos.dao.CustomerDao;
import com.codewithshiva.retailpos.dto.customer.*;
import com.codewithshiva.retailpos.exception.ConflictException;
import com.codewithshiva.retailpos.exception.ResourceNotFoundException;
import com.codewithshiva.retailpos.model.Customer;
import com.codewithshiva.retailpos.model.CustomerPointsLog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for customer management operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerDao customerDao;

    /**
     * List customers with optional search filter.
     */
    @Transactional(readOnly = true)
    public List<CustomerResponse> listCustomers(String search) {
        log.debug("Listing customers with search: {}", search);

        List<Customer> customers;
        if (search == null || search.trim().isEmpty()) {
            customers = customerDao.findAll();
        } else {
            customers = customerDao.findWithSearch(search.trim());
        }

        return customers.stream()
                .map(CustomerResponse::fromCustomer)
                .collect(Collectors.toList());
    }

    /**
     * Get customer by ID.
     */
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id) {
        log.debug("Getting customer by ID: {}", id);

        Customer customer = customerDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "CUSTOMER_NOT_FOUND",
                        "Customer not found with ID: " + id
                ));

        return CustomerResponse.fromCustomer(customer);
    }

    /**
     * Get customer by phone number (for billing auto-populate).
     */
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerByPhone(String phone) {
        log.debug("Looking up customer by phone: {}", phone);

        Customer customer = customerDao.findByPhone(phone)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "CUSTOMER_NOT_FOUND",
                        "Customer not found with phone: " + phone
                ));

        return CustomerResponse.fromCustomer(customer);
    }

    /**
     * Create a new customer.
     */
    @Transactional
    @Auditable(entity = EntityType.CUSTOMER, action = AuditAction.CREATE)
    public CustomerResponse createCustomer(CreateCustomerRequest request) {
        log.info("Creating customer with phone: {}", request.getPhone());

        // Check for duplicate phone
        if (customerDao.findByPhone(request.getPhone()).isPresent()) {
            log.warn("Duplicate customer phone: {}", request.getPhone());
            throw new ConflictException(
                    "DUPLICATE_CUSTOMER",
                    "Customer with phone '" + request.getPhone() + "' already exists"
            );
        }

        Long customerId = customerDao.create(request.getPhone(), request.getName(), request.getArea());

        log.info("Customer created successfully with ID: {}", customerId);

        return getCustomerById(customerId);
    }

    /**
     * Update an existing customer.
     */
    @Transactional
    @Auditable(entity = EntityType.CUSTOMER, action = AuditAction.UPDATE)
    public CustomerResponse updateCustomer(Long id, UpdateCustomerRequest request) {
        log.info("Updating customer with ID: {}", id);

        Customer existing = customerDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "CUSTOMER_NOT_FOUND",
                        "Customer not found with ID: " + id
                ));

        // Check for duplicate phone (excluding self)
        if (!existing.getPhone().equals(request.getPhone())) {
            Optional<Customer> duplicate = customerDao.findByPhoneExcludingId(request.getPhone(), id);
            if (duplicate.isPresent()) {
                log.warn("Duplicate customer phone: {}", request.getPhone());
                throw new ConflictException(
                        "DUPLICATE_CUSTOMER",
                        "Customer with phone '" + request.getPhone() + "' already exists"
                );
            }
        }

        customerDao.update(id, request.getPhone(), request.getName(), request.getArea());

        log.info("Customer updated successfully: {}", id);

        return getCustomerById(id);
    }

    /**
     * Get points history for a customer.
     */
    @Transactional(readOnly = true)
    public List<CustomerPointsLogResponse> getPointsHistory(Long customerId) {
        log.debug("Getting points history for customer ID: {}", customerId);

        // Verify customer exists
        customerDao.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "CUSTOMER_NOT_FOUND",
                        "Customer not found with ID: " + customerId
                ));

        List<CustomerPointsLog> logs = customerDao.findPointsLogByCustomerId(customerId);

        return logs.stream()
                .map(CustomerPointsLogResponse::fromPointsLog)
                .collect(Collectors.toList());
    }
}
