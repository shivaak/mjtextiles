package com.codewithshiva.retailpos.dto.shortcode;

import com.codewithshiva.retailpos.model.ShortCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for short code.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShortCodeResponse {
    private Long id;
    private String type;
    private String name;
    private String shortCode;

    public static ShortCodeResponse fromShortCode(ShortCode shortCode) {
        return ShortCodeResponse.builder()
                .id(shortCode.getId())
                .type(shortCode.getType())
                .name(shortCode.getName())
                .shortCode(shortCode.getShortCode())
                .build();
    }
}
