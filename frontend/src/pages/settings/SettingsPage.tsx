import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  InputAdornment,
  Stack,
  Switch,
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
import { licenseService } from '../../services/licenseService';
import type { LicenseStatusInfo, UpdateSettingsRequest } from '../../domain/types';

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
  loyaltyEnabled: z.boolean(),
  pointsMinPurchaseAmount: z.number().min(0),
  pointsPerHundred: z.number().min(0),
  pointValue: z.number().min(0),
  maxPointsRedemptionPercent: z.number().min(0).max(100),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const formatLocaleDisplay = (isoDate?: string) => {
  if (!isoDate) {
    return 'N/A';
  }
  return new Date(isoDate).toLocaleString();
};

export default function SettingsPage() {
  const { success: showSuccess, error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatusInfo | null>(null);

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
      loyaltyEnabled: false,
      pointsMinPurchaseAmount: 500,
      pointsPerHundred: 1,
      pointValue: 1,
      maxPointsRedemptionPercent: 50,
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const [data, licenseData] = await Promise.all([
          settingsService.getSettings(),
          licenseService.getStatus(),
        ]);
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
          loyaltyEnabled: data.loyaltyEnabled ?? false,
          pointsMinPurchaseAmount: data.pointsMinPurchaseAmount ?? 500,
          pointsPerHundred: data.pointsPerHundred ?? 1,
          pointValue: data.pointValue ?? 1,
          maxPointsRedemptionPercent: data.maxPointsRedemptionPercent ?? 50,
        });
        setLicenseStatus(licenseData);
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
        loyaltyEnabled: data.loyaltyEnabled,
        pointsMinPurchaseAmount: data.pointsMinPurchaseAmount,
        pointsPerHundred: data.pointsPerHundred,
        pointValue: data.pointValue,
        maxPointsRedemptionPercent: data.maxPointsRedemptionPercent,
      };
      await settingsService.updateSettings(payload);
      showSuccess('Settings saved successfully');
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to save settings'));
    }
  };

  const getLicenseColor = (status?: string): 'success' | 'warning' | 'error' | 'default' => {
    if (!status) {
      return 'default';
    }
    if (status === 'VALID') {
      return 'success';
    }
    if (status === 'EXPIRED' || status === 'MISSING') {
      return 'warning';
    }
    return 'error';
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
                          helperText={fieldState.error?.message || 'e.g., INV000001'}
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

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Loyalty Program
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Configure customer loyalty points earning and redemption
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="loyaltyEnabled"
                      control={form.control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          }
                          label="Enable Loyalty Program"
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="pointsMinPurchaseAmount"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Min Purchase to Earn Points"
                          type="number"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message || 'Customer must spend at least this amount to earn points'}
                          disabled={!form.watch('loyaltyEnabled')}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          onChange={(event) => field.onChange(parseFloat(event.target.value) || 0)}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="pointsPerHundred"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Points Earned per ₹100 Spent"
                          type="number"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message || 'Number of points earned for every ₹100 spent'}
                          disabled={!form.watch('loyaltyEnabled')}
                          onChange={(event) => field.onChange(parseFloat(event.target.value) || 0)}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="pointValue"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Point Value in Currency"
                          type="number"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message || 'How much 1 point is worth in ₹'}
                          disabled={!form.watch('loyaltyEnabled')}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          onChange={(event) => field.onChange(parseFloat(event.target.value) || 0)}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="maxPointsRedemptionPercent"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Max Redemption % of Bill"
                          type="number"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message || 'Maximum percentage of bill that can be paid with points'}
                          disabled={!form.watch('loyaltyEnabled')}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                          onChange={(event) => field.onChange(parseFloat(event.target.value) || 0)}
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

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                License Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                License controls access to login and system usage. Timestamps are shown in local system format.
              </Typography>

              {licenseStatus ? (
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip size="small" color={getLicenseColor(licenseStatus.status)} label={licenseStatus.status} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Issued On</Typography>
                    <Typography variant="body2">
                      {formatLocaleDisplay(licenseStatus.issuedAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Expires On</Typography>
                    <Typography variant="body2">
                      {formatLocaleDisplay(licenseStatus.expiresAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Days Remaining</Typography>
                    <Typography variant="body2">{licenseStatus.daysRemaining ?? 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Installation ID</Typography>
                    <Typography variant="body2" sx={{ maxWidth: 170 }} noWrap title={licenseStatus.installationId}>
                      {licenseStatus.installationId || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Machine Hash</Typography>
                    <Typography variant="body2" sx={{ maxWidth: 170 }} noWrap title={licenseStatus.machineHash}>
                      {licenseStatus.machineHash || 'N/A'}
                    </Typography>
                  </Box>
                  <Alert severity={licenseStatus.status === 'VALID' ? 'success' : 'warning'}>
                    {licenseStatus.message}
                  </Alert>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => window.open('/license', '_blank')}
                    >
                      Upload New License
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  License details unavailable.
                </Typography>
              )}
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
