import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Divider,
  Collapse,
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import LocalOfferIcon from '@mui/icons-material/LocalOffer';

import PageHeader from '../../components/common/PageHeader';
import Money from '../../components/common/Money';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../app/context/NotificationContext';
import { useAuth } from '../../app/context/AuthContext';
import { productService } from '../../services/productService';
import { settingsService } from '../../services/settingsService';
import { offerService } from '../../services/offerService';
import { formatApiError } from '../../services/api';
import { lookupService } from '../../services/lookupService';
import { shortCodeService } from '../../services/shortCodeService';
import { formatCurrency } from '../../utils/calculations';
import type {
  Product,
  Variant,
  Offer,
  VariantStatus,
  UpdateProductRequest,
  UpdateVariantRequest,
  ShortCode,
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

const editVariantSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  fabric: z.string().optional(),
  sellingPrice: z.number().min(0.01, 'Selling price must be greater than 0'),
  avgCost: z.number().min(0, 'Cost must be positive'),
  defaultDiscountPercent: z.number().min(0).max(100).nullable().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;
type EditVariantFormData = z.infer<typeof editVariantSchema>;

// Inline variant row type for multi-variant creation
interface VariantRow {
  key: string;
  fabric: string;
  color: string;
  size: string;
  sellingPrice: number;
  avgCost: number;
  initialStock: number;
  sku: string;
  barcode: string;
  skuEdited: boolean;
  barcodeEdited: boolean;
  defaultDiscountPercent: number | null;
}

const createEmptyVariantRow = (): VariantRow => ({
  key: crypto.randomUUID(),
  fabric: '',
  color: '',
  size: '',
  sellingPrice: 0,
  avgCost: 0,
  initialStock: 0,
  sku: '',
  barcode: '',
  skuEdited: false,
  barcodeEdited: false,
  defaultDiscountPercent: null,
});

// SKU generation helper
function generateSku(
  categoryCode: string,
  brandCode: string,
  fabricCode: string,
  colorCode: string,
  sizeCode: string
): string {
  const parts: string[] = [];
  if (categoryCode) parts.push(categoryCode.toUpperCase());
  if (brandCode) parts.push(brandCode.toUpperCase());
  if (fabricCode) parts.push(fabricCode.toUpperCase());
  if (colorCode) parts.push(colorCode.toUpperCase());
  if (sizeCode) parts.push(sizeCode.toUpperCase());
  return parts.join('-');
}

function getShortCodeForName(shortCodes: ShortCode[], type: string, name: string): string {
  const found = shortCodes.find(
    (sc) => sc.type === type && sc.name.toLowerCase() === name.toLowerCase()
  );
  return found?.shortCode || '';
}

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
  const [offerFilter, setOfferFilter] = useState<'' | 'with' | 'without'>('');
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
  const [fabrics, setFabrics] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [shortCodes, setShortCodes] = useState<ShortCode[]>([]);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);

  // Product search for variant dialog
  const [productSearchOptions, setProductSearchOptions] = useState<Product[]>([]);
  const productSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dialog states
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [editVariantDialogOpen, setEditVariantDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{ variant: Variant; newStatus: VariantStatus } | null>(null);
  const [productActionConfirm, setProductActionConfirm] = useState<{
    product: Product;
    action: 'delete' | 'deactivate' | 'activate';
  } | null>(null);

  // Inline variant rows for product dialog
  const [variantRowsForProduct, setVariantRowsForProduct] = useState<VariantRow[]>([]);
  const [showVariantsSection, setShowVariantsSection] = useState(false);

  // Inline variant rows for standalone variant dialog
  const [variantRowsForBatch, setVariantRowsForBatch] = useState<VariantRow[]>([createEmptyVariantRow()]);
  const [batchProductId, setBatchProductId] = useState<number>(0);

  // Short code dialog state
  const [shortCodeDialogOpen, setShortCodeDialogOpen] = useState(false);
  const [newShortCodeType, setNewShortCodeType] = useState<'CATEGORY' | 'BRAND' | 'FABRIC' | 'SIZE' | 'COLOR'>('CATEGORY');
  const [newShortCodeName, setNewShortCodeName] = useState('');
  const [newShortCodeValue, setNewShortCodeValue] = useState('');
  const [shortCodeCallback, setShortCodeCallback] = useState<((name: string) => void) | null>(null);

  // Saving state
  const [saving, setSaving] = useState(false);

  // Forms
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', brand: '', category: '', hsn: '', description: '', defaultDiscountPercent: 0 },
  });

  const editVariantForm = useForm<EditVariantFormData>({
    resolver: zodResolver(editVariantSchema),
    defaultValues: {
      productId: 0, sku: '', barcode: '', size: '', color: '', fabric: '',
      sellingPrice: 0, avgCost: 0, defaultDiscountPercent: null,
    },
  });

  // Watch product form values for SKU generation
  const watchedBrand = productForm.watch('brand');
  const watchedCategory = productForm.watch('category');

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
      setFabrics(lookups.fabrics || []);
      setSizes(lookups.sizes || []);
      setColors(lookups.colors || []);
      setShortCodes(lookups.shortCodes || []);
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

  const fetchActiveOffers = useCallback(async () => {
    try {
      const data = await offerService.getActiveOffers();
      setActiveOffers(data);
    } catch {
      // Silently fail — offers are supplementary info
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
    fetchSettings();
    fetchActiveOffers();
  }, [fetchFilterOptions, fetchSettings, fetchActiveOffers]);

  // Auto-update SKUs for product dialog variant rows
  useEffect(() => {
    const catCode = getShortCodeForName(shortCodes, 'CATEGORY', watchedCategory);
    const braCode = getShortCodeForName(shortCodes, 'BRAND', watchedBrand);

    setVariantRowsForProduct((prev) =>
      prev.map((row) => {
        if (row.skuEdited) return row;
        const fabCode = getShortCodeForName(shortCodes, 'FABRIC', row.fabric);
        const colCode = getShortCodeForName(shortCodes, 'COLOR', row.color);
        const szCode = getShortCodeForName(shortCodes, 'SIZE', row.size);
        const newSku = generateSku(catCode, braCode, fabCode, colCode, szCode);
        const newBarcode = row.barcodeEdited ? row.barcode : newSku;
        return { ...row, sku: newSku, barcode: newBarcode };
      })
    );
  }, [watchedCategory, watchedBrand, shortCodes]);

  // Helper: update a variant row and regenerate SKU
  const updateVariantRow = useCallback(
    (
      _rows: VariantRow[],
      setRows: React.Dispatch<React.SetStateAction<VariantRow[]>>,
      key: string,
      field: keyof VariantRow,
      value: string | number | boolean | null,
      catName?: string,
      brandName?: string
    ) => {
      setRows((prev) =>
        prev.map((row) => {
          if (row.key !== key) return row;
          const updated = { ...row, [field]: value };

          // Regenerate SKU if not manually edited
          if (!updated.skuEdited && field !== 'skuEdited') {
            const cat = catName ?? watchedCategory;
            const bra = brandName ?? watchedBrand;
            const catCode = getShortCodeForName(shortCodes, 'CATEGORY', cat);
            const braCode = getShortCodeForName(shortCodes, 'BRAND', bra);
            const fabCode = getShortCodeForName(shortCodes, 'FABRIC', updated.fabric);
            const colCode = getShortCodeForName(shortCodes, 'COLOR', updated.color);
            const szCode = getShortCodeForName(shortCodes, 'SIZE', updated.size);
            updated.sku = generateSku(catCode, braCode, fabCode, colCode, szCode);
          }
          // Sync barcode with SKU if not manually edited
          if (!updated.barcodeEdited) {
            updated.barcode = updated.sku;
          }
          return updated;
        })
      );
    },
    [shortCodes, watchedCategory, watchedBrand]
  );

  // Short code dialog
  const openShortCodeDialog = (type: 'CATEGORY' | 'BRAND' | 'FABRIC' | 'SIZE' | 'COLOR', name: string, callback: (name: string) => void) => {
    setNewShortCodeType(type);
    setNewShortCodeName(name);
    setNewShortCodeValue(name.substring(0, 3).toUpperCase());
    setShortCodeCallback(() => callback);
    setShortCodeDialogOpen(true);
  };

  const handleSaveShortCode = async () => {
    try {
      await shortCodeService.createShortCode({
        type: newShortCodeType,
        name: newShortCodeName,
        shortCode: newShortCodeValue.toUpperCase(),
      });
      showSuccess(`${newShortCodeType.charAt(0) + newShortCodeType.slice(1).toLowerCase()} "${newShortCodeName}" added`);
      setShortCodeDialogOpen(false);
      // Refresh lookups to get updated short codes
      const lookups = await lookupService.getLookups();
      setCategories(lookups.categories || []);
      setBrands(lookups.brands || []);
      setFabrics(lookups.fabrics || []);
      setSizes(lookups.sizes || []);
      setColors(lookups.colors || []);
      setShortCodes(lookups.shortCodes || []);
      if (shortCodeCallback) shortCodeCallback(newShortCodeName);
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to save short code'));
    }
  };

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
      setVariantRowsForProduct([]);
      setShowVariantsSection(false);
    } else {
      setEditingProduct(null);
      productForm.reset({ name: '', brand: '', category: '', hsn: '', description: '', defaultDiscountPercent: 0 });
      setVariantRowsForProduct([]);
      setShowVariantsSection(false);
    }
    setProductDialogOpen(true);
  };

  const openBatchVariantDialog = () => {
    setBatchProductId(0);
    setVariantRowsForBatch([createEmptyVariantRow()]);
    setVariantDialogOpen(true);
  };

  const openEditVariantDialog = (variant: Variant) => {
    setEditingVariant(variant);
    editVariantForm.reset({
      productId: variant.productId,
      sku: variant.sku,
      barcode: variant.barcode,
      size: variant.size,
      color: variant.color,
      fabric: variant.fabric || '',
      sellingPrice: variant.sellingPrice,
      avgCost: variant.avgCost,
      defaultDiscountPercent: variant.effectiveDiscountPercent ?? null,
    });
    setEditVariantDialogOpen(true);
  };

  const handleSaveProduct = async (data: ProductFormData) => {
    setSaving(true);
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, data as UpdateProductRequest);
        showSuccess('Product updated successfully');
      } else {
        // Check if there are variants to create with the product
        const validVariants = variantRowsForProduct.filter((r) => r.sku && r.sellingPrice > 0);
        if (validVariants.length > 0) {
          await productService.createProductWithVariants({
            ...data,
            variants: validVariants.map((r) => ({
              sku: r.sku,
              barcode: r.barcode || undefined,
              size: r.size || undefined,
              color: r.color || undefined,
              fabric: r.fabric || undefined,
              sellingPrice: r.sellingPrice,
              avgCost: r.avgCost || undefined,
              defaultDiscountPercent: r.defaultDiscountPercent ?? undefined,
              initialStock: r.initialStock || undefined,
            })),
          });
          showSuccess(`Product created with ${validVariants.length} variant(s)`);
        } else {
          await productService.createProduct(data);
          showSuccess('Product created successfully');
        }
      }
      setProductDialogOpen(false);
      fetchFilterOptions();
      fetchVariants();
      fetchProducts();
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to save product'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBatchVariants = async () => {
    if (!batchProductId) {
      showError('Please select a product');
      return;
    }
    const validVariants = variantRowsForBatch.filter((r) => r.sku && r.sellingPrice > 0);
    if (validVariants.length === 0) {
      showError('Please add at least one variant with SKU and selling price');
      return;
    }
    setSaving(true);
    try {
      await productService.createVariantsBatch({
        productId: batchProductId,
        variants: validVariants.map((r) => ({
          sku: r.sku,
          barcode: r.barcode || undefined,
          size: r.size || undefined,
          color: r.color || undefined,
          fabric: r.fabric || undefined,
          sellingPrice: r.sellingPrice,
          avgCost: r.avgCost || undefined,
          defaultDiscountPercent: r.defaultDiscountPercent ?? undefined,
          initialStock: r.initialStock || undefined,
        })),
      });
      showSuccess(`${validVariants.length} variant(s) created successfully`);
      setVariantDialogOpen(false);
      fetchVariants();
      fetchProducts();
      fetchFilterOptions();
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to create variants'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateVariant = async (data: EditVariantFormData) => {
    if (!editingVariant) return;
    setSaving(true);
    try {
      const { productId: _productId, ...updateData } = data;
      await productService.updateVariant(editingVariant.id, updateData as UpdateVariantRequest);
      showSuccess('Variant updated successfully');
      setEditVariantDialogOpen(false);
      fetchVariants();
      fetchProducts();
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to update variant'));
    } finally {
      setSaving(false);
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

  // Helper: strip "+ Add ..." prefix if present
  const stripAddPrefix = (value: string): string => {
    if (value.startsWith('+ Add "') && value.endsWith('"')) {
      return value.slice(7, -1);
    }
    return value;
  };

  // Helper: build creatable autocomplete options for brand/category
  const buildCreatableOptions = (options: string[], type: 'CATEGORY' | 'BRAND') => {
    return {
      options,
      filterOptions: (opts: string[], state: { inputValue: string }) => {
        const filtered = opts.filter((o) => o.toLowerCase().includes(state.inputValue.toLowerCase()));
        if (state.inputValue !== '' && !opts.some((o) => o.toLowerCase() === state.inputValue.toLowerCase())) {
          filtered.push(`+ Add "${state.inputValue}"`);
        }
        return filtered;
      },
      handleChange: (value: string | null, fieldOnChange: (v: string) => void) => {
        if (value && value.startsWith('+ Add "')) {
          const name = value.slice(7, -1);
          openShortCodeDialog(type, name, (savedName) => {
            fieldOnChange(savedName);
          });
          fieldOnChange(name);
        } else {
          fieldOnChange(value || '');
        }
      },
      handleInputChange: (value: string, reason: string, fieldOnChange: (v: string) => void) => {
        if (reason === 'input') {
          fieldOnChange(stripAddPrefix(value));
        } else if (reason === 'reset') {
          fieldOnChange(stripAddPrefix(value));
        }
      },
      // On blur, if the typed text doesn't match any known option, clear it
      handleBlur: (currentValue: string, fieldOnChange: (v: string) => void) => {
        if (currentValue && !options.some((o) => o.toLowerCase() === currentValue.toLowerCase())) {
          fieldOnChange('');
        }
      },
    };
  };

  // Helper: find active offers for a product or variant
  const getOffersForProduct = useCallback((productId: number): Offer[] => {
    return activeOffers.filter((offer) =>
      offer.items.some((oi) => oi.productId != null && Number(oi.productId) === productId)
    );
  }, [activeOffers]);

  const getOffersForVariant = useCallback((variantId: number, productId: number): Offer[] => {
    return activeOffers.filter((offer) =>
      offer.items.some(
        (oi) =>
          (oi.variantId != null && Number(oi.variantId) === variantId) ||
          (oi.productId != null && Number(oi.productId) === productId)
      )
    );
  }, [activeOffers]);

  const describeOffer = useCallback((offer: Offer): string => {
    const rule = offer.items[0];
    switch (offer.offerType) {
      case 'QUANTITY_PRICE':
        return `Buy ${rule?.minQty}+ @ ${formatCurrency(rule?.offerPrice ?? 0)} each`;
      case 'QUANTITY_DISCOUNT':
        return `Buy ${rule?.minQty}+, get ${rule?.discountPercent}% off`;
      case 'COMBO':
        return `Combo: ${offer.items.map(i => i.productName || 'item').join(' + ')} for ${formatCurrency(offer.comboPrice ?? 0)}`;
      case 'BOGO':
        return `Buy ${rule?.minQty}, get ${rule?.freeQty} free`;
      default:
        return offer.name;
    }
  }, []);

  const renderOfferIcon = useCallback((offers: Offer[], discountPercent?: number) => {
    const hasDiscount = discountPercent != null && discountPercent > 0;
    if (offers.length === 0 && !hasDiscount) return null;
    return (
      <Tooltip
        arrow
        placement="right"
        title={
          <Box sx={{ p: 0.5 }}>
            {hasDiscount && (
              <Box sx={{ mb: offers.length > 0 ? 1 : 0 }}>
                <Typography variant="caption" fontWeight={700} display="block" gutterBottom>
                  Default Discount
                </Typography>
                <Typography variant="caption" display="block" color="grey.300">
                  {discountPercent}% off on every sale
                </Typography>
              </Box>
            )}
            {offers.length > 0 && (
              <>
                <Typography variant="caption" fontWeight={700} display="block" gutterBottom>
                  Active Offers ({offers.length})
                </Typography>
                {offers.map((offer) => (
                  <Box key={offer.id} sx={{ mb: 0.5 }}>
                    <Typography variant="caption" fontWeight={600} display="block">
                      {offer.name}
                    </Typography>
                    <Typography variant="caption" display="block" color="grey.300">
                      {describeOffer(offer)}
                    </Typography>
                  </Box>
                ))}
              </>
            )}
          </Box>
        }
      >
        <LocalOfferIcon
          sx={{
            fontSize: 16,
            color: offers.length > 0 ? 'success.main' : 'info.main',
            ml: 0.5,
            verticalAlign: 'middle',
            cursor: 'pointer',
          }}
        />
      </Tooltip>
    );
  }, [describeOffer]);

  // Offer/discount filtered rows
  const filteredProductRows = useMemo(() => {
    if (offerFilter === '') return productRows;
    return productRows.filter((p) => {
      const hasDiscount = (p.defaultDiscountPercent ?? 0) > 0;
      const hasOffer = getOffersForProduct(p.id).length > 0;
      return offerFilter === 'with' ? (hasDiscount || hasOffer) : (!hasDiscount && !hasOffer);
    });
  }, [productRows, offerFilter, getOffersForProduct]);

  const filteredVariants = useMemo(() => {
    if (offerFilter === '') return variants;
    return variants.filter((v) => {
      const hasDiscount = (v.effectiveDiscountPercent ?? 0) > 0;
      const hasOffer = getOffersForVariant(v.id, v.productId).length > 0;
      return offerFilter === 'with' ? (hasDiscount || hasOffer) : (!hasDiscount && !hasOffer);
    });
  }, [variants, offerFilter, getOffersForVariant]);

  // =============================================
  // Variant Row Component (shared by both dialogs)
  // =============================================
  const renderVariantRows = (
    rows: VariantRow[],
    setRows: React.Dispatch<React.SetStateAction<VariantRow[]>>,
    catName?: string,
    brandName?: string,
  ) => (
    <Box>
      {rows.map((row, index) => (
        <Box key={row.key} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Variant {index + 1}
            </Typography>
            {rows.length > 1 && (
              <IconButton size="small" color="error" onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 4 }}>
              <Autocomplete
                freeSolo
                size="small"
                options={fabrics}
                value={row.fabric}
                inputValue={row.fabric || ''}
                onChange={(_, value) => {
                  if (typeof value === 'string' && value.startsWith('+ Add "')) {
                    const name = value.slice(7, -1);
                    openShortCodeDialog('FABRIC', name, (savedName) => {
                      updateVariantRow(rows, setRows, row.key, 'fabric', savedName, catName, brandName);
                    });
                    updateVariantRow(rows, setRows, row.key, 'fabric', name, catName, brandName);
                  } else {
                    updateVariantRow(rows, setRows, row.key, 'fabric', typeof value === 'string' ? value : value || '', catName, brandName);
                  }
                }}
                onInputChange={(_, value, reason) => {
                  if (reason === 'input' || reason === 'reset') {
                    updateVariantRow(rows, setRows, row.key, 'fabric', stripAddPrefix(value), catName, brandName);
                  }
                }}
                filterOptions={(opts, state) => {
                  const filtered = opts.filter((o) => o.toLowerCase().includes(state.inputValue.toLowerCase()));
                  if (state.inputValue !== '' && !opts.some((o) => o.toLowerCase() === state.inputValue.toLowerCase())) {
                    filtered.push(`+ Add "${state.inputValue}"`);
                  }
                  return filtered;
                }}
                onBlur={() => {
                  if (row.fabric && !fabrics.some((f) => f.toLowerCase() === row.fabric.toLowerCase())) {
                    updateVariantRow(rows, setRows, row.key, 'fabric', '', catName, brandName);
                  }
                }}
                renderInput={(params) => <TextField {...params} label="Fabric" />}
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Autocomplete
                freeSolo
                size="small"
                options={colors}
                value={row.color}
                inputValue={row.color || ''}
                onChange={(_, value) => {
                  if (typeof value === 'string' && value.startsWith('+ Add "')) {
                    const name = value.slice(7, -1);
                    openShortCodeDialog('COLOR', name, (savedName) => {
                      updateVariantRow(rows, setRows, row.key, 'color', savedName, catName, brandName);
                    });
                    updateVariantRow(rows, setRows, row.key, 'color', name, catName, brandName);
                  } else {
                    updateVariantRow(rows, setRows, row.key, 'color', typeof value === 'string' ? value : value || '', catName, brandName);
                  }
                }}
                onInputChange={(_, value, reason) => {
                  if (reason === 'input' || reason === 'reset') {
                    updateVariantRow(rows, setRows, row.key, 'color', stripAddPrefix(value), catName, brandName);
                  }
                }}
                filterOptions={(opts, state) => {
                  const filtered = opts.filter((o) => o.toLowerCase().includes(state.inputValue.toLowerCase()));
                  if (state.inputValue !== '' && !opts.some((o) => o.toLowerCase() === state.inputValue.toLowerCase())) {
                    filtered.push(`+ Add "${state.inputValue}"`);
                  }
                  return filtered;
                }}
                onBlur={() => {
                  if (row.color && !colors.some((c) => c.toLowerCase() === row.color.toLowerCase())) {
                    updateVariantRow(rows, setRows, row.key, 'color', '', catName, brandName);
                  }
                }}
                renderInput={(params) => <TextField {...params} label="Color (Optional)" />}
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Autocomplete
                freeSolo
                size="small"
                options={sizes}
                value={row.size}
                inputValue={row.size || ''}
                onChange={(_, value) => {
                  if (typeof value === 'string' && value.startsWith('+ Add "')) {
                    const name = value.slice(7, -1);
                    openShortCodeDialog('SIZE', name, (savedName) => {
                      updateVariantRow(rows, setRows, row.key, 'size', savedName, catName, brandName);
                    });
                    updateVariantRow(rows, setRows, row.key, 'size', name, catName, brandName);
                  } else {
                    updateVariantRow(rows, setRows, row.key, 'size', typeof value === 'string' ? value : value || '', catName, brandName);
                  }
                }}
                onInputChange={(_, value, reason) => {
                  if (reason === 'input' || reason === 'reset') {
                    updateVariantRow(rows, setRows, row.key, 'size', stripAddPrefix(value), catName, brandName);
                  }
                }}
                filterOptions={(opts, state) => {
                  const filtered = opts.filter((o) => o.toLowerCase().includes(state.inputValue.toLowerCase()));
                  if (state.inputValue !== '' && !opts.some((o) => o.toLowerCase() === state.inputValue.toLowerCase())) {
                    filtered.push(`+ Add "${state.inputValue}"`);
                  }
                  return filtered;
                }}
                onBlur={() => {
                  if (row.size && !sizes.some((s) => s.toLowerCase() === row.size.toLowerCase())) {
                    updateVariantRow(rows, setRows, row.key, 'size', '', catName, brandName);
                  }
                }}
                renderInput={(params) => <TextField {...params} label="Size" />}
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField
                size="small"
                fullWidth
                label="Selling Price"
                type="number"
                value={row.sellingPrice || ''}
                onChange={(e) => updateVariantRow(rows, setRows, row.key, 'sellingPrice', parseFloat(e.target.value) || 0, catName, brandName)}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              />
            </Grid>
            {isAdmin && (
              <Grid size={{ xs: 4 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Cost"
                  type="number"
                  value={row.avgCost || ''}
                  onChange={(e) => updateVariantRow(rows, setRows, row.key, 'avgCost', parseFloat(e.target.value) || 0, catName, brandName)}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                />
              </Grid>
            )}
            <Grid size={{ xs: 4 }}>
              <TextField
                size="small"
                fullWidth
                label="Initial Stock"
                type="number"
                value={row.initialStock || ''}
                onChange={(e) => updateVariantRow(rows, setRows, row.key, 'initialStock', parseInt(e.target.value) || 0, catName, brandName)}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32 }}>SKU:</Typography>
                {row.skuEdited ? (
                  <TextField
                    size="small"
                    variant="outlined"
                    value={row.sku}
                    onChange={(e) => {
                      setRows((prev) => prev.map((r) => r.key === row.key ? { ...r, sku: e.target.value } : r));
                    }}
                    sx={{ flex: 1 }}
                    inputProps={{ style: { fontSize: 13, fontFamily: 'monospace' } }}
                  />
                ) : (
                  <Chip
                    label={row.sku || '(auto-generated)'}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                )}
                <Tooltip title={row.skuEdited ? 'Use auto-generated SKU' : 'Edit SKU manually'}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (row.skuEdited) {
                        // Reset to auto-generated
                        updateVariantRow(rows, setRows, row.key, 'skuEdited', false, catName, brandName);
                      } else {
                        setRows((prev) => prev.map((r) => r.key === row.key ? { ...r, skuEdited: true } : r));
                      }
                    }}
                  >
                    <EditIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, minWidth: 55 }}>Barcode:</Typography>
                {row.barcodeEdited ? (
                  <TextField
                    size="small"
                    variant="outlined"
                    value={row.barcode}
                    onChange={(e) => {
                      setRows((prev) => prev.map((r) => r.key === row.key ? { ...r, barcode: e.target.value } : r));
                    }}
                    sx={{ flex: 1 }}
                    inputProps={{ style: { fontSize: 13, fontFamily: 'monospace' } }}
                  />
                ) : (
                  <Chip
                    label={row.barcode || '(= SKU)'}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                )}
                <Tooltip title={row.barcodeEdited ? 'Use SKU as barcode' : 'Edit barcode manually'}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (row.barcodeEdited) {
                        setRows((prev) => prev.map((r) => r.key === row.key ? { ...r, barcodeEdited: false, barcode: r.sku } : r));
                      } else {
                        setRows((prev) => prev.map((r) => r.key === row.key ? { ...r, barcodeEdited: true } : r));
                      }
                    }}
                  >
                    <EditIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Box>
      ))}
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => setRows((prev) => [...prev, createEmptyVariantRow()])}
      >
        Add Variant
      </Button>
    </Box>
  );

  // Columns
  const productColumns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Product',
      flex: 1,
      minWidth: 220,
      renderCell: (params: GridRenderCellParams<Product>) => {
        const productOffers = getOffersForProduct(params.row.id);
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" fontWeight={500}>
                {params.row.name}
              </Typography>
              {renderOfferIcon(productOffers, params.row.defaultDiscountPercent)}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {params.row.brand}
            </Typography>
          </Box>
        );
      },
    },
    { field: 'category', headerName: 'Category', width: 140 },
    { field: 'hsn', headerName: 'HSN', width: 120 },
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
        <Chip
          label={params.row.variantCount ?? 0}
          size="small"
          clickable
          color="primary"
          variant="outlined"
          onClick={() => {
            setSearchQuery(params.row.name);
            setActiveTab('variants');
          }}
        />
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
    { field: 'barcode', headerName: 'Barcode', width: 130 },
    { field: 'sku', headerName: 'SKU', width: 170 },
    {
      field: 'productName',
      headerName: 'Product',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<Variant>) => {
        const variantOffers = getOffersForVariant(params.row.id, params.row.productId);
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" fontWeight={500}>
                {params.row.productName}
              </Typography>
              {renderOfferIcon(variantOffers, params.row.effectiveDiscountPercent)}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {params.row.productBrand}
            </Typography>
          </Box>
        );
      },
    },
    { field: 'productHsn', headerName: 'HSN', width: 100 },
    { field: 'fabric', headerName: 'Fabric', width: 100 },
    { field: 'size', headerName: 'Size', width: 70 },
    { field: 'color', headerName: 'Color', width: 90 },
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
                    Markup % = ((Price - Cost) / Cost) x 100
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
            <IconButton size="small" onClick={() => openEditVariantDialog(params.row)}>
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

  const brandHelpers = buildCreatableOptions(brands, 'BRAND');
  const categoryHelpers = buildCreatableOptions(categories, 'CATEGORY');

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
              onClick={() => openBatchVariantDialog()}
            >
              Add Variants
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
            <Grid size={{ xs: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Offers</InputLabel>
                <Select
                  value={offerFilter}
                  label="Offers"
                  onChange={(e) => setOfferFilter(e.target.value as '' | 'with' | 'without')}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="with">With Offer/Discount</MenuItem>
                  <MenuItem value="without">Without Offer/Discount</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      {activeTab === 'products' ? (
        <Card>
          <Box sx={{ width: '100%', overflow: 'auto' }}>
            <DataGrid
              rows={filteredProductRows}
              columns={productColumns}
              rowCount={offerFilter ? filteredProductRows.length : productTotalElements}
              loading={productLoading}
              pageSizeOptions={[10, 25, 50]}
              paginationModel={productPaginationModel}
              paginationMode={offerFilter ? 'client' : 'server'}
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
              rows={filteredVariants}
              columns={variantColumns}
              rowCount={offerFilter ? filteredVariants.length : totalElements}
              loading={loading}
              pageSizeOptions={[10, 25, 50]}
              paginationModel={paginationModel}
              paginationMode={offerFilter ? 'client' : 'server'}
              onPaginationModelChange={setPaginationModel}
              disableRowSelectionOnClick
              sx={{ border: 0, minHeight: 500, minWidth: 800 }}
              getRowHeight={() => 60}
              autoHeight
            />
          </Box>
        </Card>
      )}

      {/* =============== Product Dialog (Create / Edit) =============== */}
      <Dialog
        open={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        maxWidth="md"
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
                      options={brandHelpers.options}
                      value={field.value}
                      inputValue={field.value || ''}
                      onChange={(_, value) => brandHelpers.handleChange(typeof value === 'string' ? value : value || '', field.onChange)}
                      onInputChange={(_, value, reason) => brandHelpers.handleInputChange(value, reason, field.onChange)}
                      filterOptions={brandHelpers.filterOptions}
                      onBlur={() => brandHelpers.handleBlur(field.value, field.onChange)}
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
                      options={categoryHelpers.options}
                      value={field.value}
                      inputValue={field.value || ''}
                      onChange={(_, value) => categoryHelpers.handleChange(typeof value === 'string' ? value : value || '', field.onChange)}
                      onInputChange={(_, value, reason) => categoryHelpers.handleInputChange(value, reason, field.onChange)}
                      filterOptions={categoryHelpers.filterOptions}
                      onBlur={() => categoryHelpers.handleBlur(field.value, field.onChange)}
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
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="defaultDiscountPercent"
                  control={productForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                      fullWidth
                      label="Default Discount %"
                      type="number"
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
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
            </Grid>

            {/* Inline Variants Section (only for new products) */}
            {!editingProduct && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', mb: 1 }}
                  onClick={() => {
                    setShowVariantsSection(!showVariantsSection);
                    if (!showVariantsSection && variantRowsForProduct.length === 0) {
                      setVariantRowsForProduct([createEmptyVariantRow()]);
                    }
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    Variants {variantRowsForProduct.length > 0 ? `(${variantRowsForProduct.length})` : '(Optional)'}
                  </Typography>
                  {showVariantsSection ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </Box>
                <Collapse in={showVariantsSection}>
                  {renderVariantRows(variantRowsForProduct, setVariantRowsForProduct)}
                </Collapse>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button type="button" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* =============== Batch Add Variants Dialog =============== */}
      <Dialog
        open={variantDialogOpen}
        onClose={() => setVariantDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Variants</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, mb: 2 }}>
            <Autocomplete
              options={productSearchOptions.length > 0 ? productSearchOptions : products}
              getOptionLabel={(option) => `${option.name} (${option.brand})`}
              value={[...products, ...productSearchOptions].find((p) => p.id === batchProductId) || null}
              onChange={(_, value) => setBatchProductId(value ? value.id : 0)}
              onInputChange={(_, value, reason) => {
                if (reason === 'input') handleProductSearch(value);
                if (reason === 'clear') {
                  setBatchProductId(0);
                  setProductSearchOptions(products);
                }
              }}
              onFocus={() => setProductSearchOptions(products)}
              isOptionEqualToValue={(option, val) => option.id === val.id}
              renderInput={(params) => (
                <TextField {...params} label="Product" placeholder="Search product..." />
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
          </Box>

          {batchProductId > 0 && (() => {
            const selectedProduct = [...products, ...productSearchOptions].find((p) => p.id === batchProductId);
            const catName = selectedProduct?.category || '';
            const brandName = selectedProduct?.brand || '';
            return renderVariantRows(variantRowsForBatch, setVariantRowsForBatch, catName, brandName);
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setVariantDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveBatchVariants} disabled={saving || !batchProductId}>
            {saving ? 'Saving...' : 'Create Variants'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =============== Edit Variant Dialog =============== */}
      <Dialog
        open={editVariantDialogOpen}
        onClose={() => setEditVariantDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={editVariantForm.handleSubmit(handleUpdateVariant)}>
          <DialogTitle>Edit Variant</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Product"
                  value={editingVariant ? `${editingVariant.productName} (${editingVariant.productBrand})` : ''}
                  disabled
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="sku"
                  control={editVariantForm.control}
                  render={({ field, fieldState }) => (
                    <TextField {...field} fullWidth label="SKU" error={!!fieldState.error} helperText={fieldState.error?.message} />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="barcode"
                  control={editVariantForm.control}
                  render={({ field, fieldState }) => (
                    <TextField {...field} fullWidth label="Barcode" error={!!fieldState.error} helperText={fieldState.error?.message} />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Controller
                  name="fabric"
                  control={editVariantForm.control}
                  render={({ field }) => (
                    <Autocomplete
                      freeSolo
                      options={fabrics}
                      value={field.value || ''}
                      inputValue={field.value || ''}
                      onChange={(_, value) => {
                        if (typeof value === 'string' && value.startsWith('+ Add "')) {
                          const name = value.slice(7, -1);
                          openShortCodeDialog('FABRIC', name, (savedName) => {
                            field.onChange(savedName);
                          });
                          field.onChange(name);
                        } else {
                          field.onChange(typeof value === 'string' ? value : value || '');
                        }
                      }}
                      onInputChange={(_, value, reason) => {
                        if (reason === 'input' || reason === 'reset') {
                          field.onChange(stripAddPrefix(value));
                        }
                      }}
                      filterOptions={(opts, state) => {
                        const filtered = opts.filter((o) => o.toLowerCase().includes(state.inputValue.toLowerCase()));
                        if (state.inputValue !== '' && !opts.some((o) => o.toLowerCase() === state.inputValue.toLowerCase())) {
                          filtered.push(`+ Add "${state.inputValue}"`);
                        }
                        return filtered;
                      }}
                      onBlur={() => {
                        if (field.value && !fabrics.some((f) => f.toLowerCase() === (field.value || '').toLowerCase())) {
                          field.onChange('');
                        }
                      }}
                      renderInput={(params) => <TextField {...params} label="Fabric" />}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Controller
                  name="color"
                  control={editVariantForm.control}
                  render={({ field }) => (
                    <Autocomplete
                      freeSolo
                      options={colors}
                      value={field.value || ''}
                      inputValue={field.value || ''}
                      onChange={(_, value) => {
                        if (typeof value === 'string' && value.startsWith('+ Add "')) {
                          const name = value.slice(7, -1);
                          openShortCodeDialog('COLOR', name, (savedName) => {
                            field.onChange(savedName);
                          });
                          field.onChange(name);
                        } else {
                          field.onChange(typeof value === 'string' ? value : value || '');
                        }
                      }}
                      onInputChange={(_, value, reason) => {
                        if (reason === 'input' || reason === 'reset') {
                          field.onChange(stripAddPrefix(value));
                        }
                      }}
                      filterOptions={(opts, state) => {
                        const filtered = opts.filter((o) => o.toLowerCase().includes(state.inputValue.toLowerCase()));
                        if (state.inputValue !== '' && !opts.some((o) => o.toLowerCase() === state.inputValue.toLowerCase())) {
                          filtered.push(`+ Add "${state.inputValue}"`);
                        }
                        return filtered;
                      }}
                      onBlur={() => {
                        if (field.value && !colors.some((c) => c.toLowerCase() === (field.value || '').toLowerCase())) {
                          field.onChange('');
                        }
                      }}
                      renderInput={(params) => <TextField {...params} label="Color (Optional)" />}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Controller
                  name="size"
                  control={editVariantForm.control}
                  render={({ field }) => (
                    <Autocomplete
                      freeSolo
                      options={sizes}
                      value={field.value || ''}
                      inputValue={field.value || ''}
                      onChange={(_, value) => {
                        if (typeof value === 'string' && value.startsWith('+ Add "')) {
                          const name = value.slice(7, -1);
                          openShortCodeDialog('SIZE', name, (savedName) => {
                            field.onChange(savedName);
                          });
                          field.onChange(name);
                        } else {
                          field.onChange(typeof value === 'string' ? value : value || '');
                        }
                      }}
                      onInputChange={(_, value, reason) => {
                        if (reason === 'input' || reason === 'reset') {
                          field.onChange(stripAddPrefix(value));
                        }
                      }}
                      filterOptions={(opts, state) => {
                        const filtered = opts.filter((o) => o.toLowerCase().includes(state.inputValue.toLowerCase()));
                        if (state.inputValue !== '' && !opts.some((o) => o.toLowerCase() === state.inputValue.toLowerCase())) {
                          filtered.push(`+ Add "${state.inputValue}"`);
                        }
                        return filtered;
                      }}
                      onBlur={() => {
                        if (field.value && !sizes.some((s) => s.toLowerCase() === (field.value || '').toLowerCase())) {
                          field.onChange('');
                        }
                      }}
                      renderInput={(params) => <TextField {...params} label="Size" />}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="sellingPrice"
                  control={editVariantForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Selling Price"
                      type="number"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                    />
                  )}
                />
              </Grid>
              {isAdmin && (
                <Grid size={{ xs: 6 }}>
                  <Controller
                    name="avgCost"
                    control={editVariantForm.control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Cost"
                        type="number"
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                      />
                    )}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 6 }}>
                <Controller
                  name="defaultDiscountPercent"
                  control={editVariantForm.control}
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
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button type="button" onClick={() => setEditVariantDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving...' : 'Update'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* =============== Short Code Dialog =============== */}
      <Dialog
        open={shortCodeDialogOpen}
        onClose={() => setShortCodeDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Add {newShortCodeType.charAt(0) + newShortCodeType.slice(1).toLowerCase()} Short Code
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={newShortCodeName}
              onChange={(e) => setNewShortCodeName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Short Code (for SKU)"
              value={newShortCodeValue}
              onChange={(e) => setNewShortCodeValue(e.target.value.toUpperCase())}
              inputProps={{ maxLength: 10 }}
              helperText="2-5 character code used in auto-generated SKU"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShortCodeDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveShortCode}
            disabled={!newShortCodeName || !newShortCodeValue}
          >
            Save
          </Button>
        </DialogActions>
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
