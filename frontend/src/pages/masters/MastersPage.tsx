import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNotification } from '../../app/context/NotificationContext';
import { shortCodeService } from '../../services/shortCodeService';
import { formatApiError } from '../../services/api';
import type { ShortCode, ShortCodeType } from '../../domain/types';

// ---------------------------------------------------------------------------
// Configuration: add future types here
// ---------------------------------------------------------------------------
interface MasterTypeConfig {
  key: ShortCodeType;
  label: string;
  singular: string;
  description: string;
}

const MASTER_TYPES: MasterTypeConfig[] = [
  { key: 'CATEGORY', label: 'Categories', singular: 'Category', description: 'Product categories' },
  { key: 'BRAND', label: 'Brands', singular: 'Brand', description: 'Product brands' },
  { key: 'FABRIC', label: 'Fabrics', singular: 'Fabric', description: 'Fabric types' },
  { key: 'SIZE', label: 'Sizes', singular: 'Size', description: 'Variant sizes' },
  { key: 'COLOR', label: 'Colors', singular: 'Color', description: 'Variant colors' },
];

// ---------------------------------------------------------------------------
// Zod schema for the add/edit form
// ---------------------------------------------------------------------------
const shortCodeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters'),
  shortCode: z.string().min(1, 'Short code is required').max(10, 'Short code must not exceed 10 characters'),
});

type ShortCodeFormData = z.infer<typeof shortCodeSchema>;

const normalizeShortCodeValue = (value: string): string => value.replace(/\s+/g, '').toUpperCase();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function MastersPage() {
  const { success: showSuccess, error: showError } = useNotification();

  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  const activeType = MASTER_TYPES[activeTab];

  // Data state
  const [shortCodes, setShortCodes] = useState<ShortCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShortCode | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ShortCode | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form
  const form = useForm<ShortCodeFormData>({
    resolver: zodResolver(shortCodeSchema),
    defaultValues: { name: '', shortCode: '' },
  });

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  const fetchShortCodes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await shortCodeService.getShortCodes(activeType.key);
      setShortCodes(data);
    } catch (err) {
      showError(formatApiError(err, `Failed to load ${activeType.label.toLowerCase()}`));
    } finally {
      setLoading(false);
    }
  }, [activeType.key, activeType.label, showError]);

  useEffect(() => {
    fetchShortCodes();
  }, [fetchShortCodes]);

  // Reset search when switching tabs
  useEffect(() => {
    setSearch('');
  }, [activeTab]);

  // ---------------------------------------------------------------------------
  // Filtered rows
  // ---------------------------------------------------------------------------
  const filteredRows = useMemo(() => {
    if (!search.trim()) return shortCodes;
    const q = search.toLowerCase();
    return shortCodes.filter(
      (sc) =>
        sc.name.toLowerCase().includes(q) ||
        sc.shortCode.toLowerCase().includes(q),
    );
  }, [shortCodes, search]);

  // ---------------------------------------------------------------------------
  // Dialog handlers
  // ---------------------------------------------------------------------------
  const openAddDialog = () => {
    setEditingItem(null);
    form.reset({ name: '', shortCode: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (item: ShortCode) => {
    setEditingItem(item);
    form.reset({ name: item.name, shortCode: item.shortCode });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    form.reset({ name: '', shortCode: '' });
  };

  const openDeleteDialog = (item: ShortCode) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingItem(null);
  };

  // ---------------------------------------------------------------------------
  // Save handler (create or update)
  // ---------------------------------------------------------------------------
  const handleSave = async (data: ShortCodeFormData) => {
    setSaving(true);
    try {
      if (editingItem) {
        await shortCodeService.updateShortCode(editingItem.id, {
          name: data.name.trim(),
          shortCode: normalizeShortCodeValue(data.shortCode.trim()),
        });
        showSuccess(`${activeType.singular} updated successfully`);
      } else {
        await shortCodeService.createShortCode({
          type: activeType.key,
          name: data.name.trim(),
          shortCode: normalizeShortCodeValue(data.shortCode.trim()),
        });
        showSuccess(`${activeType.singular} created successfully`);
      }
      closeDialog();
      fetchShortCodes();
    } catch (err) {
      showError(formatApiError(err, `Failed to save ${activeType.singular.toLowerCase()}`));
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------
  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await shortCodeService.deleteShortCode(deletingItem.id);
      showSuccess(`${activeType.singular} "${deletingItem.name}" deleted successfully`);
      closeDeleteDialog();
      fetchShortCodes();
    } catch (err) {
      showError(formatApiError(err, `Failed to delete ${activeType.singular.toLowerCase()}`));
    } finally {
      setDeleting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // DataGrid columns
  // ---------------------------------------------------------------------------
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
        minWidth: 200,
      },
      {
        field: 'shortCode',
        headerName: 'Short Code',
        width: 150,
        renderCell: (params: GridRenderCellParams) => (
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 600,
              bgcolor: 'action.hover',
              px: 1,
              py: 0.25,
              borderRadius: 1,
              display: 'inline-block',
            }}
          >
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<ShortCode>) => (
          <Box>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => openEditDialog(params.row)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => openDeleteDialog(params.row)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Box>
      <PageHeader
        title="Masters"
        subtitle="Manage categories, brands, fabrics, sizes, and colors"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Masters' },
        ]}
      />

      {/* Tabs */}
      <Card sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newVal) => setActiveTab(newVal)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {MASTER_TYPES.map((mt) => (
            <Tab key={mt.key} label={mt.label} />
          ))}
        </Tabs>
      </Card>

      {/* Content Card */}
      <Card>
        {/* Toolbar: search + add button */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <TextField
            size="small"
            placeholder={`Search ${activeType.label.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddDialog}
          >
            Add {activeType.singular}
          </Button>
        </Box>

        {/* DataGrid */}
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': { borderBottom: 1, borderColor: 'divider' },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'action.hover',
              borderBottom: 1,
              borderColor: 'divider',
            },
          }}
        />
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={saving ? undefined : closeDialog} maxWidth="xs" fullWidth>
        <form onSubmit={form.handleSubmit(handleSave)}>
          <DialogTitle>
            {editingItem ? `Edit ${activeType.singular}` : `Add ${activeType.singular}`}
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            <TextField
              label="Name"
              fullWidth
              autoFocus
              {...form.register('name')}
              error={!!form.formState.errors.name}
              helperText={form.formState.errors.name?.message}
            />
            <TextField
              label="Short Code"
              fullWidth
              {...form.register('shortCode')}
              error={!!form.formState.errors.shortCode}
              helperText={
                form.formState.errors.shortCode?.message ||
                'Used in SKU generation (max 10 chars, stored uppercase)'
              }
              inputProps={{ maxLength: 10, style: { textTransform: 'uppercase' } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving...' : editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title={`Delete ${activeType.singular}`}
        message={`Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone. If it is in use by any product or variant, deletion will be blocked.`}
        confirmText="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={closeDeleteDialog}
        loading={deleting}
        showWarningIcon
      />
    </Box>
  );
}
