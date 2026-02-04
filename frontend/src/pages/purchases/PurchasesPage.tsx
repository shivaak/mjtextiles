import { useState, useMemo, useEffect, useCallback } from 'react';
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
  Chip,
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
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import SearchIcon from '@mui/icons-material/Search';
import dayjs from 'dayjs';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import PageHeader from '../../components/common/PageHeader';
import Money from '../../components/common/Money';
import DateRangePicker from '../../components/common/DateRangePicker';
import { useNotification } from '../../app/context/NotificationContext';
import { purchaseService } from '../../services/purchaseService';
import { supplierService } from '../../services/supplierService';
import { productService } from '../../services/productService';
import { formatApiError } from '../../services/api';
import type {
  PurchaseList,
  PurchaseDetail,
  Supplier,
  VariantSearchResponse,
  DateRange,
  CreatePurchaseRequest,
  Variant,
} from '../../domain/types';

const purchaseSchema = z.object({
  supplierId: z.number().min(1, 'Supplier is required'),
  purchasedAt: z.string().min(1, 'Date is required'),
  invoiceNo: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    variantId: z.number().min(1, 'Product is required'),
    qty: z.number().min(1, 'Quantity must be at least 1'),
    unitCost: z.number().min(0, 'Cost must be positive'),
  })).min(1, 'At least one item is required'),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

const editPurchaseSchema = z.object({
  invoiceNo: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    variantId: z.number().min(1, 'Product is required'),
    qty: z.number().min(1, 'Quantity must be at least 1'),
    unitCost: z.number().min(0, 'Cost must be positive'),
  })).min(1, 'At least one item is required'),
});

type EditPurchaseFormData = z.infer<typeof editPurchaseSchema>;

export default function PurchasesPage() {
  const { success: showSuccess, error: showError } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseDetail | null>(null);
  const [activePurchase, setActivePurchase] = useState<PurchaseList | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [variantSearch, setVariantSearch] = useState('');
  const [variantResults, setVariantResults] = useState<VariantSearchResponse[]>([]);
  const [variantCache, setVariantCache] = useState<Record<number, VariantSearchResponse>>({});
  const [purchases, setPurchases] = useState<PurchaseList[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');
  const [newSupplierGstNumber, setNewSupplierGstNumber] = useState('');

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: 0,
      purchasedAt: dayjs().format('YYYY-MM-DD'),
      invoiceNo: '',
      notes: '',
      items: [{ variantId: 0, qty: 1, unitCost: 0 }],
    },
  });

  const editForm = useForm<EditPurchaseFormData>({
    resolver: zodResolver(editPurchaseSchema),
    defaultValues: {
      invoiceNo: '',
      notes: '',
      items: [{ variantId: 0, qty: 1, unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const {
    fields: editItemFields,
    append: appendEditItem,
    remove: removeEditItem,
  } = useFieldArray({
    control: editForm.control,
    name: 'items',
  });

  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      showError(formatApiError(error, 'Failed to load suppliers'));
    }
  }, [showError]);

  const fetchPurchases = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await purchaseService.getPurchases({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        search: searchQuery || undefined,
      });
      setPurchases(data);
    } catch (error) {
      showError(formatApiError(error, 'Failed to load purchases'));
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, searchQuery, showError]);

  const mapVariantToSearch = (variant: Variant): VariantSearchResponse => ({
    id: variant.id,
    productName: variant.productName,
    sku: variant.sku,
    barcode: variant.barcode,
    size: variant.size,
    color: variant.color,
    sellingPrice: variant.sellingPrice,
    avgCost: variant.avgCost,
    stockQty: variant.stockQty,
    status: variant.status,
  });

  const preloadVariants = useCallback(async () => {
    if (variantSearch.length >= 2 || variantResults.length > 0) {
      return;
    }
    try {
      const response = await productService.getVariants({ status: 'ACTIVE', size: 10 });
      const results = response.content.map(mapVariantToSearch);
      setVariantResults(results);
      setVariantCache((prev) => {
        const next = { ...prev };
        results.forEach((variant) => {
          next[variant.id] = variant;
        });
        return next;
      });
    } catch (error) {
      showError(formatApiError(error, 'Failed to load products'));
    }
  }, [showError, variantResults.length, variantSearch.length]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  useEffect(() => {
    const purchaseId = searchParams.get('id');
    if (!purchaseId) return;

    const openFromParam = async () => {
      try {
        const detail = await purchaseService.getPurchaseById(Number(purchaseId));
        setSelectedPurchase(detail);
        setDetailDrawerOpen(true);
        setSearchParams({}, { replace: true });
      } catch (error) {
        showError(formatApiError(error, 'Failed to load purchase details'));
      }
    };

    openFromParam();
  }, [searchParams, setSearchParams, showError]);

  const handleVariantSearch = useCallback(async (query: string) => {
    setVariantSearch(query);
    if (query.length < 2) {
      setVariantResults([]);
      return;
    }

    try {
      const results = await productService.searchVariants(query, 10);
      const activeResults = results.filter((variant) => variant.status === 'ACTIVE');
      setVariantResults(activeResults);
      setVariantCache((prev) => {
        const next = { ...prev };
        activeResults.forEach((variant) => {
          next[variant.id] = variant;
        });
        return next;
      });
    } catch (error) {
      showError(formatApiError(error, 'Failed to search variants'));
    }
  }, [showError]);

  const handleAddVariant = (variant: VariantSearchResponse, index: number) => {
    form.setValue(`items.${index}.variantId`, variant.id, { shouldValidate: true });
    form.setValue(`items.${index}.unitCost`, variant.avgCost || 0, { shouldValidate: true });
    setVariantSearch('');
    setVariantResults([]);
    setVariantCache((prev) => ({ ...prev, [variant.id]: variant }));
  };

  const getVariantName = (variantId: number): string => {
    const variant = variantCache[variantId];
    if (!variant) return variantId ? String(variantId) : '';
    return `${variant.productName} - ${variant.size} ${variant.color}`;
  };

  const handleAddEditVariant = (variant: VariantSearchResponse, index: number) => {
    editForm.setValue(`items.${index}.variantId`, variant.id, { shouldValidate: true });
    editForm.setValue(`items.${index}.unitCost`, variant.avgCost || 0, { shouldValidate: true });
    setVariantSearch('');
    setVariantResults([]);
    setVariantCache((prev) => ({ ...prev, [variant.id]: variant }));
  };

  const items = form.watch('items');
  const totalCost = items.reduce((sum, item) => sum + (item.qty * item.unitCost), 0);

  const editItems = editForm.watch('items');
  const editTotalCost = editItems.reduce((sum, item) => sum + (item.qty * item.unitCost), 0);

  const handleSavePurchase = async (data: PurchaseFormData) => {
    setIsSaving(true);
    try {
      const payload: CreatePurchaseRequest = {
        supplierId: data.supplierId,
        purchasedAt: dayjs(data.purchasedAt).toISOString(),
        invoiceNo: data.invoiceNo || undefined,
        notes: data.notes || undefined,
        items: data.items.map((item) => ({
          variantId: item.variantId,
          qty: item.qty,
          unitCost: item.unitCost,
        })),
      };
      await purchaseService.createPurchase(payload);
      showSuccess('Purchase recorded successfully');
      setDialogOpen(false);
      form.reset({
        supplierId: 0,
        purchasedAt: dayjs().format('YYYY-MM-DD'),
        invoiceNo: '',
        notes: '',
        items: [{ variantId: 0, qty: 1, unitCost: 0 }],
      });
      fetchPurchases();
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to save purchase'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPurchaseForm = () => {
    form.reset({
      supplierId: 0,
      purchasedAt: dayjs().format('YYYY-MM-DD'),
      invoiceNo: '',
      notes: '',
      items: [{ variantId: 0, qty: 1, unitCost: 0 }],
    });
    setVariantSearch('');
    setVariantResults([]);
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) return;
    try {
      const supplier = await supplierService.createSupplier({
        name: newSupplierName.trim(),
        phone: newSupplierPhone || undefined,
        email: newSupplierEmail || undefined,
        address: newSupplierAddress || undefined,
        gstNumber: newSupplierGstNumber || undefined,
      });
      await fetchSuppliers();
      form.setValue('supplierId', supplier.id, { shouldValidate: true });
      setSupplierDialogOpen(false);
      setNewSupplierName('');
      setNewSupplierPhone('');
      setNewSupplierEmail('');
      setNewSupplierAddress('');
      setNewSupplierGstNumber('');
      showSuccess('Supplier created');
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to create supplier'));
    }
  };

  const handleViewDetails = async (purchase: PurchaseList) => {
    try {
      const detail = await purchaseService.getPurchaseById(purchase.id);
      setSelectedPurchase(detail);
      setDetailDrawerOpen(true);
    } catch (error) {
      showError(formatApiError(error, 'Failed to load purchase details'));
    }
  };

  const openEditDialog = async (purchase: PurchaseList) => {
    setActivePurchase(purchase);
    setIsSaving(true);
    try {
      const detail = await purchaseService.getPurchaseById(purchase.id);
      const items = detail.items.map((item) => ({
        variantId: item.variantId,
        qty: item.qty,
        unitCost: item.unitCost,
      }));
      editForm.reset({
        invoiceNo: detail.invoiceNo || '',
        notes: detail.notes || '',
        items,
      });

      setVariantCache((prev) => {
        const next = { ...prev };
        detail.items.forEach((item) => {
          if (!next[item.variantId]) {
            next[item.variantId] = {
              id: item.variantId,
              productName: item.productName || '',
              sku: item.variantSku || '',
              barcode: item.variantBarcode || '',
              size: item.size || '',
              color: item.color || '',
              sellingPrice: 0,
              avgCost: item.unitCost,
              stockQty: 0,
              status: 'ACTIVE',
            };
          }
        });
        return next;
      });

      setEditDialogOpen(true);
    } catch (error) {
      showError(formatApiError(error, 'Failed to load purchase details'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async (data: EditPurchaseFormData) => {
    if (!activePurchase) return;
    setIsSaving(true);
    try {
      const itemsPayload = {
        items: data.items.map((item) => ({
          variantId: item.variantId,
          qty: item.qty,
          unitCost: item.unitCost,
        })),
      };
      await purchaseService.updatePurchaseItems(activePurchase.id, itemsPayload);
      const updated = await purchaseService.updatePurchaseMetadata(activePurchase.id, {
        invoiceNo: data.invoiceNo || undefined,
        notes: data.notes || undefined,
      });
      showSuccess('Purchase updated successfully');
      setEditDialogOpen(false);
      setActivePurchase(updated);
      fetchPurchases();
      if (selectedPurchase && selectedPurchase.id === updated.id) {
        setSelectedPurchase(updated);
      }
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to update purchase'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleVoidPurchase = async () => {
    if (!activePurchase) return;
    if (!voidReason.trim()) {
      showError('Void reason is required');
      return;
    }
    setIsSaving(true);
    try {
      await purchaseService.voidPurchase(activePurchase.id, { voidReason: voidReason.trim() });
      showSuccess('Purchase voided successfully');
      setVoidDialogOpen(false);
      setVoidReason('');
      fetchPurchases();
      if (selectedPurchase && selectedPurchase.id === activePurchase.id) {
        const refreshed = await purchaseService.getPurchaseById(activePurchase.id);
        setSelectedPurchase(refreshed);
      }
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to void purchase'));
    } finally {
      setIsSaving(false);
    }
  };

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
      valueGetter: (_value: unknown, row: PurchaseList) => row.itemCount ?? 0,
    },
    {
      field: 'totalCost',
      headerName: 'Total',
      width: 120,
      align: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography fontWeight={500}>
          <Money value={Number(params.value || 0)} />
        </Typography>
      ),
    },
    {
      field: 'createdByName',
      headerName: 'Created By',
      width: 140,
      valueGetter: (value) => value || '-',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params: GridRenderCellParams<PurchaseList>) => (
        <Chip
          label={params.row.status || 'ACTIVE'}
          size="small"
          color={params.row.status === 'VOIDED' ? 'default' : 'success'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 140,
      sortable: false,
      renderCell: (params: GridRenderCellParams<PurchaseList>) => {
        const isVoided = params.row.status === 'VOIDED';
        return (
          <>
            <Tooltip title="View Details">
              <IconButton size="small" onClick={() => handleViewDetails(params.row)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Purchase">
              <IconButton
                size="small"
                onClick={() => openEditDialog(params.row)}
                disabled={isVoided}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Void Purchase">
              <IconButton
                size="small"
                onClick={() => {
                  setActivePurchase(params.row);
                  setVoidReason('');
                  setVoidDialogOpen(true);
                }}
                disabled={isVoided}
              >
                <BlockIcon fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          </>
        );
      },
    },
  ];

  const filteredPurchases = useMemo(() => {
    return purchases
      .filter((purchase) => {
        const purchaseDate = dayjs(purchase.purchasedAt).format('YYYY-MM-DD');
        const inDateRange = purchaseDate >= dateRange.startDate && purchaseDate <= dateRange.endDate;
        const matchesSearch = !searchQuery ||
          purchase.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          purchase.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase());
        return inDateRange && matchesSearch;
      })
      .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
  }, [purchases, dateRange, searchQuery]);

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

      <Card>
        <DataGrid
          rows={filteredPurchases}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
          loading={isLoading}
          sx={{ border: 0, minHeight: 500 }}
        />
      </Card>

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
                      <Select
                        {...field}
                        label="Supplier"
                        value={field.value || ''}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      >
                        {suppliers.map((supplier) => (
                          <MenuItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </MenuItem>
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
                                  options={variantResults}
                                  getOptionLabel={(option) =>
                                    `${option.productName} - ${option.size} ${option.color}`
                                  }
                                  value={f.value ? variantCache[f.value] || null : null}
                                  inputValue={f.value ? getVariantName(f.value) : variantSearch}
                                  onInputChange={(_, value, reason) => {
                                    if (reason === 'clear') {
                                      form.setValue(`items.${index}.variantId`, 0, { shouldValidate: true });
                                      form.setValue(`items.${index}.qty`, 1, { shouldValidate: true });
                                      form.setValue(`items.${index}.unitCost`, 0, { shouldValidate: true });
                                      setVariantSearch('');
                                      setVariantResults([]);
                                      return;
                                    }
                                    handleVariantSearch(value);
                                  }}
                                  onFocus={preloadVariants}
                                  onChange={(_, value, reason) => {
                                    if (!value && reason === 'clear') {
                                      form.setValue(`items.${index}.variantId`, 0, { shouldValidate: true });
                                      form.setValue(`items.${index}.qty`, 1, { shouldValidate: true });
                                      form.setValue(`items.${index}.unitCost`, 0, { shouldValidate: true });
                                      setVariantSearch('');
                                      setVariantResults([]);
                                      return;
                                    }
                                    if (value) {
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
                                  onChange={(event) => f.onChange(parseInt(event.target.value, 10) || 1)}
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
                                  onChange={(event) => f.onChange(parseFloat(event.target.value) || 0)}
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
                  onClick={() => append({ variantId: 0, qty: 1, unitCost: 0 })}
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
            <Button type="button" onClick={handleResetPurchaseForm}>Reset</Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Save Purchase'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={editForm.handleSubmit(handleSaveEdit)}>
          <DialogTitle>Edit Purchase</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="invoiceNo"
                  control={editForm.control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Invoice No (Optional)" />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="notes"
                  control={editForm.control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Notes (Optional)" />
                  )}
                />
              </Grid>

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
                      {editItemFields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Controller
                              name={`items.${index}.variantId`}
                              control={editForm.control}
                              render={({ field: f }) => (
                                <Autocomplete
                                  options={variantResults}
                                  getOptionLabel={(option) =>
                                    `${option.productName} - ${option.size} ${option.color}`
                                  }
                                  value={f.value ? variantCache[f.value] || null : null}
                                  inputValue={f.value ? getVariantName(f.value) : variantSearch}
                                  onInputChange={(_, value, reason) => {
                                    if (reason === 'clear') {
                                      editForm.setValue(`items.${index}.variantId`, 0, { shouldValidate: true });
                                      editForm.setValue(`items.${index}.qty`, 1, { shouldValidate: true });
                                      editForm.setValue(`items.${index}.unitCost`, 0, { shouldValidate: true });
                                      setVariantSearch('');
                                      setVariantResults([]);
                                      return;
                                    }
                                    handleVariantSearch(value);
                                  }}
                                  onFocus={preloadVariants}
                                  onChange={(_, value, reason) => {
                                    if (!value && reason === 'clear') {
                                      editForm.setValue(`items.${index}.variantId`, 0, { shouldValidate: true });
                                      editForm.setValue(`items.${index}.qty`, 1, { shouldValidate: true });
                                      editForm.setValue(`items.${index}.unitCost`, 0, { shouldValidate: true });
                                      setVariantSearch('');
                                      setVariantResults([]);
                                      return;
                                    }
                                    if (value) {
                                      handleAddEditVariant(value, index);
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
                              control={editForm.control}
                              render={({ field: f }) => (
                                <TextField
                                  {...f}
                                  type="number"
                                  size="small"
                                  inputProps={{ min: 1 }}
                                  onChange={(event) => f.onChange(parseInt(event.target.value, 10) || 1)}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Controller
                              name={`items.${index}.unitCost`}
                              control={editForm.control}
                              render={({ field: f }) => (
                                <TextField
                                  {...f}
                                  type="number"
                                  size="small"
                                  InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                  }}
                                  onChange={(event) => f.onChange(parseFloat(event.target.value) || 0)}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Money value={editItems[index]?.qty * editItems[index]?.unitCost || 0} />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => removeEditItem(index)}
                              disabled={editItemFields.length === 1}
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
                  onClick={() => appendEditItem({ variantId: 0, qty: 1, unitCost: 0 })}
                  sx={{ mt: 1 }}
                >
                  Add Item
                </Button>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Typography variant="h6">
                    Total: <Money value={editTotalCost} />
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button type="button" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={voidDialogOpen}
        onClose={() => setVoidDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Void Purchase</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Void Reason"
            value={voidReason}
            onChange={(event) => setVoidReason(event.target.value)}
            multiline
            rows={3}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button type="button" onClick={() => setVoidDialogOpen(false)}>Cancel</Button>
          <Button type="button" variant="contained" color="error" onClick={handleVoidPurchase} disabled={isSaving}>
            {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Void Purchase'}
          </Button>
        </DialogActions>
      </Dialog>

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
            onChange={(event) => setNewSupplierName(event.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Phone"
            value={newSupplierPhone}
            onChange={(event) => setNewSupplierPhone(event.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            value={newSupplierEmail}
            onChange={(event) => setNewSupplierEmail(event.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Address"
            value={newSupplierAddress}
            onChange={(event) => setNewSupplierAddress(event.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="GST Number"
            value={newSupplierGstNumber}
            onChange={(event) => setNewSupplierGstNumber(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={() => setSupplierDialogOpen(false)}>Cancel</Button>
          <Button type="button" variant="contained" onClick={handleCreateSupplier}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

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

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">Status</Typography>
              <Typography variant="body1">{selectedPurchase.status || 'ACTIVE'}</Typography>
            </Box>

            {selectedPurchase.status === 'VOIDED' && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">Voided By</Typography>
                  <Typography variant="body1">{selectedPurchase.voidedByName || '-'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">Void Reason</Typography>
                  <Typography variant="body1">{selectedPurchase.voidReason || '-'}</Typography>
                </Box>
              </>
            )}

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
                        <Typography variant="body2">{item.productName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.size} | {item.color}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{item.qty}</TableCell>
                      <TableCell align="right"><Money value={item.unitCost} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 3,
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
              }}
            >
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
