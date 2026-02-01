// Sales page - sales history and management

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  Grid,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import dayjs from 'dayjs';

import { PageHeader, Money, DateRangePicker } from '../../components/common';
import {
  getAllSalesWithItems,
  getAllUsers,
} from '../../data/repositories';
import type { SaleWithItems, DateRange } from '../../domain/types';
import { useAuth } from '../../app/context/AuthContext';

export default function SalesPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const users = getAllUsers();

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [cashierFilter, setCashierFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Data
  const sales = getAllSalesWithItems();

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const saleDate = dayjs(s.soldAt).format('YYYY-MM-DD');
      const inDateRange = saleDate >= dateRange.startDate && saleDate <= dateRange.endDate;
      const matchesSearch = !searchQuery ||
        s.billNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customerPhone?.includes(searchQuery);
      const matchesPayment = !paymentFilter || s.paymentMode === paymentFilter;
      const matchesCashier = !cashierFilter || s.createdBy === cashierFilter;
      const matchesStatus = !statusFilter || s.status === statusFilter;
      
      return inDateRange && matchesSearch && matchesPayment && matchesCashier && matchesStatus;
    }).sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());
  }, [sales, dateRange, searchQuery, paymentFilter, cashierFilter, statusFilter]);

  // Summary stats
  const stats = useMemo(() => {
    const completed = filteredSales.filter(s => s.status === 'COMPLETED');
    const totalSales = completed.reduce((sum, s) => sum + s.total, 0);
    const totalProfit = completed.reduce((sum, s) => sum + (s.profit || 0), 0);
    const totalTransactions = completed.length;
    const voidedCount = filteredSales.filter(s => s.status === 'VOIDED').length;
    return { totalSales, totalProfit, totalTransactions, voidedCount };
  }, [filteredSales]);

  // Get user name
  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user?.fullName || '-';
  };

  // Columns - using flex for better spacing
  const columns: GridColDef[] = [
    {
      field: 'billNo',
      headerName: 'Bill No',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams<SaleWithItems>) => (
        <Typography
          variant="body2"
          fontWeight={500}
          sx={{
            textDecoration: params.row.status === 'VOIDED' ? 'line-through' : 'none',
            color: params.row.status === 'VOIDED' ? 'text.secondary' : 'inherit',
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'soldAt',
      headerName: 'Date & Time',
      flex: 1,
      minWidth: 150,
      valueFormatter: (value) => dayjs(value).format('MMM D, YYYY HH:mm'),
    },
    {
      field: 'customerName',
      headerName: 'Customer',
      flex: 1,
      minWidth: 130,
      valueGetter: (value) => value || '-',
    },
    {
      field: 'itemCount',
      headerName: 'Items',
      flex: 0.5,
      minWidth: 70,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (_value: unknown, row: SaleWithItems) => row.items?.length || 0,
    },
    {
      field: 'paymentMode',
      headerName: 'Payment',
      flex: 0.7,
      minWidth: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    {
      field: 'subtotal',
      headerName: 'Subtotal',
      flex: 0.8,
      minWidth: 100,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => <Money value={params.value as number} />,
    },
    {
      field: 'discountAmount',
      headerName: 'Discount',
      flex: 0.7,
      minWidth: 90,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => (
        (params.value as number) > 0 ? <Money value={-(params.value as number)} /> : <Typography>-</Typography>
      ),
    },
    {
      field: 'total',
      headerName: 'Total',
      flex: 0.8,
      minWidth: 110,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<SaleWithItems>) => (
        <Typography
          fontWeight={600}
          sx={{
            textDecoration: params.row.status === 'VOIDED' ? 'line-through' : 'none',
          }}
        >
          <Money value={params.value as number} />
        </Typography>
      ),
    },
    ...(isAdmin ? [{
      field: 'profit',
      headerName: 'Profit',
      flex: 0.7,
      minWidth: 100,
      align: 'right' as const,
      headerAlign: 'right' as const,
      renderCell: (params: GridRenderCellParams<SaleWithItems>) => (
        params.row.status === 'COMPLETED' ? (
          <Typography color="success.main" fontWeight={500}>
            <Money value={(params.value as number) || 0} />
          </Typography>
        ) : <Typography>-</Typography>
      ),
    }] : []),
    {
      field: 'createdBy',
      headerName: 'Cashier',
      flex: 0.8,
      minWidth: 120,
      valueGetter: (value) => getUserName(value as string),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'COMPLETED' ? 'success' : 'error'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 80,
      sortable: false,
      renderCell: (params: GridRenderCellParams<SaleWithItems>) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => navigate(`/sales/${params.row.id}`)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const employees = users.filter(u => u.role === 'EMPLOYEE');

  return (
    <Box>
      <PageHeader
        title="Sales"
        subtitle="View and manage sales history"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales' },
        ]}
      />

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Total Sales</Typography>
              <Typography variant="h6" fontWeight={600}>
                <Money value={stats.totalSales} />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {isAdmin && (
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="caption" color="text.secondary">Total Profit</Typography>
                <Typography variant="h6" fontWeight={600} color="success.main">
                  <Money value={stats.totalProfit} />
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Transactions</Typography>
              <Typography variant="h6" fontWeight={600}>{stats.totalTransactions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Voided</Typography>
              <Typography variant="h6" fontWeight={600} color={stats.voidedCount > 0 ? 'error.main' : 'inherit'}>
                {stats.voidedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                placeholder="Search by bill no, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment</InputLabel>
                <Select
                  value={paymentFilter}
                  label="Payment"
                  onChange={(e) => setPaymentFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="CARD">Card</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="CREDIT">Credit</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Cashier</InputLabel>
                <Select
                  value={cashierFilter}
                  label="Cashier"
                  onChange={(e) => setCashierFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {employees.map(emp => (
                    <MenuItem key={emp.id} value={emp.id}>{emp.fullName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="VOIDED">Voided</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card>
        <DataGrid
          rows={filteredSales}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
          sx={{ border: 0, minHeight: 500 }}
        />
      </Card>
    </Box>
  );
}
