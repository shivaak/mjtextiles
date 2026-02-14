import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './app/context/ThemeContext';
import { AuthProvider } from './app/context/AuthContext';
import { NotificationProvider } from './app/context/NotificationContext';
import { LicenseProvider } from './app/context/LicenseContext';
import AppRoutes from './app/routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <LicenseProvider>
              <AppRoutes />
            </LicenseProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
