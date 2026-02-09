import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';

import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../app/context/NotificationContext';
import { customerService } from '../../services/customerService';
import { formatApiError } from '../../services/api';
import type { Customer, CustomerPointsLog } from '../../domain/types';

const customerSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  name: z.string().min(1, 'Customer name is required'),
  area: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const { success: showSuccess, error: showError } = useNotification();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [pointsHistory, setPointsHistory] = useState<CustomerPointsLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      phone: '',
      name: '',
      area: '',
    },
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customerService.getCustomers({
        search: search || undefined,
      });
      setCustomers(data);
    } catch (error) {
      showError(formatApiError(error, 'Failed to load customers'));
    } finally {
      setLoading(false);
    }
  }, [search, showError]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openDialog = useCallback((selected?: Customer) => {
    if (selected) {
      setEditingCustomer(selected);
      form.reset({
        phone: selected.phone,
        name: selected.name,
        area: selected.area || '',
      });
    } else {
      setEditingCustomer(null);
      form.reset({
        phone: '',
        name: '',
        area: '',
      });
    }
    setDialogOpen(true);
  }, [form]);

  const openHistoryDialog = useCallback(async (customer: Customer) => {
    setSelectedCustomer(customer);
    setHistoryDialogOpen(true);
    setHistoryLoading(true);
    try {
      const history = await customerService.getPointsHistory(customer.id);
      setPointsHistory(history);
    } catch (error) {
      showError(formatApiError(error, 'Failed to load points history'));
    } finally {
      setHistoryLoading(false);
    }
  }, [showError]);

  const handleSaveCustomer = async (data: CustomerFormData) => {
    try {
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, {
          phone: data.phone,
          name: data.name,
          area: data.area || undefined,
        });
        showSuccess('Customer updated successfully');
      } else {
        await customerService.createCustomer({
          phone: data.phone,
          name: data.name,
          area: data.area || undefined,
        });
        showSuccess('Customer created successfully');
      }
      setDialogOpen(false);
      await fetchCustomers();
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to save customer'));
    }
  };

  const getPointsTypeColor = (type: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (type) {
      case 'EARNED': return 'success';
      case 'REDEEMED': return 'error';
      case 'VOID_REVERSAL': return 'warning';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
      renderCell: (params: GridRenderCellParams<Customer>) => (
        <Typography variant="body2" fontWeight={500}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'name',
      headerName: 'Customer Name',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'area',
      headerName: 'Area',
      width: 140,
      valueGetter: (value) => value || '-',
    },
    {
      field: 'loyaltyPoints',
      headerName: 'Points Balance',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ?? 0}
          size="small"
          color={params.value > 0 ? 'primary' : 'default'}
          variant={params.value > 0 ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      field: 'totalPointsEarned',
      headerName: 'Total Earned',
      width: 120,
    },
    {
      field: 'totalPointsRedeemed',
      headerName: 'Total Redeemed',
      width: 130,
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 130,
      valueFormatter: (value) => value ? dayjs(value).format('MMM D, YYYY') : '—',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Customer>) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openDialog(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Points History">
            <IconButton size="small" onClick={() => openHistoryDialog(params.row)}>
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ], [openDialog, openHistoryDialog]);

  return (
    <Box>
      <PageHeader
        title="Customers"
        subtitle="Manage customers and loyalty points"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Customers' },
        ]}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>
            Add Customer
          </Button>
        }
      />

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                placeholder="Search by name or phone..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setSearch('')}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Card>

      <Card>
        <DataGrid
          rows={customers}
          columns={columns}
          pageSizeOptions={[10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
          loading={loading}
          sx={{ border: 0, minHeight: 400 }}
        />
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={form.handleSubmit(handleSaveCustomer)}>
          <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="phone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone Number"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      autoFocus
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Customer Name"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="area"
                  control={form.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Area (Optional)"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingCustomer ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Points History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Points History — {selectedCustomer?.name} ({selectedCustomer?.phone})
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <Chip label={`Balance: ${selectedCustomer.loyaltyPoints} pts`} color="primary" />
              <Chip label={`Total Earned: ${selectedCustomer.totalPointsEarned}`} color="success" variant="outlined" />
              <Chip label={`Total Redeemed: ${selectedCustomer.totalPointsRedeemed}`} color="error" variant="outlined" />
            </Box>
          )}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Points</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">Loading...</TableCell>
                  </TableRow>
                ) : pointsHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No points history</TableCell>
                  </TableRow>
                ) : (
                  pointsHistory.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{dayjs(log.createdAt).format('MMM D, YYYY h:mm A')}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.type.replace('_', ' ')}
                          size="small"
                          color={getPointsTypeColor(log.type)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={log.points > 0 ? 'success.main' : 'error.main'}
                        >
                          {log.points > 0 ? '+' : ''}{log.points}
                        </Typography>
                      </TableCell>
                      <TableCell>{log.description || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
