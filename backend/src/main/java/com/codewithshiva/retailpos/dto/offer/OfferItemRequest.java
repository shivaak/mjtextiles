package com.codewithshiva.retailpos.dto.offer;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO for an offer item.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OfferItemRequest {

    private Long productId;

    private Long variantId;

    @Min(value = 1, message = "Minimum quantity must be at least 1")
    private Integer minQty = 1;

    @DecimalMin(value = "0.00", message = "Offer price must be non-negative")
    private BigDecimal offerPrice;

    @DecimalMin(value = "0.00", message = "Discount percent must be at least 0")
    @DecimalMax(value = "100.00", message = "Discount percent must not exceed 100")
    private BigDecimal discountPercent;

    @Min(value = 0, message = "Free quantity must be non-negative")
    private Integer freeQty = 0;
}
