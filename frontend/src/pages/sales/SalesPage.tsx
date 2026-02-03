import PagePlaceholder from '../../components/common/PagePlaceholder';
import { ReceiptLong as ReceiptLongIcon } from '@mui/icons-material';

export default function SalesPage() {
  return (
    <PagePlaceholder
      title="Sales"
      description="View sales history, filter transactions, and access detailed sale information including profit tracking."
      icon={<ReceiptLongIcon />}
    />
  );
}
