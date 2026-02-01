// Inventory page - stock management and tracking

import { useState, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import HistoryIcon from '@mui/icons-material/History';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';

import { PageHeader, Money } from '../../components/common';
import { useNotification } from '../../app/context/NotificationContext';
import { useAuth } from '../../app/context/AuthContext';
import {
  getAllVariantsWithProducts,
  getCategories,
  getBrands,
  getSettings,
  createStockAdjustment,
  getStockAdjustmentsByVariant,
  getAllPurchaseItems,
  getAllSaleItems,
  getAllPurchases,
  getAllSales,
  getAllSuppliers,
} from '../../data/repositories';
import type { VariantWithProduct, StockMovement, VariantSupplierSummary } from '../../domain/types';
import { calculateStockValue, calculateMarginPercent, calculateMarkupPercent } from '../../domain/calculations';

// Schema for stock adjustment
const adjustmentSchema = z.object({
  deltaQty: z.number().refine(val => val !== 0, 'Quantity cannot be zero'),
  reason: z.enum(['OPENING_STOCK', 'DAMAGE', 'THEFT', 'CORRECTION', 'RETURN', 'OTHER']),
  notes: z.string().optional(),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

export default function InventoryPage() {
  const { session, isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const settings = getSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('');
  
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<VariantWithProduct | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');

  // Data
  const variants = getAllVariantsWithProducts();
  const categories = getCategories();
  const brands = getBrands();

  // Filtered variants
  const filteredVariants = useMemo(() => {
    return variants.filter(v => {
      if (v.status !== 'ACTIVE') return false;
      
      const matchesSearch = !searchQuery ||
        v.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.barcode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || v.productCategory === categoryFilter;
      const matchesBrand = !brandFilter || v.productBrand === brandFilter;
      
      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = v.stockQty > 0 && v.stockQty <= settings.lowStockThreshold;
      } else if (stockFilter === 'out') {
        matchesStock = v.stockQty === 0;
      } else if (stockFilter === 'in') {
        matchesStock = v.stockQty > settings.lowStockThreshold;
      }
      
      return matchesSearch && matchesCategory && matchesBrand && matchesStock;
    });
  }, [variants, searchQuery, categoryFilter, brandFilter, stockFilter, settings.lowStockThreshold]);

  // Summary stats
  const stats = useMemo(() => {
    const activeVariants = variants.filter(v => v.status === 'ACTIVE');
    const totalValue = activeVariants.reduce((sum, v) => sum + calculateStockValue(v), 0);
    const lowStock = activeVariants.filter(v => v.stockQty > 0 && v.stockQty <= settings.lowStockThreshold).length;
    const outOfStock = activeVariants.filter(v => v.stockQty === 0).length;
    const totalItems = activeVariants.reduce((sum, v) => sum + v.stockQty, 0);
    return { totalValue, lowStock, outOfStock, totalItems, totalSkus: activeVariants.length };
  }, [variants, settings.lowStockThreshold]);

  // Form
  const form = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      deltaQty: 1,
      reason: 'CORRECTION',
      notes: '',
    },
  });

  // Open adjust dialog
  const openAdjustDialog = (variant: VariantWithProduct) => {
    setSelectedVariant(variant);
    setAdjustmentType('add');
    form.reset({ deltaQty: 1, reason: 'CORRECTION', notes: '' });
    setAdjustDialogOpen(true);
  };

  // Get all suppliers for lookup
  const suppliers = getAllSuppliers();

  // Get stock movements for variant
  const getStockMovements = (variantId: string): StockMovement[] => {
    const movements: StockMovement[] = [];
    
    // Adjustments
    const adjustments = getStockAdjustmentsByVariant(variantId);
    adjustments.forEach(adj => {
      movements.push({
        id: adj.id,
        type: 'ADJUSTMENT',
        date: adj.createdAt,
        qty: adj.deltaQty,
        referenceId: adj.id,
        notes: `${adj.reason}${adj.notes ? ': ' + adj.notes : ''}`,
      });
    });

    // Purchases - now with supplier info
    const purchases = getAllPurchases();
    const purchaseItems = getAllPurchaseItems().filter(pi => pi.variantId === variantId);
    purchaseItems.forEach(pi => {
      const purchase = purchases.find(p => p.id === pi.purchaseId);
      if (purchase) {
        const supplier = suppliers.find(s => s.id === purchase.supplierId);
        movements.push({
          id: pi.id,
          type: 'PURCHASE',
          date: purchase.purchasedAt,
          qty: pi.qty,
          referenceId: purchase.id,
          referenceNo: purchase.invoiceNo,
          supplierName: supplier?.name || 'Unknown',
          unitCost: pi.unitCost,
        });
      }
    });

    // Sales
    const sales = getAllSales();
    const saleItems = getAllSaleItems().filter(si => si.variantId === variantId);
    saleItems.forEach(si => {
      const sale = sales.find(s => s.id === si.saleId);
      if (sale) {
        movements.push({
          id: si.id,
          type: sale.status === 'VOIDED' ? 'VOID_RESTORE' : 'SALE',
          date: sale.soldAt,
          qty: sale.status === 'VOIDED' ? si.qty : -si.qty,
          referenceId: sale.id,
          referenceNo: sale.billNo,
        });
      }
    });

    return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Get supplier summary for variant - shows all suppliers who have supplied this item
  const getSupplierSummary = (variantId: string): VariantSupplierSummary[] => {
    const purchases = getAllPurchases();
    const purchaseItems = getAllPurchaseItems().filter(pi => pi.variantId === variantId);
    
    const supplierMap: Record<string, {
      supplierId: string;
      supplierName: string;
      totalQty: number;
      purchaseCount: number;
      lastPurchaseDate: string;
      totalCost: number;
    }> = {};

    purchaseItems.forEach(pi => {
      const purchase = purchases.find(p => p.id === pi.purchaseId);
      if (purchase) {
        const supplier = suppliers.find(s => s.id === purchase.supplierId);
        const supplierId = purchase.supplierId;
        
        if (!supplierMap[supplierId]) {
          supplierMap[supplierId] = {
            supplierId,
            supplierName: supplier?.name || 'Unknown',
            totalQty: 0,
            purchaseCount: 0,
            lastPurchaseDate: purchase.purchasedAt,
            totalCost: 0,
          };
        }
        
        supplierMap[supplierId].totalQty += pi.qty;
        supplierMap[supplierId].purchaseCount += 1;
        supplierMap[supplierId].totalCost += pi.qty * pi.unitCost;
        
        if (purchase.purchasedAt > supplierMap[supplierId].lastPurchaseDate) {
          supplierMap[supplierId].lastPurchaseDate = purchase.purchasedAt;
        }
      }
    });

    return Object.values(supplierMap)
      .map(s => ({
        ...s,
        avgUnitCost: s.totalQty > 0 ? s.totalCost / s.totalQty : 0,
      }))
      .sort((a, b) => b.totalQty - a.totalQty);
  };

  // Open history drawer
  const openHistoryDrawer = (variant: VariantWithProduct) => {
    setSelectedVariant(variant);
    setHistoryDrawerOpen(true);
  };

  // Save adjustment
  const handleSaveAdjustment = (data: AdjustmentFormData) => {
    if (!selectedVariant) return;

    const actualDelta = adjustmentType === 'add' ? Math.abs(data.deltaQty) : -Math.abs(data.deltaQty);
    
    // Check if removal would cause negative stock
    if (actualDelta < 0 && selectedVariant.stockQty + actualDelta < 0) {
      showError('Cannot reduce stock below zero');
      return;
    }

    try {
      createStockAdjustment({
        variantId: selectedVariant.id,
        deltaQty: actualDelta,
        reason: data.reason,
        notes: data.notes,
        createdBy: session?.userId || '',
      });
      showSuccess('Stock adjusted successfully');
      setAdjustDialogOpen(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      showError(errorMessage);
    }
  };

  // Columns - cost-related columns are only shown to admins
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
      renderCell: (params: GridRenderCellParams<VariantWithProduct>) => (
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
      renderCell: (params: GridRenderCellParams<VariantWithProduct>) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 0 ? 'error' :
            (params.value as number) <= settings.lowStockThreshold ? 'warning' : 'success'
          }
        />
      ),
    },
    // Admin-only columns: avgCost, stockValue, markup
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
      valueGetter: (_value: unknown, row: VariantWithProduct) => calculateStockValue(row),
      renderCell: (params: GridRenderCellParams) => (
        <Typography fontWeight={500}><Money value={params.value as number} /></Typography>
      ),
    },
    {
      field: 'markup',
      headerName: 'Markup',
      width: 90,
      align: 'right' as const,
      valueGetter: (_value: unknown, row: VariantWithProduct) => calculateMarkupPercent(row.sellingPrice, row.avgCost),
      renderCell: (params: GridRenderCellParams<VariantWithProduct>) => (
        <Tooltip title={`Margin: ${calculateMarginPercent(params.row.sellingPrice, params.row.avgCost).toFixed(1)}%`}>
          <Typography variant="body2" color={(params.value as number) >= 30 ? 'success.main' : 'warning.main'}>
            {(params.value as number).toFixed(1)}%
          </Typography>
        </Tooltip>
      ),
    }] : []),
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams<VariantWithProduct>) => (
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
    },
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

      {/* Summary Cards */}
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

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search by name, SKU, barcode..."
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
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {categories.map(cat => (
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
                  onChange={(e) => setBrandFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {brands.map(brand => (
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

      {/* Data Grid */}
      <Card>
        <DataGrid
          rows={filteredVariants}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: 'stockQty', sort: 'asc' }] },
          }}
          disableRowSelectionOnClick
          sx={{ border: 0, minHeight: 500 }}
          getRowHeight={() => 60}
        />
      </Card>

      {/* Stock Adjustment Dialog */}
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
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                    <MenuItem value="OPENING_STOCK">Opening Stock (Existing Inventory)</MenuItem>
                    <MenuItem value="CORRECTION">Correction</MenuItem>
                    <MenuItem value="DAMAGE">Damage</MenuItem>
                    <MenuItem value="THEFT">Theft/Loss</MenuItem>
                    <MenuItem value="RETURN">Return</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
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

      {/* History Drawer */}
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

            {/* Supplier Summary Section */}
            {getSupplierSummary(selectedVariant.id).length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  📦 Suppliers for this item
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
                      {getSupplierSummary(selectedVariant.id).map((summary) => (
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
              📋 Movement History
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
                  {getStockMovements(selectedVariant.id).map((movement) => (
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

            {getStockMovements(selectedVariant.id).length === 0 && (
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
