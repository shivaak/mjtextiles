package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.dao.DashboardDao;
import com.codewithshiva.retailpos.dto.dashboard.*;
import com.codewithshiva.retailpos.exception.BadRequestException;
import com.codewithshiva.retailpos.model.DailySalesSummary;
import com.codewithshiva.retailpos.model.DashboardStats;
import com.codewithshiva.retailpos.model.LowStockItem;
import com.codewithshiva.retailpos.model.RecentSale;
import com.codewithshiva.retailpos.model.TopSellingProduct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for dashboard operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DashboardDao dashboardDao;

    /**
     * Get dashboard statistics for the given period.
     */
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(String period, String startDate, String endDate) {
        log.debug("Getting dashboard stats for period: {}, startDate: {}, endDate: {}", period, startDate, endDate);

        DateRange dateRange = calculateDateRange(period, startDate, endDate);

        BigDecimal totalSales = dashboardDao.getTotalSales(dateRange.start, dateRange.end);
        BigDecimal totalProfit = dashboardDao.getTotalProfit(dateRange.start, dateRange.end);
        Long totalTransactions = dashboardDao.getTotalTransactions(dateRange.start, dateRange.end);
        BigDecimal avgOrderValue = dashboardDao.getAvgOrderValue(dateRange.start, dateRange.end);
        Integer lowStockCount = dashboardDao.getLowStockCount();
        Integer outOfStockCount = dashboardDao.getOutOfStockCount();
        Integer totalSkus = dashboardDao.getTotalSkus();

        DashboardStats stats = DashboardStats.builder()
                .totalSales(totalSales)
                .totalProfit(totalProfit)
                .totalTransactions(totalTransactions)
                .avgOrderValue(avgOrderValue)
                .lowStockCount(lowStockCount)
                .outOfStockCount(outOfStockCount)
                .totalSkus(totalSkus)
                .build();

        return DashboardStatsResponse.fromDashboardStats(stats);
    }

    /**
     * Get sales trend for the given number of days.
     * Uses v_daily_sales_summary view.
     */
    @Transactional(readOnly = true)
    public List<SalesTrendResponse> getSalesTrend(Integer days) {
        int numDays = days != null && days > 0 ? days : 30;
        log.debug("Getting sales trend for {} days", numDays);

        LocalDate startDate = LocalDate.now().minusDays(numDays - 1);
        List<DailySalesSummary> summaries = dashboardDao.getSalesTrend(startDate);

        return summaries.stream()
                .map(SalesTrendResponse::fromDailySalesSummary)
                .collect(Collectors.toList());
    }

    /**
     * Get top selling products for the given period.
     */
    @Transactional(readOnly = true)
    public List<TopProductResponse> getTopSellingProducts(String period, Integer limit) {
        int resultLimit = limit != null && limit > 0 ? limit : 10;
        log.debug("Getting top selling products for period: {}, limit: {}", period, resultLimit);

        DateRange dateRange = calculateDateRangeForPeriod(period);

        List<TopSellingProduct> products = dashboardDao.getTopSellingProducts(
                dateRange.start, dateRange.end, resultLimit);

        return products.stream()
                .map(TopProductResponse::fromTopSellingProduct)
                .collect(Collectors.toList());
    }

    /**
     * Get low stock items.
     * Uses v_low_stock_variants view.
     */
    @Transactional(readOnly = true)
    public List<LowStockResponse> getLowStockItems(Integer limit) {
        int resultLimit = limit != null && limit > 0 ? limit : 10;
        log.debug("Getting low stock items with limit: {}", resultLimit);

        List<LowStockItem> items = dashboardDao.getLowStockItems(resultLimit);

        return items.stream()
                .map(LowStockResponse::fromLowStockItem)
                .collect(Collectors.toList());
    }

    /**
     * Get recent sales.
     * Uses v_sales_with_details view.
     */
    @Transactional(readOnly = true)
    public List<RecentSaleResponse> getRecentSales(Integer limit) {
        int resultLimit = limit != null && limit > 0 ? limit : 10;
        log.debug("Getting recent sales with limit: {}", resultLimit);

        List<RecentSale> sales = dashboardDao.getRecentSales(resultLimit);

        return sales.stream()
                .map(RecentSaleResponse::fromRecentSale)
                .collect(Collectors.toList());
    }

    /**
     * Calculate date range based on period or custom dates.
     */
    private DateRange calculateDateRange(String period, String startDateStr, String endDateStr) {
        if (period == null || period.isEmpty()) {
            period = "today";
        }

        if ("custom".equalsIgnoreCase(period)) {
            if (startDateStr == null || startDateStr.isEmpty()) {
                throw new BadRequestException("MISSING_START_DATE", "Start date is required for custom period");
            }
            if (endDateStr == null || endDateStr.isEmpty()) {
                throw new BadRequestException("MISSING_END_DATE", "End date is required for custom period");
            }
            return parseCustomDateRange(startDateStr, endDateStr);
        }

        return calculateDateRangeForPeriod(period);
    }

    /**
     * Calculate date range for a named period.
     */
    private DateRange calculateDateRangeForPeriod(String period) {
        LocalDate today = LocalDate.now();
        LocalDate startDate;
        LocalDate endDate = today.plusDays(1); // End of today (exclusive)

        switch (period != null ? period.toLowerCase() : "today") {
            case "7days":
                startDate = today.minusDays(6);
                break;
            case "30days":
                startDate = today.minusDays(29);
                break;
            case "today":
            default:
                startDate = today;
                break;
        }

        return new DateRange(
                startDate.atStartOfDay().atOffset(ZoneOffset.UTC),
                endDate.atStartOfDay().atOffset(ZoneOffset.UTC)
        );
    }

    /**
     * Parse custom date range from strings.
     */
    private DateRange parseCustomDateRange(String startDateStr, String endDateStr) {
        try {
            LocalDate startDate = LocalDate.parse(startDateStr);
            LocalDate endDate = LocalDate.parse(endDateStr);

            if (endDate.isBefore(startDate)) {
                throw new BadRequestException("INVALID_DATE_RANGE", "End date cannot be before start date");
            }

            return new DateRange(
                    startDate.atStartOfDay().atOffset(ZoneOffset.UTC),
                    endDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC) // End of day (exclusive)
            );
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("INVALID_DATE_FORMAT", "Invalid date format. Use YYYY-MM-DD");
        }
    }

    /**
     * Helper class to hold date range.
     */
    private static class DateRange {
        final OffsetDateTime start;
        final OffsetDateTime end;

        DateRange(OffsetDateTime start, OffsetDateTime end) {
            this.start = start;
            this.end = end;
        }
    }
}
