package com.codewithshiva.retailpos.dto.lookup;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for all lookup/dropdown data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LookupDataResponse {
    private List<String> categories;
    private List<String> brands;
    private List<String> sizes;
    private List<String> colors;
    private List<String> paymentModes;
    private List<String> adjustmentReasons;
    private List<String> userRoles;
}
