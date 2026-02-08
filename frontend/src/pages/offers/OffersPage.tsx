import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  Autocomplete,
  Divider,
  Alert,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../app/context/NotificationContext';
import { offerService } from '../../services/offerService';
import { productService } from '../../services/productService';
import { formatApiError } from '../../services/api';
import type { Offer, OfferType, OfferItem, Product } from '../../domain/types';

const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  QUANTITY_PRICE: 'Quantity Price',
  QUANTITY_DISCOUNT: 'Quantity Discount',
  COMBO: 'Combo Deal',
  BOGO: 'Buy X Get Y Free',
};

const OFFER_TYPE_HELP: Record<OfferType, { description: string; example: string; fields: string }> = {
  QUANTITY_PRICE: {
    description: 'Set a special price per unit when the customer buys a minimum quantity.',
    example: 'Buy 3 or more Cotton Shirts → each at ₹399 instead of ₹499',
    fields: 'Set: Product, Min Qty, Offer Price',
  },
  QUANTITY_DISCOUNT: {
    description: 'Give a percentage discount when the customer buys a minimum quantity.',
    example: 'Buy 3 or more Jeans → get 10% off on each',
    fields: 'Set: Product, Min Qty, Discount %',
  },
  COMBO: {
    description: 'Offer a combined price when the customer buys specific products together.',
    example: 'Shirt + Pant together for ₹999 (instead of ₹600 + ₹500 = ₹1100)',
    fields: 'Set: 2+ Products with Min Qty each, Combo Price',
  },
  BOGO: {
    description: 'Give free items when the customer buys a minimum quantity.',
    example: 'Buy 2 T-Shirts, get 1 free (customer takes 3, pays for 2)',
    fields: 'Set: Product, Min Qty (buy), Free Qty (get)',
  },
};

const EMPTY_ITEM: OfferItem = { minQty: 1, freeQty: 0 };

interface OfferForm {
  name: string;
  offerType: OfferType;
  isActive: boolean;
  startDate: string;
  endDate: string;
  comboPrice: string;
  priority: string;
  items: OfferItem[];
}

const INITIAL_FORM: OfferForm = {
  name: '',
  offerType: 'QUANTITY_PRICE',
  isActive: true,
  startDate: '',
  endDate: '',
  comboPrice: '',
  priority: '0',
  items: [{ ...EMPTY_ITEM }],
};

export default function OffersPage() {
  const { success: showSuccess, error: showError } = useNotification();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<OfferForm>({ ...INITIAL_FORM });
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await offerService.getOffers();
      setOffers(data);
    } catch (error) {
      showError(formatApiError(error, 'Failed to load offers'));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await productService.getProducts({ includeInactive: false, size: 500 });
      setProducts(data.content || []);
    } catch {
      // Silently fail - user can still enter manually
    }
  }, []);

  useEffect(() => {
    fetchOffers();
    fetchProducts();
  }, [fetchOffers, fetchProducts]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ ...INITIAL_FORM, items: [{ ...EMPTY_ITEM }] });
    setDialogOpen(true);
  };

  const handleOpenEdit = (offer: Offer) => {
    setEditingId(offer.id);
    setForm({
      name: offer.name,
      offerType: offer.offerType,
      isActive: offer.isActive,
      startDate: offer.startDate || '',
      endDate: offer.endDate || '',
      comboPrice: offer.comboPrice?.toString() || '',
      priority: offer.priority?.toString() || '0',
      items: offer.items.length > 0 ? offer.items.map((i) => ({ ...i })) : [{ ...EMPTY_ITEM }],
    });
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showError('Offer name is required');
      return;
    }

    // Validate items have product/variant
    for (const item of form.items) {
      if (!item.productId && !item.variantId) {
        showError('Each offer item must have a product selected');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        offerType: form.offerType,
        isActive: form.isActive,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        comboPrice: form.comboPrice ? parseFloat(form.comboPrice) : undefined,
        priority: parseInt(form.priority, 10) || 0,
        items: form.items.map((item) => ({
          productId: item.productId || undefined,
          variantId: item.variantId || undefined,
          minQty: item.minQty || 1,
          offerPrice: item.offerPrice || undefined,
          discountPercent: item.discountPercent || undefined,
          freeQty: item.freeQty || 0,
        })),
      };

      if (editingId) {
        await offerService.updateOffer(editingId, payload);
        showSuccess('Offer updated successfully');
      } else {
        await offerService.createOffer(payload);
        showSuccess('Offer created successfully');
      }

      handleClose();
      fetchOffers();
    } catch (error) {
      showError(formatApiError(error, 'Failed to save offer'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await offerService.toggleOfferStatus(id);
      fetchOffers();
    } catch (error) {
      showError(formatApiError(error, 'Failed to toggle offer'));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await offerService.deleteOffer(deleteId);
      showSuccess('Offer deleted');
      setDeleteId(null);
      fetchOffers();
    } catch (error) {
      showError(formatApiError(error, 'Failed to delete offer'));
    }
  };

  const updateFormItem = (index: number, field: keyof OfferItem, value: any) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addFormItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }));
  };

  const removeFormItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 200 },
    {
      field: 'offerType',
      headerName: 'Type',
      width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={OFFER_TYPE_LABELS[params.value as OfferType] || params.value}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Active',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Switch
          size="small"
          checked={params.value}
          onChange={() => handleToggle(params.row.id)}
        />
      ),
    },
    {
      field: 'items',
      headerName: 'Items',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const items = params.value as OfferItem[];
        return (
          <Typography variant="body2">
            {items?.length || 0} product{(items?.length || 0) !== 1 ? 's' : ''}
          </Typography>
        );
      },
    },
    {
      field: 'startDate',
      headerName: 'Start',
      width: 120,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? <Typography variant="body2">{params.value}</Typography> : <Typography variant="body2" color="text.secondary">Always</Typography>,
    },
    {
      field: 'endDate',
      headerName: 'End',
      width: 120,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? <Typography variant="body2">{params.value}</Typography> : <Typography variant="body2" color="text.secondary">No expiry</Typography>,
    },
    { field: 'priority', headerName: 'Priority', width: 80 },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton size="small" onClick={() => handleOpenEdit(params.row as Offer)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => setDeleteId(params.row.id)}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Helper: get the relevant fields to show per offer type for an item
  const renderItemFields = (item: OfferItem, index: number) => {
    return (
      <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2">Item {index + 1}</Typography>
          {form.items.length > 1 && (
            <IconButton size="small" color="error" onClick={() => removeFormItem(index)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        <Autocomplete
          options={products}
          getOptionLabel={(opt) => `${opt.name} (${opt.brand})`}
          value={products.find((p) => p.id === item.productId) || null}
          onChange={(_, val) => updateFormItem(index, 'productId', val?.id || undefined)}
          renderInput={(params) => <TextField {...params} label="Product" size="small" sx={{ mb: 1.5 }} />}
          size="small"
        />

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            label="Min Qty"
            type="number"
            value={item.minQty}
            onChange={(e) => updateFormItem(index, 'minQty', parseInt(e.target.value, 10) || 1)}
            size="small"
            sx={{ width: 100 }}
            inputProps={{ min: 1 }}
          />

          {form.offerType === 'QUANTITY_PRICE' && (
            <TextField
              label="Offer Price"
              type="number"
              value={item.offerPrice || ''}
              onChange={(e) => updateFormItem(index, 'offerPrice', parseFloat(e.target.value) || undefined)}
              size="small"
              sx={{ width: 130 }}
              inputProps={{ min: 0 }}
            />
          )}

          {form.offerType === 'QUANTITY_DISCOUNT' && (
            <TextField
              label="Discount %"
              type="number"
              value={item.discountPercent || ''}
              onChange={(e) => updateFormItem(index, 'discountPercent', parseFloat(e.target.value) || undefined)}
              size="small"
              sx={{ width: 130 }}
              inputProps={{ min: 0, max: 100 }}
            />
          )}

          {form.offerType === 'BOGO' && (
            <TextField
              label="Free Qty"
              type="number"
              value={item.freeQty || ''}
              onChange={(e) => updateFormItem(index, 'freeQty', parseInt(e.target.value, 10) || 0)}
              size="small"
              sx={{ width: 100 }}
              inputProps={{ min: 1 }}
            />
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <PageHeader
        title="Offers"
        subtitle="Manage promotional offers"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Offers' },
        ]}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            New Offer
          </Button>
        }
      />

      <Card>
        <Box sx={{ width: '100%', overflow: 'auto' }}>
          <DataGrid
            rows={offers}
            columns={columns}
            loading={loading}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            sx={{ border: 'none', '& .MuiDataGrid-cell': { py: 1 } }}
          />
        </Box>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Offer' : 'Create Offer'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Offer Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            size="small"
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Offer Type</InputLabel>
              <Select
                value={form.offerType}
                label="Offer Type"
                onChange={(e) => {
                  const newType = e.target.value as OfferType;
                  const newItems = newType === 'COMBO' && form.items.length < 2
                    ? [...form.items, { ...EMPTY_ITEM }]
                    : newType !== 'COMBO' && form.items.length > 1
                      ? [form.items[0]]
                      : form.items;
                  setForm({ ...form, offerType: newType, items: newItems });
                }}
              >
                {Object.entries(OFFER_TYPE_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip
              arrow
              placement="right"
              title={
                <Box sx={{ p: 0.5, maxWidth: 300 }}>
                  {Object.entries(OFFER_TYPE_HELP).map(([key, info]) => (
                    <Box key={key} sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}>
                      <Typography variant="caption" fontWeight={700} display="block" color={key === form.offerType ? 'primary.light' : 'inherit'}>
                        {OFFER_TYPE_LABELS[key as OfferType]} {key === form.offerType ? '(selected)' : ''}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mb: 0.25 }}>
                        {info.description}
                      </Typography>
                      <Typography variant="caption" display="block" color="grey.400" fontStyle="italic">
                        e.g. {info.example}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              }
            >
              <HelpOutlineIcon sx={{ mt: 1, fontSize: 20, color: 'text.disabled', cursor: 'help' }} />
            </Tooltip>
          </Box>
          <Alert severity="info" variant="outlined" sx={{ mb: 2, py: 0 }} icon={false}>
            <Typography variant="caption">
              <strong>{OFFER_TYPE_LABELS[form.offerType]}:</strong> {OFFER_TYPE_HELP[form.offerType].example}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              {OFFER_TYPE_HELP[form.offerType].fields}
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            <TextField
              label="Priority"
              type="number"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              size="small"
              sx={{ width: 100 }}
            />
            <FormControlLabel
              control={
                <Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              }
              label="Active"
            />
          </Box>

          {form.offerType === 'COMBO' && (
            <TextField
              fullWidth
              label="Combo Price (total)"
              type="number"
              value={form.comboPrice}
              onChange={(e) => setForm({ ...form, comboPrice: e.target.value })}
              size="small"
              sx={{ mb: 2 }}
              inputProps={{ min: 0 }}
            />
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>Offer Items</Typography>
            {form.offerType === 'COMBO' && (
              <Button size="small" startIcon={<AddIcon />} onClick={addFormItem}>
                Add Item
              </Button>
            )}
          </Box>

          {form.offerType !== 'COMBO' && form.items.length > 1 && (
            <Alert severity="info" sx={{ mb: 1 }}>
              This offer type supports only one item.
            </Alert>
          )}

          {form.items.map((item, index) => renderItemFields(item, index))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Offer"
        message="Are you sure you want to delete this offer? This cannot be undone."
        confirmText="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
