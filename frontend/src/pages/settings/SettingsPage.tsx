import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../app/context/NotificationContext';
import { settingsService } from '../../services/settingsService';
import { formatApiError } from '../../services/api';
import type { UpdateSettingsRequest } from '../../domain/types';

const settingsSchema = z.object({
  shopName: z.string().min(1, 'Shop name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  gstNumber: z.string().optional().or(z.literal('')),
  currency: z.string().min(1, 'Currency is required'),
  taxPercent: z.number().min(0).max(100),
  invoicePrefix: z.string().min(1, 'Invoice prefix is required'),
  lowStockThreshold: z.number().min(0),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { success: showSuccess, error: showError } = useNotification();
  const [loading, setLoading] = useState(true);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      shopName: '',
      address: '',
      phone: '',
      email: '',
      gstNumber: '',
      currency: 'INR',
      taxPercent: 0,
      invoicePrefix: '',
      lowStockThreshold: 10,
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = await settingsService.getSettings();
        form.reset({
          shopName: data.shopName,
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          gstNumber: data.gstNumber || '',
          currency: data.currency || 'INR',
          taxPercent: data.taxPercent || 0,
          invoicePrefix: data.invoicePrefix || '',
          lowStockThreshold: data.lowStockThreshold || 0,
        });
      } catch (error) {
        showError(formatApiError(error, 'Failed to load settings'));
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [form, showError]);

  const handleSaveSettings = async (data: SettingsFormData) => {
    try {
      // Note: lastBillNumber is excluded from the payload as it's system-managed
      const payload: UpdateSettingsRequest = {
        shopName: data.shopName,
        address: data.address,
        phone: data.phone,
        email: data.email || undefined,
        gstNumber: data.gstNumber || undefined,
        currency: data.currency,
        taxPercent: data.taxPercent,
        invoicePrefix: data.invoicePrefix,
        lowStockThreshold: data.lowStockThreshold,
      };
      await settingsService.updateSettings(payload);
      showSuccess('Settings saved successfully');
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to save settings'));
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
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="gstNumber"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="GSTIN (Optional)"
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
                      name="currency"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Currency"
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
                          onChange={(event) => field.onChange(parseFloat(event.target.value) || 0)}
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
                          onChange={(event) => field.onChange(parseInt(event.target.value) || 0)}
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
                    disabled={loading}
                  >
                    Save Settings
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Information
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Storage</Typography>
                  <Typography variant="body2">Database</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Version</Typography>
                  <Typography variant="body2">1.0.0</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ mt: 3 }}>
            Settings updates apply immediately and affect billing, inventory alerts, and invoice generation.
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
}
