package com.codewithshiva.retailpos.dto.offer;

import com.codewithshiva.retailpos.model.Offer;
import com.codewithshiva.retailpos.model.OfferItem;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Response DTO for an offer with its items.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OfferResponse {
    private Long id;
    private String name;
    private String offerType;
    private Boolean isActive;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal comboPrice;
    private Integer priority;
    private OffsetDateTime createdAt;
    private List<OfferItemResponse> items;

    public static OfferResponse fromOffer(Offer offer, List<OfferItem> items) {
        return OfferResponse.builder()
                .id(offer.getId())
                .name(offer.getName())
                .offerType(offer.getOfferType())
                .isActive(offer.isActive())
                .startDate(offer.getStartDate())
                .endDate(offer.getEndDate())
                .comboPrice(offer.getComboPrice())
                .priority(offer.getPriority())
                .createdAt(offer.getCreatedAt())
                .items(items.stream()
                        .map(OfferItemResponse::fromOfferItem)
                        .collect(Collectors.toList()))
                .build();
    }
}
