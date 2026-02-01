// Purchases page - stock-in management

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  InputAdornment,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Drawer,
  Divider,
  Autocomplete,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import dayjs from 'dayjs';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { PageHeader, Money, DateRangePicker } from '../../components/common';
import { useNotification } from '../../app/context/NotificationContext';
import { useAuth } from '../../app/context/AuthContext';
import {
  getAllPurchasesWithItems,
  getAllSuppliers,
  createSupplier,
  createPurchase,
  searchVariants,
  getUserById,
} from '../../data/repositories';
import type { PurchaseWithItems, VariantWithProduct, DateRange } from '../../domain/types';

// Schema for purchase form
const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  purchasedAt: z.string().min(1, 'Date is required'),
  invoiceNo: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    variantId: z.string().min(1, 'Product is required'),
    qty: z.number().min(1, 'Quantity must be at least 1'),
    unitCost: z.number().min(0, 'Cost must be positive'),
  })).min(1, 'At least one item is required'),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

export default function PurchasesPage() {
  const { session } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithItems | null>(null);
  const [variantSearch, setVariantSearch] = useState('');
  const [variantResults, setVariantResults] = useState<VariantWithProduct[]>([]);

  // New supplier form
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');

  // Data
  const purchases = getAllPurchasesWithItems();
  const suppliers = getAllSuppliers();

  // Auto-open purchase detail if ID is in URL (for deep linking from inventory)
  useEffect(() => {
    const purchaseId = searchParams.get('id');
    if (purchaseId && purchases.length > 0) {
      const purchase = purchases.find(p => p.id === purchaseId);
      if (purchase) {
        setSelectedPurchase(purchase);
        setDetailDrawerOpen(true);
        // Clear the URL param after opening
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, purchases, setSearchParams]);

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const purchaseDate = dayjs(p.purchasedAt).format('YYYY-MM-DD');
      const inDateRange = purchaseDate >= dateRange.startDate && purchaseDate <= dateRange.endDate;
      const matchesSearch = !searchQuery ||
        p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase());
      return inDateRange && matchesSearch;
    }).sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
  }, [purchases, dateRange, searchQuery]);

  // Form
  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: '',
      purchasedAt: dayjs().format('YYYY-MM-DD'),
      invoiceNo: '',
      notes: '',
      items: [{ variantId: '', qty: 1, unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Handle variant search
  const handleVariantSearch = (query: string) => {
    setVariantSearch(query);
    if (query.length >= 2) {
      const results = searchVariants(query).filter(v => v.status === 'ACTIVE');
      setVariantResults(results);
    } else {
      setVariantResults([]);
    }
  };

  // Add variant to form
  const handleAddVariant = (variant: VariantWithProduct, index: number) => {
    form.setValue(`items.${index}.variantId`, variant.id);
    form.setValue(`items.${index}.unitCost`, variant.avgCost);
    setVariantSearch('');
    setVariantResults([]);
  };

  // Calculate total
  const items = form.watch('items');
  const totalCost = items.reduce((sum, item) => sum + (item.qty * item.unitCost), 0);

  // Save purchase
  const handleSavePurchase = (data: PurchaseFormData) => {
    try {
      createPurchase({
        ...data,
        createdBy: session?.userId || '',
      });
      showSuccess('Purchase recorded successfully');
      setDialogOpen(false);
      form.reset({
        supplierId: '',
        purchasedAt: dayjs().format('YYYY-MM-DD'),
        invoiceNo: '',
        notes: '',
        items: [{ variantId: '', qty: 1, unitCost: 0 }],
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save purchase';
      showError(errorMessage);
    }
  };

  // Create new supplier
  const handleCreateSupplier = () => {
    if (!newSupplierName.trim()) return;
    try {
      const supplier = createSupplier({
        name: newSupplierName,
        phone: newSupplierPhone || undefined,
      });
      form.setValue('supplierId', supplier.id);
      setSupplierDialogOpen(false);
      setNewSupplierName('');
      setNewSupplierPhone('');
      showSuccess('Supplier created');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      showError(errorMessage);
    }
  };

  // Open detail drawer
  const handleViewDetails = (purchase: PurchaseWithItems) => {
    setSelectedPurchase(purchase);
    setDetailDrawerOpen(true);
  };

  // Columns
  const columns: GridColDef[] = [
    {
      field: 'invoiceNo',
      headerName: 'Invoice #',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={500}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'purchasedAt',
      headerName: 'Date',
      width: 120,
      valueFormatter: (value) => dayjs(value).format('MMM D, YYYY'),
    },
    {
      field: 'supplierName',
      headerName: 'Supplier',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'itemCount',
      headerName: 'Items',
      width: 80,
      align: 'center',
      valueGetter: (_value: unknown, row: PurchaseWithItems) => row.items?.length || 0,
    },
    {
      field: 'totalCost',
      headerName: 'Total',
      width: 120,
      align: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography fontWeight={500}>
          <Money value={params.value as number} />
        </Typography>
      ),
    },
    {
      field: 'createdBy',
      headerName: 'Created By',
      width: 120,
      valueGetter: (value) => {
        const user = getUserById(value as string);
        return user?.fullName || '-';
      },
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params: GridRenderCellParams<PurchaseWithItems>) => (
        <Tooltip title="View Details">
          <IconButton size="small" onClick={() => handleViewDetails(params.row)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  // Get variant display name
  const getVariantName = (variantId: string): string => {
    const results = searchVariants('');
    const variant = results.find(v => v.id === variantId);
    return variant ? `${variant.productName} - ${variant.size} ${variant.color}` : variantId;
  };

  return (
    <Box>
      <PageHeader
        title="Purchases"
        subtitle="Record stock purchases from suppliers"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Purchases' },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            New Purchase
          </Button>
        }
      />

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search by supplier, invoice..."
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
            <Grid size={{ xs: 12, md: 4 }}>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card>
        <DataGrid
          rows={filteredPurchases}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
          sx={{ border: 0, minHeight: 500 }}
        />
      </Card>

      {/* New Purchase Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={form.handleSubmit(handleSavePurchase)}>
          <DialogTitle>New Purchase</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="supplierId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth error={!!fieldState.error}>
                      <InputLabel>Supplier</InputLabel>
                      <Select {...field} label="Supplier">
                        {suppliers.map(s => (
                          <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
                <Button
                  size="small"
                  sx={{ mt: 0.5 }}
                  onClick={() => setSupplierDialogOpen(true)}
                >
                  + Add New Supplier
                </Button>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Controller
                  name="purchasedAt"
                  control={form.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="date"
                      label="Date"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Controller
                  name="invoiceNo"
                  control={form.control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Invoice No (Optional)" />
                  )}
                />
              </Grid>

              {/* Items */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Items
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="50%">Product</TableCell>
                        <TableCell width="15%">Qty</TableCell>
                        <TableCell width="20%">Unit Cost</TableCell>
                        <TableCell width="15%">Total</TableCell>
                        <TableCell width="50px"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Controller
                              name={`items.${index}.variantId`}
                              control={form.control}
                              render={({ field: f }) => (
                                <Autocomplete
                                  freeSolo
                                  options={variantResults}
                                  getOptionLabel={(option) =>
                                    typeof option === 'string'
                                      ? option
                                      : `${option.productName} - ${option.size} ${option.color}`
                                  }
                                  inputValue={f.value ? getVariantName(f.value) : variantSearch}
                                  onInputChange={(_, value) => handleVariantSearch(value)}
                                  onChange={(_, value) => {
                                    if (value && typeof value !== 'string') {
                                      handleAddVariant(value, index);
                                    }
                                  }}
                                  size="small"
                                  renderInput={(params) => (
                                    <TextField {...params} placeholder="Search product..." />
                                  )}
                                  renderOption={(props, option) => (
                                    <Box component="li" {...props} key={option.id}>
                                      <Box>
                                        <Typography variant="body2">{option.productName}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {option.size} | {option.color} | {option.barcode}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  )}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Controller
                              name={`items.${index}.qty`}
                              control={form.control}
                              render={({ field: f }) => (
                                <TextField
                                  {...f}
                                  type="number"
                                  size="small"
                                  inputProps={{ min: 1 }}
                                  onChange={(e) => f.onChange(parseInt(e.target.value) || 1)}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Controller
                              name={`items.${index}.unitCost`}
                              control={form.control}
                              render={({ field: f }) => (
                                <TextField
                                  {...f}
                                  type="number"
                                  size="small"
                                  InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                  }}
                                  onChange={(e) => f.onChange(parseFloat(e.target.value) || 0)}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Money value={items[index]?.qty * items[index]?.unitCost || 0} />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => append({ variantId: '', qty: 1, unitCost: 0 })}
                  sx={{ mt: 1 }}
                >
                  Add Item
                </Button>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Typography variant="h6">
                    Total: <Money value={totalCost} />
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save Purchase</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* New Supplier Dialog */}
      <Dialog
        open={supplierDialogOpen}
        onClose={() => setSupplierDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Supplier</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Supplier Name"
            value={newSupplierName}
            onChange={(e) => setNewSupplierName(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Phone (Optional)"
            value={newSupplierPhone}
            onChange={(e) => setNewSupplierPhone(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={() => setSupplierDialogOpen(false)}>Cancel</Button>
          <Button type="button" variant="contained" onClick={handleCreateSupplier}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Detail Drawer */}
      <Drawer
        anchor="right"
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        PaperProps={{ sx: { width: 400, p: 3 } }}
      >
        {selectedPurchase && (
          <>
            <Typography variant="h6" gutterBottom>
              Purchase Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">Invoice No</Typography>
              <Typography variant="body1">{selectedPurchase.invoiceNo || '-'}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">Supplier</Typography>
              <Typography variant="body1">{selectedPurchase.supplierName}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">Date</Typography>
              <Typography variant="body1">
                {dayjs(selectedPurchase.purchasedAt).format('MMMM D, YYYY')}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>Items</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPurchase.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2">{item.variant?.productName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.variant?.size} | {item.variant?.color}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{item.qty}</TableCell>
                      <TableCell align="right"><Money value={item.unitCost} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>Total</Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                <Money value={selectedPurchase.totalCost} />
              </Typography>
            </Box>
          </>
        )}
      </Drawer>
    </Box>
  );
}
