import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  alpha,
  useTheme,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RepeatIcon from '@mui/icons-material/Repeat';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import dayjs from 'dayjs';

import StatCard from '../../components/common/StatCard';
import { useNotification } from '../../app/context/NotificationContext';
import { customerService } from '../../services/customerService';
import { formatApiError } from '../../services/api';
import { formatCurrency } from '../../utils/calculations';
import type {
  CustomerAnalyticsSummary,
  CustomerRanking,
  AreaDistribution,
  MonthlyCustomerTrend,
  PurchaseFrequency,
} from '../../domain/types';

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0', '#0288d1', '#689f38', '#f57c00', '#c62828', '#7b1fa2'];

type RankingMode = 'purchases' | 'revenue';

export default function CustomerAnalyticsTab() {
  const theme = useTheme();
  const { error: showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CustomerAnalyticsSummary | null>(null);
  const [topByPurchases, setTopByPurchases] = useState<CustomerRanking[]>([]);
  const [topByRevenue, setTopByRevenue] = useState<CustomerRanking[]>([]);
  const [areaDistribution, setAreaDistribution] = useState<AreaDistribution[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyCustomerTrend[]>([]);
  const [purchaseFrequency, setPurchaseFrequency] = useState<PurchaseFrequency[]>([]);
  const [rankingMode, setRankingMode] = useState<RankingMode>('purchases');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, purchasesData, revenueData, areaData, trendData, frequencyData] =
          await Promise.all([
            customerService.getAnalyticsSummary(),
            customerService.getTopByPurchases(15),
            customerService.getTopByRevenue(10),
            customerService.getAreaDistribution(),
            customerService.getMonthlyTrend(),
            customerService.getPurchaseFrequency(),
          ]);
        setSummary(summaryData);
        setTopByPurchases(purchasesData);
        setTopByRevenue(revenueData);
        setAreaDistribution(areaData);
        setMonthlyTrend(trendData);
        setPurchaseFrequency(frequencyData);
      } catch (error) {
        showError(formatApiError(error, 'Failed to load customer analytics'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showError]);

  const monthlyTrendChart = useMemo(() => {
    return monthlyTrend.map((entry) => ({
      ...entry,
      label: dayjs(entry.month + '-01').format('MMM YYYY'),
    }));
  }, [monthlyTrend]);

  const topRevenueChart = useMemo(() => {
    return topByRevenue.slice(0, 8).map((c) => ({
      name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
      revenue: c.totalSpent,
      purchases: c.purchaseCount,
    }));
  }, [topByRevenue]);

  const areaPieData = useMemo(() => {
    return areaDistribution.map((a) => ({
      name: a.area,
      value: a.customerCount,
    }));
  }, [areaDistribution]);

  const currentRankings = rankingMode === 'purchases' ? topByPurchases : topByRevenue;

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { color: '#FFD700', label: '1st' };
    if (rank === 2) return { color: '#C0C0C0', label: '2nd' };
    if (rank === 3) return { color: '#CD7F32', label: '3rd' };
    return { color: theme.palette.text.secondary, label: `#${rank}` };
  };

  return (
    <Box>
      {/* Summary Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Customers"
            value={summary?.totalCustomers ?? 0}
            subtitle={`${summary?.customersWithPurchases ?? 0} with purchases`}
            icon={<PeopleIcon />}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Customer Revenue"
            value={formatCurrency(summary?.totalRevenue ?? 0)}
            subtitle={`${summary?.totalTransactions ?? 0} transactions`}
            icon={<MonetizationOnIcon />}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Avg Order Value"
            value={formatCurrency(summary?.avgOrderValue ?? 0)}
            subtitle="Per transaction"
            icon={<ShoppingCartIcon />}
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Repeat Customers"
            value={summary?.repeatCustomers ?? 0}
            subtitle={`${summary?.repeatRate ?? 0}% repeat rate`}
            icon={<RepeatIcon />}
            color="warning"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Charts Row 1: Monthly Trend + Area Pie */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                New Customer Registrations (Last 12 Months)
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
              ) : monthlyTrendChart.length === 0 ? (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No data available</Typography>
                </Box>
              ) : (
                <Box sx={{ height: 300, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendChart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip contentStyle={{ borderRadius: 8 }} />
                      <Line
                        type="monotone"
                        dataKey="newCustomers"
                        name="New Customers"
                        stroke="#1976d2"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#1976d2' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Customers by Area
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
              ) : areaPieData.length === 0 ? (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No data available</Typography>
                </Box>
              ) : (
                <Box sx={{ height: 300, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={areaPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name} (${(((percent ?? 0) as number) * 100).toFixed(0)}%)`
                        }
                        labelLine={true}
                      >
                        {areaPieData.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number | string | undefined) => {
                          const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
                          return [`${numericValue} customers`, 'Count'];
                        }}
                        contentStyle={{ borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2: Top Revenue Bar + Purchase Frequency */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Top Customers by Revenue
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 1 }} />
              ) : topRevenueChart.length === 0 ? (
                <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No data available</Typography>
                </Box>
              ) : (
                <Box sx={{ height: 320, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topRevenueChart} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => formatCurrency(Number(value))}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        width={120}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value: number | string | undefined) => {
                          const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
                          return [formatCurrency(numericValue), 'Revenue'];
                        }}
                        contentStyle={{ borderRadius: 8 }}
                      />
                      <Bar dataKey="revenue" fill="#2e7d32" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Purchase Frequency Distribution
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 1 }} />
              ) : purchaseFrequency.length === 0 ? (
                <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No data available</Typography>
                </Box>
              ) : (
                <Box sx={{ height: 320, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={purchaseFrequency}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="bucket"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        formatter={(value: number | string | undefined) => {
                          const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
                          return [`${numericValue} customers`, 'Count'];
                        }}
                        contentStyle={{ borderRadius: 8 }}
                      />
                      <Bar dataKey="customerCount" name="Customers" fill="#1976d2" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Area Revenue Table + Loyalty Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Area-wise Revenue Breakdown
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 1 }} />
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Area</TableCell>
                        <TableCell align="right">Customers</TableCell>
                        <TableCell align="right">Active Buyers</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {areaDistribution.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">No data</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        areaDistribution.map((row) => (
                          <TableRow key={row.area}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {row.area}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{row.customerCount}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={row.activeCustomers}
                                size="small"
                                color={row.activeCustomers > 0 ? 'success' : 'default'}
                                variant={row.activeCustomers > 0 ? 'filled' : 'outlined'}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={500}>
                                {formatCurrency(row.totalRevenue)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <LoyaltyIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Loyalty Points Summary
                </Typography>
              </Box>
              {loading ? (
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.success.main, 0.08),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Total Points Earned
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="success.main">
                      {(summary?.totalPointsEarned ?? 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.error.main, 0.08),
                      border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Total Points Redeemed
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="error.main">
                      {(summary?.totalPointsRedeemed ?? 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Outstanding Balance
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="primary.main">
                      {(summary?.totalPointsBalance ?? 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Customer Rankings Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmojiEventsIcon color="warning" />
              <Typography variant="h6" fontWeight={600}>
                Customer Rankings
              </Typography>
            </Box>
            <ToggleButtonGroup
              value={rankingMode}
              exclusive
              onChange={(_e, val) => val && setRankingMode(val)}
              size="small"
            >
              <ToggleButton value="purchases">By Purchase Count</ToggleButton>
              <ToggleButton value="revenue">By Revenue</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {loading ? (
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={70}>Rank</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Area</TableCell>
                    <TableCell align="right">Purchases</TableCell>
                    <TableCell align="right">Total Spent</TableCell>
                    <TableCell align="right">Avg Order</TableCell>
                    <TableCell>Last Purchase</TableCell>
                    <TableCell align="right">Points</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentRankings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No customer purchase data available
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentRankings.map((customer) => {
                      const badge = getRankBadge(customer.rank);
                      return (
                        <TableRow key={customer.customerId} hover>
                          <TableCell>
                            <Chip
                              label={badge.label}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                bgcolor: customer.rank <= 3
                                  ? alpha(badge.color, 0.15)
                                  : 'action.hover',
                                color: customer.rank <= 3 ? badge.color : 'text.primary',
                                border: customer.rank <= 3
                                  ? `1px solid ${alpha(badge.color, 0.4)}`
                                  : 'none',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {customer.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {customer.phone}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {customer.area || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={customer.purchaseCount}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600} color="success.main">
                              {formatCurrency(customer.totalSpent)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {formatCurrency(customer.avgOrderValue)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {customer.lastPurchaseAt
                                ? dayjs(customer.lastPurchaseAt).format('MMM D, YYYY')
                                : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={customer.loyaltyPoints}
                              size="small"
                              color={customer.loyaltyPoints > 0 ? 'primary' : 'default'}
                              variant={customer.loyaltyPoints > 0 ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
