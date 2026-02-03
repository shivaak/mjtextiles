package com.codewithshiva.retailpos.controller;

import com.codewithshiva.retailpos.dto.ApiResponse;
import com.codewithshiva.retailpos.dto.report.*;
import com.codewithshiva.retailpos.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for report generation endpoints.
 * All endpoints are Admin only.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Reports", description = "Report generation endpoints (Admin only)")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/sales-summary")
    @Operation(summary = "Sales Summary Report", description = "Get sales aggregated by day/week/month")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<SalesSummaryReport>> getSalesSummaryReport(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false, defaultValue = "day") String groupBy) {
        log.info("Sales summary report request - startDate: {}, endDate: {}, groupBy: {}", 
                startDate, endDate, groupBy);
        SalesSummaryReport report = reportService.getSalesSummaryReport(startDate, endDate, groupBy);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/product-performance")
    @Operation(summary = "Product Performance Report", description = "Get product/variant performance metrics")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<ProductPerformanceReport>> getProductPerformanceReport(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false, defaultValue = "qtySold") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String order,
            @RequestParam(required = false, defaultValue = "20") Integer limit) {
        log.info("Product performance report request - startDate: {}, endDate: {}, category: {}, brand: {}", 
                startDate, endDate, category, brand);
        ProductPerformanceReport report = reportService.getProductPerformanceReport(
                startDate, endDate, category, brand, sortBy, order, limit);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/profit")
    @Operation(summary = "Profit Report", description = "Get detailed profit analysis")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<ProfitReport>> getProfitReport(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false, defaultValue = "day") String groupBy) {
        log.info("Profit report request - startDate: {}, endDate: {}, groupBy: {}", 
                startDate, endDate, groupBy);
        ProfitReport report = reportService.getProfitReport(startDate, endDate, groupBy);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/inventory-valuation")
    @Operation(summary = "Inventory Valuation Report", description = "Get current inventory valuation")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<InventoryValuationReport>> getInventoryValuationReport(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false, defaultValue = "category") String groupBy) {
        log.info("Inventory valuation report request - category: {}, brand: {}, groupBy: {}", 
                category, brand, groupBy);
        InventoryValuationReport report = reportService.getInventoryValuationReport(category, brand, groupBy);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Low Stock Report", description = "Get detailed low stock and reorder suggestions")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<LowStockReport>> getLowStockReport(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false, defaultValue = "false") Boolean includeOutOfStock) {
        log.info("Low stock report request - category: {}, brand: {}, includeOutOfStock: {}", 
                category, brand, includeOutOfStock);
        LowStockReport report = reportService.getLowStockReport(category, brand, includeOutOfStock);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/export")
    @Operation(summary = "Export Report", description = "Export any report as CSV")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<byte[]> exportReport(
            @RequestParam String reportType,
            @RequestParam(required = false, defaultValue = "csv") String format,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String groupBy) {
        log.info("Export report request - type: {}, format: {}", reportType, format);

        byte[] data = reportService.exportReportAsCsv(reportType, startDate, endDate, 
                category, brand, groupBy);

        String filename = reportType + "-report-" + 
                java.time.LocalDate.now().toString() + ".csv";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return ResponseEntity.ok()
                .headers(headers)
                .body(data);
    }
}
