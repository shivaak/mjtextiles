import PagePlaceholder from '../../components/common/PagePlaceholder';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';

export default function PurchasesPage() {
  return (
    <PagePlaceholder
      title="Purchases"
      description="Record purchase orders from suppliers, manage stock updates, and track weighted average cost. (Admin Only)"
      icon={<ShoppingCartIcon />}
    />
  );
}
