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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CancelIcon from '@mui/icons-material/Cancel';
import PrintIcon from '@mui/icons-material/Print';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import PaymentIcon from '@mui/icons-material/Payment';
import BadgeIcon from '@mui/icons-material/Badge';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BlockIcon from '@mui/icons-material/Block';
import dayjs from 'dayjs';

import { useAuth } from '../../app/context/AuthContext';
import { useNotification } from '../../app/context/NotificationContext';
import { formatApiError } from '../../services/api';
import { saleService } from '../../services/saleService';
import PageHeader from '../../components/common/PageHeader';
import Money from '../../components/common/Money';
import { formatCurrency } from '../../utils/calculations';
import type { SaleDetail } from '../../domain/types';

/** Format a number as ₹X,XXX.XX for use in plain-text tooltips */
const fmt = (v: number) => formatCurrency(Math.abs(v));

/* ------------------------------------------------------------------ */
/*  Small presentational helpers (kept local to avoid extra files)     */
/* ------------------------------------------------------------------ */

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1 }}>
      <Box sx={{ color: 'text.secondary', mt: 0.25, fontSize: 20, display: 'flex' }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, letterSpacing: 0.3, textTransform: 'uppercase', fontSize: '0.65rem' }}>
          {label}
        </Typography>
        <Box sx={{ mt: 0.25 }}>{typeof value === 'string' ? <Typography variant="body2" fontWeight={500}>{value}</Typography> : value}</Box>
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  SaleDetailPage                                                    */
/* ------------------------------------------------------------------ */

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { success: showSuccess, error: showError } = useNotification();
  const theme = useTheme();

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

  /* ---------- loading / error / empty states ---------- */

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

  /* ---------- derived values for summary ---------- */
  const discountedSubtotal = sale.subtotal - sale.discountAmount;
  const taxableValue = discountedSubtotal - sale.taxAmount;

  /* ---------- per-item profit (before bill discount & points) ---------- */
  const taxDivisor = 1 + sale.taxPercent / 100;
  const itemProfitData = sale.items.map((item) => {
    const itemDiscPct = item.itemDiscountPercent || 0;
    const effectiveUnitPrice = item.unitPrice * (1 - itemDiscPct / 100);
    const lineAmount = item.qty * effectiveUnitPrice;
    const lineTaxableValue = sale.taxPercent > 0 ? lineAmount / taxDivisor : lineAmount;
    const lineCost = (item.unitCostAtSale || 0) * item.qty;
    const profit = lineTaxableValue - lineCost;
    return {
      id: item.id,
      name: `${item.productName || '-'} (${item.size || '-'})`,
      lineTaxableValue,
      unitCost: item.unitCostAtSale || 0,
      qty: item.qty,
      lineCost,
      profit,
    };
  });
  const productProfitSum = itemProfitData.reduce((sum, p) => sum + p.profit, 0);

  /* ---------- styles ---------- */
  const summaryRowSx = { display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', columnGap: 2 };
  const summaryAmountSx = { textAlign: 'right', minWidth: 96 };
  const isVoided = sale.status === 'VOIDED';

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
          <Stack direction="row" spacing={1}>
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
          </Stack>
        }
      />

      {/* -------- Voided banner -------- */}
      {isVoided && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.error.main, 0.06),
            border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
          }}
        >
          <BlockIcon color="error" />
          <Box>
            <Typography variant="subtitle2" color="error.main" fontWeight={600}>
              Sale Voided
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sale.voidedAt ? dayjs(sale.voidedAt).format('MMM D, YYYY [at] h:mm A') : '-'}
              {sale.voidedByName ? ` by ${sale.voidedByName}` : ''}
              {sale.voidReason ? ` — ${sale.voidReason}` : ''}
            </Typography>
          </Box>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* ============================================================ */}
        {/*  LEFT SIDEBAR — Sale Information                             */}
        {/* ============================================================ */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              {/* Card header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ReceiptLongIcon fontSize="small" color="primary" />
                <Typography variant="subtitle1" fontWeight={600}>Sale Information</Typography>
              </Box>
              <Divider />

              {/* Status highlight */}
              <Box
                sx={{
                  mt: 2,
                  mb: 1,
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: isVoided
                    ? alpha(theme.palette.error.main, 0.06)
                    : alpha(theme.palette.success.main, 0.06),
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" fontWeight={500} color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={sale.status}
                  color={sale.status === 'COMPLETED' ? 'success' : 'error'}
                  size="small"
                  sx={{ fontWeight: 600, letterSpacing: 0.5 }}
                />
              </Box>

              {/* Info rows */}
              <Stack spacing={0} sx={{ mt: 1 }} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
                <InfoRow
                  icon={<ReceiptLongIcon fontSize="inherit" />}
                  label="Bill Number"
                  value={sale.billNo}
                />
                <InfoRow
                  icon={<CalendarTodayIcon fontSize="inherit" />}
                  label="Date & Time"
                  value={dayjs(sale.soldAt).format('MMM D, YYYY · h:mm A')}
                />
                <InfoRow
                  icon={<PaymentIcon fontSize="inherit" />}
                  label="Payment Mode"
                  value={
                    <Chip
                      label={sale.paymentMode}
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 500, mt: 0.25 }}
                    />
                  }
                />
                <InfoRow
                  icon={<BadgeIcon fontSize="inherit" />}
                  label="Cashier"
                  value={sale.createdByName || '-'}
                />
                {sale.customerName && (
                  <InfoRow
                    icon={<PersonIcon fontSize="inherit" />}
                    label="Customer Name"
                    value={sale.customerName}
                  />
                )}
                {sale.customerPhone && (
                  <InfoRow
                    icon={<PhoneIcon fontSize="inherit" />}
                    label="Customer Phone"
                    value={sale.customerPhone}
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ============================================================ */}
        {/*  MAIN — Items table & summary                                */}
        {/* ============================================================ */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined">
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              {/* Card header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingCartIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle1" fontWeight={600}>Items</Typography>
                </Box>
                <Chip
                  label={`${sale.items.length} item${sale.items.length !== 1 ? 's' : ''}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              </Box>
              <Divider />

              {/* Items table */}
              <TableContainer sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        '& .MuiTableCell-head': {
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          color: 'text.secondary',
                          py: 1.5,
                          borderBottom: `2px solid ${theme.palette.divider}`,
                        },
                      }}
                    >
                      <TableCell>Product</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell align="right">
                        <Typography variant="inherit">Rate</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '0.65rem' }}>
                          (Incl GST)
                        </Typography>
                      </TableCell>
                      <TableCell align="right">Discount</TableCell>
                      <TableCell align="right">Taxable</TableCell>
                      <TableCell align="right">GST ({sale.taxPercent}%)</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      {isAdmin && <TableCell align="right">Cost</TableCell>}
                      {isAdmin && <TableCell align="right">Profit</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sale.items.map((item, idx) => {
                      const itemDiscPct = item.itemDiscountPercent || 0;
                      const effectiveUnitPrice = item.unitPrice * (1 - itemDiscPct / 100);
                      const lineAmount = item.qty * effectiveUnitPrice;
                      const lineTaxableValue = sale.taxPercent > 0 ? lineAmount / taxDivisor : lineAmount;
                      const lineGst = lineAmount - lineTaxableValue;
                      const lineCost = (item.unitCostAtSale || 0) * item.qty;
                      const itemProfit = lineTaxableValue - lineCost;

                      const profitTooltip = `Taxable ${fmt(lineTaxableValue)} − Cost (${fmt(item.unitCostAtSale || 0)} × ${item.qty}) ${fmt(lineCost)} = ${fmt(itemProfit)}`;

                      return (
                        <TableRow
                          key={item.id}
                          sx={{
                            bgcolor: idx % 2 === 0 ? 'transparent' : alpha(theme.palette.text.primary, 0.02),
                            '&:last-child td': { borderBottom: 0 },
                            '& .MuiTableCell-root': { py: 1.25 },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.productName || '-'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
                              {item.variantBarcode || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={500}>{item.qty}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2"><Money value={item.unitPrice} /></Typography>
                          </TableCell>
                          <TableCell align="right">
                            {itemDiscPct > 0 ? (
                              <Chip
                                label={`${itemDiscPct}%`}
                                size="small"
                                color="error"
                                variant="outlined"
                                sx={{ fontWeight: 600, height: 22, fontSize: '0.7rem' }}
                              />
                            ) : (
                              <Typography variant="body2" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2"><Money value={lineTaxableValue} /></Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              <Money value={lineGst} />
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}><Money value={lineAmount} /></Typography>
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
                              <Tooltip title={profitTooltip} arrow placement="top">
                                <Typography variant="body2" color="success.main" fontWeight={600} sx={{ cursor: 'help' }}>
                                  <Money value={itemProfit} />
                                </Typography>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* -------- Summary -------- */}
              <Box
                sx={{
                  mt: 3,
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.03),
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                {/* Subtotal */}
                <Box sx={{ ...summaryRowSx, mb: 1 }}>
                  <Typography variant="body2" fontWeight={500}>Subtotal (after item discounts)</Typography>
                  <Typography variant="body2" fontWeight={500} sx={summaryAmountSx}><Money value={sale.subtotal} /></Typography>
                </Box>

                {/* Bill-level discount */}
                {sale.discountAmount > 0 && (
                  <Box sx={{ ...summaryRowSx, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Bill Discount ({sale.discountPercent.toFixed(1)}%)
                    </Typography>
                    <Typography variant="body2" color="error.main" fontWeight={500} sx={summaryAmountSx}>
                      -<Money value={sale.discountAmount} />
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

                {/* Taxable value */}
                <Box sx={{ ...summaryRowSx, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Taxable Value</Typography>
                  <Typography variant="body2" sx={summaryAmountSx}><Money value={taxableValue} /></Typography>
                </Box>

                {/* GST */}
                <Box sx={{ ...summaryRowSx, mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">GST ({sale.taxPercent}%)</Typography>
                    <Tooltip title="GST is calculated after bill-level discount.">
                      <Box component="span" sx={{ display: 'inline-flex' }}>
                        <HelpOutlineIcon aria-label="GST is calculated after bill-level discount" sx={{ fontSize: 14, color: 'text.disabled' }} />
                      </Box>
                    </Tooltip>
                  </Box>
                  <Typography variant="body2" sx={summaryAmountSx}><Money value={sale.taxAmount} /></Typography>
                </Box>

                {/* Points redeemed */}
                {(sale.pointsRedeemed ?? 0) > 0 && (
                  <Box sx={{ ...summaryRowSx, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Points Redeemed ({sale.pointsRedeemed} pts)
                      </Typography>
                      <Tooltip title="Points are applied after GST.">
                        <Box component="span" sx={{ display: 'inline-flex' }}>
                          <HelpOutlineIcon aria-label="Points are applied after GST" sx={{ fontSize: 14, color: 'text.disabled' }} />
                        </Box>
                      </Tooltip>
                    </Box>
                    <Typography variant="body2" color="error.main" fontWeight={500} sx={summaryAmountSx}>
                      -<Money value={sale.pointsRedemptionAmount || 0} />
                    </Typography>
                  </Box>
                )}

                {/* Net Payable */}
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                    ...summaryRowSx,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>Net Payable</Typography>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="primary.main"
                    sx={{
                      ...summaryAmountSx,
                      textDecoration: isVoided ? 'line-through' : 'none',
                    }}
                  >
                    <Money value={sale.total - (sale.pointsRedemptionAmount || 0)} />
                  </Typography>
                </Box>

                {/* Product Profit — sum of per-item profits (admin) */}
                {isAdmin && sale.status === 'COMPLETED' && (
                  <>
                    <Box sx={{ ...summaryRowSx, mt: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Product Profit (before bill discounts & points)
                        </Typography>
                        <Tooltip
                          title={
                            itemProfitData.length <= 1
                              ? `Taxable ${fmt(itemProfitData[0]?.lineTaxableValue ?? 0)} − Cost ${fmt(itemProfitData[0]?.lineCost ?? 0)} = ${fmt(productProfitSum)}`
                              : itemProfitData.map((p) => `${p.name}: ${fmt(p.profit)}`).join(' + ') + ` = ${fmt(productProfitSum)}`
                          }
                          arrow
                          placement="top"
                        >
                          <Box component="span" sx={{ display: 'inline-flex', cursor: 'help' }}>
                            <HelpOutlineIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          </Box>
                        </Tooltip>
                      </Box>
                      <Typography variant="body2" color="success.main" fontWeight={600} sx={summaryAmountSx}>
                        <Money value={productProfitSum} />
                      </Typography>
                    </Box>

                    {/* Net Profit — backend value after bill discount & points */}
                    <Box sx={{ ...summaryRowSx, mt: 0.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" color="text.disabled">
                          Net Profit (after bill discounts & points)
                        </Typography>
                        <Tooltip
                          title={
                            `Product Profit ${fmt(productProfitSum)}`
                            + (sale.discountAmount > 0 ? ` − Bill Discount ${fmt(sale.discountAmount)}` : '')
                            + ((sale.pointsRedemptionAmount || 0) > 0 ? ` − Points ${fmt(sale.pointsRedemptionAmount || 0)}` : '')
                            + ` = ${fmt(sale.profit || 0)}`
                          }
                          arrow
                          placement="top"
                        >
                          <Box component="span" sx={{ display: 'inline-flex', cursor: 'help' }}>
                            <HelpOutlineIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                          </Box>
                        </Tooltip>
                      </Box>
                      <Typography variant="caption" color="text.disabled" fontWeight={500} sx={summaryAmountSx}>
                        <Money value={sale.profit || 0} />
                      </Typography>
                    </Box>
                  </>
                )}

                {/* Points earned */}
                {(sale.pointsEarned ?? 0) > 0 && (
                  <Box sx={{ ...summaryRowSx, mt: 1.5 }}>
                    <Typography variant="body2" color="success.main" fontWeight={600}>
                      Points Earned
                    </Typography>
                    <Typography variant="body2" color="success.main" fontWeight={600} sx={summaryAmountSx}>
                      +{sale.pointsEarned} pts
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ============================================================ */}
      {/*  Void Dialog                                                  */}
      {/* ============================================================ */}
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

      {/* ============================================================ */}
      {/*  Exchange Dialog                                              */}
      {/* ============================================================ */}
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
                <li>Refund the customer: <strong><Money value={sale.total - (sale.pointsRedemptionAmount || 0)} /></strong></li>
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
