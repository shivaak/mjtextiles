// Billing (POS) page - main point of sale interface

import React, { useState, useRef, useEffect, useCallback } from 'react';
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

import { PageHeader, Money, ConfirmDialog } from '../../components/common';
import { useAuth } from '../../app/context/AuthContext';
import { useNotification } from '../../app/context/NotificationContext';
import {
  searchVariants,
  getVariantByBarcode,
  createSale,
  getSettings,
  getVariantWithProduct,
} from '../../data/repositories';
import type { CartItem, VariantWithProduct, PaymentMode, Sale } from '../../domain/types';
import {
  calculateSubtotal,
  calculateDiscountAmount,
  calculateTaxAmount,
  calculateGrandTotal,
  formatCurrency,
} from '../../domain/calculations';

export default function BillingPage() {
  const { session } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();
  const settings = getSettings();

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VariantWithProduct[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Discount and payment
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');

  // Dialog states
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Refs
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Calculate totals
  const subtotal = calculateSubtotal(cart);
  const discountAmount = discountType === 'percent'
    ? calculateDiscountAmount(subtotal, discountValue)
    : Math.min(discountValue, subtotal);
  const discountPercent = discountType === 'percent'
    ? discountValue
    : subtotal > 0 ? (discountValue / subtotal) * 100 : 0;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = calculateTaxAmount(afterDiscount, settings.taxPercent);
  const grandTotal = calculateGrandTotal(subtotal, discountAmount, taxAmount);

  // Handle barcode input
  const handleBarcodeSubmit = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      const variant = getVariantByBarcode(barcodeInput.trim());
      if (variant) {
        const variantWithProduct = getVariantWithProduct(variant.id);
        if (variantWithProduct) {
          addToCart(variantWithProduct);
        }
      } else {
        showWarning('Product not found');
      }
      setBarcodeInput('');
    }
  }, [barcodeInput]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = searchVariants(query).filter(v => v.status === 'ACTIVE');
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, []);

  // Add item to cart
  const addToCart = useCallback((variant: VariantWithProduct) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.variantId === variant.id);
      
      if (existingIndex >= 0) {
        // Check stock
        const newQty = prev[existingIndex].qty + 1;
        if (newQty > variant.stockQty) {
          showWarning(`Only ${variant.stockQty} items in stock`);
          return prev;
        }
        
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], qty: newQty };
        return updated;
      } else {
        // New item
        if (variant.stockQty <= 0) {
          showError('Out of stock');
          return prev;
        }
        
        return [...prev, {
          variantId: variant.id,
          variant,
          qty: 1,
          unitPrice: variant.sellingPrice,
        }];
      }
    });
    
    setSearchQuery('');
    setSearchResults([]);
    barcodeInputRef.current?.focus();
  }, [showError, showWarning]);

  // Update cart item quantity
  const updateQuantity = useCallback((variantId: string, delta: number) => {
    setCart(prev => {
      const index = prev.findIndex(item => item.variantId === variantId);
      if (index === -1) return prev;

      const item = prev[index];
      const newQty = item.qty + delta;

      if (newQty <= 0) {
        return prev.filter(i => i.variantId !== variantId);
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

  // Remove item from cart
  const removeFromCart = useCallback((variantId: string) => {
    setCart(prev => prev.filter(item => item.variantId !== variantId));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountValue(0);
    setShowClearConfirm(false);
    barcodeInputRef.current?.focus();
  }, []);

  // Complete sale
  const handleCompleteSale = useCallback(() => {
    if (cart.length === 0) {
      showError('Cart is empty');
      return;
    }

    try {
      const sale = createSale({
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        paymentMode,
        subtotal,
        discountAmount,
        discountPercent,
        taxAmount,
        taxPercent: settings.taxPercent,
        total: grandTotal,
        createdBy: session?.userId || '',
        items: cart.map(item => ({
          variantId: item.variantId,
          qty: item.qty,
          unitPrice: item.unitPrice,
        })),
      });

      setCompletedSale(sale);
      setShowSuccessDialog(true);
      showSuccess(`Sale completed: ${sale.billNo}`);
      
      // Reset cart
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountValue(0);
    } catch (error) {
      console.error('Sale error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete sale';
      showError(errorMessage);
    }
  }, [cart, customerName, customerPhone, paymentMode, subtotal, discountAmount, discountPercent, taxAmount, grandTotal, settings.taxPercent, session?.userId, showSuccess, showError]);

  // Print invoice
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
        {/* Left Panel - Product Search & Cart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              {/* Barcode Input */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  inputRef={barcodeInputRef}
                  fullWidth
                  placeholder="Scan barcode or enter manually"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
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

              {/* Product Search */}
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
                        {formatCurrency(option.sellingPrice, settings.currencySymbol)}
                      </Typography>
                      <Typography variant="caption" color={option.stockQty <= settings.lowStockThreshold ? 'error' : 'text.secondary'}>
                        Stock: {option.stockQty}
                      </Typography>
                    </Box>
                  </Box>
                )}
                noOptionsText="No products found"
              />
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Cart ({cart.length} items)
                </Typography>
                {cart.length > 0 && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setShowClearConfirm(true)}
                  >
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
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center" width={50}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.variantId}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.variant.productName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.variant.size} | {item.variant.color} | {item.variant.barcode}
                            </Typography>
                            {item.qty >= item.variant.stockQty && (
                              <Chip label="Max stock" size="small" color="warning" sx={{ ml: 1 }} />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <IconButton
                                size="small"
                                onClick={() => updateQuantity(item.variantId, -1)}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <TextField
                                value={item.qty}
                                onChange={(e) => {
                                  const newQty = parseInt(e.target.value) || 0;
                                  const delta = newQty - item.qty;
                                  if (delta !== 0) updateQuantity(item.variantId, delta);
                                }}
                                size="small"
                                sx={{ width: 60, mx: 1 }}
                                inputProps={{ style: { textAlign: 'center' } }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => updateQuantity(item.variantId, 1)}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Money value={item.unitPrice} />
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={500}>
                              <Money value={item.qty * item.unitPrice} />
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeFromCart(item.variantId)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Payment */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ position: 'sticky', top: 80 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Payment Details
              </Typography>

              {/* Customer Info */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Customer Name (Optional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Customer Phone (Optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  size="small"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Discount */}
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
                    onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    size="small"
                    inputProps={{ min: 0, step: discountType === 'percent' ? 1 : 10 }}
                  />
                </Box>
              </Box>

              {/* Payment Mode */}
              <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  value={paymentMode}
                  label="Payment Mode"
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                >
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="CARD">Card</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="CREDIT">Credit</MenuItem>
                </Select>
              </FormControl>

              <Divider sx={{ my: 2 }} />

              {/* Totals */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Subtotal</Typography>
                  <Typography><Money value={subtotal} /></Typography>
                </Box>
                {discountAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="text.secondary">
                      Discount {discountType === 'percent' && `(${discountValue}%)`}
                    </Typography>
                    <Typography color="error.main">-<Money value={discountAmount} /></Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Tax ({settings.taxPercent}%)</Typography>
                  <Typography><Money value={taxAmount} /></Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={600}>Grand Total</Typography>
                  <Typography variant="h6" fontWeight={600} color="primary">
                    <Money value={grandTotal} />
                  </Typography>
                </Box>
              </Box>

              {/* Complete Sale Button */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleCompleteSale}
                disabled={cart.length === 0}
                sx={{ py: 1.5 }}
              >
                Complete Sale ({formatCurrency(grandTotal, settings.currencySymbol)})
              </Button>

              {/* Keyboard shortcuts hint */}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                Press Enter in barcode field to add item
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Clear Cart Confirmation */}
      <ConfirmDialog
        open={showClearConfirm}
        title="Clear Cart"
        message="Are you sure you want to clear all items from the cart?"
        confirmText="Clear"
        confirmColor="error"
        onConfirm={clearCart}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* Success Dialog */}
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
                  <Money value={completedSale.total} />
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
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
