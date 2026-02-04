package com.codewithshiva.retailpos.controller;

import com.codewithshiva.retailpos.dto.ApiResponse;
import com.codewithshiva.retailpos.dto.dashboard.*;
import com.codewithshiva.retailpos.service.DashboardService;
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
 * Controller for dashboard endpoints.
 * All dashboard APIs are restricted to ADMIN users only.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard statistics and metrics (Admin only)")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    @Operation(summary = "Get Dashboard Stats", description = "Get key metrics for dashboard based on period")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats(
            @RequestParam(required = false, defaultValue = "today") String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        log.debug("Dashboard stats request - period: {}, startDate: {}, endDate: {}", period, startDate, endDate);
        DashboardStatsResponse stats = dashboardService.getDashboardStats(period, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/sales-trend")
    @Operation(summary = "Get Sales Trend", description = "Get daily sales data for chart")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SalesTrendResponse>>> getSalesTrend(
            @RequestParam(required = false, defaultValue = "30") Integer days) {
        log.debug("Sales trend request - days: {}", days);
        List<SalesTrendResponse> trend = dashboardService.getSalesTrend(days);
        return ResponseEntity.ok(ApiResponse.success(trend));
    }

    @GetMapping("/top-products")
    @Operation(summary = "Get Top Selling Products", description = "Get top selling products/variants for period")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TopProductResponse>>> getTopSellingProducts(
            @RequestParam(required = false, defaultValue = "30days") String period,
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
        log.debug("Top products request - period: {}, limit: {}", period, limit);
        List<TopProductResponse> products = dashboardService.getTopSellingProducts(period, limit);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Get Low Stock Items", description = "Get items below low stock threshold")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<LowStockResponse>>> getLowStockItems(
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
        log.debug("Low stock items request - limit: {}", limit);
        List<LowStockResponse> items = dashboardService.getLowStockItems(limit);
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/recent-sales")
    @Operation(summary = "Get Recent Sales", description = "Get most recent sales")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<RecentSaleResponse>>> getRecentSales(
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
        log.debug("Recent sales request - limit: {}", limit);
        List<RecentSaleResponse> sales = dashboardService.getRecentSales(limit);
        return ResponseEntity.ok(ApiResponse.success(sales));
    }
}
