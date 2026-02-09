package com.codewithshiva.retailpos.controller;

import com.codewithshiva.retailpos.dto.ApiResponse;
import com.codewithshiva.retailpos.dto.customer.*;
import com.codewithshiva.retailpos.service.CustomerAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for customer analytics endpoints.
 * Restricted to ADMIN users only.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/customer-analytics")
@RequiredArgsConstructor
@Tag(name = "Customer Analytics", description = "Customer analytics and insights (Admin only)")
public class CustomerAnalyticsController {

    private final CustomerAnalyticsService customerAnalyticsService;

    @GetMapping("/summary")
    @Operation(summary = "Get Customer Analytics Summary", description = "Get summary statistics for customer analytics")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CustomerAnalyticsSummaryResponse>> getSummary() {
        log.debug("Customer analytics summary request");
        CustomerAnalyticsSummaryResponse summary = customerAnalyticsService.getSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/top-by-purchases")
    @Operation(summary = "Get Top Customers by Purchase Count", description = "Get customers ranked by number of purchases")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CustomerRankingResponse>>> getTopByPurchases(
            @RequestParam(required = false, defaultValue = "20") Integer limit) {
        log.debug("Top customers by purchases request - limit: {}", limit);
        List<CustomerRankingResponse> rankings = customerAnalyticsService.getTopCustomersByPurchases(limit);
        return ResponseEntity.ok(ApiResponse.success(rankings));
    }

    @GetMapping("/top-by-revenue")
    @Operation(summary = "Get Top Customers by Revenue", description = "Get customers ranked by total revenue")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CustomerRankingResponse>>> getTopByRevenue(
            @RequestParam(required = false, defaultValue = "20") Integer limit) {
        log.debug("Top customers by revenue request - limit: {}", limit);
        List<CustomerRankingResponse> rankings = customerAnalyticsService.getTopCustomersByRevenue(limit);
        return ResponseEntity.ok(ApiResponse.success(rankings));
    }

    @GetMapping("/area-distribution")
    @Operation(summary = "Get Area-wise Distribution", description = "Get customer distribution by area with revenue")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AreaDistributionResponse>>> getAreaDistribution() {
        log.debug("Area distribution request");
        List<AreaDistributionResponse> distribution = customerAnalyticsService.getAreaDistribution();
        return ResponseEntity.ok(ApiResponse.success(distribution));
    }

    @GetMapping("/monthly-trend")
    @Operation(summary = "Get Monthly New Customer Trend", description = "Get monthly new customer registrations for last 12 months")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<MonthlyCustomerTrendResponse>>> getMonthlyTrend() {
        log.debug("Monthly customer trend request");
        List<MonthlyCustomerTrendResponse> trend = customerAnalyticsService.getMonthlyTrend();
        return ResponseEntity.ok(ApiResponse.success(trend));
    }

    @GetMapping("/purchase-frequency")
    @Operation(summary = "Get Purchase Frequency Distribution", description = "Get distribution of customers by number of purchases")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<PurchaseFrequencyResponse>>> getPurchaseFrequency() {
        log.debug("Purchase frequency distribution request");
        List<PurchaseFrequencyResponse> frequency = customerAnalyticsService.getPurchaseFrequency();
        return ResponseEntity.ok(ApiResponse.success(frequency));
    }
}
