package com.codewithshiva.retailpos.controller;

import com.codewithshiva.retailpos.dto.ApiResponse;
import com.codewithshiva.retailpos.dto.offer.CreateOfferRequest;
import com.codewithshiva.retailpos.dto.offer.OfferResponse;
import com.codewithshiva.retailpos.dto.offer.UpdateOfferRequest;
import com.codewithshiva.retailpos.security.CustomUserDetails;
import com.codewithshiva.retailpos.service.OfferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for offer management endpoints.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/offers")
@RequiredArgsConstructor
@Tag(name = "Offer Management", description = "Promotional offer CRUD operations")
public class OfferController {

    private final OfferService offerService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all offers", description = "Get all offers with their items")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<OfferResponse>>> listOffers() {
        log.debug("List offers request");
        List<OfferResponse> offers = offerService.listOffers();
        return ResponseEntity.ok(ApiResponse.success(offers));
    }

    @GetMapping("/active")
    @Operation(summary = "Get active offers", description = "Get all currently active and date-valid offers (for billing)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<OfferResponse>>> getActiveOffers() {
        log.debug("Get active offers request");
        List<OfferResponse> offers = offerService.getActiveOffers();
        return ResponseEntity.ok(ApiResponse.success(offers));
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get offer by ID", description = "Get a specific offer with items")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<OfferResponse>> getOfferById(@PathVariable Long id) {
        log.debug("Get offer request for ID: {}", id);
        OfferResponse offer = offerService.getOfferById(id);
        return ResponseEntity.ok(ApiResponse.success(offer));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create offer", description = "Create a new promotional offer")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<OfferResponse>> createOffer(
            @Valid @RequestBody CreateOfferRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        log.info("Create offer request: {}", request.getName());
        OfferResponse offer = offerService.createOffer(request, userDetails.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(offer, "Offer created successfully"));
    }

    @PutMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update offer", description = "Update an existing offer")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<OfferResponse>> updateOffer(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOfferRequest request) {
        log.info("Update offer request for ID: {}", id);
        OfferResponse offer = offerService.updateOffer(id, request);
        return ResponseEntity.ok(ApiResponse.success(offer, "Offer updated successfully"));
    }

    @PatchMapping("/{id:\\d+}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toggle offer status", description = "Activate or deactivate an offer")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<OfferResponse>> toggleOfferStatus(@PathVariable Long id) {
        log.info("Toggle offer status request for ID: {}", id);
        OfferResponse offer = offerService.toggleOfferStatus(id);
        return ResponseEntity.ok(ApiResponse.success(offer, "Offer status updated"));
    }

    @DeleteMapping("/{id:\\d+}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete offer", description = "Delete an offer")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Void>> deleteOffer(@PathVariable Long id) {
        log.info("Delete offer request for ID: {}", id);
        offerService.deleteOffer(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Offer deleted successfully"));
    }
}
