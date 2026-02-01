// Settings page - shop configuration (Admin only)

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Typography,
  Divider,
  InputAdornment,
  Alert,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { PageHeader, ConfirmDialog } from '../../components/common';
import { useNotification } from '../../app/context/NotificationContext';
import { getSettings, updateSettings } from '../../data/repositories';
import { resetAndReseed } from '../../data/seed';

// Schema for settings form
const settingsSchema = z.object({
  shopName: z.string().min(1, 'Shop name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  currencySymbol: z.string().min(1, 'Currency symbol is required'),
  taxPercent: z.number().min(0).max(100),
  invoicePrefix: z.string().min(1, 'Invoice prefix is required'),
  lowStockThreshold: z.number().min(0),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { showSuccess, showError } = useNotification();
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const currentSettings = getSettings();

  // Form
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      shopName: currentSettings.shopName,
      address: currentSettings.address,
      phone: currentSettings.phone,
      email: currentSettings.email || '',
      currencySymbol: currentSettings.currencySymbol,
      taxPercent: currentSettings.taxPercent,
      invoicePrefix: currentSettings.invoicePrefix,
      lowStockThreshold: currentSettings.lowStockThreshold,
    },
  });

  // Save settings
  const handleSaveSettings = (data: SettingsFormData) => {
    try {
      updateSettings({
        ...data,
        email: data.email || undefined,
      });
      showSuccess('Settings saved successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      showError(errorMessage);
    }
  };

  // Reset demo data
  const handleResetDemoData = () => {
    setResetting(true);
    try {
      resetAndReseed();
      showSuccess('Demo data reset successfully');
      setResetConfirmOpen(false);
      // Reload page to refresh all data
      setTimeout(() => window.location.reload(), 500);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset data';
      showError(errorMessage);
    } finally {
      setResetting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Configure shop settings and preferences"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings' },
        ]}
      />

      <Grid container spacing={3}>
        {/* Shop Information */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Shop Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                This information appears on invoices and receipts
              </Typography>

              <form onSubmit={form.handleSubmit(handleSaveSettings)}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="shopName"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Shop Name"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="address"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Address"
                          multiline
                          rows={2}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="phone"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Phone"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="email"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Email (Optional)"
                          type="email"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Billing Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Configure tax, currency, and invoice settings
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Controller
                      name="currencySymbol"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Currency Symbol"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Controller
                      name="taxPercent"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Tax Rate"
                          type="number"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Controller
                      name="invoicePrefix"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Invoice Prefix"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message || 'e.g., MJT000001'}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Inventory Settings
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="lowStockThreshold"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Low Stock Threshold"
                          type="number"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message || 'Items at or below this quantity will be flagged'}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    size="large"
                  >
                    Save Settings
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Demo Controls */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Demo Controls
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Reset the demo to its initial state
              </Typography>

              <Alert severity="warning" sx={{ mb: 2 }}>
                Resetting will clear all data and regenerate demo products, sales, and purchases.
              </Alert>

              <Button
                variant="outlined"
                color="error"
                startIcon={<RefreshIcon />}
                onClick={() => setResetConfirmOpen(true)}
                fullWidth
              >
                Reset Demo Data
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Information
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Last Bill Number</Typography>
                  <Typography variant="body2">{currentSettings.lastBillNumber}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Storage</Typography>
                  <Typography variant="body2">localStorage</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Version</Typography>
                  <Typography variant="body2">1.0.0 (Demo)</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Keyboard Shortcuts
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Barcode Input</Typography>
                  <Typography variant="body2">Enter</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Focus Barcode</Typography>
                  <Typography variant="body2">Auto-focus</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        open={resetConfirmOpen}
        title="Reset Demo Data"
        message="This will delete all existing data and regenerate fresh demo data. This action cannot be undone. Are you sure?"
        confirmText="Reset Data"
        confirmColor="error"
        onConfirm={handleResetDemoData}
        onCancel={() => setResetConfirmOpen(false)}
        loading={resetting}
        showWarningIcon
      />
    </Box>
  );
}
