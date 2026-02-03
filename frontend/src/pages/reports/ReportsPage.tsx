import PagePlaceholder from '../../components/common/PagePlaceholder';
import { Assessment as AssessmentIcon } from '@mui/icons-material';

export default function ReportsPage() {
  return (
    <PagePlaceholder
      title="Reports"
      description="Generate comprehensive reports including sales summaries, product performance, profit analysis, and inventory valuation. (Admin Only)"
      icon={<AssessmentIcon />}
    />
  );
}
