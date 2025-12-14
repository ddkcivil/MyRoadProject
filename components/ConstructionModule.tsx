import React, { useState } from 'react';
import { 
    Box, Typography, Button, Grid, Card, CardContent, Chip, LinearProgress, 
    IconButton, Tooltip, TextField, FormControl, InputLabel, Select, MenuItem, 
    Dialog, DialogTitle, DialogContent, DialogActions, Stack, ListSubheader, Paper
} from '@mui/material';
import { 
    Plus, Hammer, Save, Trash2, CheckCircle, X, RefreshCw
} from 'lucide-react';
import { Project, StructureAsset, StructureType, StructureComponent, UserRole } from '../types';
import ConfirmDialog from './ConfirmDialog'; // Import ConfirmDialog
import { useNotification } from './NotificationContext'; // Import useNotification

interface Props {
  project: Project;
  userRole: UserRole;
  onProjectUpdate: (project: Project) => void;
}

const DEFAULT_TEMPLATES: Record<string, Omit<StructureComponent, 'id' | 'completedQuantity'>[]> = {
    'Pipe Culvert': [
        { name: 'Structural Excavation', unit: 'cum', totalQuantity: 0 },
        { name: 'PCC M15 Bedding', unit: 'cum', totalQuantity: 0 },
        { name: 'Pipe Laying', unit: 'rm', totalQuantity: 0 },
        { name: 'Headwall Concrete', unit: 'cum', totalQuantity: 0 }
    ],
    'Box Culvert': [
        { name: 'Structural Excavation', unit: 'cum', totalQuantity: 0 },
        { name: 'PCC M15 Bedding', unit: 'cum', totalQuantity: 0 },
        { name: 'Formwork', unit: 'sqm', totalQuantity: 0 },
        { name: 'Rebar', unit: 'kg', totalQuantity: 0 },
        { name: 'Concrete', unit: 'cum', totalQuantity: 0 }
    ],
    'Slab Culvert': [
        { name: 'Structural Excavation', unit: 'cum', totalQuantity: 0 },
        { name: 'PCC M15 Bedding', unit: 'cum', totalQuantity: 0 },
        { name: 'Formwork', unit: 'sqm', totalQuantity: 0 },
        { name: 'Rebar', unit: 'kg', totalQuantity: 0 },
        { name: 'Concrete', unit: 'cum', totalQuantity: 0 }
    ],
    'Retaining Wall': [
        { name: 'Excavation', unit: 'cum', totalQuantity: 0 },
        { name: 'Foundation Concrete', unit: 'cum', totalQuantity: 0 },
        { name: 'Wall Concrete', unit: 'cum', totalQuantity: 0 },
        { name: 'Rebar', unit: 'kg', totalQuantity: 0 },
        { name: 'Formwork', unit: 'sqm', totalQuantity: 0 }
    ],
    'Major Bridge': [
        { name: 'Piling', unit: 'rm', totalQuantity: 0 },
        { name: 'Pile Cap Concrete', unit: 'cum', totalQuantity: 0 },
        { name: 'Pier/Abutment Concrete', unit: 'cum', totalQuantity: 0 },
        { name: 'Girder Launching', unit: 'no', totalQuantity: 0 },
        { name: 'Deck Concrete', unit: 'cum', totalQuantity: 0 }
    ],
    'Minor Bridge': [
        { name: 'Foundation Concrete', unit: 'cum', totalQuantity: 0 },
        { name: 'Substructure Concrete', unit: 'cum', totalQuantity: 0 },
        { name: 'Superstructure Concrete', unit: 'cum', totalQuantity: 0 },
        { name: 'Rebar', unit: 'kg', totalQuantity: 0 }
    ],
    'VUP': [ // Vehicle Underpass
        { name: 'Excavation', unit: 'cum', totalQuantity: 0 },
        { name: 'Substructure', unit: 'cum', totalQuantity: 0 },
        { name: 'Superstructure', unit: 'cum', totalQuantity: 0 }
    ],
    'PUP': [ // Pedestrian Underpass
        { name: 'Excavation', unit: 'cum', totalQuantity: 0 },
        { name: 'Substructure', unit: 'cum', totalQuantity: 0 },
        { name: 'Superstructure', unit: 'cum', totalQuantity: 0 }
    ],
    'Flyover': [
        { name: 'Piling', unit: 'rm', totalQuantity: 0 },
        { name: 'Pier/Abutment', unit: 'cum', totalQuantity: 0 },
        { name: 'Girder Launching', unit: 'no', totalQuantity: 0 },
        { name: 'Deck Concrete', unit: 'cum', totalQuantity: 0 }
    ],
    'Drainage (Lined)': [
        { name: 'Excavation', unit: 'cum', totalQuantity: 0 },
        { name: 'Lining Concrete', unit: 'cum', totalQuantity: 0 }
    ],
    'Drainage (Unlined)': [
        { name: 'Excavation', unit: 'cum', totalQuantity: 0 },
        { name: 'Shaping', unit: 'sqm', totalQuantity: 0 }
    ],
    'Footpath': [
        { name: 'Earthwork', unit: 'cum', totalQuantity: 0 },
        { name: 'Sub-base', unit: 'cum', totalQuantity: 0 },
        { name: 'Paving', unit: 'sqm', totalQuantity: 0 }
    ],
    'Pavement (Flexible)': [
        { name: 'Earthwork', unit: 'cum', totalQuantity: 0 },
        { name: 'Sub-base', unit: 'cum', totalQuantity: 0 },
        { name: 'Base Course', unit: 'cum', totalQuantity: 0 },
        { name: 'Asphalt Layer', unit: 'cum', totalQuantity: 0 }
    ],
    'Pavement (Rigid)': [
        { name: 'Earthwork', unit: 'cum', totalQuantity: 0 },
        { name: 'Sub-base', unit: 'cum', totalQuantity: 0 },
        { name: 'DLC', unit: 'cum', totalQuantity: 0 },
        { name: 'PQC', unit: 'cum', totalQuantity: 0 }
    ],
    'Road Safety (Signage)': [
        { name: 'Foundation', unit: 'no', totalQuantity: 0 },
        { name: 'Pole Erection', unit: 'no', totalQuantity: 0 },
        { name: 'Sign Board Fixing', unit: 'no', totalQuantity: 0 }
    ],
    'Road Safety (Marking)': [
        { name: 'Road Cleaning', unit: 'sqm', totalQuantity: 0 },
        { name: 'Paint Application', unit: 'sqm', totalQuantity: 0 }
    ],
    'Road Safety (Barriers)': [
        { name: 'Foundation', unit: 'no', totalQuantity: 0 },
        { name: 'Barrier Installation', unit: 'rm', totalQuantity: 0 }
    ],
};

const calculateProgress = (structure: StructureAsset) => {
    if (!structure.components || structure.components.length === 0) return 0;
    const totalPossible = structure.components.reduce((sum, comp) => sum + comp.totalQuantity, 0);
    const totalCompleted = structure.components.reduce((sum, comp) => sum + comp.completedQuantity, 0);
    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
};

interface StructureAssetCardProps {
    str: StructureAsset;
    handleOpenUpdateModal: (str: StructureAsset) => void;
    handleDeleteStructureClick: (id: string) => void;
}

const StructureAssetCard: React.FC<StructureAssetCardProps> = React.memo(({
    str,
    handleOpenUpdateModal,
    handleDeleteStructureClick
}) => {
    const progress = calculateProgress(str);
    return (
        <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ height: '100%' }}>
                <CardContent>
                     <Box display="flex" justifyContent="space-between">
                        <Typography variant="h6" fontWeight="bold">{str.name}</Typography>
                        <Box>
                            <IconButton size="small" onClick={() => handleOpenUpdateModal(str)} aria-label="Update structure asset" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><Hammer size={16} /></IconButton>
                            <IconButton size="small" onClick={() => handleDeleteStructureClick(str.id)} aria-label="Delete structure asset" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><Trash2 size={16} /></IconButton>
                        </Box>
                     </Box>
                    <Chip label={str.type} size="small" />
                    <Box mt={2}>
                        <LinearProgress variant="determinate" value={progress} />
                        <Typography variant="caption">{progress}% Complete</Typography>
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    );
});


const ConstructionModule: React.FC<Props> = ({ project, userRole, onProjectUpdate }) => {
    const [structureView, setStructureView] = useState<'LIST' | 'ADD'>('LIST');
    const [filterType, setFilterType] = useState<string>('ALL');
    
    const [newStructureForm, setNewStructureForm] = useState<Partial<StructureAsset> & { components: any[] }>({
        name: '', type: StructureType.PIPE_CULVERT, size: '', location: '', status: 'Not Started', components: []
    });

    const [updateStructureModal, setUpdateStructureModal] = useState<{ isOpen: boolean, structureId: string, componentId: string } | null>(null);
    const [progressUpdateValue, setProgressUpdateValue] = useState<string>('');
    const [confirmOpen, setConfirmOpen] = useState(false); // State for ConfirmDialog
    const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null); // State for ID of item to delete
    const { showNotification } = useNotification(); // Use notification hook
    
    const handleAddStructure = () => {
        setStructureView('ADD');
        handleTypeChange(StructureType.PIPE_CULVERT); // Reset with default
    };

    const handleTypeChange = (type: StructureType) => {
        const template = DEFAULT_TEMPLATES[type] || [];
        setNewStructureForm({
            name: '', type, size: '', location: '', status: 'Not Started',
            components: template.map((t, i) => ({ ...t, id: `comp-${Date.now()}-${i}`, completedQuantity: 0 }))
        });
    };
    
    const handleSaveStructure = () => {
        if (!newStructureForm.name) return;
        const newStructure: StructureAsset = {
            id: `str-${Date.now()}`,
            name: newStructureForm.name!,
            type: newStructureForm.type,
            location: newStructureForm.location!,
            status: 'Not Started',
            components: newStructureForm.components,
            size: newStructureForm.size
        };
        onProjectUpdate({ ...project, structures: [...(project.structures || []), newStructure] });
        setStructureView('LIST');
        showNotification("Structure asset added successfully!", "success");
    };
    
    const handleOpenUpdateModal = (str: StructureAsset) => {
        setNewStructureForm({ ...str, components: str.components.map(comp => ({ ...comp })) }); // Deep copy components
        setUpdateStructureModal({ isOpen: true, structureId: str.id, componentId: '' }); // componentId not used for full structure update
    };

    const handleUpdateStructure = () => {
        if (!newStructureForm.name || !newStructureForm.location) return; // Basic validation
        const updatedStructures = project.structures?.map(str =>
            str.id === newStructureForm.id ? { ...newStructureForm, components: newStructureForm.components.map(comp => ({...comp})) } as StructureAsset : str
        );
        onProjectUpdate({ ...project, structures: updatedStructures });
        setUpdateStructureModal(null); // Close modal
        setNewStructureForm({ name: '', type: StructureType.PIPE_CULVERT, size: '', location: '', status: 'Not Started', components: [] }); // Reset form
        showNotification("Structure asset updated successfully!", "success");
    };
    
    const filteredStructures = (project.structures || []).filter(s => filterType === 'ALL' || s.type === filterType);

    const handleDeleteStructureClick = (id: string) => {
        setItemToDeleteId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (itemToDeleteId) {
            onProjectUpdate({ ...project, structures: project.structures?.filter(s => s.id !== itemToDeleteId) });
            showNotification("Structure asset deleted successfully!", "success");
            setItemToDeleteId(null);
            setConfirmOpen(false);
        }
    };

    if (structureView === 'ADD') {
        return (
            <Box>
            <Box>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <Button variant="outlined" onClick={() => setStructureView('LIST')}>Cancel</Button>
                    <Typography variant="h5" fontWeight="bold">Add New Asset</Typography>
                    <Button variant="contained" startIcon={<Save />} onClick={handleSaveStructure} disabled={!newStructureForm.name || !newStructureForm.location || newStructureForm.components.some(comp => comp.totalQuantity === 0)}>Save Asset</Button>
                </Box>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" mb={2}>Asset Details</Typography>
                                <Stack spacing={2}>
                                    <TextField
                                        label="Asset Name"
                                        value={newStructureForm.name}
                                        onChange={(e) => setNewStructureForm({ ...newStructureForm, name: e.target.value })}
                                        fullWidth
                                        required
                                    />
                                    <FormControl fullWidth required>
                                        <InputLabel>Asset Type</InputLabel>
                                        <Select
                                            value={newStructureForm.type}
                                            label="Asset Type"
                                            onChange={(e) => handleTypeChange(e.target.value as StructureType)}
                                        >
                                            {Object.values(StructureType).map(type => (
                                                <MenuItem key={type} value={type}>{type}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label="Size (e.g., 900mm NP4, 2x2 m)"
                                        value={newStructureForm.size}
                                        onChange={(e) => setNewStructureForm({ ...newStructureForm, size: e.target.value })}
                                        fullWidth
                                    />
                                    <TextField
                                        label="Location (Chainage)"
                                        value={newStructureForm.location}
                                        onChange={(e) => setNewStructureForm({ ...newStructureForm, location: e.target.value })}
                                        fullWidth
                                        required
                                    />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" mb={2}>Components & Quantities</Typography>
                                <Stack spacing={2}>
                                    {newStructureForm.components.length === 0 ? (
                                        <Typography color="text.secondary">Select an Asset Type to load components.</Typography>
                                    ) : (
                                        newStructureForm.components.map((component, index) => (
                                            <TextField
                                                key={component.id}
                                                label={`${component.name} (${component.unit})`}
                                                type="number"
                                                value={component.totalQuantity === 0 ? '' : component.totalQuantity}
                                                onChange={(e) => {
                                                    const updatedComponents = [...newStructureForm.components];
                                                    updatedComponents[index] = { ...component, totalQuantity: parseFloat(e.target.value) || 0 };
                                                    setNewStructureForm({ ...newStructureForm, components: updatedComponents });
                                                }}
                                                fullWidth
                                                required
                                            />
                                        ))
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">Construction Works</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Manage Project Assets</Typography>
                </Box>
                <Box display="flex" gap={2}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Filter by Type</InputLabel>
                        <Select value={filterType} label="Filter by Type" onChange={(e) => setFilterType(e.target.value)}>
                            <MenuItem value="ALL">All Types</MenuItem>
                            {Object.values(StructureType).map(type => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="contained" startIcon={<Plus />} onClick={handleAddStructure}>Add Asset</Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {filteredStructures.length === 0 ? (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 8, textAlign: 'center', borderStyle: 'dashed' }}>
                            <Box sx={{ opacity: 0.3 }}><Hammer size={40} /></Box>
                            <Typography color="text.secondary" mt={1}>No structure assets found. Click "Add Asset" to get started.</Typography>
                        </Paper>
                    </Grid>
                ) : (
                    filteredStructures.map(str => (
                        <StructureAssetCard
                            key={str.id}
                            str={str}
                            handleOpenUpdateModal={handleOpenUpdateModal}
                            handleDeleteStructureClick={handleDeleteStructureClick}
                        />
                    ))
                )}
            </Grid>

            {/* Update Structure Modal */}
            <Dialog open={updateStructureModal?.isOpen || false} onClose={() => setUpdateStructureModal(null)} maxWidth="md" fullWidth>
                <DialogTitle>Update Structure Asset</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" mb={2}>Asset Details</Typography>
                                    <Stack spacing={2}>
                                        <TextField
                                            label="Asset Name"
                                            value={newStructureForm.name}
                                            onChange={(e) => setNewStructureForm({ ...newStructureForm, name: e.target.value })}
                                            fullWidth
                                            required
                                        />
                                        <FormControl fullWidth required>
                                            <InputLabel>Asset Type</InputLabel>
                                            <Select
                                                value={newStructureForm.type}
                                                label="Asset Type"
                                                onChange={(e) => handleTypeChange(e.target.value as StructureType)}
                                            >
                                                {Object.values(StructureType).map(type => (
                                                    <MenuItem key={type} value={type}>{type}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            label="Size (e.g., 900mm NP4, 2x2 m)"
                                            value={newStructureForm.size}
                                            onChange={(e) => setNewStructureForm({ ...newStructureForm, size: e.target.value })}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Location (Chainage)"
                                            value={newStructureForm.location}
                                            onChange={(e) => setNewStructureForm({ ...newStructureForm, location: e.target.value })}
                                            fullWidth
                                            required
                                        />
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" mb={2}>Components & Quantities</Typography>
                                    <Stack spacing={2}>
                                        {newStructureForm.components.length === 0 ? (
                                            <Typography color="text.secondary">Select an Asset Type to load components.</Typography>
                                        ) : (
                                            newStructureForm.components.map((component, index) => (
                                                <TextField
                                                    key={component.id}
                                                    label={`${component.name} (${component.unit})`}
                                                    type="number"
                                                    value={component.totalQuantity === 0 ? '' : component.totalQuantity}
                                                    onChange={(e) => {
                                                        const updatedComponents = [...newStructureForm.components];
                                                        updatedComponents[index] = { ...component, totalQuantity: parseFloat(e.target.value) || 0 };
                                                        setNewStructureForm({ ...newStructureForm, components: updatedComponents });
                                                    }}
                                                    fullWidth
                                                    required
                                                />
                                            ))
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUpdateStructureModal(null)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleUpdateStructure}
                        startIcon={<Save />}
                        disabled={!newStructureForm.name || !newStructureForm.location}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={confirmOpen}
                title="Delete Structure Asset"
                message="Are you sure you want to delete this structure asset? This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setConfirmOpen(false);
                    setItemToDeleteId(null);
                    showNotification("Deletion cancelled.", "info");
                }}
            />
        </Box>
    );
};

export default ConstructionModule;