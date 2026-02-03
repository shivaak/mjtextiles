import PagePlaceholder from '../../components/common/PagePlaceholder';
import { PointOfSale as PointOfSaleIcon } from '@mui/icons-material';

export default function BillingPage() {
  return (
    <PagePlaceholder
      title="Billing (POS)"
      description="Point of Sale interface for processing customer transactions with barcode scanning, cart management, and multiple payment modes."
      icon={<PointOfSaleIcon />}
    />
  );
}
