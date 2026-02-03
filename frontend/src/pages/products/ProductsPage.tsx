import PagePlaceholder from '../../components/common/PagePlaceholder';
import { Inventory as InventoryIcon } from '@mui/icons-material';

export default function ProductsPage() {
  return (
    <PagePlaceholder
      title="Products"
      description="Manage products and variants including SKU, barcode, pricing, and stock information."
      icon={<InventoryIcon />}
    />
  );
}
