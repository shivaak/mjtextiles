import { useState, useEffect, useCallback, useRef } from 'react';
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
  Tabs,
  Tab,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  Grid,
  Typography,
  Autocomplete,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams, GridPaginationModel } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import PageHeader from '../../components/common/PageHeader';
import Money from '../../components/common/Money';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../app/context/NotificationContext';
import { useAuth } from '../../app/context/AuthContext';
import { productService } from '../../services/productService';
import { settingsService } from '../../services/settingsService';
import { formatApiError } from '../../services/api';
import { lookupService } from '../../services/lookupService';
import type {
  Product,
  Variant,
  VariantStatus,
  CreateProductRequest,
  UpdateProductRequest,
  CreateVariantRequest,
  UpdateVariantRequest,
  Settings,
} from '../../domain/types';
import { calculateMarkupPercent, isLowStock, isOutOfStock } from '../../utils/calculations';

// Schemas
const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  brand: z.string().min(1, 'Brand is required'),
  category: z.string().min(1, 'Category is required'),
  hsn: z.string().min(1, 'HSN is required'),
  description: z.string().optional(),
  defaultDiscountPercent: z.number().min(0).max(100).optional(),
});

const variantSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().min(1, 'Barcode is required'),
  size: z.string().min(1, 'Size is required'),
  color: z.string().min(1, 'Color is required'),
  sellingPrice: z.number().min(0.01, 'Selling price must be greater than 0'),
  avgCost: z.number().min(0, 'Cost must be positive'),
  defaultDiscountPercent: z.number().min(0).max(100).nullable().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;
type VariantFormData = z.infer<typeof variantSchema>;

export default function ProductsPage() {
  const { success: showSuccess, error: showError } = useNotification();
  const { isAdmin } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<'products' | 'variants'>('products');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [productRows, setProductRows] = useState<Product[]>([]);
  const [productTotalElements, setProductTotalElements] = useState(0);
  const [productLoading, setProductLoading] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<VariantStatus | ''>('');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [productPaginationModel, setProductPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });

  // Filter options
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Product search for variant dialog
  const [productSearchOptions, setProductSearchOptions] = useState<Product[]>([]);
  const productSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dialog states
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{ variant: Variant; newStatus: VariantStatus } | null>(null);
  const [productActionConfirm, setProductActionConfirm] = useState<{
    product: Product;
    action: 'delete' | 'deactivate' | 'activate';
  } | null>(null);

  // Forms
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', brand: '', category: '', hsn: '', description: '', defaultDiscountPercent: 0 },
  });

  const variantForm = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      productId: 0,
      sku: '',
      barcode: '',
      size: '',
      color: '',
      sellingPrice: 0,
      avgCost: 0,
      defaultDiscountPercent: null,
    },
  });

  // Fetch variants
  const fetchVariants = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productService.getVariants({
        category: categoryFilter || undefined,
        brand: brandFilter || undefined,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page: paginationModel.page,
        size: paginationModel.pageSize,
      });
      setVariants(data.content);
      setTotalElements(data.totalElements);
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to fetch variants'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, brandFilter, statusFilter, searchQuery, paginationModel, showError]);

  const fetchProducts = useCallback(async () => {
    setProductLoading(true);
    try {
      const data = await productService.getProducts({
        category: categoryFilter || undefined,
        brand: brandFilter || undefined,
        search: searchQuery || undefined,
        includeInactive: true,
        page: productPaginationModel.page,
        size: productPaginationModel.pageSize,
      });
      setProductRows(data.content);
      setProductTotalElements(data.totalElements);
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to fetch products'));
      console.error(error);
    } finally {
      setProductLoading(false);
    }
  }, [categoryFilter, brandFilter, searchQuery, productPaginationModel, showError]);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [lookups, productsData] = await Promise.all([
        lookupService.getLookups(),
        productService.getProducts({ size: 1000 }),
      ]);
      setCategories(lookups.categories || []);
      setBrands(lookups.brands || []);
      setProducts(productsData.content);
    } catch (error) {
      showError(formatApiError(error, 'Failed to load filter options'));
      console.error('Failed to fetch filter options', error);
    }
  }, [showError]);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (error) {
      showError(formatApiError(error, 'Failed to load settings'));
      console.error('Failed to fetch settings', error);
      // Default threshold if fetch fails
      setSettings({ lowStockThreshold: 10 } as Settings);
    }
  }, [showError]);

  const handleProductSearch = useCallback((query: string) => {
    if (productSearchTimer.current) {
      clearTimeout(productSearchTimer.current);
    }
    if (!query || query.length < 2) {
      setProductSearchOptions(products);
      return;
    }
    productSearchTimer.current = setTimeout(async () => {
      try {
        const data = await productService.getProducts({ search: query, size: 20 });
        setProductSearchOptions(data.content);
      } catch (error) {
        console.error('Failed to search products', error);
      }
    }, 300);
  }, [products]);

  // Initial load
  useEffect(() => {
    if (activeTab === 'variants') {
      fetchVariants();
    }
  }, [activeTab, fetchVariants]);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab, fetchProducts]);

  useEffect(() => {
    fetchFilterOptions();
    fetchSettings();
  }, [fetchFilterOptions, fetchSettings]);

  // Handlers
  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      productForm.reset({
        name: product.name,
        brand: product.brand,
        category: product.category,
        hsn: product.hsn,
        description: product.description || '',
        defaultDiscountPercent: product.defaultDiscountPercent || 0,
      });
    } else {
      setEditingProduct(null);
      productForm.reset({ name: '', brand: '', category: '', hsn: '', description: '', defaultDiscountPercent: 0 });
    }
    setProductDialogOpen(true);
  };

  const openVariantDialog = (variant?: Variant) => {
    if (variant) {
      setEditingVariant(variant);
      variantForm.reset({
        productId: variant.productId,
        sku: variant.sku,
        barcode: variant.barcode,
        size: variant.size,
        color: variant.color,
        sellingPrice: variant.sellingPrice,
        avgCost: variant.avgCost,
        defaultDiscountPercent: variant.effectiveDiscountPercent ?? null,
      });
    } else {
      setEditingVariant(null);
      variantForm.reset({
        productId: 0,
        sku: '',
        barcode: '',
        size: '',
        color: '',
        sellingPrice: 0,
        avgCost: 0,
        defaultDiscountPercent: null,
      });
    }
    setVariantDialogOpen(true);
  };

  const handleSaveProduct = async (data: ProductFormData) => {
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, data as UpdateProductRequest);
        showSuccess('Product updated successfully');
      } else {
        await productService.createProduct(data as CreateProductRequest);
        showSuccess('Product created successfully');
      }
      setProductDialogOpen(false);
      fetchFilterOptions(); // Refresh products for dropdown
      fetchVariants(); // Refresh variants list
      fetchProducts(); // Refresh products list
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to save product'));
    }
  };

  const handleSaveVariant = async (data: VariantFormData) => {
    try {
      if (editingVariant) {
        const { productId: _productId, ...updateData } = data;
        await productService.updateVariant(editingVariant.id, updateData as UpdateVariantRequest);
        showSuccess('Variant updated successfully');
      } else {
        await productService.createVariant(data as CreateVariantRequest);
        showSuccess('Variant created. Add stock via Purchases or Inventory adjustment.');
      }
      setVariantDialogOpen(false);
      fetchVariants();
      fetchProducts();
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to save variant'));
    }
  };

  const handleStatusChange = async () => {
    if (!statusConfirm) return;
    try {
      await productService.updateVariantStatus(statusConfirm.variant.id, statusConfirm.newStatus);
      showSuccess(`Variant ${statusConfirm.newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
      setStatusConfirm(null);
      fetchVariants();
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to update variant status'));
    }
  };

  const handleProductAction = async () => {
    if (!productActionConfirm) return;
    try {
      if (productActionConfirm.action === 'activate') {
        await productService.updateProductStatus(productActionConfirm.product.id, 'ACTIVE');
        showSuccess('Product activated and variants enabled');
      } else if (productActionConfirm.action === 'deactivate') {
        await productService.updateProductStatus(productActionConfirm.product.id, 'INACTIVE');
        showSuccess('Product deactivated and variants disabled');
      } else {
        await productService.deleteOrDeactivateProduct(productActionConfirm.product.id);
        showSuccess('Product deleted successfully');
      }
      setProductActionConfirm(null);
      fetchProducts();
      fetchVariants();
      fetchFilterOptions();
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to update product'));
    }
  };

  // Columns
  const productColumns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Product',
      flex: 1,
      minWidth: 220,
      renderCell: (params: GridRenderCellParams<Product>) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {params.row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.brand}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 140,
    },
    {
      field: 'hsn',
      headerName: 'HSN',
      width: 120,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 200,
      valueGetter: (_value: unknown, row: Product) => row.description || '-',
    },
    {
      field: 'variantCount',
      headerName: 'Variants',
      width: 110,
      align: 'center',
      renderCell: (params: GridRenderCellParams<Product>) => (
        <Chip label={params.row.variantCount ?? 0} size="small" />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params: GridRenderCellParams<Product>) => (
        <Chip
          label={params.row.isActive ? 'ACTIVE' : 'INACTIVE'}
          size="small"
          color={params.row.isActive ? 'success' : 'default'}
        />
      ),
    },
    ...(isAdmin ? [{
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Product>) => {
        const variantCount = params.row.variantCount ?? 0;
        const isActive = params.row.isActive !== false;
        const action: 'delete' | 'deactivate' | 'activate' = isActive
          ? (variantCount === 0 ? 'delete' : 'deactivate')
          : 'activate';
        return (
          <Box>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => openProductDialog(params.row)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={action === 'delete' ? 'Delete' : action === 'deactivate' ? 'Deactivate' : 'Activate'}>
              <IconButton
                size="small"
                onClick={() => setProductActionConfirm({ product: params.row, action })}
              >
                {action === 'activate' ? (
                  <CheckCircleIcon fontSize="small" color="success" />
                ) : action === 'delete' ? (
                  <DeleteIcon fontSize="small" color="error" />
                ) : (
                  <BlockIcon fontSize="small" color="error" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    }] : []),
  ];

  const variantColumns: GridColDef[] = [
    {
      field: 'barcode',
      headerName: 'Barcode',
      width: 130,
    },
    {
      field: 'sku',
      headerName: 'SKU',
      width: 150,
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
            {params.row.productBrand}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'productHsn',
      headerName: 'HSN',
      width: 110,
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
      width: 80,
      align: 'center',
      renderCell: (params: GridRenderCellParams<Variant>) => {
        const stock = params.value as number;
        const threshold = settings?.lowStockThreshold || 10;
        return (
          <Chip
            label={stock}
            size="small"
            color={
              isOutOfStock(stock) ? 'error' :
              isLowStock(stock, threshold) ? 'warning' : 'default'
            }
          />
        );
      },
    },
    {
      field: 'sellingPrice',
      headerName: 'Price',
      width: 100,
      align: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Money value={params.value as number} />
      ),
    },
    ...(isAdmin ? [
      {
        field: 'avgCost',
        headerName: 'Cost',
        width: 100,
        align: 'right' as const,
        renderCell: (params: GridRenderCellParams) => (
          <Money value={params.value as number} />
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
        renderCell: (params: GridRenderCellParams) => {
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
              <Typography variant="body2" color={markup >= 20 ? 'success.main' : 'warning.main'} sx={{ cursor: 'help' }}>
                {markup.toFixed(1)}%
              </Typography>
            </Tooltip>
          );
        },
      },
      {
        field: 'effectiveDiscountPercent',
        headerName: 'Discount',
        width: 90,
        align: 'right' as const,
        valueGetter: (_value: unknown, row: Variant) => row.effectiveDiscountPercent ?? 0,
        renderCell: (params: GridRenderCellParams) => {
          const discount = params.value as number;
          return (
            <Typography variant="body2" color={discount > 0 ? 'info.main' : 'text.secondary'}>
              {discount}%
            </Typography>
          );
        },
      }
    ] : []),
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params: GridRenderCellParams<Variant>) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'ACTIVE' ? 'success' : 'default'}
        />
      ),
    },
    ...(isAdmin ? [{
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Variant>) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openVariantDialog(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
            <IconButton
              size="small"
              onClick={() => setStatusConfirm({
                variant: params.row,
                newStatus: params.row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
              })}
            >
              {params.row.status === 'ACTIVE' ? (
                <BlockIcon fontSize="small" color="error" />
              ) : (
                <CheckCircleIcon fontSize="small" color="success" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    }] : []),
  ];

  return (
    <Box>
      <PageHeader
        title="Products"
        subtitle="Manage products and variants"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Products' },
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => openProductDialog()}
            >
              Add Product
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openVariantDialog()}
            >
              Add Variant
            </Button>
          </Box>
        }
      />

      <Box sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_event, value) => setActiveTab(value)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Products" value="products" />
          <Tab label="Variants" value="variants" />
        </Tabs>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder={
                  activeTab === 'products'
                    ? 'Search by name, brand, category, HSN...'
                    : 'Search by name, SKU, barcode, HSN...'
                }
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
            {activeTab === 'variants' && (
              <Grid size={{ xs: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value as VariantStatus | '')}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      {activeTab === 'products' ? (
        <Card>
          <Box sx={{ width: '100%', overflow: 'auto' }}>
            <DataGrid
              rows={productRows}
              columns={productColumns}
              rowCount={productTotalElements}
              loading={productLoading}
              pageSizeOptions={[10, 25, 50]}
              paginationModel={productPaginationModel}
              paginationMode="server"
              onPaginationModelChange={setProductPaginationModel}
              disableRowSelectionOnClick
              sx={{ border: 0, minHeight: 500, minWidth: 800 }}
              getRowHeight={() => 60}
              autoHeight
            />
          </Box>
        </Card>
      ) : (
        <Card>
          <Box sx={{ width: '100%', overflow: 'auto' }}>
            <DataGrid
              rows={variants}
              columns={variantColumns}
              rowCount={totalElements}
              loading={loading}
              pageSizeOptions={[10, 25, 50]}
              paginationModel={paginationModel}
              paginationMode="server"
              onPaginationModelChange={setPaginationModel}
              disableRowSelectionOnClick
              sx={{ border: 0, minHeight: 500, minWidth: 800 }}
              getRowHeight={() => 60}
              autoHeight
            />
          </Box>
        </Card>
      )}

      {/* Product Dialog */}
      <Dialog
        open={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={productForm.handleSubmit(handleSaveProduct)}>
          <DialogTitle>
            {editingProduct ? 'Edit Product' : 'Add Product'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="name"
                  control={productForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Product Name"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="brand"
                  control={productForm.control}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      freeSolo
                      options={brands}
                      value={field.value}
                      onChange={(_, value) => field.onChange(value || '')}
                      onInputChange={(_, value) => field.onChange(value)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Brand"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="category"
                  control={productForm.control}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      freeSolo
                      options={categories}
                      value={field.value}
                      onChange={(_, value) => field.onChange(value || '')}
                      onInputChange={(_, value) => field.onChange(value)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Category"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="hsn"
                  control={productForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="HSN"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="description"
                  control={productForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description (Optional)"
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="defaultDiscountPercent"
                  control={productForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                      fullWidth
                      label="Default Discount % (applies to all variants)"
                      type="number"
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button type="button" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Variant Dialog */}
      <Dialog
        open={variantDialogOpen}
        onClose={() => setVariantDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={variantForm.handleSubmit(handleSaveVariant)}>
          <DialogTitle>
            {editingVariant ? 'Edit Variant' : 'Add Variant'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="productId"
                  control={variantForm.control}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      options={productSearchOptions.length > 0 ? productSearchOptions : products}
                      getOptionLabel={(option) => `${option.name} (${option.brand})`}
                      value={
                        [...products, ...productSearchOptions].find((p) => p.id === field.value) || null
                      }
                      onChange={(_, value) => {
                        field.onChange(value ? value.id : 0);
                      }}
                      onInputChange={(_, value, reason) => {
                        if (reason === 'input') {
                          handleProductSearch(value);
                        }
                        if (reason === 'clear') {
                          field.onChange(0);
                          setProductSearchOptions(products);
                        }
                      }}
                      onFocus={() => setProductSearchOptions(products)}
                      isOptionEqualToValue={(option, val) => option.id === val.id}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Product"
                          placeholder="Search product..."
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} key={option.id}>
                          <Box>
                            <Typography variant="body2">{option.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.brand} | {option.category}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="sku"
                  control={variantForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="SKU"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="barcode"
                  control={variantForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Barcode"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="size"
                  control={variantForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Size"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="color"
                  control={variantForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Color"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="sellingPrice"
                  control={variantForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Selling Price"
                      type="number"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                    />
                  )}
                />
              </Grid>
              {isAdmin && (
                <Grid size={{ xs: 6 }}>
                  <Controller
                    name="avgCost"
                    control={variantForm.control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Cost"
                        type="number"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                      />
                    )}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="defaultDiscountPercent"
                  control={variantForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                      fullWidth
                      label="Default Discount % (Optional)"
                      type="number"
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message || 'Leave empty to use product discount'}
                    />
                  )}
                />
              </Grid>
              {!editingVariant && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    💡 Stock starts at 0. Add stock through <strong>Purchases</strong> (from supplier) or <strong>Inventory → Adjust Stock</strong> (for existing inventory).
                  </Typography>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button type="button" onClick={() => setVariantDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingVariant ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Status Change Confirmation */}
      <ConfirmDialog
        open={!!statusConfirm}
        title={statusConfirm?.newStatus === 'ACTIVE' ? 'Activate Variant' : 'Deactivate Variant'}
        message={
          statusConfirm?.newStatus === 'ACTIVE'
            ? 'This variant will be available for sale again.'
            : 'This variant will no longer be available for sale.'
        }
        confirmText={statusConfirm?.newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'}
        confirmColor={statusConfirm?.newStatus === 'ACTIVE' ? 'success' : 'error'}
        onConfirm={handleStatusChange}
        onCancel={() => setStatusConfirm(null)}
      />

      {/* Product Action Confirmation */}
      <ConfirmDialog
        open={!!productActionConfirm}
        title={
          productActionConfirm?.action === 'delete'
            ? 'Delete Product'
            : productActionConfirm?.action === 'activate'
              ? 'Activate Product'
              : 'Deactivate Product'
        }
        message={
          productActionConfirm?.action === 'delete'
            ? 'This product has no variants and will be permanently deleted.'
            : productActionConfirm?.action === 'activate'
              ? 'This product and all its variants will be activated.'
              : 'This product has variants and will be deactivated. All its variants will be disabled.'
        }
        confirmText={
          productActionConfirm?.action === 'delete'
            ? 'Delete'
            : productActionConfirm?.action === 'activate'
              ? 'Activate'
              : 'Deactivate'
        }
        confirmColor={productActionConfirm?.action === 'activate' ? 'success' : 'error'}
        onConfirm={handleProductAction}
        onCancel={() => setProductActionConfirm(null)}
      />
    </Box>
  );
}
