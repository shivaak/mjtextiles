package com.codewithshiva.retailpos.controller;

import com.codewithshiva.retailpos.dto.ApiResponse;
import com.codewithshiva.retailpos.dto.lookup.LookupDataResponse;
import com.codewithshiva.retailpos.service.LookupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for lookup/utility endpoints.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/lookups")
@RequiredArgsConstructor
@Tag(name = "Lookups", description = "Lookup/utility data for dropdowns")
public class LookupController {

    private final LookupService lookupService;

    @GetMapping
    @Operation(summary = "Get All Lookup Data", description = "Get all dropdown/lookup data in one call (useful for initial app load)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<LookupDataResponse>> getAllLookupData() {
        log.debug("Get all lookup data request");
        LookupDataResponse data = lookupService.getAllLookupData();
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
