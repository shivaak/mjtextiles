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
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';

import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../app/context/NotificationContext';
import { supplierService } from '../../services/supplierService';
import { formatApiError } from '../../services/api';
import type { Supplier } from '../../domain/types';

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  phone: z.string().optional(),
  email: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  isActive: z.boolean(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
  const { success: showSuccess, error: showError } = useNotification();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      gstNumber: '',
      isActive: true,
    },
  });

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supplierService.getSuppliers({
        search: search || undefined,
      });
      setSuppliers(data);
    } catch (error) {
      showError(formatApiError(error, 'Failed to load suppliers'));
    } finally {
      setLoading(false);
    }
  }, [search, showError]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const openDialog = useCallback((selected?: Supplier) => {
    if (selected) {
      setEditingSupplier(selected);
      form.reset({
        name: selected.name,
        phone: selected.phone || '',
        email: selected.email || '',
        address: selected.address || '',
        gstNumber: selected.gstNumber || '',
        isActive: selected.isActive ?? true,
      });
    } else {
      setEditingSupplier(null);
      form.reset({
        name: '',
        phone: '',
        email: '',
        address: '',
        gstNumber: '',
        isActive: true,
      });
    }
    setDialogOpen(true);
  }, [form]);

  const handleSaveSupplier = async (data: SupplierFormData) => {
    try {
      if (editingSupplier) {
        await supplierService.updateSupplier(editingSupplier.id, {
          name: data.name,
          phone: data.phone || undefined,
          email: data.email || undefined,
          address: data.address || undefined,
          gstNumber: data.gstNumber || undefined,
          isActive: data.isActive,
        });
        showSuccess('Supplier updated successfully');
      } else {
        await supplierService.createSupplier({
          name: data.name,
          phone: data.phone || undefined,
          email: data.email || undefined,
          address: data.address || undefined,
          gstNumber: data.gstNumber || undefined,
        });
        showSuccess('Supplier created successfully');
      }
      setDialogOpen(false);
      await fetchSuppliers();
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to save supplier'));
    }
  };

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'name',
      headerName: 'Supplier Name',
      flex: 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams<Supplier>) => (
        <Typography variant="body2" fontWeight={500}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 140,
      renderCell: (params: GridRenderCellParams) => params.value || '—',
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
      renderCell: (params: GridRenderCellParams) => params.value || '—',
    },
    {
      field: 'gstNumber',
      headerName: 'GST Number',
      width: 170,
      renderCell: (params: GridRenderCellParams) => params.value || '—',
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          size="small"
          color={params.value ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 140,
      valueFormatter: (value) => value ? dayjs(value).format('MMM D, YYYY') : '—',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Supplier>) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openDialog(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ], [openDialog]);

  return (
    <Box>
      <PageHeader
        title="Suppliers"
        subtitle="Manage your suppliers and their contact information"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Suppliers' },
        ]}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>
            Add Supplier
          </Button>
        }
      />

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                placeholder="Search by supplier name or phone..."
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
          rows={suppliers}
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={form.handleSubmit(handleSaveSupplier)}>
          <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Supplier Name"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      autoFocus
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="phone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="gstNumber"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="GST Number"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="address"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Address"
                      multiline
                      rows={2}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              {editingSupplier && (
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="isActive"
                    control={form.control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        }
                        label="Active"
                      />
                    )}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingSupplier ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
