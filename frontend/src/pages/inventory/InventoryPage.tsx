import PagePlaceholder from '../../components/common/PagePlaceholder';
import { Warehouse as WarehouseIcon } from '@mui/icons-material';

export default function InventoryPage() {
  return (
    <PagePlaceholder
      title="Inventory"
      description="Track stock levels, manage adjustments, view movement history, and monitor supplier details."
      icon={<WarehouseIcon />}
    />
  );
}
