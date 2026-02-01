// Main App component with providers

import { BrowserRouter } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { ThemeProvider } from './app/context/ThemeContext';
import { AuthProvider } from './app/context/AuthContext';
import { NotificationProvider } from './app/context/NotificationContext';
import { AppRoutes } from './app/routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <NotificationProvider>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
