import PagePlaceholder from '../../components/common/PagePlaceholder';
import { Settings as SettingsIcon } from '@mui/icons-material';

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Settings"
      description="Configure shop information, tax rates, currency, invoice settings, and low stock thresholds. (Admin Only)"
      icon={<SettingsIcon />}
    />
  );
}
