package com.codewithshiva.retailpos.dto.purchase;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for updating purchase items.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePurchaseItemsRequest {

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<CreatePurchaseItemRequest> items;
}
