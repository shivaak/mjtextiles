package com.codewithshiva.retailpos.dto.product;

import com.codewithshiva.retailpos.model.Product;
import com.codewithshiva.retailpos.model.Variant;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Response DTO for product detail (with variants).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductDetailResponse {
    private Long id;
    private String name;
    private String brand;
    private String category;
    private String hsn;
    private String description;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private List<VariantResponse> variants;

    /**
     * Create ProductDetailResponse from Product entity and list of variants.
     */
    public static ProductDetailResponse fromProduct(Product product, List<Variant> variants) {
        List<VariantResponse> variantResponses = variants.stream()
                .map(VariantResponse::fromVariant)
                .collect(Collectors.toList());

        return ProductDetailResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .brand(product.getBrand())
                .category(product.getCategory())
                .hsn(product.getHsn())
                .description(product.getDescription())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .variants(variantResponses)
                .build();
    }
}
