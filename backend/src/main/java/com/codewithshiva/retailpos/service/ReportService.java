package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.dao.ReportDao;
import com.codewithshiva.retailpos.dto.report.*;
import com.codewithshiva.retailpos.exception.BadRequestException;
import com.codewithshiva.retailpos.model.report.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for report generation operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportDao reportDao;

    // ==========================================
    // Sales Summary Report
    // ==========================================

    @Transactional(readOnly = true)
    public SalesSummaryReport getSalesSummaryReport(String startDateStr, String endDateStr, String groupBy) {
        log.info("Generating sales summary report from {} to {}, grouped by {}", startDateStr, endDateStr, groupBy);

        validateDateRange(startDateStr, endDateStr);
        DateRange dateRange = parseDateRange(startDateStr, endDateStr);

        // Get totals
        BigDecimal totalSales = reportDao.getSalesTotalSales(dateRange.start, dateRange.end);
        BigDecimal totalProfit = reportDao.getSalesTotalProfit(dateRange.start, dateRange.end);
        Long totalTransactions = reportDao.getSalesTotalTransactions(dateRange.start, dateRange.end);
        BigDecimal avgOrderValue = totalTransactions > 0 
                ? totalSales.divide(BigDecimal.valueOf(totalTransactions), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        SalesSummaryReport.Summary summary = SalesSummaryReport.Summary.builder()
                .totalSales(totalSales)
                .totalProfit(totalProfit)
                .totalTransactions(totalTransactions)
                .avgOrderValue(avgOrderValue)
                .build();

        // Get period breakdown
        List<SalesPeriodData> periodData;
        String effectiveGroupBy = groupBy != null ? groupBy.toLowerCase() : "day";
        
        switch (effectiveGroupBy) {
            case "week":
                periodData = reportDao.getSalesByWeek(dateRange.start, dateRange.end);
                break;
            case "month":
                periodData = reportDao.getSalesByMonth(dateRange.start, dateRange.end);
                break;
            default: // day
                LocalDate startDate = LocalDate.parse(startDateStr);
                LocalDate endDate = LocalDate.parse(endDateStr);
                periodData = reportDao.getSalesByDay(startDate, endDate);
        }

        List<SalesSummaryReport.PeriodBreakdown> breakdown = periodData.stream()
                .map(pd -> {
                    BigDecimal avg = pd.getTransactions() > 0
                            ? pd.getSales().divide(BigDecimal.valueOf(pd.getTransactions()), 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                    return SalesSummaryReport.PeriodBreakdown.builder()
                            .period(pd.getPeriod())
                            .sales(pd.getSales())
                            .profit(pd.getProfit())
                            .transactions(pd.getTransactions())
                            .avgOrderValue(avg)
                            .build();
                })
                .collect(Collectors.toList());

        // Get payment mode breakdown
        List<PaymentModeData> paymentData = reportDao.getPaymentModeBreakdown(dateRange.start, dateRange.end);
        List<SalesSummaryReport.PaymentModeBreakdown> paymentBreakdown = paymentData.stream()
                .map(pm -> SalesSummaryReport.PaymentModeBreakdown.builder()
                        .mode(pm.getMode())
                        .amount(pm.getAmount())
                        .count(pm.getCount())
                        .build())
                .collect(Collectors.toList());

        return SalesSummaryReport.builder()
                .summary(summary)
                .breakdown(breakdown)
                .paymentModeBreakdown(paymentBreakdown)
                .build();
    }

    // ==========================================
    // Product Performance Report
    // ==========================================

    @Transactional(readOnly = true)
    public ProductPerformanceReport getProductPerformanceReport(String startDateStr, String endDateStr,
                                                                 String category, String brand,
                                                                 String sortBy, String order, Integer limit) {
        log.info("Generating product performance report from {} to {}", startDateStr, endDateStr);

        validateDateRange(startDateStr, endDateStr);
        DateRange dateRange = parseDateRange(startDateStr, endDateStr);

        int resultLimit = limit != null && limit > 0 ? limit : 20;
        String effectiveSortBy = sortBy != null ? sortBy : "qtySold";
        String effectiveOrder = order != null ? order.toUpperCase() : "DESC";

        // Get top sellers
        List<ProductSalesData> topSellersData = reportDao.getTopSellingProducts(
                dateRange.start, dateRange.end, category, brand, effectiveSortBy, effectiveOrder, resultLimit);

        List<ProductPerformanceReport.TopSeller> topSellers = topSellersData.stream()
                .map(ps -> {
                    BigDecimal markup = ps.getCost().compareTo(BigDecimal.ZERO) > 0
                            ? ps.getProfit().multiply(BigDecimal.valueOf(100))
                                .divide(ps.getCost(), 1, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                    return ProductPerformanceReport.TopSeller.builder()
                            .variantId(ps.getVariantId())
                            .productName(ps.getProductName())
                            .sku(ps.getSku())
                            .category(ps.getCategory())
                            .brand(ps.getBrand())
                            .qtySold(ps.getQtySold())
                            .revenue(ps.getRevenue())
                            .cost(ps.getCost())
                            .profit(ps.getProfit())
                            .markupPercent(markup)
                            .build();
                })
                .collect(Collectors.toList());

        // Get slow movers
        List<SlowMoverData> slowMoversData = reportDao.getSlowMovers(dateRange.start, dateRange.end, 10);
        List<ProductPerformanceReport.SlowMover> slowMovers = slowMoversData.stream()
                .map(sm -> ProductPerformanceReport.SlowMover.builder()
                        .variantId(sm.getVariantId())
                        .productName(sm.getProductName())
                        .sku(sm.getSku())
                        .qtySold(sm.getQtySold())
                        .daysSinceLastSale(sm.getDaysSinceLastSale())
                        .stockQty(sm.getStockQty())
                        .build())
                .collect(Collectors.toList());

        // Get category breakdown
        List<CategorySalesData> categoryData = reportDao.getCategoryBreakdown(dateRange.start, dateRange.end);
        List<ProductPerformanceReport.CategoryBreakdown> categoryBreakdown = categoryData.stream()
                .map(cs -> ProductPerformanceReport.CategoryBreakdown.builder()
                        .category(cs.getCategory())
                        .qtySold(cs.getQtySold())
                        .revenue(cs.getRevenue())
                        .profit(cs.getProfit())
                        .build())
                .collect(Collectors.toList());

        return ProductPerformanceReport.builder()
                .topSellers(topSellers)
                .slowMovers(slowMovers)
                .categoryBreakdown(categoryBreakdown)
                .build();
    }

    // ==========================================
    // Profit Report
    // ==========================================

    @Transactional(readOnly = true)
    public ProfitReport getProfitReport(String startDateStr, String endDateStr, String groupBy) {
        log.info("Generating profit report from {} to {}, grouped by {}", startDateStr, endDateStr, groupBy);

        validateDateRange(startDateStr, endDateStr);
        DateRange dateRange = parseDateRange(startDateStr, endDateStr);

        // Get summary
        BigDecimal totalRevenue = reportDao.getProfitTotalRevenue(dateRange.start, dateRange.end);
        BigDecimal totalCost = reportDao.getProfitTotalCost(dateRange.start, dateRange.end);
        BigDecimal grossProfit = totalRevenue.subtract(totalCost);
        BigDecimal profitMargin = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                ? grossProfit.multiply(BigDecimal.valueOf(100)).divide(totalRevenue, 1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        ProfitReport.Summary summary = ProfitReport.Summary.builder()
                .totalRevenue(totalRevenue)
                .totalCost(totalCost)
                .grossProfit(grossProfit)
                .profitMargin(profitMargin)
                .build();

        // Get trend
        String effectiveGroupBy = groupBy != null ? groupBy.toLowerCase() : "day";
        List<ProfitPeriodData> trendData;
        
        switch (effectiveGroupBy) {
            case "week":
                trendData = reportDao.getProfitTrendByWeek(dateRange.start, dateRange.end);
                break;
            case "month":
                trendData = reportDao.getProfitTrendByMonth(dateRange.start, dateRange.end);
                break;
            default: // day
                trendData = reportDao.getProfitTrendByDay(dateRange.start, dateRange.end);
        }

        List<ProfitReport.ProfitTrend> trend = trendData.stream()
                .map(pd -> {
                    BigDecimal margin = pd.getRevenue().compareTo(BigDecimal.ZERO) > 0
                            ? pd.getProfit().multiply(BigDecimal.valueOf(100))
                                .divide(pd.getRevenue(), 1, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                    return ProfitReport.ProfitTrend.builder()
                            .period(pd.getPeriod())
                            .revenue(pd.getRevenue())
                            .cost(pd.getCost())
                            .profit(pd.getProfit())
                            .margin(margin)
                            .build();
                })
                .collect(Collectors.toList());

        // Get by category
        List<CategorySalesData> categoryData = reportDao.getCategoryBreakdown(dateRange.start, dateRange.end);
        List<ProfitReport.CategoryProfit> byCategory = categoryData.stream()
                .map(cs -> {
                    BigDecimal margin = cs.getRevenue().compareTo(BigDecimal.ZERO) > 0
                            ? cs.getProfit().multiply(BigDecimal.valueOf(100))
                                .divide(cs.getRevenue(), 1, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                    return ProfitReport.CategoryProfit.builder()
                            .category(cs.getCategory())
                            .revenue(cs.getRevenue())
                            .cost(cs.getCost())
                            .profit(cs.getProfit())
                            .margin(margin)
                            .build();
                })
                .collect(Collectors.toList());

        // Get by cashier
        List<CashierSalesData> cashierData = reportDao.getProfitByCashier(dateRange.start, dateRange.end);
        List<ProfitReport.CashierProfit> byCashier = cashierData.stream()
                .map(cd -> ProfitReport.CashierProfit.builder()
                        .userId(cd.getUserId())
                        .userName(cd.getUserName())
                        .revenue(cd.getRevenue())
                        .profit(cd.getProfit())
                        .transactions(cd.getTransactions())
                        .build())
                .collect(Collectors.toList());

        return ProfitReport.builder()
                .summary(summary)
                .trend(trend)
                .byCategory(byCategory)
                .byCashier(byCashier)
                .build();
    }

    // ==========================================
    // Inventory Valuation Report
    // ==========================================

    @Transactional(readOnly = true)
    public InventoryValuationReport getInventoryValuationReport(String category, String brand, String groupBy) {
        log.info("Generating inventory valuation report - category: {}, brand: {}, groupBy: {}", 
                category, brand, groupBy);

        // Get summary
        Integer totalSkus = reportDao.getInventoryTotalSkus();
        Long totalItems = reportDao.getInventoryTotalItems();
        BigDecimal totalCostValue = reportDao.getInventoryTotalCostValue();
        BigDecimal totalRetailValue = reportDao.getInventoryTotalRetailValue();
        BigDecimal potentialProfit = totalRetailValue.subtract(totalCostValue);

        InventoryValuationReport.Summary summary = InventoryValuationReport.Summary.builder()
                .totalSkus(totalSkus)
                .totalItems(totalItems)
                .totalCostValue(totalCostValue)
                .totalRetailValue(totalRetailValue)
                .potentialProfit(potentialProfit)
                .build();

        // Get by category
        List<InventoryGroupData> categoryData = reportDao.getInventoryByCategory(category, brand);
        List<InventoryValuationReport.CategoryValuation> byCategory = categoryData.stream()
                .map(ig -> InventoryValuationReport.CategoryValuation.builder()
                        .category(ig.getGroupName())
                        .skuCount(ig.getSkuCount())
                        .itemCount(ig.getItemCount())
                        .costValue(ig.getCostValue())
                        .retailValue(ig.getRetailValue())
                        .build())
                .collect(Collectors.toList());

        // Get by brand
        List<InventoryGroupData> brandData = reportDao.getInventoryByBrand(category, brand);
        List<InventoryValuationReport.BrandValuation> byBrand = brandData.stream()
                .map(ig -> InventoryValuationReport.BrandValuation.builder()
                        .brand(ig.getGroupName())
                        .skuCount(ig.getSkuCount())
                        .itemCount(ig.getItemCount())
                        .costValue(ig.getCostValue())
                        .retailValue(ig.getRetailValue())
                        .build())
                .collect(Collectors.toList());

        return InventoryValuationReport.builder()
                .summary(summary)
                .byCategory(byCategory)
                .byBrand(byBrand)
                .build();
    }

    // ==========================================
    // Low Stock Report
    // ==========================================

    @Transactional(readOnly = true)
    public LowStockReport getLowStockReport(String category, String brand, Boolean includeOutOfStock) {
        log.info("Generating low stock report - category: {}, brand: {}, includeOutOfStock: {}", 
                category, brand, includeOutOfStock);

        boolean includeOOS = includeOutOfStock != null && includeOutOfStock;

        // Get counts
        Integer lowStockCount = reportDao.getLowStockCount(category, brand);
        Integer outOfStockCount = reportDao.getOutOfStockCount(category, brand);

        // Get items
        List<LowStockItemData> itemsData = reportDao.getLowStockItems(category, brand, includeOOS);
        
        // If includeOutOfStock, also get out of stock items
        if (includeOOS) {
            List<LowStockItemData> outOfStockItems = reportDao.getOutOfStockItems(category, brand);
            itemsData = new ArrayList<>(itemsData);
            itemsData.addAll(outOfStockItems);
        }

        // Calculate total reorder value and build response items
        BigDecimal totalReorderValue = BigDecimal.ZERO;
        List<LowStockReport.LowStockItem> items = new ArrayList<>();

        for (LowStockItemData data : itemsData) {
            // Calculate suggested reorder: threshold - current + 1 month buffer
            int avgMonthly = data.getAvgMonthlySales() != null 
                    ? data.getAvgMonthlySales().intValue() : 0;
            int suggestedReorder = Math.max(0, 
                    data.getThreshold() - data.getCurrentStock() + avgMonthly);

            BigDecimal lastPrice = data.getLastPurchasePrice() != null 
                    ? data.getLastPurchasePrice() : BigDecimal.ZERO;
            BigDecimal reorderCost = lastPrice.multiply(BigDecimal.valueOf(suggestedReorder));
            totalReorderValue = totalReorderValue.add(reorderCost);

            items.add(LowStockReport.LowStockItem.builder()
                    .variantId(data.getVariantId())
                    .productName(data.getProductName())
                    .sku(data.getSku())
                    .category(data.getCategory())
                    .brand(data.getBrand())
                    .currentStock(data.getCurrentStock())
                    .threshold(data.getThreshold())
                    .avgMonthlySales(data.getAvgMonthlySales())
                    .suggestedReorder(suggestedReorder)
                    .lastPurchasePrice(lastPrice)
                    .reorderCost(reorderCost)
                    .lastSupplier(data.getLastSupplier())
                    .build());
        }

        LowStockReport.Summary summary = LowStockReport.Summary.builder()
                .lowStockCount(lowStockCount)
                .outOfStockCount(outOfStockCount)
                .totalReorderValue(totalReorderValue)
                .build();

        return LowStockReport.builder()
                .summary(summary)
                .items(items)
                .build();
    }

    // ==========================================
    // Export Report as CSV
    // ==========================================

    public byte[] exportReportAsCsv(String reportType, String startDate, String endDate,
                                     String category, String brand, String groupBy) {
        log.info("Exporting {} report as CSV", reportType);

        StringBuilder csv = new StringBuilder();

        switch (reportType.toLowerCase()) {
            case "sales-summary":
                SalesSummaryReport salesReport = getSalesSummaryReport(startDate, endDate, groupBy);
                csv.append("Period,Sales,Profit,Transactions,Avg Order Value\n");
                for (SalesSummaryReport.PeriodBreakdown pb : salesReport.getBreakdown()) {
                    csv.append(String.format("%s,%.2f,%.2f,%d,%.2f\n",
                            pb.getPeriod(), pb.getSales(), pb.getProfit(),
                            pb.getTransactions(), pb.getAvgOrderValue()));
                }
                break;

            case "product-performance":
                ProductPerformanceReport productReport = getProductPerformanceReport(
                        startDate, endDate, category, brand, "qtySold", "desc", 100);
                csv.append("SKU,Product,Category,Brand,Qty Sold,Revenue,Cost,Profit,Margin %\n");
                for (ProductPerformanceReport.TopSeller ts : productReport.getTopSellers()) {
                    csv.append(String.format("%s,%s,%s,%s,%d,%.2f,%.2f,%.2f,%.1f\n",
                            ts.getSku(), escapeCsv(ts.getProductName()), ts.getCategory(),
                            ts.getBrand(), ts.getQtySold(), ts.getRevenue(),
                            ts.getCost(), ts.getProfit(), ts.getMarkupPercent()));
                }
                break;

            case "profit":
                ProfitReport profitReport = getProfitReport(startDate, endDate, groupBy);
                csv.append("Period,Revenue,Cost,Profit,Margin %\n");
                for (ProfitReport.ProfitTrend pt : profitReport.getTrend()) {
                    csv.append(String.format("%s,%.2f,%.2f,%.2f,%.1f\n",
                            pt.getPeriod(), pt.getRevenue(), pt.getCost(),
                            pt.getProfit(), pt.getMargin()));
                }
                break;

            case "inventory-valuation":
                InventoryValuationReport invReport = getInventoryValuationReport(category, brand, groupBy);
                csv.append("Category,SKU Count,Item Count,Cost Value,Retail Value\n");
                for (InventoryValuationReport.CategoryValuation cv : invReport.getByCategory()) {
                    csv.append(String.format("%s,%d,%d,%.2f,%.2f\n",
                            cv.getCategory(), cv.getSkuCount(), cv.getItemCount(),
                            cv.getCostValue(), cv.getRetailValue()));
                }
                break;

            case "low-stock":
                LowStockReport lowStockReport = getLowStockReport(category, brand, true);
                csv.append("SKU,Product,Category,Brand,Current Stock,Threshold,Avg Monthly Sales,Suggested Reorder,Last Price,Reorder Cost,Last Supplier\n");
                for (LowStockReport.LowStockItem li : lowStockReport.getItems()) {
                    csv.append(String.format("%s,%s,%s,%s,%d,%d,%.1f,%d,%.2f,%.2f,%s\n",
                            li.getSku(), escapeCsv(li.getProductName()), li.getCategory(),
                            li.getBrand(), li.getCurrentStock(), li.getThreshold(),
                            li.getAvgMonthlySales(), li.getSuggestedReorder(),
                            li.getLastPurchasePrice(), li.getReorderCost(),
                            li.getLastSupplier() != null ? escapeCsv(li.getLastSupplier()) : ""));
                }
                break;

            default:
                throw new BadRequestException("INVALID_REPORT_TYPE", 
                        "Invalid report type: " + reportType);
        }

        return csv.toString().getBytes();
    }

    // ==========================================
    // Helper Methods
    // ==========================================

    private void validateDateRange(String startDateStr, String endDateStr) {
        if (startDateStr == null || startDateStr.isEmpty()) {
            throw new BadRequestException("MISSING_START_DATE", "Start date is required");
        }
        if (endDateStr == null || endDateStr.isEmpty()) {
            throw new BadRequestException("MISSING_END_DATE", "End date is required");
        }
    }

    private DateRange parseDateRange(String startDateStr, String endDateStr) {
        try {
            LocalDate startDate = LocalDate.parse(startDateStr);
            LocalDate endDate = LocalDate.parse(endDateStr);

            if (endDate.isBefore(startDate)) {
                throw new BadRequestException("INVALID_DATE_RANGE", "End date cannot be before start date");
            }

            return new DateRange(
                    startDate.atStartOfDay().atOffset(ZoneOffset.UTC),
                    endDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC)
            );
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("INVALID_DATE_FORMAT", "Invalid date format. Use YYYY-MM-DD");
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private static class DateRange {
        final OffsetDateTime start;
        final OffsetDateTime end;

        DateRange(OffsetDateTime start, OffsetDateTime end) {
            this.start = start;
            this.end = end;
        }
    }
}
