
import React, { useState } from 'react';
import { Project, ScheduleTask, UserRole } from '../types';
import { CalendarClock, Plus, Edit2, Trash2, X, Check, AlertTriangle, Clock } from 'lucide-react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
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
    Avatar,
    ChipProps,
    CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ConfirmDialog from './ConfirmDialog'; // Import ConfirmDialog
import { useNotification } from './NotificationContext'; // Import useNotification

interface Props {
    project: Project;
    userRole: UserRole;
    onProjectUpdate: (project: Project) => void;
}

// Define a type for the colors object that matches ChipPropsColorOverrides
type StatusColor = ChipProps['color'];

export const getStatusChip = (status: 'Completed' | 'Delayed' | 'On Track') => {
    const colors: Record<typeof status, StatusColor> = {
        'Completed': 'success',
        'Delayed': 'error',
        'On Track': 'info'
    };
    return <Chip label={status} color={colors[status]} size="small" />;
};

export const getPosition = (start: string, end: string, minDate: number, maxDate: number, totalDuration: number) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();

    // Calculate effective start and end, clamping them within the minDate and maxDate
    const effectiveStart = Math.max(s, minDate);
    const effectiveEnd = Math.min(e, maxDate);

    const left = ((effectiveStart - minDate) / totalDuration) * 100;
    const width = ((effectiveEnd - effectiveStart) / totalDuration) * 100;

    return { left: `${Math.max(0, left)}%`, width: `${Math.max(0.5, width)}%` };
};

interface ScheduleTaskItemProps {
    task: ScheduleTask;
    canEdit: boolean;
    handleOpenModal: (task?: ScheduleTask) => void;
    handleDeleteClick: (id: string) => void;
    getPosition: (start: string, end: string, minDate: number, maxDate: number, totalDuration: number) => { left: string, width: string };
    theme: any; // Pass theme for color
    minDate: number;
    maxDate: number;
    totalDuration: number;
}

const ScheduleTaskItem: React.FC<ScheduleTaskItemProps> = React.memo(({
    task,
    canEdit,
    handleOpenModal,
    handleDeleteClick,
    getPosition,
    theme,
    minDate,
    maxDate,
    totalDuration
}) => {
    const pos = getPosition(task.startDate, task.endDate, minDate, maxDate, totalDuration);
    const color = task.status === 'Completed' ? 'success.main' : task.status === 'Delayed' ? 'error.main' : 'primary.main';

    return (
        <Box key={task.id} sx={{ p: 2, '&:hover': { bgcolor: 'action.hover' } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Box>
                    <Typography variant="subtitle1" fontWeight="bold">{task.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{task.startDate} → {task.endDate}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    {getStatusChip(task.status)}
                    <Chip label={`${task.progress}%`} size="small" />
                    {canEdit && (
                        <>
                            <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenModal(task)} aria-label="Edit task" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><Edit2 size={16} /></IconButton></Tooltip>
                            <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDeleteClick(task.id)} aria-label="Delete task" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><Trash2 size={16} /></IconButton></Tooltip>
                        </>
                    )}
                </Box>
            </Box>

            <Box sx={{ width: '100%', height: 24, bgcolor: 'divider', borderRadius: 1, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', height: '100%', left: pos.left, width: pos.width, bgcolor: 'action.selected', opacity: 0.3 }} />
                <Box sx={{ position: 'absolute', height: '100%', left: pos.left, width: `calc(${pos.width} * ${task.progress / 100})`, bgcolor: color, borderRadius: 1 }} />
            </Box>
        </Box>
    );
});


const ScheduleModule: React.FC<Props> = ({ project, userRole, onProjectUpdate }) => {
  const theme = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<ScheduleTask>>({});
  const [saving, setSaving] = useState(false); // Add saving state

  // Validation states
  const [taskNameError, setTaskNameError] = useState('');
  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');
  const [progressError, setProgressError] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false); // State for ConfirmDialog
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null); // State for ID of item to delete
  const { showNotification } = useNotification(); // Use notification hook


  const canEdit = [UserRole.PROJECT_MANAGER, UserRole.ADMIN, UserRole.SITE_ENGINEER].includes(userRole);

  const handleOpenModal = (task?: ScheduleTask) => {
      if (!canEdit) return;
      setEditingTask(task || {
          name: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          progress: 0,
          status: 'On Track'
      });
      setTaskNameError('');
      setStartDateError('');
      setEndDateError('');
      setProgressError('');
      setIsModalOpen(true);
  };

  const validateForm = () => {
    let isValid = true;
    setTaskNameError('');
    setStartDateError('');
    setEndDateError('');
    setProgressError('');

    if (!editingTask.name?.trim()) {
      setTaskNameError('Task Name is required.');
      isValid = false;
    }

    if (!editingTask.startDate) {
      setStartDateError('Start Date is required.');
      isValid = false;
    }

    if (!editingTask.endDate) {
      setEndDateError('End Date is required.');
      isValid = false;
    } else if (editingTask.startDate && editingTask.endDate < editingTask.startDate) {
      setEndDateError('End Date must be after Start Date.');
      isValid = false;
    }

    if (editingTask.progress === undefined || isNaN(editingTask.progress) || editingTask.progress < 0 || editingTask.progress > 100) {
      setProgressError('Progress must be a number between 0 and 100.');
      isValid = false;
    }

    return isValid;
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!validateForm()) {
          return;
      }
      setSaving(true); // Set saving to true

      let updatedSchedule: ScheduleTask[];
      
      if (editingTask.id) {
          updatedSchedule = project.schedule.map(t => t.id === editingTask.id ? { ...t, ...editingTask } as ScheduleTask : t);
          showNotification("Task updated successfully!", "success");
      } else {
          const newTask: ScheduleTask = {
              id: `task-${Date.now()}`,
              name: editingTask.name!,
              startDate: editingTask.startDate!,
              endDate: editingTask.endDate!,
              progress: Number(editingTask.progress) || 0,
              status: editingTask.status as any || 'On Track'
          };
          updatedSchedule = [...project.schedule, newTask];
          showNotification("Task added successfully!", "success");
      }
      
      updatedSchedule.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      onProjectUpdate({ ...project, schedule: updatedSchedule });
      setIsModalOpen(false);
      setSaving(false); // Set saving to false
  };

  const handleDeleteClick = (id: string) => {
      setItemToDeleteId(id);
      setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
      if (itemToDeleteId) {
          onProjectUpdate({
              ...project,
              schedule: project.schedule.filter(t => t.id !== itemToDeleteId)
          });
          showNotification("Task deleted successfully!", "success");
          setItemToDeleteId(null);
          setConfirmOpen(false);
      }
  };

  const dates = project.schedule.flatMap(t => [new Date(t.startDate).getTime(), new Date(t.endDate).getTime()]);
  const minDate = dates.length ? Math.min(...dates) : new Date().getTime();
  const maxDate = dates.length ? Math.max(...dates) : new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
  const totalDuration = maxDate - minDate || 1;
  
  return (
      <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <div>
                  <Typography variant="h4" fontWeight="bold">Master Work Schedule</Typography>
                  <Typography variant="subtitle1" color="text.secondary">Project Timeline & Critical Path</Typography>
              </div>
              {canEdit && (
                  <Button variant="contained" startIcon={<Plus />} onClick={() => handleOpenModal()}>
                      Add Task
                  </Button>
              )}
          </Box>

          <Grid container spacing={3} mb={3}>
              <Grid item xs={12} sm={4}>
                  <Card>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'info.light', color: 'info.main' }}><Clock /></Avatar>
                          <Box>
                              <Typography variant="h4" fontWeight="bold">{project.schedule.length}</Typography>
                              <Typography variant="body2" color="text.secondary">Total Tasks</Typography>
                          </Box>
                      </CardContent>
                  </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                  <Card>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}><Check /></Avatar>
                          <Box>
                              <Typography variant="h4" fontWeight="bold">{project.schedule.filter(t => t.status === 'Completed').length}</Typography>
                              <Typography variant="body2" color="text.secondary">Completed</Typography>
                          </Box>
                      </CardContent>
                  </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                  <Card>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'error.light', color: 'error.main' }}><AlertTriangle /></Avatar>
                          <Box>
                              <Typography variant="h4" fontWeight="bold">{project.schedule.filter(t => t.status === 'Delayed').length}</Typography>
                              <Typography variant="body2" color="text.secondary">Delayed</Typography>
                          </Box>
                      </CardContent>
                  </Card>
              </Grid>
          </Grid>

          <Card>
              <Paper elevation={0} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight="bold">Gantt View</Typography>
              </Paper>
              
              <Box sx={{ divideY: 1, borderColor: 'divider' }}>
                  {project.schedule.length === 0 ? (
                      <Box p={8} textAlign="center" color="text.secondary">No tasks scheduled.</Box>
                  ) : (
                      project.schedule.map(task => (
                        <ScheduleTaskItem
                            key={task.id}
                            task={task}
                            canEdit={canEdit}
                            handleOpenModal={handleOpenModal}
                            handleDeleteClick={handleDeleteClick}
                            getPosition={getPosition}
                            theme={theme}
                            minDate={minDate}
                            maxDate={maxDate}
                            totalDuration={totalDuration}
                        />
                      ))
                  )}
              </Box>
          </Card>

          <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle fontWeight="bold">{editingTask.id ? 'Edit Task' : 'Add New Task'}</DialogTitle>
              <DialogContent>
                  <Box component="form" onSubmit={handleSave} sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                          label="Task Name"
                          fullWidth
                          required
                          value={editingTask.name || ''} 
                          onChange={e => setEditingTask({...editingTask, name: e.target.value})}
                          // onBlur={validateForm} // commented out to avoid conflict
                          // error={!!taskNameError} // commented out to avoid conflict
                          // helperText={taskNameError} // commented out to avoid conflict
                      />
                      <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                              <TextField 
                                  label="Start Date"
                                  type="date" 
                                  fullWidth
                                  required
                                  InputLabelProps={{ shrink: true }}
                                  value={editingTask.startDate || ''} 
                                  onChange={e => setEditingTask({...editingTask, startDate: e.target.value})}
                                  // onBlur={validateForm} // commented out to avoid conflict
                                  // error={!!startDateError} // commented out to avoid conflict
                                  // helperText={startDateError} // commented out to avoid conflict
                              />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                              <TextField
                                  label="End Date"
                                  type="date"
                                  fullWidth
                                  required
                                  InputLabelProps={{ shrink: true }}
                                  value={editingTask.endDate || ''} 
                                  onChange={e => setEditingTask({...editingTask, endDate: e.target.value})}
                                  // onBlur={validateForm} // commented out to avoid conflict
                                  // error={!!endDateError} // commented out to avoid conflict
                                  // helperText={endDateError} // commented out to avoid conflict
                              />
                          </Grid>
                      </Grid>
                      <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                              <TextField
                                  label="Progress (%)"
                                  type="number"
                                  fullWidth
                                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                                  value={editingTask.progress ?? 0} 
                                  onChange={e => setEditingTask({...editingTask, progress: Number(e.target.value)})}
                                  // onBlur={validateForm} // commented out to avoid conflict
                                  // error={!!progressError} // commented out to avoid conflict
                                  // helperText={progressError} // commented out to avoid conflict
                              />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                              <FormControl fullWidth>
                                  <InputLabel>Status</InputLabel>
                                  <Select
                                      value={editingTask.status || 'On Track'}
                                      label="Status"
                                      onChange={e => setEditingTask({...editingTask, status: e.target.value as any})}
                                  >
                                      <MenuItem value="On Track">On Track</MenuItem>
                                      <MenuItem value="Delayed">Delayed</MenuItem>
                                      <MenuItem value="Completed">Completed</MenuItem>
                                  </Select>
                              </FormControl>
                          </Grid>
                      </Grid>
                  </Box>
              </DialogContent>
              <DialogActions>
                  <Button onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
                  <Button onClick={handleSave} variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={20} /> : <Check />}>Save</Button>
              </DialogActions>
          </Dialog>

          <ConfirmDialog
            open={confirmOpen}
            title="Delete Schedule Task"
            message="Are you sure you want to delete this schedule task? This action cannot be undone."
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

export default ScheduleModule;