import { Box, Typography, Button } from '@mui/material';
import { useAuth } from '../../app/context/AuthContext';
import { useNotification } from '../../app/context/NotificationContext';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const notification = useNotification();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      notification.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      notification.error('Logout failed');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 3,
      }}
    >
      <Typography variant="h3" gutterBottom>
        Welcome to MJ Textiles
      </Typography>
      <Typography variant="h6" color="text.secondary">
        {user?.fullName} ({user?.role})
      </Typography>
      <Button variant="contained" onClick={handleLogout} size="large">
        Logout
      </Button>
    </Box>
  );
}
