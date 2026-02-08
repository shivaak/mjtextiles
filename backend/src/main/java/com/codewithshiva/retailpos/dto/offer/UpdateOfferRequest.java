package com.codewithshiva.retailpos.dto.offer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for updating an offer.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOfferRequest {

    @NotBlank(message = "Offer name is required")
    @Size(max = 200, message = "Offer name must not exceed 200 characters")
    private String name;

    @NotBlank(message = "Offer type is required")
    private String offerType;

    private Boolean isActive;

    private LocalDate startDate;

    private LocalDate endDate;

    private BigDecimal comboPrice;

    private Integer priority;

    @NotEmpty(message = "At least one offer item is required")
    @Valid
    private List<OfferItemRequest> items;
}
