// Users page - user management (Admin only)

import { useState } from 'react';
import {
  Box,
  Card,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Typography,
  Switch,
  FormControlLabel,
  InputAdornment,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import LockResetIcon from '@mui/icons-material/LockReset';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';

import { PageHeader } from '../../components/common';
import { useNotification } from '../../app/context/NotificationContext';
import { useAuth } from '../../app/context/AuthContext';
import {
  getAllUsers,
  createUser,
  updateUser,
  resetPassword,
} from '../../data/repositories';
import type { User } from '../../domain/types';

// Schema for user form
const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['ADMIN', 'EMPLOYEE']),
  isActive: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UsersPage() {
  const { session } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Data
  const users = getAllUsers();

  // Form
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      password: '',
      fullName: '',
      role: 'EMPLOYEE',
      isActive: true,
    },
  });

  // Open dialog for new/edit
  const openDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      form.reset({
        username: user.username,
        password: '',
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      form.reset({
        username: '',
        password: '',
        fullName: '',
        role: 'EMPLOYEE',
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  // Open password reset dialog
  const openPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setPasswordDialogOpen(true);
  };

  // Save user
  const handleSaveUser = (data: UserFormData) => {
    try {
      if (editingUser) {
        updateUser(editingUser.id, {
          username: data.username,
          fullName: data.fullName,
          role: data.role,
          isActive: data.isActive,
        });
        showSuccess('User updated successfully');
      } else {
        if (!data.password) {
          showError('Password is required for new users');
          return;
        }
        createUser({
          username: data.username,
          password: data.password,
          fullName: data.fullName,
          role: data.role,
          isActive: data.isActive,
        });
        showSuccess('User created successfully');
      }
      setDialogOpen(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save user';
      showError(errorMessage);
    }
  };

  // Reset password
  const handleResetPassword = () => {
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    try {
      resetPassword(selectedUser.id, newPassword);
      showSuccess('Password reset successfully');
      setPasswordDialogOpen(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      showError(errorMessage);
    }
  };

  // Columns
  const columns: GridColDef[] = [
    {
      field: 'username',
      headerName: 'Username',
      width: 150,
      renderCell: (params: GridRenderCellParams<User>) => (
        <Typography variant="body2" fontWeight={500}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'fullName',
      headerName: 'Full Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'ADMIN' ? 'primary' : 'default'}
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          size="small"
          color={params.value ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      valueFormatter: (value) => dayjs(value).format('MMM D, YYYY'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams<User>) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => openDialog(params.row)}
              disabled={params.row.id === session?.userId && params.row.role === 'ADMIN'}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Password">
            <IconButton
              size="small"
              onClick={() => openPasswordDialog(params.row)}
            >
              <LockResetIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle="Manage user accounts and permissions"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Users' },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openDialog()}
          >
            Add User
          </Button>
        }
      />

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Users with ADMIN role have full access to all features including purchases, reports, settings, and user management.
        EMPLOYEE role users can only access Billing, Products (view), and Sales (view).
      </Alert>

      {/* Data Grid */}
      <Card>
        <DataGrid
          rows={users}
          columns={columns}
          pageSizeOptions={[10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
          sx={{ border: 0, minHeight: 400 }}
        />
      </Card>

      {/* User Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={form.handleSubmit(handleSaveUser)}>
          <DialogTitle>
            {editingUser ? 'Edit User' : 'Add User'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="fullName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Full Name"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="username"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Username"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      disabled={!!editingUser}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="role"
                  control={form.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Role</InputLabel>
                      <Select {...field} label="Role">
                        <MenuItem value="ADMIN">Admin</MenuItem>
                        <MenuItem value="EMPLOYEE">Employee</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              {!editingUser && (
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="password"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message || 'Minimum 6 characters'}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="isActive"
                  control={form.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Active"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Resetting password for: <strong>{selectedUser.fullName}</strong>
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Minimum 6 characters"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button type="button" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleResetPassword}
            disabled={newPassword.length < 6}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
