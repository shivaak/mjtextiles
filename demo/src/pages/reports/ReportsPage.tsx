// Reports page - analytics and reporting (Admin only)

import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';

import { PageHeader, Money, DateRangePicker } from '../../components/common';
import {
  getAllSales,
  getAllSaleItems,
  getAllVariantsWithProducts,
  getAllUsers,
  getSettings,
} from '../../data/repositories';
import type { DateRange } from '../../domain/types';
import { formatCurrency, calculateSaleProfit, calculateStockValue } from '../../domain/calculations';

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f', '#0288d1'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

export default function ReportsPage() {
  const settings = getSettings();
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });

  // Raw data
  const allSales = getAllSales();
  const allSaleItems = getAllSaleItems();
  const variants = getAllVariantsWithProducts();
  const users = getAllUsers();

  // Filtered sales
  const filteredSales = useMemo(() => {
    return allSales.filter(s => {
      const saleDate = dayjs(s.soldAt).format('YYYY-MM-DD');
      return saleDate >= dateRange.startDate && saleDate <= dateRange.endDate && s.status === 'COMPLETED';
    });
  }, [allSales, dateRange]);

  // Sales Summary Report
  const salesSummary = useMemo(() => {
    const dailyData: Record<string, { date: string; sales: number; profit: number; transactions: number }> = {};
    
    filteredSales.forEach(sale => {
      const date = dayjs(sale.soldAt).format('YYYY-MM-DD');
      if (!dailyData[date]) {
        dailyData[date] = { date, sales: 0, profit: 0, transactions: 0 };
      }
      dailyData[date].sales += sale.total;
      dailyData[date].transactions += 1;
      
      const saleItems = allSaleItems.filter(si => si.saleId === sale.id);
      dailyData[date].profit += calculateSaleProfit(saleItems);
    });

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSales, allSaleItems]);

  // Product Performance Report
  const productPerformance = useMemo(() => {
    const productData: Record<string, {
      productName: string;
      category: string;
      qtySold: number;
      revenue: number;
      profit: number;
      margin: number;
    }> = {};

    filteredSales.forEach(sale => {
      const saleItems = allSaleItems.filter(si => si.saleId === sale.id);
      saleItems.forEach(item => {
        const variant = variants.find(v => v.id === item.variantId);
        if (variant) {
          const key = variant.productName;
          if (!productData[key]) {
            productData[key] = {
              productName: variant.productName,
              category: variant.productCategory,
              qtySold: 0,
              revenue: 0,
              profit: 0,
              margin: 0,
            };
          }
          productData[key].qtySold += item.qty;
          productData[key].revenue += item.qty * item.unitPrice;
          productData[key].profit += (item.unitPrice - item.unitCostAtSale) * item.qty;
        }
      });
    });

    return Object.values(productData)
      .map(p => ({ ...p, margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, allSaleItems, variants]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const catData: Record<string, { category: string; revenue: number; profit: number }> = {};
    
    productPerformance.forEach(p => {
      if (!catData[p.category]) {
        catData[p.category] = { category: p.category, revenue: 0, profit: 0 };
      }
      catData[p.category].revenue += p.revenue;
      catData[p.category].profit += p.profit;
    });

    return Object.values(catData).sort((a, b) => b.revenue - a.revenue);
  }, [productPerformance]);

  // Cashier performance
  const cashierPerformance = useMemo(() => {
    const cashierData: Record<string, { name: string; sales: number; transactions: number; avgTicket: number }> = {};
    
    filteredSales.forEach(sale => {
      const user = users.find(u => u.id === sale.createdBy);
      const name = user?.fullName || 'Unknown';
      if (!cashierData[name]) {
        cashierData[name] = { name, sales: 0, transactions: 0, avgTicket: 0 };
      }
      cashierData[name].sales += sale.total;
      cashierData[name].transactions += 1;
    });

    return Object.values(cashierData)
      .map(c => ({ ...c, avgTicket: c.transactions > 0 ? c.sales / c.transactions : 0 }))
      .sort((a, b) => b.sales - a.sales);
  }, [filteredSales, users]);

  // Inventory Valuation
  const inventoryValuation = useMemo(() => {
    const catValuation: Record<string, { category: string; stockValue: number; itemCount: number; skuCount: number }> = {};
    
    variants.filter(v => v.status === 'ACTIVE').forEach(v => {
      const cat = v.productCategory;
      if (!catValuation[cat]) {
        catValuation[cat] = { category: cat, stockValue: 0, itemCount: 0, skuCount: 0 };
      }
      catValuation[cat].stockValue += calculateStockValue(v);
      catValuation[cat].itemCount += v.stockQty;
      catValuation[cat].skuCount += 1;
    });

    return Object.values(catValuation).sort((a, b) => b.stockValue - a.stockValue);
  }, [variants]);

  // Low stock report
  const lowStockReport = useMemo(() => {
    return variants
      .filter(v => v.status === 'ACTIVE' && v.stockQty <= settings.lowStockThreshold)
      .sort((a, b) => a.stockQty - b.stockQty);
  }, [variants, settings.lowStockThreshold]);

  // Totals
  const totals = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, s) => sum + s.total, 0);
    let totalProfit = 0;
    filteredSales.forEach(sale => {
      const items = allSaleItems.filter(si => si.saleId === sale.id);
      totalProfit += calculateSaleProfit(items);
    });
    const totalInventoryValue = inventoryValuation.reduce((sum, c) => sum + c.stockValue, 0);
    
    return { totalSales, totalProfit, totalInventoryValue, transactionCount: filteredSales.length };
  }, [filteredSales, allSaleItems, inventoryValuation]);

  // Export to CSV
  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Custom tooltip formatter
  const tooltipFormatter = (value: unknown) => formatCurrency(Number(value), '₹');

  return (
    <Box>
      <PageHeader
        title="Reports"
        subtitle="Analytics and business intelligence"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports' },
        ]}
        action={
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        }
      />

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Total Sales</Typography>
              <Typography variant="h5" fontWeight={600}>
                <Money value={totals.totalSales} />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Total Profit</Typography>
              <Typography variant="h5" fontWeight={600} color="success.main">
                <Money value={totals.totalProfit} />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Profit Margin</Typography>
              <Typography variant="h5" fontWeight={600}>
                {totals.totalSales > 0 ? ((totals.totalProfit / totals.totalSales) * 100).toFixed(1) : 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Inventory Value</Typography>
              <Typography variant="h5" fontWeight={600}>
                <Money value={totals.totalInventoryValue} />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Sales Summary" />
          <Tab label="Product Performance" />
          <Tab label="Profit Analysis" />
          <Tab label="Inventory Valuation" />
          <Tab label="Low Stock" />
        </Tabs>

        {/* Sales Summary */}
        <TabPanel value={activeTab} index={0}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => exportToCSV(salesSummary, 'sales_summary')}
              >
                Export CSV
              </Button>
            </Box>

            <Box sx={{ height: 300, mb: 4 }}>
              <ResponsiveContainer>
                <LineChart data={salesSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => dayjs(v).format('MMM D')} />
                  <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={tooltipFormatter} />
                  <Legend />
                  <Line type="monotone" dataKey="sales" name="Sales" stroke="#1976d2" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" name="Profit" stroke="#2e7d32" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Transactions</TableCell>
                    <TableCell align="right">Sales</TableCell>
                    <TableCell align="right">Profit</TableCell>
                    <TableCell align="right">Margin</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salesSummary.slice(-15).reverse().map((row) => (
                    <TableRow key={row.date}>
                      <TableCell>{dayjs(row.date).format('MMM D, YYYY')}</TableCell>
                      <TableCell align="right">{row.transactions}</TableCell>
                      <TableCell align="right"><Money value={row.sales} /></TableCell>
                      <TableCell align="right">
                        <Typography color="success.main"><Money value={row.profit} /></Typography>
                      </TableCell>
                      <TableCell align="right">
                        {row.sales > 0 ? ((row.profit / row.sales) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>

        {/* Product Performance */}
        <TabPanel value={activeTab} index={1}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => exportToCSV(productPerformance, 'product_performance')}
              >
                Export CSV
              </Button>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="subtitle2" gutterBottom>Top Products by Revenue</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={productPerformance.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="productName" width={150} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={tooltipFormatter} />
                      <Bar dataKey="revenue" fill="#1976d2" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2" gutterBottom>Sales by Category</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="revenue"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name }) => name}
                      >
                        {categoryBreakdown.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={tooltipFormatter} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>

            <TableContainer sx={{ mt: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Qty Sold</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Profit</TableCell>
                    <TableCell align="right">Margin</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productPerformance.slice(0, 20).map((row) => (
                    <TableRow key={row.productName}>
                      <TableCell>{row.productName}</TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell align="right">{row.qtySold}</TableCell>
                      <TableCell align="right"><Money value={row.revenue} /></TableCell>
                      <TableCell align="right">
                        <Typography color="success.main"><Money value={row.profit} /></Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${row.margin.toFixed(1)}%`}
                          size="small"
                          color={row.margin >= 25 ? 'success' : row.margin >= 15 ? 'warning' : 'error'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>

        {/* Profit Analysis */}
        <TabPanel value={activeTab} index={2}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>Profit by Category</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={categoryBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={tooltipFormatter} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#1976d2" />
                      <Bar dataKey="profit" name="Profit" fill="#2e7d32" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>Sales by Cashier</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Cashier</TableCell>
                        <TableCell align="right">Sales</TableCell>
                        <TableCell align="right">Transactions</TableCell>
                        <TableCell align="right">Avg Ticket</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cashierPerformance.map((row) => (
                        <TableRow key={row.name}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell align="right"><Money value={row.sales} /></TableCell>
                          <TableCell align="right">{row.transactions}</TableCell>
                          <TableCell align="right"><Money value={row.avgTicket} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* Inventory Valuation */}
        <TabPanel value={activeTab} index={3}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => exportToCSV(inventoryValuation, 'inventory_valuation')}
              >
                Export CSV
              </Button>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={inventoryValuation}
                        dataKey="stockValue"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      >
                        {inventoryValuation.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={tooltipFormatter} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">SKUs</TableCell>
                        <TableCell align="right">Items</TableCell>
                        <TableCell align="right">Stock Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventoryValuation.map((row) => (
                        <TableRow key={row.category}>
                          <TableCell>{row.category}</TableCell>
                          <TableCell align="right">{row.skuCount}</TableCell>
                          <TableCell align="right">{row.itemCount}</TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={500}><Money value={row.stockValue} /></Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell><strong>Total</strong></TableCell>
                        <TableCell align="right">
                          <strong>{inventoryValuation.reduce((s, r) => s + r.skuCount, 0)}</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>{inventoryValuation.reduce((s, r) => s + r.itemCount, 0)}</strong>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600}>
                            <Money value={totals.totalInventoryValue} />
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* Low Stock Report */}
        <TabPanel value={activeTab} index={4}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography color="text.secondary">
                {lowStockReport.length} items need reordering (threshold: {settings.lowStockThreshold})
              </Typography>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => exportToCSV(lowStockReport.map(v => ({
                  barcode: v.barcode,
                  sku: v.sku,
                  product: v.productName,
                  size: v.size,
                  color: v.color,
                  stock: v.stockQty,
                  reorderQty: Math.max(0, settings.lowStockThreshold * 2 - v.stockQty),
                })), 'low_stock_report')}
              >
                Export CSV
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Barcode</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Size/Color</TableCell>
                    <TableCell align="center">Current Stock</TableCell>
                    <TableCell align="center">Suggested Reorder</TableCell>
                    <TableCell align="right">Est. Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStockReport.map((variant) => {
                    const reorderQty = Math.max(0, settings.lowStockThreshold * 2 - variant.stockQty);
                    return (
                      <TableRow key={variant.id}>
                        <TableCell>{variant.barcode}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{variant.productName}</Typography>
                          <Typography variant="caption" color="text.secondary">{variant.productBrand}</Typography>
                        </TableCell>
                        <TableCell>{variant.size} / {variant.color}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={variant.stockQty}
                            size="small"
                            color={variant.stockQty === 0 ? 'error' : 'warning'}
                          />
                        </TableCell>
                        <TableCell align="center">{reorderQty}</TableCell>
                        <TableCell align="right">
                          <Money value={reorderQty * variant.avgCost} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>
      </Card>
    </Box>
  );
}
