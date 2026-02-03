import PagePlaceholder from '../../components/common/PagePlaceholder';
import { People as PeopleIcon } from '@mui/icons-material';

export default function UsersPage() {
  return (
    <PagePlaceholder
      title="Users"
      description="Manage user accounts, roles (Admin/Employee), passwords, and access control. (Admin Only)"
      icon={<PeopleIcon />}
    />
  );
}
