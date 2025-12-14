import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserRole, RFI, RFIStatus, Project } from '../types';
import { MOCK_USERS } from '../constants';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus, 
  MapPin, 
  Calendar, 
  Edit3, 
  Search,
  Filter,
  FileText,
  X,
  List as ListIcon,
  Map as MapIcon,
  Archive,
  RefreshCw,
  User,
  Paperclip,
  Eye, 
  Trash2,
  Layers
} from 'lucide-react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  InputAdornment,
  Stack,
  Avatar,
  SelectChangeEvent,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ConfirmDialog from './ConfirmDialog'; // Import ConfirmDialog
import { useNotification } from './NotificationContext'; // Import useNotification


// Declare Leaflet global
declare global {
  interface Window {
    L: any;
  }
}

interface Props {
  userRole: UserRole;
  project: Project;
  onProjectUpdate: (project: Project) => void;
}

// Debounce utility function
export const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeout: NodeJS.Timeout;
  return function(this: any, ...args: any[]) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

// Mock Geo Constants for RFI Map (consistent with MapModule)
export const START_COORDS = [27.6588, 83.4633]; 
export const END_COORDS = [27.7588, 83.4633]; 
export const PROJECT_LENGTH = 15;

export const getGeoFromChainage = (chainageStr: string, startCoords: number[] = START_COORDS, endCoords: number[] = END_COORDS, projectLength: number = PROJECT_LENGTH) => {
    let km = 0;
    if (typeof chainageStr === 'string' && chainageStr.includes('+')) {
        const match = chainageStr.match(/(\d+)\+(\d+)/);
        if (match) {
            km = parseInt(match[1]) + (parseInt(match[2]) / 1000);
        }
    } else {
        km = parseFloat(chainageStr) || 0;
    }
    
    // Linear interpolation
    const ratio = Math.min(1, Math.max(0, km / projectLength));
    const lat = startCoords[0] + (endCoords[0] - startCoords[0]) * ratio;
    const lng = startCoords[1] + (endCoords[1] - startCoords[1]) * ratio;
    
    // Add slight random offset for markers at same location
    const offset = (Math.random() - 0.5) * 0.0005;

    return [lat, lng + offset];
};

export const getStatusChip = (status: RFIStatus) => {
  switch (status) {
    case RFIStatus.APPROVED: 
      return <Chip icon={<CheckCircle size={14} />} label="Approved" size="small" color="success" variant="outlined" />;
    case RFIStatus.REJECTED: 
      return <Chip icon={<XCircle size={14} />} label="Rejected" size="small" color="error" variant="outlined" />;
    case RFIStatus.OPEN: 
      return <Chip icon={<Clock size={14} />} label="Open" size="small" color="warning" variant="outlined" />;
    case RFIStatus.CLOSED:
      return <Chip icon={<Archive size={14} />} label="Closed" size="small" sx={{ bgcolor: 'grey.100' }} variant="outlined" />;
    default: 
      return <Chip label="Unknown" size="small" variant="outlined" />;
  }
};

export const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

interface RFIRowProps {
    rfi: RFI;
    canEdit: boolean;
    handleViewOnMap: (rfi: RFI) => void;
    openUpdateModal: (rfi: RFI) => void;
    handleDelete: (id: string) => void;
}

const RFIRow: React.FC<RFIRowProps> = React.memo(({
    rfi,
    canEdit,
    handleViewOnMap,
    openUpdateModal,
    handleDelete
}) => {
    return (
        <TableRow hover key={rfi.id} sx={{ opacity: rfi.status === RFIStatus.CLOSED ? 0.6 : 1 }}>
            <TableCell>
                <Typography variant="body2" fontFamily="monospace" fontWeight="bold" color="primary">
                    {rfi.rfiNumber}
                </Typography>
            </TableCell>
            <TableCell>{formatDate(rfi.date)}</TableCell>
            <TableCell>
                <Chip icon={<MapPin size={14} />} label={rfi.location} size="small" variant="outlined" />
            </TableCell>
            <TableCell>
                <Typography variant="body2" sx={{ display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
                    {rfi.description}
                </Typography>
            </TableCell>
            <TableCell>{getStatusChip(rfi.status)}</TableCell>
            <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>{rfi.requestedBy?.charAt(0)}</Avatar>
                    <Typography variant="body2">{rfi.requestedBy}</Typography>
                </Box>
            </TableCell>
            <TableCell align="right">
                <Stack direction="row" justifyContent="flex-end">
                    <Tooltip title="View on Map"><IconButton size="small" onClick={() => handleViewOnMap(rfi)} aria-label="View RFI on map" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><MapIcon size={18} /></IconButton></Tooltip>
                    {canEdit && (
                        <>
                            <Tooltip title="Update"><IconButton size="small" onClick={() => openUpdateModal(rfi)} aria-label="Update RFI" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><Edit3 size={18} /></IconButton></Tooltip>
                            <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(rfi.id)} color="error" aria-label="Delete RFI" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><Trash2 size={18} /></IconButton></Tooltip>
                        </>
                    )}
                </Stack>
            </TableCell>
        </TableRow>
    );
});


const RFIModule: React.FC<Props> = ({ userRole, project, onProjectUpdate }) => {
  const theme = useTheme();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState(''); // New state for input value
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');
  const [mapBaseLayer, setMapBaseLayer] = useState<'STREET' | 'SATELLITE'>('STREET');
  const [focusedRfiId, setFocusedRfiId] = useState<string | null>(null);
  const [creatingRfi, setCreatingRfi] = useState(false); // Add creatingRfi state
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map Refs
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // Status Update Modal State
  const [updateModal, setUpdateModal] = useState<{
    isOpen: boolean;
    rfi: RFI | null;
    newStatus: RFIStatus;
    inspectionDate: string;
  }>({
    isOpen: false,
    rfi: null,
    newStatus: RFIStatus.OPEN,
    inspectionDate: new Date().toISOString().split('T')[0]
  });

  // Create Form State
  const [formData, setFormData] = useState({
    rfiNumber: '',
    location: '',
    description: '',
    requestedBy: userRole as string,
    inspectionDate: new Date().toISOString().split('T')[0]
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Validation states
  const [locationError, setLocationError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  const { showNotification } = useNotification(); // Use notification hook


  const generateNextRFINumber = () => {
    const maxNum = project.rfis.reduce((max, rfi) => {
        const parts = rfi.rfiNumber.split('/');
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart);
        return !isNaN(num) && num > max ? num : max;
    }, 0);
    
    const nextNum = maxNum + 1;
    return `RFI/${project.code}/${String(nextNum).padStart(3, '0')}`;
  };

  const handleOpenCreate = () => {
    const rfiNumber = generateNextRFINumber();
    const defaultUser = MOCK_USERS.find(u => u.role === userRole)?.name || '';
    
    setFormData({ 
      rfiNumber,
      location: '', 
      description: '', 
      requestedBy: defaultUser,
      inspectionDate: new Date().toISOString().split('T')[0]
    });
    setSelectedFiles([]);
    setLocationError('');
    setDescriptionError('');
    setIsFormOpen(true);
  };

  const validateForm = () => {
    let isValid = true;
    setLocationError('');
    setDescriptionError('');

    if (!formData.location.trim()) {
      setLocationError('Location is required.');
      isValid = false;
    }

    if (!formData.description.trim()) {
      setDescriptionError('Description is required.');
      isValid = false;
    }

    return isValid;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
        return;
    }

    setCreatingRfi(true); // Set creatingRfi to true

    const isDuplicateNo = project.rfis.some(r => r.rfiNumber === formData.rfiNumber);
    if (isDuplicateNo) {
        showNotification(`Double Entry: RFI Number "${formData.rfiNumber}" already exists.`, "error");
        setCreatingRfi(false); // Reset creatingRfi
        return;
    }

    const possibleDuplicate = project.rfis.find(r => 
        r.location.toLowerCase() === formData.location.toLowerCase() &&
        r.status === RFIStatus.OPEN
    );

    if (possibleDuplicate) {
        if(!confirm(`Warning: An Open RFI (${possibleDuplicate.rfiNumber}) already exists at location "${formData.location}". Do you want to proceed?`)) {
            setCreatingRfi(false); // Reset creatingRfi
            return;
        }
    }

    const newRFI: RFI = {
      id: `rfi-${Date.now()}`,
      rfiNumber: formData.rfiNumber,
      date: new Date().toISOString().split('T')[0],
      location: formData.location,
      description: formData.description,
      status: RFIStatus.OPEN,
      requestedBy: formData.requestedBy,
      inspectionDate: formData.inspectionDate,
      attachments: selectedFiles.map(f => f.name)
    };
    
    onProjectUpdate({
        ...project,
        rfis: [newRFI, ...project.rfis]
    });
    
    setIsFormOpen(false);
    showNotification("RFI raised successfully!", "success");
    setCreatingRfi(false); // Reset creatingRfi
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const files = Array.from(e.target.files);
          if (selectedFiles.length + files.length > 3) {
              showNotification("You can attach up to 3 documents only.", "warning");
              return;
          }
          setSelectedFiles(prev => [...prev, ...files]);
      }
  };

  const removeFile = (index: number) => {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const openUpdateModal = (rfi: RFI) => {
      setUpdateModal({
          isOpen: true,
          rfi,
          newStatus: rfi.status,
          inspectionDate: rfi.inspectionDate || new Date().toISOString().split('T')[0]
      });
  };

  const handleUpdateSubmit = () => {
      if (!updateModal.rfi) return;

      const updatedRfis = project.rfis.map(r => 
          r.id === updateModal.rfi!.id 
            ? { 
                ...r, 
                status: updateModal.newStatus, 
                inspectionDate: updateModal.inspectionDate 
              } 
            : r
      );
      
      onProjectUpdate({ ...project, rfis: updatedRfis });
      setUpdateModal({ ...updateModal, isOpen: false, rfi: null });
      showNotification("RFI updated successfully!", "success");
  };

  const handleDelete = (id: string) => {
      if (confirm("Are you sure you want to delete this RFI? This action cannot be undone.")) {
          onProjectUpdate({
              ...project,
              rfis: project.rfis.filter(r => r.id !== id)
          });
          showNotification("RFI deleted successfully!", "success");
      }
  };

  const handleViewOnMap = (rfi: RFI) => {
      setFocusedRfiId(rfi.id);
      setViewMode('MAP');
  };

  const debouncedSetSearchTerm = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
    }, 300), 
    []
  );

  const handleDisplaySearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplaySearchTerm(e.target.value);
    debouncedSetSearchTerm(e.target.value);
  };


  const filteredRfis = project.rfis.filter(r => {
      const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
      const matchesSearch = 
        r.rfiNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
  });

  const statusCounts = {
      [RFIStatus.OPEN]: project.rfis.filter(r => r.status === RFIStatus.OPEN).length,
      [RFIStatus.APPROVED]: project.rfis.filter(r => r.status === RFIStatus.APPROVED).length,
      [RFIStatus.REJECTED]: project.rfis.filter(r => r.status === RFIStatus.REJECTED).length,
      [RFIStatus.CLOSED]: project.rfis.filter(r => r.status === RFIStatus.CLOSED).length,
  };

  const toggleStatusFilter = (status: RFIStatus) => {
      setFilterStatus(prev => prev === status ? 'ALL' : status);
  };

  useEffect(() => {
    // Map effect logic remains the same for now
  }, [viewMode, filteredRfis, mapBaseLayer, focusedRfiId]);

  const clearFilters = () => {
      setDisplaySearchTerm(''); // Clear the displayed input as well
      setSearchTerm('');
      setFilterStatus('ALL');
  };

  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'ALL';
  const canEdit = userRole === UserRole.PROJECT_MANAGER || userRole === UserRole.ADMIN;

  const statCards = [
      { status: RFIStatus.OPEN, label: 'Open', icon: Clock, color: 'warning' },
      { status: RFIStatus.APPROVED, label: 'Approved', icon: CheckCircle, color: 'success' },
      { status: RFIStatus.REJECTED, label: 'Rejected', icon: XCircle, color: 'error' },
      { status: RFIStatus.CLOSED, label: 'Closed', icon: Archive, color: 'info' },
  ];

  return (
    <Box>
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" gap={2} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">RFI Management</Typography>
          <Typography variant="subtitle1" color="text.secondary">Requests for Inspection and Approvals</Typography>
        </Box>
        <Box display="flex" gap={2}>
            <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newView) => { if (newView) setViewMode(newView); }}
                size="small"
            >
                <ToggleButton value="LIST"><Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}><ListIcon size={16} /></Box> List View</ToggleButton>
                <ToggleButton value="MAP"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><MapIcon size={16} /> Map View</Box></ToggleButton>
            </ToggleButtonGroup>

            <Button 
                variant="contained" 
                startIcon={<Plus />} 
                onClick={handleOpenCreate}
            >
                Raise RFI
            </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3, height: viewMode === 'MAP' ? '70vh' : 'auto', display: 'flex', flexDirection: 'column' }}>
        <Grid container spacing={2} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            {statCards.map((stat) => (
                <Grid item xs={6} md={3} key={stat.label}>
                    <Paper
                        elevation={0}
                        onClick={() => toggleStatusFilter(stat.status)}
                        sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            border: 1,
                            borderColor: filterStatus === stat.status ? `${stat.color}.main` : 'divider',
                            bgcolor: filterStatus === stat.status ? `${stat.color}.light` : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 1,
                            }
                        }}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Typography variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', color: 'text.secondary' }}>{stat.label}</Typography>
                                <Typography variant="h4" fontWeight="bold" color={`${stat.color}.dark`}>
                                    {statusCounts[stat.status]}
                                </Typography>
                            </Box>
                            <Box sx={{ p: 1, borderRadius: '50%', color: `${stat.color}.dark` }}>
                                <stat.icon size={28} />
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            ))}
        </Grid>
        
        <Box sx={{ p: 2, bgcolor: 'background.paper', display: 'flex', gap: 2, alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
             <TextField 
                size="small"
                placeholder="Search RFIs..."
                value={displaySearchTerm} // Use displaySearchTerm for input value
                onChange={handleDisplaySearchTermChange} // Use new handler
                InputProps={{
                    startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment>
                }}
                sx={{ width: { xs: '100%', sm: 300 } }}
             />
             
             <FormControl size="small" sx={{ minWidth: 180 }}>
                 <InputLabel>Status</InputLabel>
                 <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                     <MenuItem value="ALL">All Status</MenuItem>
                     <MenuItem value={RFIStatus.OPEN}>Open</MenuItem>
                     <MenuItem value={RFIStatus.APPROVED}>Approved</MenuItem>
                     <MenuItem value={RFIStatus.REJECTED}>Rejected</MenuItem>
                     <MenuItem value={RFIStatus.CLOSED}>Closed</MenuItem>
                 </Select>
             </FormControl>

             {hasActiveFilters && (
                 <Button size="small" onClick={clearFilters} startIcon={<X size={14} />}>Clear</Button>
             )}
             
             <Box flexGrow={1} />
             <Typography variant="caption" color="text.secondary">
                 Showing {filteredRfis.length} of {project.rfis.length}
             </Typography>
        </Box>

        {viewMode === 'LIST' ? (
            <TableContainer sx={{ flexGrow: 1 }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>RFI Number</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell sx={{ width: '30%' }}>Description</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Requested By</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredRfis.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                    <Box sx={{ opacity: 0.3 }}><FileText size={32} /></Box>
                                    <Typography color="text.secondary" mt={1}>No RFIs found.</Typography>
                                    {hasActiveFilters && (
                                        <Button size="small" onClick={clearFilters} sx={{ mt: 1 }}>Clear Filters</Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRfis.map((rfi) => (
                                <RFIRow
                                    key={rfi.id}
                                    rfi={rfi}
                                    canEdit={canEdit}
                                    handleViewOnMap={handleViewOnMap}
                                    openUpdateModal={openUpdateModal}
                                    handleDelete={handleDelete}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        ) : (
             <Box flex={1} position="relative" bgcolor="grey.100" sx={{ width: '100%', height: '100%' }}>
                <div ref={mapContainerRef}></div>
                {/* Map Controls will go here */}
            </Box>
        )}
      </Card>

      {/* Dialogs will be refactored to use theme consistently */}

      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight="bold">Raise New RFI</DialogTitle>
        <DialogContent dividers>
            <Box component="form" onSubmit={handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="RFI Number" fullWidth value={formData.rfiNumber} InputProps={{ readOnly: true }} />
                <TextField 
                  label="Location (Chainage)" 
                  fullWidth 
                  required 
                  value={formData.location} 
                  onChange={e => setFormData({...formData, location: e.target.value})} 
                  onBlur={validateForm}
                  error={!!locationError}
                  helperText={locationError}
                />
                <TextField 
                  label="Description" 
                  multiline 
                  rows={3} 
                  fullWidth 
                  required 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  onBlur={validateForm}
                  error={!!descriptionError}
                  helperText={descriptionError}
                />
                <TextField label="Requested By" fullWidth value={formData.requestedBy} InputProps={{ readOnly: true }} />
                <TextField label="Proposed Inspection Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.inspectionDate} onChange={e => setFormData({...formData, inspectionDate: e.target.value})} />
                
                <Box>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} multiple accept="image/*,application/pdf" aria-label="Attach documents"/>
                    <Button variant="outlined" startIcon={<Paperclip />} onClick={() => fileInputRef.current?.click()}>
                        Attach Documents ({selectedFiles.length})
                    </Button>
                    <Stack direction="row" spacing={1} mt={1}>
                        {selectedFiles.map((file, index) => (
                            <Chip 
                              key={index} 
                              label={file.name} 
                              onDelete={() => removeFile(index)} 
                              size="small" 
                              icon={<FileText size={14}/>} 
                            />
                        ))}
                    </Stack>
                </Box>
            </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsFormOpen(false)} disabled={creatingRfi}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={creatingRfi} startIcon={creatingRfi ? <CircularProgress size={20} /> : <Plus />}>Raise RFI</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RFIModule;