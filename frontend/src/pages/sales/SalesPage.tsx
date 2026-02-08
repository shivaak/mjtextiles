import { useState, useMemo, useEffect, useCallback } from 'react';
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

import PageHeader from '../../components/common/PageHeader';
import Money from '../../components/common/Money';
import DateRangePicker from '../../components/common/DateRangePicker';
import { useAuth } from '../../app/context/AuthContext';
import { useNotification } from '../../app/context/NotificationContext';
import { saleService } from '../../services/saleService';
import { userService } from '../../services/userService';
import { formatApiError } from '../../services/api';
import { lookupService } from '../../services/lookupService';
import type { SaleList, DateRange, UserLookup } from '../../domain/types';

export default function SalesPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { error: showError } = useNotification();

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [cashierFilter, setCashierFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sales, setSales] = useState<SaleList[]>([]);
  const [cashiers, setCashiers] = useState<UserLookup[]>([]);
  const [paymentModes, setPaymentModes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCashiers = useCallback(async () => {
    try {
      const [users, lookups] = await Promise.all([
        userService.getUsersLookup({ role: 'ADMIN,EMPLOYEE' }),
        lookupService.getLookups(),
      ]);
      setCashiers(users);
      setPaymentModes(lookups.paymentModes || []);
    } catch (error) {
      showError(formatApiError(error, 'Failed to load cashiers'));
    }
  }, [showError]);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const response = await saleService.getSales({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        paymentMode: paymentFilter || undefined,
        status: statusFilter || undefined,
        createdBy: cashierFilter ? Number(cashierFilter) : undefined,
        search: searchQuery || undefined,
        page: 0,
        size: 1000,
      });
      setSales(response.content);
    } catch (error) {
      showError(formatApiError(error, 'Failed to load sales'));
    } finally {
      setLoading(false);
    }
  }, [dateRange, paymentFilter, statusFilter, cashierFilter, searchQuery, showError]);

  useEffect(() => {
    fetchCashiers();
  }, [fetchCashiers]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const stats = useMemo(() => {
    const completed = sales.filter((sale) => sale.status === 'COMPLETED');
    const totalSales = completed.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = completed.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    const totalTransactions = completed.length;
    const voidedCount = sales.filter((sale) => sale.status === 'VOIDED').length;
    return { totalSales, totalProfit, totalTransactions, voidedCount };
  }, [sales]);

  const columns: GridColDef[] = [
    {
      field: 'billNo',
      headerName: 'Bill No',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams<SaleList>) => (
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
      valueGetter: (_value: unknown, row: SaleList) => row.itemCount || 0,
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
      headerName: 'Addl. Disc',
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
      renderCell: (params: GridRenderCellParams<SaleList>) => (
        <Typography
          fontWeight={600}
          sx={{ textDecoration: params.row.status === 'VOIDED' ? 'line-through' : 'none' }}
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
      renderCell: (params: GridRenderCellParams<SaleList>) => (
        params.row.status === 'COMPLETED' ? (
          <Typography color="success.main" fontWeight={500}>
            <Money value={(params.value as number) || 0} />
          </Typography>
        ) : <Typography>-</Typography>
      ),
    }] : []),
    {
      field: 'createdByName',
      headerName: 'Cashier',
      flex: 0.8,
      minWidth: 120,
      valueGetter: (value) => value || '-',
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
      renderCell: (params: GridRenderCellParams<SaleList>) => (
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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                placeholder="Search by bill no, customer..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
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
                  onChange={(event) => setPaymentFilter(event.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {paymentModes.map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {mode}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Cashier</InputLabel>
                <Select
                  value={cashierFilter}
                  label="Cashier"
                  onChange={(event) => setCashierFilter(event.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {cashiers.map((cashier) => (
                    <MenuItem key={cashier.id} value={cashier.id}>
                      {cashier.fullName}
                      {!cashier.isActive ? ' (Inactive)' : ''}
                    </MenuItem>
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
                  onChange={(event) => setStatusFilter(event.target.value)}
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

      <Card>
        <DataGrid
          rows={sales}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
          loading={loading}
          sx={{ border: 0, minHeight: 500 }}
        />
      </Card>
    </Box>
  );
}
