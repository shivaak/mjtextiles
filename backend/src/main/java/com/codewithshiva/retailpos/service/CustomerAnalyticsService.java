package com.codewithshiva.retailpos.service;

import com.codewithshiva.retailpos.dao.CustomerAnalyticsDao;
import com.codewithshiva.retailpos.dto.customer.*;
import com.codewithshiva.retailpos.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Service for customer analytics operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerAnalyticsService {

    private final CustomerAnalyticsDao customerAnalyticsDao;

    /**
     * Get customer analytics summary stats.
     */
    @Transactional(readOnly = true)
    public CustomerAnalyticsSummaryResponse getSummary() {
        log.debug("Getting customer analytics summary");

        Long totalCustomers = customerAnalyticsDao.getTotalCustomers();
        Long customersWithPurchases = customerAnalyticsDao.getCustomersWithPurchases();
        BigDecimal totalRevenue = customerAnalyticsDao.getTotalCustomerRevenue();
        BigDecimal avgOrderValue = customerAnalyticsDao.getAvgOrderValue();
        Long totalTransactions = customerAnalyticsDao.getTotalCustomerTransactions();
        Integer totalPointsEarned = customerAnalyticsDao.getTotalPointsEarned();
        Integer totalPointsRedeemed = customerAnalyticsDao.getTotalPointsRedeemed();
        Integer totalPointsBalance = customerAnalyticsDao.getTotalPointsBalance();
        Long repeatCustomers = customerAnalyticsDao.getRepeatCustomers();

        double repeatRate = customersWithPurchases > 0
                ? (double) repeatCustomers / customersWithPurchases * 100
                : 0;

        return CustomerAnalyticsSummaryResponse.builder()
                .totalCustomers(totalCustomers != null ? totalCustomers : 0L)
                .customersWithPurchases(customersWithPurchases != null ? customersWithPurchases : 0L)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .avgOrderValue(avgOrderValue != null ? avgOrderValue : BigDecimal.ZERO)
                .totalTransactions(totalTransactions != null ? totalTransactions : 0L)
                .totalPointsEarned(totalPointsEarned != null ? totalPointsEarned : 0)
                .totalPointsRedeemed(totalPointsRedeemed != null ? totalPointsRedeemed : 0)
                .totalPointsBalance(totalPointsBalance != null ? totalPointsBalance : 0)
                .repeatCustomers(repeatCustomers != null ? repeatCustomers : 0L)
                .repeatRate(Math.round(repeatRate * 100.0) / 100.0)
                .build();
    }

    /**
     * Get top customers by purchase count.
     */
    @Transactional(readOnly = true)
    public List<CustomerRankingResponse> getTopCustomersByPurchases(Integer limit) {
        int resultLimit = limit != null && limit > 0 ? limit : 20;
        log.debug("Getting top customers by purchase count, limit: {}", resultLimit);

        List<CustomerRanking> rankings = customerAnalyticsDao.getTopCustomersByPurchaseCount(resultLimit);
        AtomicInteger rank = new AtomicInteger(1);

        return rankings.stream()
                .map(r -> CustomerRankingResponse.fromCustomerRanking(r, rank.getAndIncrement()))
                .collect(Collectors.toList());
    }

    /**
     * Get top customers by revenue.
     */
    @Transactional(readOnly = true)
    public List<CustomerRankingResponse> getTopCustomersByRevenue(Integer limit) {
        int resultLimit = limit != null && limit > 0 ? limit : 20;
        log.debug("Getting top customers by revenue, limit: {}", resultLimit);

        List<CustomerRanking> rankings = customerAnalyticsDao.getTopCustomersByRevenue(resultLimit);
        AtomicInteger rank = new AtomicInteger(1);

        return rankings.stream()
                .map(r -> CustomerRankingResponse.fromCustomerRanking(r, rank.getAndIncrement()))
                .collect(Collectors.toList());
    }

    /**
     * Get area-wise customer distribution.
     */
    @Transactional(readOnly = true)
    public List<AreaDistributionResponse> getAreaDistribution() {
        log.debug("Getting area-wise customer distribution");

        List<AreaDistribution> distributions = customerAnalyticsDao.getAreaDistribution();

        return distributions.stream()
                .map(AreaDistributionResponse::fromAreaDistribution)
                .collect(Collectors.toList());
    }

    /**
     * Get monthly new customer trend (last 12 months).
     */
    @Transactional(readOnly = true)
    public List<MonthlyCustomerTrendResponse> getMonthlyTrend() {
        log.debug("Getting monthly new customer trend");

        List<MonthlyCustomerTrend> trends = customerAnalyticsDao.getMonthlyNewCustomerTrend();

        return trends.stream()
                .map(MonthlyCustomerTrendResponse::fromMonthlyTrend)
                .collect(Collectors.toList());
    }

    /**
     * Get purchase frequency distribution.
     */
    @Transactional(readOnly = true)
    public List<PurchaseFrequencyResponse> getPurchaseFrequency() {
        log.debug("Getting purchase frequency distribution");

        List<PurchaseFrequency> frequencies = customerAnalyticsDao.getPurchaseFrequencyDistribution();

        return frequencies.stream()
                .map(PurchaseFrequencyResponse::fromPurchaseFrequency)
                .collect(Collectors.toList());
    }
}
