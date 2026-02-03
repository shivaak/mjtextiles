import PagePlaceholder from '../../components/common/PagePlaceholder';
import { ReceiptLong as ReceiptLongIcon } from '@mui/icons-material';

export default function SaleDetailPage() {
  return (
    <PagePlaceholder
      title="Sale Details"
      description="View detailed information about a specific sale including items, customer info, payment details, and void options."
      icon={<ReceiptLongIcon />}
    />
  );
}
