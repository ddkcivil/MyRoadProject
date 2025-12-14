import React, { useState } from 'react';
import { UserRole, Project, LabTest } from '../types';
import { Beaker, FileText, Plus, Check, X } from 'lucide-react';
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
    Chip,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid
} from '@mui/material';

interface Props {
  userRole: UserRole;
  project: Project;
  onProjectUpdate: (project: Project) => void;
}

export const getResultChip = (result: 'Pass' | 'Fail' | 'Pending') => {
    if (result === 'Pass') return <Chip label="Pass" color="success" size="small" />;
    if (result === 'Fail') return <Chip label="Fail" color="error" size="small" />;
    return <Chip label="Pending" color="warning" size="small" />;
};

interface LabTestRowProps {
  test: LabTest;
  handleUpdateResult: (id: string, result: 'Pass' | 'Fail') => void;
}

const LabTestRow: React.FC<LabTestRowProps> = React.memo(({ test, handleUpdateResult }) => {
  return (
    <TableRow hover key={test.id}>
      <TableCell>{test.sampleId}</TableCell>
      <TableCell>{test.testName}</TableCell>
      <TableCell>{test.location}</TableCell>
      <TableCell>{test.date}</TableCell>
      <TableCell>{getResultChip(test.result)}</TableCell>
      <TableCell>{test.technician}</TableCell>
      <TableCell align="right">
        {test.result === 'Pending' ? (
          <Box>
            <Tooltip title="Mark as Pass"><IconButton color="success" onClick={() => handleUpdateResult(test.id, 'Pass')} aria-label="Mark test as pass" size="small" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><Check /></IconButton></Tooltip>
            <Tooltip title="Mark as Fail"><IconButton color="error" onClick={() => handleUpdateResult(test.id, 'Fail')} aria-label="Mark test as fail" size="small" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><X /></IconButton></Tooltip>
          </Box>
        ) : (
          <Button size="small" startIcon={<FileText size={14}/>}>View Report</Button>
        )}
      </TableCell>
    </TableRow>
  );
});

const LabModule: React.FC<Props> = ({ userRole, project, onProjectUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTest, setNewTest] = useState({ testName: '', sampleId: '', location: '' });

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    const test: LabTest = {
      id: `test-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      result: 'Pending',
      technician: userRole,
      ...newTest
    };
    onProjectUpdate({ ...project, labTests: [test, ...project.labTests] });
    setIsModalOpen(false);
    setNewTest({ testName: '', sampleId: '', location: '' });
  };

  const handleUpdateResult = (id: string, result: 'Pass' | 'Fail') => {
    onProjectUpdate({
      ...project,
      labTests: project.labTests.map(t => t.id === id ? { ...t, result } : t)
    });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography variant="h4" fontWeight="bold">Material Laboratory</Typography>
          <Typography variant="subtitle1" color="text.secondary">Quality Control & Assurance</Typography>
        </div>
        <Button variant="contained" startIcon={<Plus />} onClick={() => setIsModalOpen(true)}>
          Register Sample
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sample ID</TableCell>
                <TableCell>Test Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Technician</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {project.labTests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Box sx={{ opacity: 0.3 }}><Beaker size={40} /></Box>
                    <Typography color="text.secondary" mt={1}>No lab tests recorded.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                project.labTests.map((test) => (
                  <LabTestRow
                    key={test.id}
                    test={test}
                    handleUpdateResult={handleUpdateResult}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight="bold">Register New Sample</DialogTitle>
        <DialogContent>
            <Box component="form" onSubmit={handleAddTest} sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField autoFocus label="Test Name" fullWidth required value={newTest.testName} onChange={e => setNewTest({...newTest, testName: e.target.value})} />
                <TextField label="Sample ID" fullWidth required value={newTest.sampleId} onChange={e => setNewTest({...newTest, sampleId: e.target.value})} />
                <TextField label="Source / Location" fullWidth required value={newTest.location} onChange={e => setNewTest({...newTest, location: e.target.value})} />
            </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAddTest} variant="contained">Register</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LabModule;