// Dashboard page with KPIs, charts, and recent data

import { useState, useEffect, useMemo } from 'react';
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

import { PageHeader, StatCard, DateRangePicker, Money } from '../../components/common';
import { useAuth } from '../../app/context/AuthContext';
import {
  getAllVariantsWithProducts,
  getSettings,
  getAllSales,
  getAllSaleItems,
} from '../../data/repositories';
import type { DateRange } from '../../domain/types';
import { formatCurrency, calculateSaleProfit } from '../../domain/calculations';

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });
  const [loading, setLoading] = useState(true);

  const settings = getSettings();

  // Fetch and compute data
  const data = useMemo(() => {
    const allSales = getAllSales();
    const allSaleItems = getAllSaleItems();
    const variants = getAllVariantsWithProducts();
    
    const today = dayjs().format('YYYY-MM-DD');
    const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD');

    // Filter completed sales
    const completedSales = allSales.filter(s => s.status === 'COMPLETED');

    // Today's sales
    const todaySales = completedSales.filter(s => 
      dayjs(s.soldAt).format('YYYY-MM-DD') === today
    );
    const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);
    
    // Calculate today's profit
    let todayProfit = 0;
    todaySales.forEach(sale => {
      const saleItems = allSaleItems.filter(item => item.saleId === sale.id);
      todayProfit += calculateSaleProfit(saleItems);
    });

    // Monthly sales
    const monthlySales = completedSales.filter(s =>
      dayjs(s.soldAt).format('YYYY-MM-DD') >= startOfMonth
    );
    const monthlyTotal = monthlySales.reduce((sum, s) => sum + s.total, 0);

    // Calculate monthly profit
    let monthlyProfit = 0;
    monthlySales.forEach(sale => {
      const saleItems = allSaleItems.filter(item => item.saleId === sale.id);
      monthlyProfit += calculateSaleProfit(saleItems);
    });

    // Low stock count
    const lowStockVariants = variants.filter(
      v => v.status === 'ACTIVE' && v.stockQty <= settings.lowStockThreshold
    );

    // Total SKUs
    const totalSkus = variants.filter(v => v.status === 'ACTIVE').length;

    // Sales trend for chart (last 30 days)
    const salesTrend: { date: string; sales: number; profit: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const daySales = completedSales.filter(s => 
        dayjs(s.soldAt).format('YYYY-MM-DD') === date
      );
      const dayTotal = daySales.reduce((sum, s) => sum + s.total, 0);
      
      let dayProfit = 0;
      daySales.forEach(sale => {
        const saleItems = allSaleItems.filter(item => item.saleId === sale.id);
        dayProfit += calculateSaleProfit(saleItems);
      });

      salesTrend.push({
        date: dayjs(date).format('MMM D'),
        sales: dayTotal,
        profit: dayProfit,
      });
    }

    // Top selling products
    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    completedSales
      .filter(s => dayjs(s.soldAt).format('YYYY-MM-DD') >= dateRange.startDate)
      .forEach(sale => {
        const saleItems = allSaleItems.filter(item => item.saleId === sale.id);
        saleItems.forEach(item => {
          const variant = variants.find(v => v.id === item.variantId);
          if (variant) {
            const key = variant.productName;
            if (!productSales[key]) {
              productSales[key] = { name: key, qty: 0, revenue: 0 };
            }
            productSales[key].qty += item.qty;
            productSales[key].revenue += item.qty * item.unitPrice;
          }
        });
      });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Recent sales
    const recentSales = allSales
      .sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime())
      .slice(0, 10);

    return {
      todayTotal,
      todayProfit,
      todayTransactions: todaySales.length,
      monthlyTotal,
      monthlyProfit,
      lowStockCount: lowStockVariants.length,
      lowStockVariants: lowStockVariants.slice(0, 5),
      totalSkus,
      salesTrend,
      topProducts,
      recentSales,
    };
  }, [dateRange, settings.lowStockThreshold]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your textile shop performance"
        action={
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        }
      />

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Today's Sales"
            value={formatCurrency(data.todayTotal, settings.currencySymbol)}
            subtitle={`${data.todayTransactions} transactions`}
            icon={<ShoppingCartIcon />}
            color="primary"
            loading={loading}
          />
        </Grid>
        {isAdmin && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Today's Profit"
              value={formatCurrency(data.todayProfit, settings.currencySymbol)}
              subtitle="Net profit"
              icon={<TrendingUpIcon />}
              color="success"
              loading={loading}
            />
          </Grid>
        )}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Low Stock Items"
            value={data.lowStockCount}
            subtitle={`Threshold: ${settings.lowStockThreshold}`}
            icon={<WarningAmberIcon />}
            color={data.lowStockCount > 0 ? 'warning' : 'success'}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Monthly Sales"
            value={formatCurrency(data.monthlyTotal, settings.currencySymbol)}
            subtitle="This month"
            icon={<AttachMoneyIcon />}
            color="info"
            loading={loading}
          />
        </Grid>
        {!isAdmin && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total SKUs"
              value={data.totalSkus}
              subtitle="Active variants"
              icon={<InventoryIcon />}
              color="primary"
              loading={loading}
            />
          </Grid>
        )}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Sales Trend (Last 30 Days)
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.salesTrend}>
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
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value), '₹')}
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
                    {isAdmin && (
                      <Line
                        type="monotone"
                        dataKey="profit"
                        name="Profit"
                        stroke="#2e7d32"
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
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
                  <BarChart data={data.topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis 
                      type="number"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      width={100}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value), '₹')}
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

      {/* Tables */}
      <Grid container spacing={3}>
        {/* Low Stock Items */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Low Stock Alert
                </Typography>
                <Chip 
                  label={`${data.lowStockCount} items`} 
                  color={data.lowStockCount > 0 ? 'warning' : 'success'} 
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
                    {data.lowStockVariants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No low stock items
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.lowStockVariants.map((variant) => (
                        <TableRow key={variant.id}>
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

        {/* Recent Sales */}
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
                    {data.recentSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {sale.billNo}
                          </Typography>
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
                            <Money value={sale.total} />
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
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
