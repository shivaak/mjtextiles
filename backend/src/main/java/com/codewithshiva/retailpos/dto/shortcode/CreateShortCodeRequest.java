package com.codewithshiva.retailpos.dto.shortcode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a new short code.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateShortCodeRequest {

    @NotBlank(message = "Type is required")
    @Pattern(regexp = "^(CATEGORY|BRAND|FABRIC|SIZE|COLOR|VARIANT_TYPE)$", message = "Type must be CATEGORY, BRAND, FABRIC, SIZE, COLOR, or VARIANT_TYPE")
    private String type;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @NotBlank(message = "Short code is required")
    @Size(max = 10, message = "Short code must not exceed 10 characters")
    private String shortCode;
}
