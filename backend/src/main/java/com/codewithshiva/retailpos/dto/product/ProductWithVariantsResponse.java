package com.codewithshiva.retailpos.dto.product;

import com.codewithshiva.retailpos.dto.variant.VariantDetailResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for product creation with variants.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductWithVariantsResponse {
    private ProductResponse product;
    private List<VariantDetailResponse> variants;
}
