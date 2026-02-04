import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
  Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import LockResetIcon from '@mui/icons-material/LockReset';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SearchIcon from '@mui/icons-material/Search';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';

import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../app/context/NotificationContext';
import { useAuth } from '../../app/context/AuthContext';
import { userService } from '../../services/userService';
import { formatApiError } from '../../services/api';
import type { CreateUserRequest, UpdateUserRequest, User } from '../../domain/types';

const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.union([
    z.string().min(6, 'Password must be at least 6 characters'),
    z.literal(''),
  ]).optional(),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['ADMIN', 'EMPLOYEE']),
  isActive: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UsersPage() {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useNotification();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers({
        role: roleFilter || undefined,
        isActive: statusFilter === '' ? undefined : statusFilter === 'active',
        search: search || undefined,
      });
      setUsers(data);
    } catch (error) {
      showError(formatApiError(error, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, search, showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openDialog = (selected?: User) => {
    if (selected) {
      setEditingUser(selected);
      form.reset({
        username: selected.username,
        password: '',
        fullName: selected.fullName,
        role: selected.role,
        isActive: selected.isActive,
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

  const openPasswordDialog = (selected: User) => {
    setSelectedUser(selected);
    setNewPassword('');
    setPasswordDialogOpen(true);
  };

  const handleSaveUser = async (data: UserFormData) => {
    try {
      if (editingUser) {
        const payload: UpdateUserRequest = {
          fullName: data.fullName,
          role: data.role,
          isActive: data.isActive,
        };
        await userService.updateUser(editingUser.id, payload);
        showSuccess('User updated successfully');
      } else {
        if (!data.password) {
          showError('Password is required for new users');
          return;
        }
        const payload: CreateUserRequest = {
          username: data.username,
          password: data.password,
          fullName: data.fullName,
          role: data.role,
        };
        await userService.createUser(payload);
        showSuccess('User created successfully');
      }
      setDialogOpen(false);
      await fetchUsers();
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to save user'));
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    try {
      await userService.resetPassword(selectedUser.id, newPassword);
      showSuccess('Password reset successfully');
      setPasswordDialogOpen(false);
    } catch (error: unknown) {
      showError(formatApiError(error, 'Failed to reset password'));
    }
  };

  const columns: GridColDef[] = useMemo(() => [
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
      width: 110,
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
              disabled={params.row.id === user?.id && params.row.role === 'ADMIN'}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Password">
            <IconButton size="small" onClick={() => openPasswordDialog(params.row)}>
              <LockResetIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ], [user, openDialog]);

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
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>
            Add User
          </Button>
        }
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        Users with ADMIN role have full access to all features including purchases, reports, settings, and user management.
        EMPLOYEE role users can only access Billing, Products (view), and Sales (view).
      </Alert>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search by username or name..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(event) => setRoleFilter(event.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="EMPLOYEE">Employee</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setSearch('');
                  setRoleFilter('');
                  setStatusFilter('');
                }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Card>

      <Card>
        <DataGrid
          rows={users}
          columns={columns}
          pageSizeOptions={[10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
          loading={loading}
          sx={{ border: 0, minHeight: 400 }}
        />
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={form.handleSubmit(handleSaveUser)}>
          <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
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
              {editingUser && (
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
              )}
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
