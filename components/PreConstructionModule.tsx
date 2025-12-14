import React, { useState } from 'react';
import { Project, PreConstructionTask } from '../types';
import { CheckCircle, Clock, AlertCircle, Plus, Calendar, BellRing, Target, Trash2 } from 'lucide-react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    Paper,
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
    InputLabel,
    LinearProgress,
    CircularProgress
} from '@mui/material';
import ConfirmDialog from './ConfirmDialog'; // Import ConfirmDialog
import { useNotification } from './NotificationContext'; // Import useNotification

interface Props {
  project: Project;
  onProjectUpdate: (project: Project) => void;
}

const getStatusChip = (status: string) => {
    if (status === 'Completed') return <Chip label="Completed" color="success" size="small" />;
    if (status === 'In Progress') return <Chip label="In Progress" color="info" size="small" />;
    return <Chip label="Pending" color="warning" size="small" />;
};

interface PreConstructionTaskCardProps {
    task: PreConstructionTask;
    handleDeleteTaskClick: (id: string) => void;
    setSelectedTaskForTrack: (id: string | null) => void;
    setIsTrackModalOpen: (isOpen: boolean) => void;
}

const PreConstructionTaskCard: React.FC<PreConstructionTaskCardProps> = React.memo(({
    task,
    handleDeleteTaskClick,
    setSelectedTaskForTrack,
    setIsTrackModalOpen
}) => {
    return (
        <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">{task.category}</Typography>
                        {getStatusChip(task.status)}
                    </Box>
                    <Typography variant="h6" fontWeight="bold" my={1}>{task.description}</Typography>
                    <Box display="flex" alignItems="center" gap={1} color="text.secondary" mb={2}><Calendar size={16} /><Typography variant="body2">{task.estStartDate} → {task.estEndDate}</Typography></Box>
                    <Box mb={1}><LinearProgress variant="determinate" value={task.progress || 0} /><Typography variant="caption" align="right" display="block">{task.progress || 0}%</Typography></Box>
                    {task.remarks && <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.100' }}><Typography variant="caption" fontStyle="italic">"{task.remarks}"</Typography></Paper>}
                </CardContent>
                <Box flexGrow={1} />
                <Box sx={{ justifyContent: 'space-between', padding: 2 }}>
                    <Button size="small" startIcon={<Target />} onClick={() => { setSelectedTaskForTrack(task.id); setIsTrackModalOpen(true); }}>Track Progress</Button>
                    <IconButton 
                        size="small" 
                        onClick={() => handleDeleteTaskClick(task.id)} 
                        aria-label="Delete activity"
                        sx={{ 
                          minWidth: { xs: 44, md: 'auto' },
                          minHeight: { xs: 44, md: 'auto' }
                        }}
                    >
                        <Trash2 size={16} />
                    </IconButton>
                </Box>
            </Card>
        </Grid>
    );
});


const PreConstructionModule: React.FC<Props> = ({ project, onProjectUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [selectedTaskForTrack, setSelectedTaskForTrack] = useState<string | null>(null);
  const [addingTask, setAddingTask] = useState(false); // Add addingTask state
  const [trackingProgress, setTrackingProgress] = useState(false); // Declare trackingProgress here

  const [newTask, setNewTask] = useState<Partial<PreConstructionTask>>({
    category: 'Survey', status: 'Pending', description: '', remarks: '', estStartDate: '', estEndDate: '', progress: 0
  });

  const [trackForm, setTrackForm] = useState({
      date: new Date().toISOString().split('T')[0], progressAdded: 0, description: ''
  });

  const [confirmOpen, setConfirmOpen] = useState(false); // State for ConfirmDialog
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null); // State for ID of item to delete
  const { showNotification } = useNotification(); // Use notification hook

  // Validation states for Add New Pre-Construction Activity Modal
  const [descriptionError, setDescriptionError] = useState('');
  const [estStartDateError, setEstStartDateError] = useState('');
  const [estEndDateError, setEstEndDateError] = useState('');

  const validateAddTaskForm = () => {
    let isValid = true;
    setDescriptionError('');
    setEstStartDateError('');
    setEstEndDateError('');

    if (!newTask.description?.trim()) {
      setDescriptionError('Description is required.');
      isValid = false;
    }
    if (!newTask.estStartDate) {
      setEstStartDateError('Estimated Start Date is required.');
      isValid = false;
    }
    if (!newTask.estEndDate) {
      setEstEndDateError('Estimated End Date is required.');
      isValid = false;
    } else if (newTask.estStartDate && newTask.estEndDate < newTask.estStartDate) {
      setEstEndDateError('Estimated End Date cannot be before Start Date.');
      isValid = false;
    }
    return isValid;
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddTaskForm()) {
        return;
    }
    setAddingTask(true); // Set addingTask to true
    const task: PreConstructionTask = {
        id: `pre-${Date.now()}`,
        category: newTask.category as any,
        description: newTask.description || '',
        status: newTask.status as any,
        targetDate: newTask.estEndDate || '',
        estStartDate: newTask.estStartDate,
        estEndDate: newTask.estEndDate,
        progress: 0,
        remarks: newTask.remarks || '', // Add remarks here
        logs: []
    };
    onProjectUpdate({ ...project, preConstruction: [...project.preConstruction, task] });
    setIsModalOpen(false);
    setNewTask({ category: 'Survey', status: 'Pending', description: '', remarks: '', estStartDate: '', estEndDate: '', progress: 0 });
    setDescriptionError('');
    setEstStartDateError('');
    setEstEndDateError('');
    showNotification("Pre-construction activity added successfully!", "success");
    setAddingTask(false); // Set addingTask to false
  };

  const handleDeleteTaskClick = (id: string) => {
      setItemToDeleteId(id);
      setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
      if (itemToDeleteId) {
          onProjectUpdate({ ...project, preConstruction: project.preConstruction.filter(t => t.id !== itemToDeleteId) });
          showNotification("Pre-construction activity deleted successfully!", "success");
          setItemToDeleteId(null);
          setConfirmOpen(false);
      }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedTaskForTrack) return;
      setTrackingProgress(true); // Set trackingProgress to true
      
      const updated = project.preConstruction.map(t => {
          if (t.id === selectedTaskForTrack) {
              const newProgress = Math.min(100, (t.progress || 0) + Number(trackForm.progressAdded));
              return { ...t, progress: newProgress, status: newProgress === 100 ? 'Completed' : 'In Progress', logs: [...(t.logs || []), { date: trackForm.date, progressAdded: Number(trackForm.progressAdded), description: trackForm.description }] };
          }
          return t;
      });

      onProjectUpdate({ ...project, preConstruction: updated as any });
      setIsTrackModalOpen(false);
      setTrackForm({ date: new Date().toISOString().split('T')[0], progressAdded: 0, description: '' });
      showNotification("Progress updated successfully!", "success");
      setTrackingProgress(false); // Set trackingProgress to false
  };
  
  const today = new Date().toISOString().split('T')[0];
  const dueTasks = project.preConstruction.filter(t => t.status !== 'Completed' && t.estEndDate && t.estEndDate <= today);

  return (
    <Box>
       <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography variant="h4" fontWeight="bold">Pre-Construction Activities</Typography>
          <Typography variant="subtitle1" color="text.secondary">Land Acquisition, Clearances, and Surveys</Typography>
        </div>
        <Button variant="contained" startIcon={<Plus />} onClick={() => setIsModalOpen(true)}>Add Activity</Button>
      </Box>

      {dueTasks.length > 0 && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.light', color: 'warning.dark', display: 'flex', gap: 2 }}>
              <BellRing />
              <Box>
                  <Typography fontWeight="bold">Action Required: {dueTasks.length} Tasks Due or Overdue</Typography>
                  <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                      {dueTasks.map(t => <li key={t.id}><Typography variant="body2">{t.description} (Due: {t.estEndDate})</Typography></li>)}
                  </ul>
              </Box>
          </Paper>
      )}

      <Grid container spacing={3}>
          {project.preConstruction.map(task => (
              <PreConstructionTaskCard
                  key={task.id}
                  task={task}
                  handleDeleteTaskClick={handleDeleteTaskClick}
                  setSelectedTaskForTrack={setSelectedTaskForTrack}
                  setIsTrackModalOpen={setIsTrackModalOpen}
              />
          ))}
          {project.preConstruction.length === 0 && (
              <Grid item xs={12}><Paper sx={{ p: 8, textAlign: 'center', borderStyle: 'dashed' }}><Typography color="text.secondary">No pre-construction activities logged.</Typography></Paper></Grid>
          )}
      </Grid>
      
      {/* Modals */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Pre-Construction Activity</DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleAddTask} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select value={newTask.category} label="Category" onChange={(e) => setNewTask({ ...newTask, category: e.target.value as any })}>
                <MenuItem value="Survey">Survey</MenuItem>
                <MenuItem value="Investigation">Investigation</MenuItem>
                <MenuItem value="Land Acquisition">Land Acquisition</MenuItem>
                <MenuItem value="Clearances">Clearances</MenuItem>
                <MenuItem value="Utility Relocation">Utility Relocation</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Approvals">Approvals</MenuItem>
                <MenuItem value="Mobilization">Mobilization</MenuItem>
              </Select>
            </FormControl>
            <TextField 
              label="Description" 
              value={newTask.description} 
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} 
              onBlur={validateAddTaskForm}
              error={!!descriptionError}
              helperText={descriptionError}
              fullWidth 
              required 
              multiline 
              rows={2} 
            />
            <TextField 
              label="Remarks" 
              value={newTask.remarks} 
              onChange={(e) => setNewTask({ ...newTask, remarks: e.target.value })} 
              fullWidth 
              multiline 
              rows={2} 
            />
            <TextField 
              label="Estimated Start Date" 
              type="date" 
              value={newTask.estStartDate} 
              onChange={(e) => setNewTask({ ...newTask, estStartDate: e.target.value })} 
              fullWidth 
              InputLabelProps={{ shrink: true }} 
              onBlur={validateAddTaskForm}
              error={!!estStartDateError}
              helperText={estStartDateError}
            />
            <TextField 
              label="Estimated End Date" 
              type="date" 
              value={newTask.estEndDate} 
              onChange={(e) => setNewTask({ ...newTask, estEndDate: e.target.value })} 
              fullWidth 
              InputLabelProps={{ shrink: true }} 
              onBlur={validateAddTaskForm}
              error={!!estEndDateError}
              helperText={estEndDateError}
            />
            <FormControl fullWidth required>
              <InputLabel>Status</InputLabel>
              <Select value={newTask.status} label="Status" onChange={(e) => setNewTask({ ...newTask, status: e.target.value as any })}>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="On Hold">On Hold</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)} disabled={addingTask}>Cancel</Button>
          <Button onClick={handleAddTask} variant="contained" disabled={addingTask} startIcon={addingTask ? <CircularProgress size={20} /> : <Plus />}>Add Activity</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isTrackModalOpen} onClose={() => setIsTrackModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Track Progress</DialogTitle>
          <DialogContent dividers>
              <Box component="form" onSubmit={handleTrackSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField label="Date" type="date" value={trackForm.date} onChange={(e) => setTrackForm({ ...trackForm, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
                  <TextField label="Progress Added (%)" type="number" value={trackForm.progressAdded} onChange={(e) => setTrackForm({ ...trackForm, progressAdded: Number(e.target.value) })} fullWidth />
                  <TextField label="Remarks" value={trackForm.description} onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })} fullWidth multiline rows={2} />
              </Box>
          </DialogContent>
          <DialogActions>
              <Button onClick={() => setIsTrackModalOpen(false)} disabled={trackingProgress}>Cancel</Button>
              <Button onClick={handleTrackSubmit} variant="contained" disabled={trackingProgress} startIcon={trackingProgress ? <CircularProgress size={20} /> : <CheckCircle />}>Update Progress</Button>
          </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Pre-Construction Activity"
        message="Are you sure you want to delete this pre-construction activity? This action cannot be undone."
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

export default PreConstructionModule;