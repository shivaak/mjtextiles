import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
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
  Drawer,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Link,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams, GridPaginationModel } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import HistoryIcon from '@mui/icons-material/History';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';

import PageHeader from '../../components/common/PageHeader';
import Money from '../../components/common/Money';
import { useNotification } from '../../app/context/NotificationContext';
import { useAuth } from '../../app/context/AuthContext';
import { productService } from '../../services/productService';
import { settingsService } from '../../services/settingsService';
import { inventoryService } from '../../services/inventoryService';
import { lookupService } from '../../services/lookupService';
import { formatApiError } from '../../services/api';
import type {
  Variant,
  VariantStatus,
  PagedResponse,
  StockMovement,
  SupplierSummary,
  InventorySummary,
  Settings,
} from '../../domain/types';
import { calculateStockValue, calculateMarkupPercent } from '../../utils/calculations';

const adjustmentSchema = z.object({
  deltaQty: z.number().refine((val) => val !== 0, 'Quantity cannot be zero'),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

export default function InventoryPage() {
  const { isAdmin } = useAuth();
  const { success: showSuccess, error: showError } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearchQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });

  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');

  const [variants, setVariants] = useState<Variant[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [adjustmentReasons, setAdjustmentReasons] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [supplierSummary, setSupplierSummary] = useState<SupplierSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      deltaQty: 1,
      reason: 'CORRECTION',
      notes: '',
    },
  });

  const fetchFilters = useCallback(async () => {
    try {
      const lookups = await lookupService.getLookups();
      setCategories(lookups.categories || []);
      setBrands(lookups.brands || []);
      setAdjustmentReasons(lookups.adjustmentReasons || []);
    } catch (error) {
      showError(formatApiError(error, 'Failed to load filters'));
    }
  }, [showError]);

  const fetchSettings = useCallback(async () => {
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
  }, [showError]);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await inventoryService.getSummary();
      setSummary(data);
    } catch (error) {
      showError(formatApiError(error, 'Failed to load inventory summary'));
    }
  }, [showError]);

  const fetchVariants = useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        category?: string;
        brand?: string;
        status?: VariantStatus;
        lowStock?: boolean;
        outOfStock?: boolean;
        search?: string;
        page?: number;
        size?: number;
      } = {
        category: categoryFilter || undefined,
        brand: brandFilter || undefined,
        status: 'ACTIVE',
        search: searchQuery || undefined,
        page: paginationModel.page,
        size: paginationModel.pageSize,
      };

      if (stockFilter === 'low') params.lowStock = true;
      if (stockFilter === 'out') params.outOfStock = true;

      const data: PagedResponse<Variant> = await productService.getVariants(params);
      setVariants(data.content);
      setTotalElements(data.totalElements);
    } catch (error) {
      showError(formatApiError(error, 'Failed to load inventory'));
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, brandFilter, stockFilter, searchQuery, paginationModel, showError]);

  useEffect(() => {
    fetchFilters();
    fetchSettings();
    fetchSummary();
  }, [fetchFilters, fetchSettings, fetchSummary]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }
  }, [searchParams, searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));

    const nextParams = new URLSearchParams(searchParams);
    const trimmed = value.trim();

    if (trimmed) {
      nextParams.set('q', trimmed);
    } else {
      nextParams.delete('q');
    }

    setSearchParams(nextParams, { replace: true });
  };

  const stats = useMemo(() => {
    const totalValue = summary?.totalValue || 0;
    const lowStock = summary?.lowStockCount || 0;
    const outOfStock = summary?.outOfStockCount || 0;
    const totalItems = summary?.totalItems || 0;
    const totalSkus = summary?.totalSkus || 0;
    return { totalValue, lowStock, outOfStock, totalItems, totalSkus };
  }, [summary]);

  const openAdjustDialog = (variant: Variant) => {
    setSelectedVariant(variant);
    setAdjustmentType('add');
      form.reset({ deltaQty: 1, reason: 'CORRECTION', notes: '' });
    setAdjustDialogOpen(true);
  };

  const openHistoryDrawer = async (variant: Variant) => {
    setSelectedVariant(variant);
    setHistoryDrawerOpen(true);
    try {
      const [movementData, supplierData] = await Promise.all([
        inventoryService.getMovements({ variantId: variant.id }),
        inventoryService.getSupplierSummary(variant.id),
      ]);
      setMovements(movementData);
      setSupplierSummary(supplierData);
    } catch (error) {
      showError(formatApiError(error, 'Failed to load stock history'));
    }
  };

  const handleSaveAdjustment = async (data: AdjustmentFormData) => {
    if (!selectedVariant) return;

    const actualDelta = adjustmentType === 'add'
      ? Math.abs(data.deltaQty)
      : -Math.abs(data.deltaQty);

    if (actualDelta < 0 && selectedVariant.stockQty + actualDelta < 0) {
      showError('Cannot reduce stock below zero');
      return;
    }

    try {
      await inventoryService.createAdjustment({
        variantId: selectedVariant.id,
        deltaQty: actualDelta,
        reason: data.reason,
        notes: data.notes,
      });
      showSuccess('Stock adjusted successfully');
      setAdjustDialogOpen(false);
      fetchVariants();
      fetchSummary();
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to adjust stock'));
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'barcode',
      headerName: 'Barcode',
      width: 130,
    },
    {
      field: 'sku',
      headerName: 'SKU',
      width: 140,
    },
    {
      field: 'productName',
      headerName: 'Product',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<Variant>) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {params.row.productName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.productBrand} | {params.row.productCategory}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'size',
      headerName: 'Size',
      width: 80,
    },
    {
      field: 'color',
      headerName: 'Color',
      width: 100,
    },
    {
      field: 'stockQty',
      headerName: 'Stock',
      width: 90,
      align: 'center',
      renderCell: (params: GridRenderCellParams<Variant>) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 0 ? 'error' :
            (params.value as number) <= (settings?.lowStockThreshold || 0) ? 'warning' : 'success'
          }
        />
      ),
    },
    ...(isAdmin ? [{
      field: 'avgCost',
      headerName: 'Avg Cost',
      width: 100,
      align: 'right' as const,
      renderCell: (params: GridRenderCellParams) => <Money value={params.value as number} />,
    }] : []),
    {
      field: 'sellingPrice',
      headerName: 'Price',
      width: 100,
      align: 'right',
      renderCell: (params: GridRenderCellParams) => <Money value={params.value as number} />,
    },
    ...(isAdmin ? [{
      field: 'stockValue',
      headerName: 'Stock Value',
      width: 120,
      align: 'right' as const,
      valueGetter: (_value: unknown, row: Variant) => calculateStockValue({
        ...row,
        avgCost: row.avgCost,
        stockQty: row.stockQty,
      }),
      renderCell: (params: GridRenderCellParams) => (
        <Typography fontWeight={500}><Money value={params.value as number} /></Typography>
      ),
    },
    {
      field: 'markup',
      headerName: 'Markup',
      width: 100,
      align: 'right' as const,
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" fontWeight={500}>Markup</Typography>
          <HelpOutlineIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        </Box>
      ),
      valueGetter: (_value: unknown, row: Variant) => calculateMarkupPercent(row.sellingPrice, row.avgCost),
      renderCell: (params: GridRenderCellParams<Variant>) => {
        const markup = params.value as number;
        return (
          <Tooltip
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
            <Typography variant="body2" color={markup >= 30 ? 'success.main' : 'warning.main'} sx={{ cursor: 'help' }}>
              {markup.toFixed(1)}%
            </Typography>
          </Tooltip>
        );
      },
    }] : []),
    ...(isAdmin ? [{
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Variant>) => (
        <Box>
          <Tooltip title="Adjust Stock">
            <IconButton size="small" onClick={() => openAdjustDialog(params.row)}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View History">
            <IconButton size="small" onClick={() => openHistoryDrawer(params.row)}>
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    }] : []),
  ];

  return (
    <Box>
      <PageHeader
        title="Inventory"
        subtitle="Track stock levels and valuations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory' },
        ]}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {isAdmin && (
          <Grid size={{ xs: 6, md: 2.4 }}>
            <Card>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="caption" color="text.secondary">Total Value</Typography>
                <Typography variant="h6" fontWeight={600}>
                  <Money value={stats.totalValue} />
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        <Grid size={{ xs: 6, md: isAdmin ? 2.4 : 3 }}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Total SKUs</Typography>
              <Typography variant="h6" fontWeight={600}>{stats.totalSkus}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: isAdmin ? 2.4 : 3 }}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Total Items</Typography>
              <Typography variant="h6" fontWeight={600}>{stats.totalItems.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: isAdmin ? 2.4 : 3 }}>
          <Card sx={{ bgcolor: stats.lowStock > 0 ? 'warning.light' : undefined }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Low Stock</Typography>
              <Typography variant="h6" fontWeight={600}>{stats.lowStock}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: isAdmin ? 2.4 : 3 }}>
          <Card sx={{ bgcolor: stats.outOfStock > 0 ? 'error.light' : undefined }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Out of Stock</Typography>
              <Typography variant="h6" fontWeight={600}>{stats.outOfStock}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search by name, SKU, barcode..."
                value={searchQuery}
                onChange={(event) => handleSearchChange(event.target.value)}
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
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Brand</InputLabel>
                <Select
                  value={brandFilter}
                  label="Brand"
                  onChange={(event) => setBrandFilter(event.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {brands.map((brand) => (
                    <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <ToggleButtonGroup
                value={stockFilter}
                exclusive
                onChange={(_, value) => setStockFilter(value || '')}
                size="small"
              >
                <ToggleButton value="">All</ToggleButton>
                <ToggleButton value="in">In Stock</ToggleButton>
                <ToggleButton value="low" color="warning">Low</ToggleButton>
                <ToggleButton value="out" color="error">Out</ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <DataGrid
          rows={variants}
          columns={columns}
          rowCount={totalElements}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          paginationModel={paginationModel}
          paginationMode="server"
          onPaginationModelChange={setPaginationModel}
          disableRowSelectionOnClick
          sx={{ border: 0, minHeight: 500 }}
          getRowHeight={() => 60}
        />
      </Card>

      {isAdmin && (
        <Dialog
          open={adjustDialogOpen}
          onClose={() => setAdjustDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <form onSubmit={form.handleSubmit(handleSaveAdjustment)}>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogContent>
              {selectedVariant && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2">{selectedVariant.productName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedVariant.size} | {selectedVariant.color} | Current: {selectedVariant.stockQty}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <ToggleButtonGroup
                  value={adjustmentType}
                  exclusive
                  onChange={(_, value) => value && setAdjustmentType(value)}
                  fullWidth
                >
                  <ToggleButton value="add" color="success">
                    <AddIcon sx={{ mr: 1 }} /> Add Stock
                  </ToggleButton>
                  <ToggleButton value="remove" color="error">
                    <RemoveIcon sx={{ mr: 1 }} /> Remove Stock
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Controller
                name="deltaQty"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Quantity"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    sx={{ mb: 2 }}
                    inputProps={{ min: 1 }}
                    onChange={(event) => field.onChange(parseInt(event.target.value, 10) || 0)}
                  />
                )}
              />

              <Controller
                name="reason"
                control={form.control}
                render={({ field }) => (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Reason</InputLabel>
                    <Select {...field} label="Reason">
                      {adjustmentReasons.map((reason) => (
                        <MenuItem key={reason} value={reason}>{reason}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="notes"
                control={form.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Notes (Optional)"
                    multiline
                    rows={2}
                  />
                )}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button type="button" onClick={() => setAdjustDialogOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                color={adjustmentType === 'add' ? 'success' : 'error'}
              >
                {adjustmentType === 'add' ? 'Add' : 'Remove'} Stock
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}

      <Drawer
        anchor="right"
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        PaperProps={{ sx: { width: 500, p: 3 } }}
      >
        {selectedVariant && (
          <>
            <Typography variant="h6" gutterBottom>
              Stock Movement History
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">{selectedVariant.productName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedVariant.size} | {selectedVariant.color} | {selectedVariant.barcode}
              </Typography>
              <Chip
                label={`Current Stock: ${selectedVariant.stockQty}`}
                color={selectedVariant.stockQty === 0 ? 'error' : 'success'}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>

            {supplierSummary.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Suppliers for this item
                </Typography>
                <TableContainer sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Supplier</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        {isAdmin && <TableCell align="right">Avg Cost</TableCell>}
                        <TableCell>Last Purchase</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {supplierSummary.map((summary) => (
                        <TableRow key={summary.supplierId}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {summary.supplierName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {summary.purchaseCount} purchase{summary.purchaseCount > 1 ? 's' : ''}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{summary.totalQty}</Typography>
                          </TableCell>
                          {isAdmin && (
                            <TableCell align="right">
                              <Money value={summary.avgUnitCost} />
                            </TableCell>
                          )}
                          <TableCell>
                            <Typography variant="caption">
                              {dayjs(summary.lastPurchaseDate).format('MMM D, YY')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Movement History
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <Typography variant="caption">
                          {dayjs(movement.date).format('MMM D, YY')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={movement.type}
                          size="small"
                          color={
                            movement.type === 'PURCHASE' ? 'success' :
                            movement.type === 'SALE' ? 'primary' :
                            movement.type === 'VOID_RESTORE' ? 'info' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={movement.qty > 0 ? 'success.main' : 'error.main'}
                          fontWeight={500}
                        >
                          {movement.qty > 0 ? '+' : ''}{movement.qty}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {movement.type === 'PURCHASE' ? (
                          <Box>
                            <Link
                              component={RouterLink}
                              to={`/purchases?id=${movement.referenceId}`}
                              underline="hover"
                              sx={{
                                display: 'block',
                                fontWeight: 500,
                                fontSize: '0.75rem',
                              }}
                            >
                              {movement.supplierName}
                            </Link>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {movement.referenceNo ? `Inv: ${movement.referenceNo}` : ''}
                              {isAdmin && movement.unitCost ? ` @ ₹${movement.unitCost.toFixed(0)}` : ''}
                            </Typography>
                          </Box>
                        ) : (movement.type === 'SALE' || movement.type === 'VOID_RESTORE') && movement.referenceNo ? (
                          <Link
                            component={RouterLink}
                            to={`/sales/${movement.referenceId}`}
                            underline="hover"
                            sx={{ fontSize: '0.75rem' }}
                          >
                            {movement.referenceNo}
                            {movement.type === 'VOID_RESTORE' && ' (Voided)'}
                          </Link>
                        ) : (
                          <Typography variant="caption">
                            {movement.referenceNo || movement.notes || '-'}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {movements.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No movement history yet</Typography>
              </Box>
            )}
          </>
        )}
      </Drawer>
    </Box>
  );
}
