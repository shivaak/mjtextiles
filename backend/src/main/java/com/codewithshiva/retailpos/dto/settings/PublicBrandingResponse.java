package com.codewithshiva.retailpos.dto.settings;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicBrandingResponse {
    private String shopName;
    private String logoUrl;
}
