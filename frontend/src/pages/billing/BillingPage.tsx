import { useState, useRef, useEffect, useCallback } from 'react';
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

import PageHeader from '../../components/common/PageHeader';
import Money from '../../components/common/Money';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../app/context/NotificationContext';
import { productService } from '../../services/productService';
import { saleService } from '../../services/saleService';
import { settingsService } from '../../services/settingsService';
import { formatApiError } from '../../services/api';
import { lookupService } from '../../services/lookupService';
import type {
  CartItem,
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

  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');

  const [completedSale, setCompletedSale] = useState<SaleDetail | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [paymentModes, setPaymentModes] = useState<string[]>([]);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsSettingsLoading(true);
      try {
        const [settingsData, lookups] = await Promise.all([
          settingsService.getSettings(),
          lookupService.getLookups(),
        ]);
        setSettings(settingsData);
        setPaymentModes(lookups.paymentModes || []);
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
  const taxMultiplier = 1 + taxPercent / 100;
  const getBaseUnitPrice = useCallback(
    (price: number) => (taxPercent > 0 ? price / taxMultiplier : price),
    [taxPercent, taxMultiplier]
  );

  const subtotal = cart.reduce((sum, item) => sum + (getBaseUnitPrice(item.unitPrice) * item.qty), 0);
  const discountAmount = discountType === 'percent'
    ? calculateDiscountAmount(subtotal, discountValue)
    : Math.min(discountValue, subtotal);
  const discountPercent = discountType === 'percent'
    ? Math.min(discountValue, 100)
    : subtotal > 0 ? Math.min((discountValue / subtotal) * 100, 100) : 0;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = taxPercent > 0 ? (afterDiscount * taxPercent) / 100 : 0;
  const grandTotal = afterDiscount + taxAmount;

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

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

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
                getOptionLabel={(option) =>
                  typeof option === 'string'
                    ? option
                    : `${option.productName} - ${option.size} ${option.color} (${option.barcode})`
                }
                inputValue={searchQuery}
                onInputChange={(_, value) => handleSearch(value)}
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
                        {option.size} | {option.color} | {option.barcode}
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
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="center">Qty</TableCell>
                      <TableCell align="right">Price (excl tax)</TableCell>
                      <TableCell align="right">Tax ({taxPercent}%)</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center" width={50}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                    {cart.map((item) => {
                      const baseUnitPrice = getBaseUnitPrice(item.unitPrice);
                      const lineTax = (item.unitPrice - baseUnitPrice) * item.qty;

                      return (
                        <TableRow key={item.variantId}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.variant.productName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" component="div">
                              {item.variant.size} | {item.variant.color} | {item.variant.sku}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" component="div">
                              MRP: {formatCurrency(item.unitPrice, currencySymbol)}
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
                          <TableCell align="right">
                            <Money value={baseUnitPrice} symbol={currencySymbol} />
                          </TableCell>
                          <TableCell align="right">
                            <Money value={lineTax} symbol={currencySymbol} />
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={500}>
                              <Money value={item.qty * item.unitPrice} symbol={currencySymbol} />
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
                  Discount
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
                  <Typography color="text.secondary">Subtotal</Typography>
                  <Typography><Money value={subtotal} symbol={currencySymbol} /></Typography>
                </Box>
                {discountAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="text.secondary">
                      Discount {discountType === 'percent' && `(${discountValue}%)`}
                    </Typography>
                    <Typography color="error.main">
                      -<Money value={discountAmount} symbol={currencySymbol} />
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Tax ({taxPercent}%)</Typography>
                  <Typography><Money value={taxAmount} symbol={currencySymbol} /></Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={600}>Grand Total</Typography>
                  <Typography variant="h6" fontWeight={600} color="primary">
                    <Money value={grandTotal} symbol={currencySymbol} />
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
                  `Complete Sale (${formatCurrency(grandTotal, currencySymbol)})`
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
