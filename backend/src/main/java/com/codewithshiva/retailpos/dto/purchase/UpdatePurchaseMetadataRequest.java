package com.codewithshiva.retailpos.dto.purchase;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating purchase metadata.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePurchaseMetadataRequest {

    @Size(max = 50, message = "Invoice number must not exceed 50 characters")
    private String invoiceNo;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;
}
