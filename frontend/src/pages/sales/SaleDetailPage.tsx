import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CancelIcon from '@mui/icons-material/Cancel';
import PrintIcon from '@mui/icons-material/Print';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import dayjs from 'dayjs';

import { useAuth } from '../../app/context/AuthContext';
import { useNotification } from '../../app/context/NotificationContext';
import { formatApiError } from '../../services/api';
import { saleService } from '../../services/saleService';
import PageHeader from '../../components/common/PageHeader';
import Money from '../../components/common/Money';
import type { SaleDetail } from '../../domain/types';

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { success: showSuccess, error: showError } = useNotification();

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  const saleId = useMemo(() => (id ? Number(id) : NaN), [id]);

  useEffect(() => {
    if (!id) {
      setLoadError('Sale id is missing');
      return;
    }
    if (Number.isNaN(saleId)) {
      setLoadError('Invalid sale id');
      return;
    }
    let isMounted = true;
    setLoading(true);
    setLoadError(null);
    saleService
      .getSaleById(saleId)
      .then((data) => {
        if (isMounted) {
          setSale(data);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(formatApiError(error, 'Failed to load sale details'));
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [id, saleId]);

  const handleVoidSale = async () => {
    if (!sale) return;
    if (!voidReason.trim()) {
      showError('Please provide a reason');
      return;
    }
    setVoiding(true);
    try {
      const updatedSale = await saleService.voidSale(sale.id, voidReason.trim());
      setSale(updatedSale);
      setVoidDialogOpen(false);
      setVoidReason('');
      showSuccess('Sale voided successfully');
    } catch (error) {
      showError(formatApiError(error, 'Failed to void sale'));
    } finally {
      setVoiding(false);
    }
  };

  const handlePrint = async () => {
    if (!sale) return;
    try {
      const pdfBlob = await saleService.getSaleInvoice(sale.id);
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      showError(formatApiError(error, 'Failed to generate invoice'));
    }
  };

  if (loading) {
    return (
      <Box>
        <PageHeader
          title="Sale Details"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Sales', href: '/sales' },
          ]}
        />
        <Alert severity="info">Loading sale details...</Alert>
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box>
        <PageHeader
          title="Sale Details"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Sales', href: '/sales' },
          ]}
        />
        <Alert severity="error">{loadError}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/sales')} sx={{ mt: 2 }}>
          Back to Sales
        </Button>
      </Box>
    );
  }

  if (!sale) {
    return (
      <Box>
        <PageHeader
          title="Sale Details"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Sales', href: '/sales' },
          ]}
        />
        <Alert severity="error">Sale not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/sales')} sx={{ mt: 2 }}>
          Back to Sales
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`Sale ${sale.billNo}`}
        subtitle={dayjs(sale.soldAt).format('MMMM D, YYYY [at] h:mm A')}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/sales' },
          { label: sale.billNo },
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/sales')}>
              Back
            </Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
              Print
            </Button>
            {sale.status === 'COMPLETED' && (
              <>
                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<SwapHorizIcon />}
                  onClick={() => setExchangeDialogOpen(true)}
                >
                  Exchange
                </Button>
                {isAdmin && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => setVoidDialogOpen(true)}
                  >
                    Void Sale
                  </Button>
                )}
              </>
            )}
          </Box>
        }
      />

      {sale.status === 'VOIDED' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          This sale was voided on {sale.voidedAt ? dayjs(sale.voidedAt).format('MMM D, YYYY [at] h:mm A') : '-'}
          {sale.voidedByName ? ` by ${sale.voidedByName}` : ''}
          {sale.voidReason ? `. Reason: ${sale.voidReason}` : ''}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Sale Information</Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Bill Number</Typography>
                <Typography variant="body1" fontWeight={500}>{sale.billNo}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Date & Time</Typography>
                <Typography variant="body1">
                  {dayjs(sale.soldAt).format('MMMM D, YYYY [at] h:mm A')}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box>
                  <Chip
                    label={sale.status}
                    color={sale.status === 'COMPLETED' ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Payment Mode</Typography>
                <Box>
                  <Chip label={sale.paymentMode} variant="outlined" size="small" />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Cashier</Typography>
                <Typography variant="body1">{sale.createdByName || '-'}</Typography>
              </Box>

              {sale.customerName && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">Customer Name</Typography>
                  <Typography variant="body1">{sale.customerName}</Typography>
                </Box>
              )}

              {sale.customerPhone && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">Customer Phone</Typography>
                  <Typography variant="body1">{sale.customerPhone}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Items</Typography>
              <Divider sx={{ mb: 2 }} />

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>Rate</Typography>
                        <Typography variant="caption" color="text.secondary">(Incl GST)</Typography>
                      </TableCell>
                      <TableCell align="right">Discount</TableCell>
                      <TableCell align="right">Taxable Value</TableCell>
                      <TableCell align="right">GST ({sale.taxPercent}%)</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      {isAdmin && <TableCell align="right">Cost</TableCell>}
                      {isAdmin && <TableCell align="right">Profit</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sale.items.map((item) => {
                      const itemDiscPct = item.itemDiscountPercent || 0;
                      const effectiveUnitPrice = item.unitPrice * (1 - itemDiscPct / 100);
                      const taxDivisor = 1 + sale.taxPercent / 100;
                      const lineAmount = item.qty * effectiveUnitPrice;
                      const lineTaxableValue = sale.taxPercent > 0 ? lineAmount / taxDivisor : lineAmount;
                      const lineGst = lineAmount - lineTaxableValue;
                      const lineRevenue = lineAmount / taxDivisor;
                      const itemProfit = (lineRevenue - (item.unitCostAtSale || 0) * item.qty);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.productName || '-'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.size || '-'} | {item.color || '-'} | {item.variantBarcode || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{item.qty}</TableCell>
                          <TableCell align="right"><Money value={item.unitPrice} /></TableCell>
                          <TableCell align="right">
                            {itemDiscPct > 0 ? (
                              <Typography variant="body2" color="error.main" fontWeight={500}>
                                {itemDiscPct}%
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right"><Money value={lineTaxableValue} /></TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              <Money value={lineGst} />
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={500}><Money value={lineAmount} /></Typography>
                          </TableCell>
                          {isAdmin && (
                            <TableCell align="right">
                              <Typography variant="body2" color="text.secondary">
                                <Money value={item.unitCostAtSale || 0} />
                              </Typography>
                            </TableCell>
                          )}
                          {isAdmin && (
                            <TableCell align="right">
                              <Typography color="success.main" fontWeight={500}>
                                <Money value={itemProfit} />
                              </Typography>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Total Taxable Value</Typography>
                  <Typography><Money value={sale.subtotal - sale.taxAmount} /></Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Total GST ({sale.taxPercent}%)</Typography>
                  <Typography><Money value={sale.taxAmount} /></Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography fontWeight={500}>Subtotal</Typography>
                  <Typography fontWeight={500}><Money value={sale.subtotal} /></Typography>
                </Box>
                {sale.discountAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="text.secondary">
                      Addl. Discount ({sale.discountPercent.toFixed(1)}%)
                    </Typography>
                    <Typography color="error.main">-<Money value={sale.discountAmount} /></Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={600}>Final Amount</Typography>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{ textDecoration: sale.status === 'VOIDED' ? 'line-through' : 'none' }}
                  >
                    <Money value={sale.total} />
                  </Typography>
                </Box>
                {isAdmin && sale.status === 'COMPLETED' && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography color="text.secondary">Total Profit</Typography>
                    <Typography color="success.main" fontWeight={600}>
                      <Money value={sale.profit || 0} />
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={voidDialogOpen}
        onClose={() => setVoidDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Void Sale</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Voiding this sale will restore the stock quantities. This action cannot be undone.
          </Alert>
          <TextField
            fullWidth
            label="Reason for voiding"
            value={voidReason}
            onChange={(event) => setVoidReason(event.target.value)}
            multiline
            rows={2}
            placeholder="e.g., Customer returned items, Wrong items added..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button type="button" onClick={() => setVoidDialogOpen(false)} disabled={voiding}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleVoidSale}
            disabled={voiding || !voidReason.trim()}
          >
            {voiding ? 'Voiding...' : 'Void Sale'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={exchangeDialogOpen}
        onClose={() => setExchangeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SwapHorizIcon color="info" />
            Exchange / Return
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            To process an exchange or return, follow these steps:
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              For Exchange (Customer wants different item):
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                <li>Note down the items being returned</li>
                <li>Click <strong>Void Sale</strong> to cancel this bill and restore stock</li>
                <li>Go to <strong>Billing (POS)</strong> and create a new sale with the correct items</li>
                <li>Apply discount if customer is getting a cheaper item (refund difference in cash)</li>
                <li>Collect additional payment if new item is more expensive</li>
              </ol>
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              For Full Return (Customer wants money back):
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                <li>Click <strong>Void Sale</strong> to cancel this bill</li>
                <li>Stock will be automatically restored</li>
                <li>Refund the customer: <strong><Money value={sale.total} /></strong></li>
              </ol>
            </Typography>
          </Box>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Tip:</strong> Always verify the returned items match what was sold before voiding.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button type="button" onClick={() => setExchangeDialogOpen(false)}>
            Close
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setExchangeDialogOpen(false);
              navigate('/billing');
            }}
          >
            Go to Billing
          </Button>
          {isAdmin && (
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                setExchangeDialogOpen(false);
                setVoidDialogOpen(true);
              }}
            >
              Void This Sale
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
