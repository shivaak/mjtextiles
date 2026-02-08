import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Autocomplete,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PercentIcon from '@mui/icons-material/Percent';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

import PageHeader from '../../components/common/PageHeader';
import Money from '../../components/common/Money';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../app/context/NotificationContext';
import { productService } from '../../services/productService';
import { saleService } from '../../services/saleService';
import { settingsService } from '../../services/settingsService';
import { offerService } from '../../services/offerService';
import { formatApiError } from '../../services/api';
import { lookupService } from '../../services/lookupService';
import { evaluateOffers } from '../../utils/offerEngine';
import type {
  CartItem,
  Offer,
  VariantSearchResponse,
  PaymentMode,
  SaleDetail,
  Settings,
} from '../../domain/types';
import {
  calculateDiscountAmount,
  formatCurrency,
} from '../../utils/calculations';

const getCurrencySymbol = (currency?: string): string => {
  switch ((currency || '').toUpperCase()) {
    case 'INR':
      return '₹';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    default:
      return currency || '₹';
  }
};

export default function BillingPage() {
  const { success: showSuccess, error: showError, warning: showWarning } = useNotification();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VariantSearchResponse[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('amount');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');

  const [completedSale, setCompletedSale] = useState<SaleDetail | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [paymentModes, setPaymentModes] = useState<string[]>([]);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsSettingsLoading(true);
      try {
        const [settingsData, lookups, offers] = await Promise.all([
          settingsService.getSettings(),
          lookupService.getLookups(),
          offerService.getActiveOffers().catch(() => [] as Offer[]),
        ]);
        setSettings(settingsData);
        setPaymentModes(lookups.paymentModes || []);
        setActiveOffers(offers);
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
        setPaymentModes(['CASH', 'CARD', 'UPI', 'CREDIT']);
      } finally {
        setIsSettingsLoading(false);
      }
    };

    fetchSettings();
  }, [showError]);

  const currencySymbol = getCurrencySymbol(settings?.currency);
  const taxPercent = Number(settings?.taxPercent || 0);
  const lowStockThreshold = Number(settings?.lowStockThreshold || 10);
  const taxDivisor = 1 + taxPercent / 100;

  const getItemDiscountPercent = (item: CartItem) => item.itemDiscountPercent;
  const getEffectiveUnitPrice = (item: CartItem) => {
    const discPct = getItemDiscountPercent(item);
    return item.unitPrice * (1 - discPct / 100);
  };

  // Subtotal = sum of line amounts (tax-inclusive, after item discounts)
  const subtotal = cart.reduce((sum, item) => sum + (getEffectiveUnitPrice(item) * item.qty), 0);
  // Extract taxable value and GST from subtotal
  const totalTaxableValue = taxPercent > 0 ? subtotal / taxDivisor : subtotal;
  const totalGst = subtotal - totalTaxableValue;
  // Additional discount on subtotal (tax-inclusive)
  const discountAmount = discountType === 'percent'
    ? calculateDiscountAmount(subtotal, discountValue)
    : Math.min(discountValue, subtotal);
  const discountPercent = discountType === 'percent'
    ? Math.min(discountValue, 100)
    : subtotal > 0 ? Math.min((discountValue / subtotal) * 100, 100) : 0;
  const finalAmount = subtotal - discountAmount;
  const roundedTotal = Math.round(finalAmount);
  const roundOff = roundedTotal - finalAmount;

  const addToCart = useCallback((variant: VariantSearchResponse) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.variantId === variant.id);

      if (existingIndex >= 0) {
        const newQty = prev[existingIndex].qty + 1;
        if (newQty > variant.stockQty) {
          showWarning(`Only ${variant.stockQty} items in stock`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], qty: newQty };
        return updated;
      }

      if (variant.stockQty <= 0) {
        showError('Out of stock');
        return prev;
      }

      return [
        ...prev,
        {
          variantId: variant.id,
          variant,
          qty: 1,
          unitPrice: variant.sellingPrice,
          itemDiscountPercent: variant.effectiveDiscountPercent || 0,
        },
      ];
    });

    setSearchQuery('');
    setSearchResults([]);
    barcodeInputRef.current?.focus();
  }, [showError, showWarning]);

  const handleBarcodeSubmit = useCallback(async (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter' || !barcodeInput.trim()) {
      return;
    }

    try {
      const variant = await productService.getVariantByBarcode(barcodeInput.trim());
      if (variant.status !== 'ACTIVE') {
        showWarning('Product is inactive');
      } else {
        addToCart(variant);
      }
    } catch (error) {
      showWarning(formatApiError(error, 'Product not found'));
    } finally {
      setBarcodeInput('');
    }
  }, [barcodeInput, addToCart, showWarning]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await productService.searchVariants(query, 10);
      setSearchResults(results.filter((variant) => variant.status === 'ACTIVE'));
    } catch (error) {
      showError(formatApiError(error, 'Failed to search products'));
    }
  }, [showError]);

  const updateQuantity = useCallback((variantId: number, delta: number) => {
    setCart((prev) => {
      const index = prev.findIndex((item) => item.variantId === variantId);
      if (index === -1) return prev;

      const item = prev[index];
      const newQty = item.qty + delta;

      if (newQty <= 0) {
        return prev.filter((i) => i.variantId !== variantId);
      }

      if (newQty > item.variant.stockQty) {
        showWarning(`Only ${item.variant.stockQty} items in stock`);
        return prev;
      }

      const updated = [...prev];
      updated[index] = { ...item, qty: newQty };
      return updated;
    });
  }, [showWarning]);

  const removeFromCart = useCallback((variantId: number) => {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId));
  }, []);

  const updateItemDiscount = useCallback((variantId: number, discount: number) => {
    const clamped = Math.min(100, Math.max(0, discount));
    setCart((prev) =>
      prev.map((item) =>
        item.variantId === variantId
          ? { ...item, itemDiscountPercent: clamped, appliedOfferId: undefined, appliedOfferName: undefined }
          : item
      )
    );
  }, []);

  const removeOfferFromItem = useCallback((variantId: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.variantId === variantId
          ? {
              ...item,
              itemDiscountPercent: item.variant.effectiveDiscountPercent || 0,
              appliedOfferId: undefined,
              appliedOfferName: undefined,
            }
          : item
      )
    );
  }, []);

  // Auto-evaluate and apply offers when cart changes
  const offerApplications = useMemo(
    () => {
      const apps = evaluateOffers(cart, activeOffers);
      if (apps.length > 0) {
        console.debug('[Offers] Applied:', apps.map(a => `${a.offerName} -> variant ${a.variantId} (${a.discountPercent}%)`));
      }
      if (activeOffers.length > 0 && cart.length > 0) {
        console.debug('[Offers] Active offers:', activeOffers.map(o => ({
          name: o.name, type: o.offerType,
          items: o.items.map(i => ({ productId: i.productId, variantId: i.variantId, minQty: i.minQty }))
        })));
        console.debug('[Offers] Cart items:', cart.map(c => ({
          variantId: c.variantId, productId: c.variant.productId, qty: c.qty, product: c.variant.productName
        })));
      }
      return apps;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cart.map((i) => `${i.variantId}:${i.qty}`).join(','), activeOffers]
  );

  useEffect(() => {
    if (offerApplications.length === 0 && !cart.some((i) => i.appliedOfferId)) return;

    setCart((prev) => {
      let changed = false;
      const updated = prev.map((item) => {
        const app = offerApplications.find((a) => a.variantId === item.variantId);
        if (app) {
          // Apply offer if different from current
          if (item.appliedOfferId !== app.offerId || item.itemDiscountPercent !== app.discountPercent) {
            changed = true;
            return {
              ...item,
              itemDiscountPercent: app.discountPercent,
              appliedOfferId: app.offerId,
              appliedOfferName: app.offerName,
            };
          }
        } else if (item.appliedOfferId) {
          // Remove offer that no longer matches (e.g. qty dropped below threshold)
          changed = true;
          return {
            ...item,
            itemDiscountPercent: item.variant.effectiveDiscountPercent || 0,
            appliedOfferId: undefined,
            appliedOfferName: undefined,
          };
        }
        return item;
      });
      return changed ? updated : prev;
    });
  }, [offerApplications]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute per-item offer hints: relevant offers for a specific cart item
  type OfferHint = {
    offerId: number;
    offerName: string;
    description: string;
    status: 'applied' | 'eligible' | 'needs_more';
    statusLabel: string;
  };

  const itemOfferHintsMap = useMemo(() => {
    const map = new Map<number, OfferHint[]>();
    if (activeOffers.length === 0 || cart.length === 0) return map;

    for (const offer of activeOffers) {
      const rule = offer.items[0];
      if (!rule) continue;

      // Find cart items that match this offer
      const matchingCartItems = cart.filter((ci) => {
        for (const oi of offer.items) {
          if (oi.variantId != null && Number(ci.variantId) === Number(oi.variantId)) return true;
          if (oi.productId != null && Number(ci.variant.productId) === Number(oi.productId)) return true;
        }
        return false;
      });
      if (matchingCartItems.length === 0) continue;

      const isApplied = cart.some((ci) => ci.appliedOfferId === offer.id);

      let desc = '';
      let status: 'applied' | 'eligible' | 'needs_more' = 'eligible';
      let statusLabel = '';

      switch (offer.offerType) {
        case 'QUANTITY_PRICE': {
          const totalQty = matchingCartItems.reduce((s, c) => s + c.qty, 0);
          desc = `Buy ${rule.minQty}+ @ ${formatCurrency(rule.offerPrice!, currencySymbol)} each`;
          if (isApplied) {
            status = 'applied'; statusLabel = 'Applied';
          } else if (totalQty >= rule.minQty) {
            status = 'eligible'; statusLabel = 'Eligible';
          } else {
            status = 'needs_more'; statusLabel = `Add ${rule.minQty - totalQty} more`;
          }
          break;
        }
        case 'QUANTITY_DISCOUNT': {
          const totalQty = matchingCartItems.reduce((s, c) => s + c.qty, 0);
          desc = `Buy ${rule.minQty}+, get ${rule.discountPercent}% off`;
          if (isApplied) {
            status = 'applied'; statusLabel = 'Applied';
          } else if (totalQty >= rule.minQty) {
            status = 'eligible'; statusLabel = 'Eligible';
          } else {
            status = 'needs_more'; statusLabel = `Add ${rule.minQty - totalQty} more`;
          }
          break;
        }
        case 'COMBO': {
          desc = `Combo with ${offer.items.filter(i => i.productName).map(i => i.productName).join(' + ')} for ${formatCurrency(offer.comboPrice!, currencySymbol)}`;
          if (isApplied) {
            status = 'applied'; statusLabel = 'Applied';
          } else {
            const missing: string[] = [];
            let allPresent = true;
            for (const oi of offer.items) {
              const qty = cart.filter((ci) => {
                if (oi.variantId != null) return Number(ci.variantId) === Number(oi.variantId);
                if (oi.productId != null) return Number(ci.variant.productId) === Number(oi.productId);
                return false;
              }).reduce((s, c) => s + c.qty, 0);
              if (qty < oi.minQty) { allPresent = false; missing.push(oi.productName || 'item'); }
            }
            if (allPresent) { status = 'eligible'; statusLabel = 'Eligible'; }
            else { status = 'needs_more'; statusLabel = `Need ${missing.join(', ')}`; }
          }
          break;
        }
        case 'BOGO': {
          const totalQty = matchingCartItems.reduce((s, c) => s + c.qty, 0);
          const groupSize = rule.minQty + (rule.freeQty || 0);
          desc = `Buy ${rule.minQty}, get ${rule.freeQty} free`;
          if (isApplied) {
            status = 'applied'; statusLabel = 'Applied';
          } else if (totalQty >= groupSize) {
            status = 'eligible'; statusLabel = 'Eligible';
          } else {
            status = 'needs_more'; statusLabel = `Add ${groupSize - totalQty} more`;
          }
          break;
        }
      }

      const hint: OfferHint = { offerId: offer.id, offerName: offer.name, description: desc, status, statusLabel };

      // Add hint to each matching cart item
      for (const ci of matchingCartItems) {
        const existing = map.get(ci.variantId) || [];
        existing.push(hint);
        map.set(ci.variantId, existing);
      }
    }

    return map;
  }, [activeOffers, cart, currencySymbol]);

  const clearCart = useCallback(() => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountValue(0);
    setShowClearConfirm(false);
    barcodeInputRef.current?.focus();
  }, []);

  const handleCompleteSale = useCallback(async () => {
    if (cart.length === 0) {
      showError('Cart is empty');
      return;
    }

    setIsCompleting(true);
    try {
      const sale = await saleService.createSale({
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        paymentMode,
        discountPercent,
        items: cart.map((item) => ({
          variantId: item.variantId,
          qty: item.qty,
          unitPrice: item.unitPrice,
          itemDiscountPercent: Math.round(item.itemDiscountPercent * 100) / 100,
          appliedOfferId: item.appliedOfferId,
        })),
      });

      setCompletedSale(sale);
      setShowSuccessDialog(true);
      showSuccess(`Sale completed: ${sale.billNo}`);

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountValue(0);
      setSearchQuery('');
      setSearchResults([]);
      setBarcodeInput('');
    } catch (error) {
      showError(formatApiError(error, 'Failed to complete sale'));
    } finally {
      setIsCompleting(false);
    }
  }, [
    cart,
    customerName,
    customerPhone,
    paymentMode,
    discountPercent,
    showSuccess,
    showError,
  ]);

  const handlePrint = useCallback(async () => {
    if (!completedSale) {
      return;
    }
    try {
      const pdfBlob = await saleService.getSaleInvoice(completedSale.id);
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      showError(formatApiError(error, 'Failed to generate invoice'));
    }
  }, [completedSale, showError]);

  return (
    <Box>
      <PageHeader
        title="Billing (POS)"
        subtitle="Create new sale"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Billing' },
        ]}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  inputRef={barcodeInputRef}
                  fullWidth
                  placeholder="Scan barcode or enter manually"
                  value={barcodeInput}
                  onChange={(event) => setBarcodeInput(event.target.value)}
                  onKeyDown={handleBarcodeSubmit}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <QrCodeScannerIcon />
                      </InputAdornment>
                    ),
                  }}
                  autoFocus
                />
              </Box>

              <Autocomplete
                freeSolo
                options={searchResults}
                filterOptions={(options) => options}
                getOptionLabel={(option) =>
                  typeof option === 'string'
                    ? option
                    : `${option.productName} - ${option.sku} - ${option.size} ${option.color} (${option.barcode})`
                }
                inputValue={searchQuery}
                onInputChange={(_, value, reason) => {
                  if (reason === 'reset') {
                    return;
                  }
                  handleSearch(value);
                }}
                onChange={(_, value) => {
                  if (value && typeof value !== 'string') {
                    addToCart(value);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search by product name, SKU, or barcode"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {option.productName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.sku} | {option.size} | {option.color} | {option.barcode}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(option.sellingPrice, currencySymbol)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color={option.stockQty <= lowStockThreshold ? 'error' : 'text.secondary'}
                      >
                        Stock: {option.stockQty}
                      </Typography>
                    </Box>
                  </Box>
                )}
                noOptionsText="No products found"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Cart ({cart.length} items)
                </Typography>
                {cart.length > 0 && (
                  <Button size="small" color="error" onClick={() => setShowClearConfirm(true)}>
                    Clear All
                  </Button>
                )}
              </Box>

              {cart.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    Scan barcode or search to add products
                  </Typography>
                </Box>
              ) : (
                <>
                <TableContainer>
                  <Table size="small" sx={{ tableLayout: 'auto' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>Qty</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" fontWeight={600}>Rate</Typography>
                          <Typography variant="caption" color="text.secondary">(Incl GST)</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Disc %</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Taxable</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>GST ({taxPercent}%)</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Amount</TableCell>
                        <TableCell align="center" width={40}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                    {cart.map((item) => {
                      const itemDiscPct = getItemDiscountPercent(item);
                      const effectivePrice = getEffectiveUnitPrice(item);
                      const lineAmount = effectivePrice * item.qty;
                      const lineTaxableValue = taxPercent > 0 ? lineAmount / taxDivisor : lineAmount;
                      const lineGst = lineAmount - lineTaxableValue;

                      const itemHints = itemOfferHintsMap.get(item.variantId) || [];

                      return (
                        <TableRow key={item.variantId}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {item.variant.productName}
                              </Typography>
                              {itemHints.length > 0 && (
                                <Tooltip
                                  arrow
                                  placement="right"
                                  title={
                                    <Box sx={{ p: 0.5 }}>
                                      {itemHints.map((h) => (
                                        <Box key={h.offerId} sx={{ mb: 0.75, '&:last-child': { mb: 0 } }}>
                                          <Typography variant="caption" fontWeight={600} display="block">
                                            {h.offerName}
                                          </Typography>
                                          <Typography variant="caption" display="block" color="grey.300">
                                            {h.description}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            fontWeight={600}
                                            display="block"
                                            color={
                                              h.status === 'applied' ? 'success.light'
                                              : h.status === 'eligible' ? 'info.light'
                                              : 'warning.light'
                                            }
                                          >
                                            {h.statusLabel}
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Box>
                                  }
                                >
                                  <LocalOfferIcon
                                    sx={{
                                      fontSize: 16,
                                      cursor: 'pointer',
                                      color: itemHints.some((h) => h.status === 'applied') ? 'success.main'
                                        : itemHints.some((h) => h.status === 'eligible') ? 'info.main'
                                        : 'warning.main',
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary" component="div">
                              {item.variant.size} | {item.variant.color} | {item.variant.sku}
                            </Typography>
                            {item.qty >= item.variant.stockQty && (
                              <Chip label="Max stock" size="small" color="warning" sx={{ ml: 1 }} />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <IconButton size="small" onClick={() => updateQuantity(item.variantId, -1)}>
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <TextField
                                value={item.qty}
                                onChange={(event) => {
                                  const newQty = parseInt(event.target.value, 10) || 0;
                                  const delta = newQty - item.qty;
                                  if (delta !== 0) updateQuantity(item.variantId, delta);
                                }}
                                size="small"
                                sx={{ width: 60, mx: 1 }}
                                inputProps={{ style: { textAlign: 'center' } }}
                              />
                              <IconButton size="small" onClick={() => updateQuantity(item.variantId, 1)}>
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            <Money value={item.unitPrice} symbol={currencySymbol} />
                          </TableCell>
                          <TableCell align="right">
                            {item.appliedOfferId ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                <Chip
                                  label={`${Math.round(itemDiscPct * 100) / 100}%`}
                                  size="small"
                                  color="success"
                                  title={item.appliedOfferName}
                                  onDelete={() => removeOfferFromItem(item.variantId)}
                                />
                              </Box>
                            ) : (
                              <TextField
                                type="number"
                                value={itemDiscPct}
                                onChange={(event) => {
                                  const val = parseFloat(event.target.value) || 0;
                                  updateItemDiscount(item.variantId, val);
                                }}
                                size="small"
                                sx={{ width: 70 }}
                                inputProps={{ min: 0, max: 100, step: 1, style: { textAlign: 'right' } }}
                              />
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            <Money value={lineTaxableValue} symbol={currencySymbol} />
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            <Typography variant="body2" color="text.secondary">
                              <Money value={lineGst} symbol={currencySymbol} />
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            <Typography fontWeight={500}>
                              <Money value={lineAmount} symbol={currencySymbol} />
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" color="error" onClick={() => removeFromCart(item.variantId)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    </TableBody>
                  </Table>
                </TableContainer>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ position: 'sticky', top: 80 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Payment Details
              </Typography>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Customer Name (Optional)"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Customer Phone (Optional)"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  size="small"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Additional Discount
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <ToggleButtonGroup
                    value={discountType}
                    exclusive
                    onChange={(_, value) => value && setDiscountType(value)}
                    size="small"
                  >
                    <ToggleButton value="percent">
                      <PercentIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton value="amount">
                      <CurrencyRupeeIcon fontSize="small" />
                    </ToggleButton>
                  </ToggleButtonGroup>
                  <TextField
                    fullWidth
                    type="number"
                    value={discountValue}
                    onChange={(event) => setDiscountValue(Math.max(0, parseFloat(event.target.value) || 0))}
                    size="small"
                    inputProps={{ min: 0, step: discountType === 'percent' ? 1 : 10 }}
                  />
                </Box>
              </Box>

              <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  value={paymentMode}
                  label="Payment Mode"
                  onChange={(event) => setPaymentMode(event.target.value as PaymentMode)}
                >
                  {paymentModes.map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {mode}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Total Taxable Value</Typography>
                  <Typography><Money value={totalTaxableValue} symbol={currencySymbol} /></Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Total GST ({taxPercent}%)</Typography>
                  <Typography><Money value={totalGst} symbol={currencySymbol} /></Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography fontWeight={500}>Subtotal</Typography>
                  <Typography fontWeight={500}><Money value={subtotal} symbol={currencySymbol} /></Typography>
                </Box>
                {discountAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="text.secondary">
                      Addl. Discount {discountType === 'percent' && `(${discountValue}%)`}
                    </Typography>
                    <Typography color="error.main">
                      -<Money value={discountAmount} symbol={currencySymbol} />
                    </Typography>
                  </Box>
                )}
                {roundOff !== 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="text.secondary">Round off</Typography>
                    <Typography color={roundOff > 0 ? 'text.secondary' : 'error.main'}>
                      {roundOff > 0 ? '+' : ''}<Money value={roundOff} symbol={currencySymbol} />
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={600}>Final Amount Payable</Typography>
                  <Typography variant="h6" fontWeight={600} color="primary">
                    <Money value={roundedTotal} symbol={currencySymbol} />
                  </Typography>
                </Box>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleCompleteSale}
                disabled={cart.length === 0 || isCompleting || isSettingsLoading}
                sx={{ py: 1.5 }}
              >
                {isCompleting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  `Complete Sale (${formatCurrency(roundedTotal, currencySymbol)})`
                )}
              </Button>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 2, textAlign: 'center' }}
              >
                Press Enter in barcode field to add item
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={showClearConfirm}
        title="Clear Cart"
        message="Are you sure you want to clear all items from the cart?"
        confirmText="Clear"
        confirmColor="error"
        onConfirm={clearCart}
        onCancel={() => setShowClearConfirm(false)}
      />

      <Dialog
        open={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" />
          Sale Completed
        </DialogTitle>
        <DialogContent>
          {completedSale && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Bill No: <strong>{completedSale.billNo}</strong>
              </Alert>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Total Amount</Typography>
                <Typography fontWeight={600}>
                  <Money value={completedSale.total} symbol={currencySymbol} />
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Payment Mode</Typography>
                <Chip label={completedSale.paymentMode} size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Date/Time</Typography>
                <Typography>{new Date(completedSale.soldAt).toLocaleString()}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button type="button" onClick={() => setShowSuccessDialog(false)}>
            Close
          </Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
