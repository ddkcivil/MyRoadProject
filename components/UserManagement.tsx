
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';
import { UserPlus, Trash2, Mail, Shield } from 'lucide-react';
import {
    Box,
    Typography,
    Button,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    Chip,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import ConfirmDialog from './ConfirmDialog'; // Import ConfirmDialog
import { useNotification } from './NotificationContext'; // Import useNotification

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.SITE_ENGINEER });

  const [confirmOpen, setConfirmOpen] = useState(false); // State for ConfirmDialog
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null); // State for ID of item to delete
  const { showNotification } = useNotification(); // Use notification hook

  // Validation states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setNameError('');
    setEmailError('');

    if (!newUser.name.trim()) {
      setNameError('Full Name is required');
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newUser.email.trim() || !emailRegex.test(newUser.email)) {
      setEmailError('Valid Email is required');
      isValid = false;
    }

    return isValid;
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    const user: User = {
        id: `u-${Date.now()}`,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
    };
    setUsers([...users, user]);
    setIsModalOpen(false);
    setNewUser({ name: '', email: '', role: UserRole.SITE_ENGINEER });
    setNameError(''); // Clear errors on successful submission
    setEmailError('');
    showNotification("User added successfully!", "success");
  };

  const removeUserClick = (id: string) => {
      setItemToDeleteId(id);
      setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
      if (itemToDeleteId) {
          setUsers(users.filter(u => u.id !== itemToDeleteId));
          showNotification("User removed successfully!", "success");
          setItemToDeleteId(null);
          setConfirmOpen(false);
      }
  };

  return (
    <Box>
       <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography variant="h4" fontWeight="bold">User Management</Typography>
          <Typography variant="subtitle1" color="text.secondary">Manage system access and roles</Typography>
        </div>
        <Button variant="contained" startIcon={<UserPlus />} onClick={() => setIsModalOpen(true)}>
          Add User
        </Button>
      </Box>

      <Card>
          <TableContainer>
              <Table>
                  <TableHead>
                      <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Role</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell align="right">Actions</TableCell>
                      </TableRow>
                  </TableHead>
                  <TableBody>
                      {users.map(user => (
                          <TableRow hover key={user.id}>
                              <TableCell>
                                  <Box display="flex" alignItems="center" gap={2}>
                                      <Avatar>{user.name.charAt(0)}</Avatar>
                                      <Typography variant="body2" fontWeight="medium">{user.name}</Typography>
                                  </Box>
                              </TableCell>
                              <TableCell>
                                  <Chip icon={<Shield size={16} />} label={user.role} size="small" color="primary" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                  <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                                      <Mail size={16} /> 
                                      <Typography variant="body2">{user.email}</Typography>
                                  </Box>
                              </TableCell>
                              <TableCell align="right">
                                  <Tooltip title="Remove User">
                                      <IconButton 
                                          onClick={() => removeUserClick(user.id)} 
                                          size="small" 
                                          aria-label="Remove user"
                                          sx={{ 
                                            minWidth: { xs: 44, md: 'auto' },
                                            minHeight: { xs: 44, md: 'auto' }
                                          }}
                                      >
                                          <Trash2 size={16} />
                                      </IconButton>
                                  </Tooltip>
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </TableContainer>
      </Card>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight="bold">Add New User</DialogTitle>
        <DialogContent>
            <Box component="form" onSubmit={handleAddUser} sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField 
                  autoFocus 
                  label="Full Name" 
                  fullWidth 
                  required 
                  value={newUser.name} 
                  onChange={e => setNewUser({...newUser, name: e.target.value})} 
                  onBlur={validateForm} // Validate on blur
                  error={!!nameError}
                  helperText={nameError}
                />
                <TextField 
                  label="Email" 
                  type="email" 
                  fullWidth 
                  required 
                  value={newUser.email} 
                  onChange={e => setNewUser({...newUser, email: e.target.value})} 
                  onBlur={validateForm} // Validate on blur
                  error={!!emailError}
                  helperText={emailError}
                />
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={newUser.role}
                    label="Role"
                    onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                  >
                      {Object.values(UserRole).map(role => (
                          <MenuItem key={role} value={role}>{role}</MenuItem>
                      ))}
                  </Select>
                </FormControl>
            </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAddUser} variant="contained">Add User</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Remove User"
        message="Are you sure you want to remove this user? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
            setConfirmOpen(false);
            setItemToDeleteId(null);
            showNotification("User removal cancelled.", "info");
        }}
      />
    </Box>
  );
};

export default UserManagement;
