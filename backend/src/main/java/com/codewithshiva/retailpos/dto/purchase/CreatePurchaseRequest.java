package com.codewithshiva.retailpos.dto.purchase;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Request DTO for creating a new purchase.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePurchaseRequest {

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    @Size(max = 50, message = "Invoice number must not exceed 50 characters")
    private String invoiceNo;

    @NotNull(message = "Purchase date is required")
    private OffsetDateTime purchasedAt;

    private String notes;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<CreatePurchaseItemRequest> items;
}
