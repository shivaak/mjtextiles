import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';

import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DateRangePicker from '../../components/common/DateRangePicker';
import Money from '../../components/common/Money';
import { useAuth } from '../../app/context/AuthContext';
import { useNotification } from '../../app/context/NotificationContext';
import { dashboardService } from '../../services/dashboardService';
import { formatApiError } from '../../services/api';
import { settingsService } from '../../services/settingsService';
import type {
  DashboardStats,
  SalesTrend,
  TopProduct,
  LowStockItem,
  RecentSale,
  DateRange,
  Settings,
} from '../../domain/types';
import { formatCurrency } from '../../utils/calculations';

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const { error: showError } = useNotification();

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<Settings | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsService.getSettings();
        setSettings(data);
      } catch (error) {
        showError(formatApiError(error, 'Failed to load settings'));
        setSettings({
          shopName: '',
          currency: 'INR',
          taxPercent: 0,
          invoicePrefix: '',
          lastBillNumber: 0,
          lowStockThreshold: 10,
        } as Settings);
      }
    };

    fetchSettings();
  }, [showError]);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const [lowStock, recent] = await Promise.all([
          dashboardService.getLowStock({ limit: 10 }),
          dashboardService.getRecentSales({ limit: 10 }),
        ]);
        setLowStockItems(lowStock);
        setRecentSales(recent);
      } catch (error) {
        showError(formatApiError(error, 'Failed to load dashboard data'));
      }
    };

    if (!isAdmin) {
      fetchEmployeeData().finally(() => setLoading(false));
    }
  }, [isAdmin, showError]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsData, trend, top, lowStock, recent] = await Promise.all([
          dashboardService.getStats({
            period: 'custom',
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          }),
          dashboardService.getSalesTrend({ days: 30 }),
          dashboardService.getTopProducts({ period: '30days', limit: 5 }),
          dashboardService.getLowStock({ limit: 5 }),
          dashboardService.getRecentSales({ limit: 10 }),
        ]);
        setStats(statsData);
        setSalesTrend(trend);
        setTopProducts(top);
        setLowStockItems(lowStock);
        setRecentSales(recent);
      } catch (error) {
        showError(formatApiError(error, 'Failed to load dashboard data'));
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, dateRange, showError]);

  const salesTrendChart = useMemo(() => {
    return salesTrend.map((entry) => ({
      ...entry,
      date: dayjs(entry.date).format('MMM D'),
    }));
  }, [salesTrend]);

  const currencySymbol = settings?.currency || '₹';

  const lowStockCount = stats?.lowStockCount ?? lowStockItems.length;
  const totalSkus = stats?.totalSkus ?? 0;

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your textile shop performance"
        action={isAdmin ? <DateRangePicker value={dateRange} onChange={setDateRange} /> : undefined}
      />

      {isAdmin && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Total Sales"
                value={formatCurrency(stats?.totalSales || 0, currencySymbol)}
                subtitle={`${stats?.totalTransactions || 0} transactions`}
                icon={<ShoppingCartIcon />}
                color="primary"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Total Profit"
                value={formatCurrency(stats?.totalProfit || 0, currencySymbol)}
                subtitle="Net profit"
                icon={<TrendingUpIcon />}
                color="success"
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Low Stock Items"
                value={lowStockCount}
                subtitle={`Threshold: ${settings?.lowStockThreshold ?? 0}`}
                icon={<WarningAmberIcon />}
                color={lowStockCount > 0 ? 'warning' : 'success'}
                loading={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Total SKUs"
                value={totalSkus}
                subtitle="Active variants"
                icon={<InventoryIcon />}
                color="info"
                loading={loading}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Sales Trend (Last 30 Days)
                  </Typography>
                  <Box sx={{ height: 300, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesTrendChart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => formatCurrency(Number(value), currencySymbol)}
                        />
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value), currencySymbol)}
                          contentStyle={{ borderRadius: 8 }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="sales"
                          name="Sales"
                          stroke="#1976d2"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="profit"
                          name="Profit"
                          stroke="#2e7d32"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Top Selling Products
                  </Typography>
                  <Box sx={{ height: 300, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProducts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) => formatCurrency(Number(value), currencySymbol)}
                        />
                        <YAxis
                          type="category"
                          dataKey="productName"
                          tick={{ fontSize: 11 }}
                          width={100}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value), currencySymbol)}
                          contentStyle={{ borderRadius: 8 }}
                        />
                        <Bar dataKey="revenue" fill="#1976d2" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Low Stock Alert
                </Typography>
                <Chip
                  label={`${lowStockItems.length} items`}
                  color={lowStockItems.length > 0 ? 'warning' : 'success'}
                  size="small"
                />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Size/Color</TableCell>
                      <TableCell align="right">Stock</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lowStockItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No low stock items
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      lowStockItems.map((variant) => (
                        <TableRow key={variant.variantId}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {variant.productName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {variant.sku}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {variant.size} / {variant.color}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={variant.stockQty}
                              color={variant.stockQty === 0 ? 'error' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Recent Sales
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Bill No</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Payment</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <Link
                            component={RouterLink}
                            to={`/sales/${sale.id}`}
                            underline="always"
                            color="primary"
                            sx={{ fontWeight: 600, fontSize: '0.875rem' }}
                          >
                            {sale.billNo}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {dayjs(sale.soldAt).format('MMM D, HH:mm')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={sale.paymentMode} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            color={sale.status === 'VOIDED' ? 'error' : 'inherit'}
                            sx={{ textDecoration: sale.status === 'VOIDED' ? 'line-through' : 'none' }}
                          >
                            <Money value={sale.total} symbol={currencySymbol} />
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    {recentSales.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No recent sales
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
