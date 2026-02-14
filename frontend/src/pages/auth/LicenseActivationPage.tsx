import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { LicenseStatusInfo } from '../../domain/types';
import { licenseService } from '../../services/licenseService';
import { formatApiError } from '../../services/api';
import { useNotification } from '../../app/context/NotificationContext';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAuth } from '../../app/context/AuthContext';

const statusColorMap: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  VALID: 'success',
  EXPIRED: 'warning',
  MISSING: 'warning',
  CLOCK_TAMPERED: 'error',
  INVALID_FORMAT: 'error',
  INVALID_SIGNATURE: 'error',
  MACHINE_MISMATCH: 'error',
  INSTALLATION_MISMATCH: 'error',
  CONFIG_ERROR: 'error',
};

export default function LicenseActivationPage() {
  const navigate = useNavigate();
  const notification = useNotification();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [installationId, setInstallationId] = useState('');
  const [machineHash, setMachineHash] = useState('');
  const [machineFactors, setMachineFactors] = useState<Record<string, string>>({});
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatusInfo | null>(null);
  const [licenseDocument, setLicenseDocument] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [info, status] = await Promise.all([
          licenseService.getInstallationInfo(),
          licenseService.getStatus(),
        ]);
        setInstallationId(info.installationId);
        setMachineHash(info.machineHash);
        setMachineFactors(info.machineFactors || {});
        setLicenseStatus(status);
      } catch (error) {
        notification.error(formatApiError(error, 'Failed to load license details'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [notification]);

  const statusColor = useMemo(() => {
    if (!licenseStatus) {
      return 'default';
    }
    return statusColorMap[licenseStatus.status] || 'default';
  }, [licenseStatus]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    setLicenseDocument(text);
  };

  const handleActivate = async () => {
    if (!licenseDocument.trim()) {
      notification.warning('Please upload or paste a license document');
      return;
    }

    setActivating(true);
    try {
      const status = await licenseService.activate({ licenseDocument });
      setLicenseStatus(status);
      notification.success('License activated successfully');
    } catch (error) {
      notification.error(formatApiError(error, 'License activation failed'));
    } finally {
      setActivating(false);
    }
  };

  const handleRemoveLicense = async () => {
    setRemoving(true);
    try {
      const status = await licenseService.remove();
      setLicenseStatus(status);
      setLicenseDocument('');
      notification.success('License removed successfully');
      setRemoveDialogOpen(false);

      try {
        await logout();
      } catch {
        // Logout call can fail if session is already invalid; local auth should still be cleared.
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    } catch (error) {
      notification.error(formatApiError(error, 'Failed to remove license'));
    } finally {
      setRemoving(false);
    }
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      notification.success(`${label} copied`);
    } catch {
      notification.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const machineFactorsJson = useMemo(
    () => JSON.stringify(machineFactors, null, 2),
    [machineFactors]
  );
  const machineFactorsCliJson = useMemo(
    () => JSON.stringify(machineFactors),
    [machineFactors]
  );

  const downloadLicenseConfigTemplate = () => {
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime());
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const configTemplate = {
      info: {
        description: 'Offline license generation config template',
        editableFields: ['customerName', 'issuedAt', 'expiresAt'],
      },
      privateKeyPath: '/absolute/path/to/private_key.pem',
      installationId,
      machineHash,
      machineFactors,
      customerName: 'Shop Name',
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      features: {},
      outputPath: '/tmp/customer.lic',
    };

    const blob = new Blob([JSON.stringify(configTemplate, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `license-config-${installationId}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 6, bgcolor: 'background.default' }}>
      <Container maxWidth="md">
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h4">
                    License Activation
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
                    <Button variant="text" onClick={() => navigate('/login')} sx={{ whiteSpace: 'nowrap' }}>
                      Back to Login
                    </Button>
                    {licenseStatus?.status !== 'MISSING' && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => setRemoveDialogOpen(true)}
                        disabled={removing}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        Remove License
                      </Button>
                    )}
                  </Stack>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  This installation runs only with a valid offline license file.
                </Typography>
              </Box>

              {licenseStatus && (
                <Alert severity={licenseStatus.status === 'VALID' ? 'success' : 'warning'}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">Current status:</Typography>
                    <Chip size="small" color={statusColor} label={licenseStatus.status} />
                    <Typography variant="body2" color="text.secondary">
                      {licenseStatus.message}
                    </Typography>
                  </Stack>
                </Alert>
              )}

              <TextField
                label="Installation ID"
                value={installationId}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <Button
                variant="text"
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={() => copyToClipboard(installationId, 'Installation ID')}
                  sx={{ alignSelf: 'flex-start', whiteSpace: 'nowrap' }}
              >
                Copy Installation ID
              </Button>
              <TextField
                label="Machine Hash"
                value={machineHash}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <Button
                variant="text"
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={() => copyToClipboard(machineHash, 'Machine hash')}
                  sx={{ alignSelf: 'flex-start', whiteSpace: 'nowrap' }}
              >
                Copy Machine Hash
              </Button>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Advanced Details (Owner)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1.5}>
                    <Typography variant="body2" color="text.secondary">
                      Use this JSON directly for `--machine-factors-json` during license generation.
                    </Typography>
                    <TextField
                      label="Machine Factors JSON"
                      value={machineFactorsJson}
                      fullWidth
                      multiline
                      minRows={8}
                      InputProps={{ readOnly: true }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ContentCopyIcon />}
                      onClick={() => copyToClipboard(machineFactorsCliJson, 'Machine factors JSON')}
                      sx={{ alignSelf: 'flex-start', whiteSpace: 'nowrap' }}
                    >
                      Copy Machine Factors JSON (CLI)
                    </Button>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadLicenseConfigTemplate}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Download License Config Template
                </Button>
                <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
                  Upload .lic file
                  <input hidden type="file" accept=".lic,.json,text/plain" onChange={handleFileSelect} />
                </Button>
                <Button
                  variant="contained"
                  onClick={handleActivate}
                  disabled={activating || !licenseDocument.trim()}
                  startIcon={activating ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Activate License
                </Button>
              </Stack>

              <TextField
                label="License Document"
                value={licenseDocument}
                onChange={(event) => setLicenseDocument(event.target.value)}
                fullWidth
                multiline
                minRows={10}
                placeholder="Paste signed license JSON here if file upload is not available."
              />
            </Stack>
          </CardContent>
        </Card>
      </Container>
      <ConfirmDialog
        open={removeDialogOpen}
        title="Remove License?"
        message="This will remove the installed license from this machine and immediately log out the current user. Continue?"
        confirmText="Remove License"
        cancelText="Cancel"
        confirmColor="error"
        onConfirm={handleRemoveLicense}
        onCancel={() => setRemoveDialogOpen(false)}
        loading={removing}
        showWarningIcon
      />
    </Box>
  );
}

