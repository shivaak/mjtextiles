import { useEffect, useMemo, useState } from 'react';
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
  Tooltip as MuiTooltip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
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

import PageHeader from '../../components/common/PageHeader';
import Money from '../../components/common/Money';
import DateRangePicker from '../../components/common/DateRangePicker';
import { useNotification } from '../../app/context/NotificationContext';
import { reportService } from '../../services/reportService';
import { settingsService } from '../../services/settingsService';
import { formatApiError } from '../../services/api';
import type {
  DateRange,
  InventoryValuationReport,
  LowStockReport,
  ProductPerformanceReport,
  ProfitReport,
  SalesSummaryReport,
  Settings,
} from '../../domain/types';
import { formatCurrency } from '../../utils/calculations';

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
  const { error: showError } = useNotification();

  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<Settings | null>(null);
  const [salesSummary, setSalesSummary] = useState<SalesSummaryReport | null>(null);
  const [productPerformance, setProductPerformance] = useState<ProductPerformanceReport | null>(null);
  const [profitReport, setProfitReport] = useState<ProfitReport | null>(null);
  const [inventoryValuation, setInventoryValuation] = useState<InventoryValuationReport | null>(null);
  const [lowStockReport, setLowStockReport] = useState<LowStockReport | null>(null);

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
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [summary, performance, profit, valuation, lowStock] = await Promise.all([
          reportService.getSalesSummary({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            groupBy: 'day',
          }),
          reportService.getProductPerformance({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            sortBy: 'revenue',
            order: 'desc',
            limit: 50,
          }),
          reportService.getProfit({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            groupBy: 'day',
          }),
          reportService.getInventoryValuation(),
          reportService.getLowStock({ includeOutOfStock: true }),
        ]);
        setSalesSummary(summary);
        setProductPerformance(performance);
        setProfitReport(profit);
        setInventoryValuation(valuation);
        setLowStockReport(lowStock);
      } catch (error) {
        showError(formatApiError(error, 'Failed to load reports'));
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [dateRange, showError]);

  const currencySymbol = settings?.currency || '₹';

  const salesSummaryRows = salesSummary?.breakdown || [];
  const salesSummaryChart = useMemo(() => {
    return salesSummaryRows.map((row) => ({
      ...row,
      date: row.period,
    }));
  }, [salesSummaryRows]);

  const topSellers = productPerformance?.topSellers || [];
  const categoryBreakdown = productPerformance?.categoryBreakdown || [];

  const profitByCategory = profitReport?.byCategory || [];
  const cashierPerformance = profitReport?.byCashier || [];

  const inventoryByCategory = inventoryValuation?.byCategory || [];
  const inventorySummary = inventoryValuation?.summary;

  const lowStockItems = lowStockReport?.items || [];

  const totals = useMemo(() => {
    const totalSales = salesSummary?.summary?.totalSales ?? 0;
    const totalProfit = profitReport?.summary?.grossProfit ?? 0;
    const profitMargin = profitReport?.summary?.profitMargin ?? (totalSales > 0 ? (totalProfit / totalSales) * 100 : 0);
    const inventoryValue = inventorySummary?.totalCostValue ?? 0;

    return { totalSales, totalProfit, profitMargin, inventoryValue };
  }, [salesSummary, profitReport, inventorySummary]);

  const tooltipFormatter = (value: unknown) => formatCurrency(Number(value), currencySymbol);

  const downloadReport = async (reportType: 'sales-summary' | 'product-performance' | 'profit' | 'inventory-valuation' | 'low-stock') => {
    try {
      const blob = await reportService.exportReport({
        reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy: 'day',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report-${dayjs().format('YYYY-MM-DD')}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showError(formatApiError(error, 'Failed to export report'));
    }
  };

  return (
    <Box>
      <PageHeader
        title="Reports"
        subtitle="Analytics and business intelligence"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports' },
        ]}
        action={<DateRangePicker value={dateRange} onChange={setDateRange} />}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Total Sales</Typography>
              <Typography variant="h5" fontWeight={600}>
                <Money value={totals.totalSales} symbol={currencySymbol} />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Total Profit</Typography>
              <Typography variant="h5" fontWeight={600} color="success.main">
                <Money value={totals.totalProfit} symbol={currencySymbol} />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Profit Margin</Typography>
              <Typography variant="h5" fontWeight={600}>
                {totals.profitMargin.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Inventory Value</Typography>
              <Typography variant="h5" fontWeight={600}>
                <Money value={totals.inventoryValue} symbol={currencySymbol} />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

        <TabPanel value={activeTab} index={0}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button startIcon={<DownloadIcon />} onClick={() => downloadReport('sales-summary')}>
                Export CSV
              </Button>
            </Box>

            <Box sx={{ height: 300, mb: 4 }}>
              <ResponsiveContainer>
                <LineChart data={salesSummaryChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => dayjs(value).format('MMM D')}
                  />
                  <YAxis tickFormatter={(value) => formatCurrency(Number(value), currencySymbol)} />
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
                    <TableCell align="right">Avg Order</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salesSummaryRows.slice(-15).reverse().map((row) => (
                    <TableRow key={row.period}>
                      <TableCell>{dayjs(row.period).format('MMM D, YYYY')}</TableCell>
                      <TableCell align="right">{row.transactions}</TableCell>
                      <TableCell align="right"><Money value={row.sales} symbol={currencySymbol} /></TableCell>
                      <TableCell align="right">
                        <Typography color="success.main">
                          <Money value={row.profit} symbol={currencySymbol} />
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Money value={row.avgOrderValue} symbol={currencySymbol} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && salesSummaryRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No sales in the selected range
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button startIcon={<DownloadIcon />} onClick={() => downloadReport('product-performance')}>
                Export CSV
              </Button>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="subtitle2" gutterBottom>Top Products by Revenue</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={topSellers.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => formatCurrency(Number(value), currencySymbol)} />
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
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        Markup
                        <HelpOutlineIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topSellers.slice(0, 20).map((row) => {
                    const markup = row.markupPercent ?? (row.cost > 0 ? (row.profit / row.cost) * 100 : 0);
                    return (
                      <TableRow key={row.variantId}>
                        <TableCell>{row.productName}</TableCell>
                        <TableCell>{row.category || '-'}</TableCell>
                        <TableCell align="right">{row.qtySold}</TableCell>
                        <TableCell align="right"><Money value={row.revenue} symbol={currencySymbol} /></TableCell>
                        <TableCell align="right">
                          <Typography color="success.main">
                            <Money value={row.profit} symbol={currencySymbol} />
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <MuiTooltip
                            title={
                              <Box sx={{ p: 0.5 }}>
                                <Typography variant="caption" fontWeight={600} display="block" gutterBottom>
                                  How is Markup calculated?
                                </Typography>
                                <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                                  Markup % = ((Price − Cost) / Cost) × 100
                                </Typography>
                                <Typography variant="caption" fontWeight={600} display="block" gutterBottom>
                                  Example:
                                </Typography>
                                <Typography variant="caption" display="block">Selling Price: ₹150</Typography>
                                <Typography variant="caption" display="block">Cost: ₹100</Typography>
                                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                  Markup = (150 − 100) / 100 × 100 = 50%
                                </Typography>
                              </Box>
                            }
                            arrow
                            placement="left"
                          >
                            <Chip
                              label={`${markup.toFixed(1)}%`}
                              size="small"
                              color={markup >= 25 ? 'success' : markup >= 15 ? 'warning' : 'error'}
                              sx={{ cursor: 'help' }}
                            />
                          </MuiTooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!loading && topSellers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No product performance data
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button startIcon={<DownloadIcon />} onClick={() => downloadReport('profit')}>
                Export CSV
              </Button>
            </Box>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>Profit by Category</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={profitByCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(value) => formatCurrency(Number(value), currencySymbol)} />
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
                        <TableCell align="right">Revenue</TableCell>
                        <TableCell align="right">Profit</TableCell>
                        <TableCell align="right">Transactions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cashierPerformance.map((row) => (
                        <TableRow key={row.userId}>
                          <TableCell>{row.userName}</TableCell>
                          <TableCell align="right"><Money value={row.revenue} symbol={currencySymbol} /></TableCell>
                          <TableCell align="right">
                            <Typography color="success.main">
                              <Money value={row.profit} symbol={currencySymbol} />
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{row.transactions}</TableCell>
                        </TableRow>
                      ))}
                      {!loading && cashierPerformance.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No cashier performance data
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button startIcon={<DownloadIcon />} onClick={() => downloadReport('inventory-valuation')}>
                Export CSV
              </Button>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={inventoryByCategory}
                        dataKey="costValue"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      >
                        {inventoryByCategory.map((_, index) => (
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
                      {inventoryByCategory.map((row) => (
                        <TableRow key={row.category}>
                          <TableCell>{row.category}</TableCell>
                          <TableCell align="right">{row.skuCount}</TableCell>
                          <TableCell align="right">{row.itemCount}</TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={500}>
                              <Money value={row.costValue} symbol={currencySymbol} />
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      {inventorySummary && (
                        <TableRow>
                          <TableCell><strong>Total</strong></TableCell>
                          <TableCell align="right"><strong>{inventorySummary.totalSkus}</strong></TableCell>
                          <TableCell align="right"><strong>{inventorySummary.totalItems}</strong></TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={600}>
                              <Money value={inventorySummary.totalCostValue} symbol={currencySymbol} />
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography color="text.secondary">
                {lowStockReport?.summary?.lowStockCount ?? 0} items need reordering
              </Typography>
              <Button startIcon={<DownloadIcon />} onClick={() => downloadReport('low-stock')}>
                Export CSV
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>SKU</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="center">Current Stock</TableCell>
                    <TableCell align="center">Suggested Reorder</TableCell>
                    <TableCell align="right">Est. Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow key={item.variantId}>
                      <TableCell>{item.sku || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{item.productName}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.brand || '-'}</Typography>
                      </TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.currentStock}
                          size="small"
                          color={item.currentStock === 0 ? 'error' : 'warning'}
                        />
                      </TableCell>
                      <TableCell align="center">{item.suggestedReorder}</TableCell>
                      <TableCell align="right">
                        <Money value={item.reorderCost || 0} symbol={currencySymbol} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && lowStockItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No low stock items
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>
      </Card>
    </Box>
  );
}
