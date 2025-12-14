import React, { useState, useCallback } from 'react';
import { Project, UserRole, BOQItem } from '../types';
import { Search, Plus, Trash2, Edit, CheckCircle, X } from 'lucide-react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
    IconButton,
    Tooltip,
    InputAdornment,
    CircularProgress
} from '@mui/material';

interface Props {
  projects: Project[];
  userRole: UserRole;
  onSelectProject: (projectId: string) => void;
  onSaveProject: (project: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
}

// Debounce utility function
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeout: NodeJS.Timeout;
  return function(this: any, ...args: any[]) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

export const calculateProgress = (boq: BOQItem[]) => {
  const totalValue = boq.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  if (totalValue === 0) return 0;
  const completedValue = boq.reduce((sum, item) => sum + (item.completedQuantity * item.rate), 0);
  return Math.round((completedValue / totalValue) * 100);
};

interface ProjectRowProps {
  project: Project;
  userRole: UserRole;
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (id: string) => void;
  handleOpenEdit: (project: Project) => void;
}

const ProjectRow: React.FC<ProjectRowProps> = React.memo(({
  project,
  userRole,
  onSelectProject,
  onDeleteProject,
  handleOpenEdit
}) => {
  const progress = calculateProgress(project.boq);
  const hasEditPrivilege = userRole === UserRole.ADMIN || userRole === UserRole.PROJECT_MANAGER;

  return (
    <TableRow hover key={project.id}>
        <TableCell sx={{ cursor: 'pointer' }} onClick={() => onSelectProject(project.id)}>
            <Typography variant="subtitle2" color="primary" fontWeight="bold">{project.name}</Typography>
            <Typography variant="caption" color="text.secondary">{project.location}</Typography>
        </TableCell>
        <TableCell>{project.client}</TableCell>
        <TableCell>{project.contractNo}</TableCell>
        <TableCell>{project.startDate} to {project.endDate}</TableCell>
        <TableCell>
            <Box display="flex" alignItems="center" gap={2}>
            <LinearProgress variant="determinate" value={progress} sx={{ width: 100, height: 8, borderRadius: 4 }} />
            <Typography variant="body2">{progress}%</Typography>
            </Box>
        </TableCell>
        <TableCell align="center">
            <Tooltip title="Select Project"><IconButton color="success" onClick={() => onSelectProject(project.id)} aria-label="Select project" size="small" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><CheckCircle /></IconButton></Tooltip>
            {hasEditPrivilege && (
            <>
                <Tooltip title="Edit"><IconButton color="primary" onClick={() => handleOpenEdit(project)} aria-label="Edit project" size="small" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><Edit /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton color="error" onClick={() => onDeleteProject(project.id)} aria-label="Delete project" size="small" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><Trash2 /></IconButton></Tooltip>
            </>
            )}
        </TableCell>
    </TableRow>
  );
});


const ProjectsList: React.FC<Props> = ({ projects, userRole, onSelectProject, onSaveProject, onDeleteProject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [displaySearchTerm, setDisplaySearchTerm] = useState(''); // New state for input value
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Project>>({});
  const [saving, setSaving] = useState(false); // Add saving state

  // Validation states
  const [projectNameError, setProjectNameError] = useState('');
  const [projectCodeError, setProjectCodeError] = useState('');
  const [clientError, setClientError] = useState('');
  const [contractorError, setContractorError] = useState('');
  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');
  const [contractNoError, setContractNoError] = useState('');

  const hasEditPrivilege = userRole === UserRole.ADMIN || userRole === UserRole.PROJECT_MANAGER;

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

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenNew = () => {
    setEditForm({});
    setProjectNameError('');
    setProjectCodeError('');
    setClientError('');
    setContractorError('');
    setStartDateError('');
    setEndDateError('');
    setContractNoError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditForm(project);
    setProjectNameError('');
    setProjectCodeError('');
    setClientError('');
    setContractorError('');
    setStartDateError('');
    setEndDateError('');
    setContractNoError('');
    setIsModalOpen(true);
  };

  const validateForm = () => {
    let isValid = true;
    setProjectNameError('');
    setProjectCodeError('');
    setClientError('');
    setContractorError('');
    setStartDateError('');
    setEndDateError('');
    setContractNoError('');

    if (!editForm.name?.trim()) {
      setProjectNameError('Project Name is required.');
      isValid = false;
    }
    if (!editForm.code?.trim()) {
      setProjectCodeError('Project Code is required.');
      isValid = false;
    }
    if (!editForm.client?.trim()) {
      setClientError('Client / Employer is required.');
      isValid = false;
    }
    if (!editForm.contractor?.trim()) {
      setContractorError('Contractor is required.');
      isValid = false;
    }
    if (!editForm.startDate) {
      setStartDateError('Start Date is required.');
      isValid = false;
    }
    if (editForm.endDate && editForm.startDate && editForm.endDate < editForm.startDate) {
      setEndDateError('End Date cannot be before Start Date.');
      isValid = false;
    }
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setSaving(true); // Set saving to true
    onSaveProject(editForm);
    setIsModalOpen(false);
    setSaving(false); // Set saving to false
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Projects</Typography>
        {hasEditPrivilege && (
          <Button variant="contained" startIcon={<Plus />} onClick={handleOpenNew}>New Project</Button>
        )}
      </Box>

      <Card>
         <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">All Projects</Typography>
            <TextField
              size="small"
              placeholder="Search projects..."
              value={displaySearchTerm} // Use displaySearchTerm for input value
              onChange={handleDisplaySearchTermChange} // Use new handler
              InputProps={{
                  startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment>
              }}
            />
         </Box>
         <TableContainer>
            <Table>
               <TableHead>
                  <TableRow>
                     <TableCell>Name</TableCell>
                     <TableCell>Client</TableCell>
                     <TableCell>Contract No</TableCell>
                     <TableCell>Dates</TableCell>
                     <TableCell>Progress</TableCell>
                     <TableCell align="center">Actions</TableCell>
                  </TableRow>
               </TableHead>
               <TableBody>
                  {filteredProjects.map(project => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      userRole={userRole}
                      onSelectProject={onSelectProject}
                      onDeleteProject={onDeleteProject}
                      handleOpenEdit={handleOpenEdit}
                    />
                  ))}
               </TableBody>
            </Table>
         </TableContainer>
      </Card>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight="bold">{editForm.id ? 'Edit Project' : 'New Project'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField label="Project Name" fullWidth required value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} onBlur={validateForm} error={!!projectNameError} helperText={projectNameError} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Project Code" fullWidth required value={editForm.code || ''} onChange={e => setEditForm({...editForm, code: e.target.value})} onBlur={validateForm} error={!!projectCodeError} helperText={projectCodeError} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Contract No" fullWidth value={editForm.contractNo || ''} onChange={e => setEditForm({...editForm, contractNo: e.target.value})} onBlur={validateForm} error={!!contractNoError} helperText={contractNoError} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Client / Employer" fullWidth required value={editForm.client || ''} onChange={e => setEditForm({...editForm, client: e.target.value})} onBlur={validateForm} error={!!clientError} helperText={clientError} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Authority Engineer" fullWidth value={editForm.engineer || ''} onChange={e => setEditForm({...editForm, engineer: e.target.value})} /></Grid>
              <Grid item xs={12}><TextField label="Contractor" fullWidth required value={editForm.contractor || ''} onChange={e => setEditForm({...editForm, contractor: e.target.value})} onBlur={validateForm} error={!!contractorError} helperText={contractorError} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Start Date" type="date" InputLabelProps={{ shrink: true }} fullWidth required value={editForm.startDate || ''} onChange={e => setEditForm({...editForm, startDate: e.target.value})} onBlur={validateForm} error={!!startDateError} helperText={startDateError} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="End Date" type="date" InputLabelProps={{ shrink: true }} fullWidth value={editForm.endDate || ''} onChange={e => setEditForm({...editForm, endDate: e.target.value})} onBlur={validateForm} error={!!endDateError} helperText={endDateError} /></Grid>
              <Grid item xs={12}><TextField label="Location" fullWidth value={editForm.location || ''} onChange={e => setEditForm({...editForm, location: e.target.value})} /></Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={20} /> : (editForm.id ? <Edit /> : <Plus />)}>{editForm.id ? 'Save Changes' : 'Create Project'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default ProjectsList;