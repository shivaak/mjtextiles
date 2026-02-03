import { useState, useMemo, memo } from 'react';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme as useMuiTheme,
  Badge,
  InputBase,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  PointOfSale as PointOfSaleIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  ReceiptLong as ReceiptLongIcon,
  Warehouse as WarehouseIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Billing (POS)', path: '/billing', icon: <PointOfSaleIcon /> },
  { label: 'Products', path: '/products', icon: <InventoryIcon /> },
  { label: 'Purchases', path: '/purchases', icon: <ShoppingCartIcon />, adminOnly: true },
  { label: 'Inventory', path: '/inventory', icon: <WarehouseIcon /> },
  { label: 'Sales', path: '/sales', icon: <ReceiptLongIcon /> },
  { label: 'Reports', path: '/reports', icon: <AssessmentIcon />, adminOnly: true },
  { label: 'Users', path: '/users', icon: <PeopleIcon />, adminOnly: true },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon />, adminOnly: true },
];

// Memoized navigation item component
interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  onMobileClick?: () => void;
}

const NavItemComponent = memo(function NavItemComponent({ 
  item, 
  isActive, 
  onMobileClick 
}: NavItemComponentProps) {
  const theme = useMuiTheme();
  
  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton
        component={RouterLink}
        to={item.path}
        onClick={onMobileClick}
        sx={{
          borderRadius: 2,
          mx: 0.5,
          bgcolor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          color: isActive ? 'primary.main' : 'text.primary',
          '&:hover': {
            bgcolor: isActive 
              ? alpha(theme.palette.primary.main, 0.15) 
              : 'action.hover',
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 40,
            color: isActive ? 'primary.main' : 'inherit',
          }}
        >
          {item.icon}
        </ListItemIcon>
        <ListItemText 
          primary={item.label}
          primaryTypographyProps={{
            fontWeight: isActive ? 600 : 400,
            fontSize: '0.9rem',
          }}
        />
      </ListItemButton>
    </ListItem>
  );
});

// Memoized navigation list
interface NavigationListProps {
  items: NavItem[];
  currentPath: string;
  onMobileClick?: () => void;
}

const NavigationList = memo(function NavigationList({ 
  items, 
  currentPath, 
  onMobileClick 
}: NavigationListProps) {
  return (
    <List sx={{ flex: 1, px: 1, py: 2 }}>
      {items.map((item) => {
        const isActive = currentPath === item.path || 
                        (item.path !== '/dashboard' && currentPath.startsWith(item.path));
        
        return (
          <NavItemComponent
            key={item.path}
            item={item}
            isActive={isActive}
            onMobileClick={onMobileClick}
          />
        );
      })}
    </List>
  );
});

// Memoized sidebar content
interface SidebarContentProps {
  items: NavItem[];
  currentPath: string;
  user: { fullName?: string; role?: string } | null;
  onMobileClick?: () => void;
}

const SidebarContent = memo(function SidebarContent({ 
  items, 
  currentPath, 
  user, 
  onMobileClick 
}: SidebarContentProps) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '1.2rem',
          }}
        >
          MJ
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            MJ Textiles
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Stock & Billing
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Navigation */}
      <NavigationList 
        items={items} 
        currentPath={currentPath} 
        onMobileClick={onMobileClick} 
      />

      {/* User info at bottom */}
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'primary.main',
              fontSize: '0.9rem',
            }}
          >
            {user?.fullName?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

// Memoized top bar
interface TopBarProps {
  onMenuClick: () => void;
  onProfileClick: (event: React.MouseEvent<HTMLElement>) => void;
  user: { fullName?: string } | null;
  isDark: boolean;
  onThemeToggle: () => void;
}

const TopBar = memo(function TopBar({ 
  onMenuClick, 
  onProfileClick, 
  user, 
  isDark, 
  onThemeToggle 
}: TopBarProps) {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { md: `${DRAWER_WIDTH}px` },
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { md: 'none' }, color: 'text.primary' }}
        >
          <MenuIcon />
        </IconButton>

        {/* Search */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'action.hover',
            borderRadius: 2,
            px: 2,
            py: 0.5,
            flex: 1,
            maxWidth: 400,
          }}
        >
          <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          <InputBase
            placeholder="Search products, SKU, barcode..."
            sx={{ flex: 1 }}
            inputProps={{ 'aria-label': 'search' }}
          />
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={isDark ? 'Light mode' : 'Dark mode'}>
            <IconButton onClick={onThemeToggle} color="inherit" sx={{ color: 'text.primary' }}>
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton color="inherit" sx={{ color: 'text.primary' }}>
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Profile">
            <IconButton onClick={onProfileClick} sx={{ ml: 1 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '0.85rem',
                }}
              >
                {user?.fullName?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
});

// Memoized main content area
const MainContent = memo(function MainContent() {
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Toolbar />
      <Box sx={{ p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
});

export default function AppShell() {
  const theme = useMuiTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const notification = useNotification();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    try {
      await logout();
      notification.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      notification.error('Logout failed');
    }
  };

  const handleMobileNavClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Memoize filtered nav items
  const filteredNavItems = useMemo(() => 
    navItems.filter(item => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  // Memoize user data for sidebar
  const sidebarUser = useMemo(() => ({
    fullName: user?.fullName,
    role: user?.role,
  }), [user?.fullName, user?.role]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Top Bar */}
      <TopBar
        onMenuClick={handleDrawerToggle}
        onProfileClick={handleProfileMenuOpen}
        user={sidebarUser}
        isDark={mode === 'dark'}
        onThemeToggle={toggleTheme}
      />

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { width: 200, mt: 1 },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2">{user?.fullName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.username} • {user?.role}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          <SidebarContent
            items={filteredNavItems}
            currentPath={location.pathname}
            user={sidebarUser}
            onMobileClick={handleMobileNavClick}
          />
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          <SidebarContent
            items={filteredNavItems}
            currentPath={location.pathname}
            user={sidebarUser}
          />
        </Drawer>
      </Box>

      {/* Main content */}
      <MainContent />
    </Box>
  );
}
