import React, { useState } from 'react';
import { Project, UserRole, DailyReport, DailyWorkItem } from '../types';
import { FileText, Plus, Calendar, MapPin, Hash, CheckCircle, ArrowRight, Link as LinkIcon, Trash2 } from 'lucide-react';
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
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    CircularProgress
} from '@mui/material';

interface Props {
  project: Project;
  userRole: UserRole;
  onProjectUpdate: (project: Project) => void;
}

interface WorkItemRowProps {
    item: Partial<DailyWorkItem>;
    boqItems: Project['boq'];
    handleRemoveItem: (id: string) => void;
}

const WorkItemRow: React.FC<WorkItemRowProps> = React.memo(({ item, boqItems, handleRemoveItem }) => {
    const boqItem = boqItems.find(b => b.id === item.boqItemId);
    return (
        <TableRow key={item.id}>
            <TableCell sx={{ fontWeight: 'bold' }}>{boqItem?.itemNo}</TableCell>
            <TableCell>{item.location}</TableCell>
            <TableCell align="right">{item.quantity}</TableCell>
            <TableCell>{item.links?.length || 0}</TableCell>
            <TableCell align="right">
                <IconButton 
                    size="small" 
                    onClick={() => handleRemoveItem(item.id!)} 
                    aria-label="Remove item from report"
                    sx={{ 
                      minWidth: { xs: 44, md: 'auto' },
                      minHeight: { xs: 44, md: 'auto' }
                    }}
                >
                    <Trash2 size={16}/>
                </IconButton>
            </TableCell>
        </TableRow>
    );
});

interface DailyReportRowProps {
    report: DailyReport;
}

const DailyReportRow: React.FC<DailyReportRowProps> = React.memo(({ report }) => {
    return (
        <TableRow hover key={report.id}>
            <TableCell>{report.date}</TableCell>
            <TableCell><Chip label={report.reportNumber} size="small" variant="outlined" /></TableCell>
            <TableCell>{report.items.length}</TableCell>
            <TableCell>{report.submittedBy}</TableCell>
            <TableCell>
                <Chip label={report.status} color="success" size="small" icon={<CheckCircle size={14} />} />
            </TableCell>
            <TableCell align="right">
                <Button size="small" endIcon={<ArrowRight size={14} />}>View Details</Button>
            </TableCell>
        </TableRow>
    );
});

const DailyReportModule: React.FC<Props> = ({ project, userRole, onProjectUpdate }) => {
  const [view, setView] = useState<'LIST' | 'CREATE'>('LIST');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [submittingReport, setSubmittingReport] = useState(false); // Add submittingReport state
  
  const [workItems, setWorkItems] = useState<Partial<DailyWorkItem>[]>([]);
  const [currentWorkItem, setCurrentWorkItem] = useState<Partial<DailyWorkItem>>({
    boqItemId: '',
    location: '',
    quantity: 0,
    description: '',
    links: []
  });
  const [currentLink, setCurrentLink] = useState('');

  const handleAddItem = () => {
    if (!currentWorkItem.boqItemId || !currentWorkItem.quantity) return;
    
    const isDuplicate = workItems.some(item => 
        item.boqItemId === currentWorkItem.boqItemId && 
        item.location?.trim().toLowerCase() === currentWorkItem.location?.trim().toLowerCase()
    );

    if (isDuplicate) {
        alert("Duplicate Entry: This work item for this location is already in the report.");
        return;
    }

    const finalItem = { ...currentWorkItem, links: currentLink ? [...(currentWorkItem.links || []), currentLink] : currentWorkItem.links };
    setWorkItems([...workItems, { ...finalItem, id: `item-${Date.now()}` }]);
    setCurrentWorkItem({ boqItemId: '', location: '', quantity: 0, description: '', links: [] });
    setCurrentLink('');
  };
  
  const handleRemoveItem = (id: string) => {
      setWorkItems(workItems.filter(item => item.id !== id));
  };

  const handleSubmitReport = () => {
    if (workItems.length === 0) return;
    setSubmittingReport(true); // Set submittingReport to true

    const newReport: DailyReport = {
      id: `dpr-${Date.now()}`,
      date: reportDate,
      reportNumber: `DPR-${reportDate}`,
      items: workItems as DailyWorkItem[],
      status: 'Approved',
      submittedBy: userRole
    };

    const updatedBoq = project.boq.map(boqItem => {
      const totalAdded = workItems
        .filter(wi => wi.boqItemId === boqItem.id)
        .reduce((sum, wi) => sum + (wi.quantity || 0), 0);
      return totalAdded > 0 ? { ...boqItem, completedQuantity: boqItem.completedQuantity + totalAdded } : boqItem;
    });

    onProjectUpdate({
      ...project,
      boq: updatedBoq,
      dailyReports: [newReport, ...project.dailyReports]
    });

    setView('LIST');
    setWorkItems([]);
    setSubmittingReport(false); // Set submittingReport to false
  };

  const renderCreateView = () => (
    <Card>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
                <Typography variant="h6" fontWeight="bold">New Daily Progress Report</Typography>
                <Typography variant="body2" color="text.secondary">Enter executed quantities for the day</Typography>
            </Box>
            <TextField
              type="date"
              label="Report Date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 200 }}
            />
        </Box>

        <Grid container spacing={3} sx={{ p: 3 }}>
            <Grid item xs={12} md={5}>
                <Typography variant="h6" gutterBottom>Add Work Item</Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                    <FormControl fullWidth>
                        <InputLabel>BOQ Item</InputLabel>
                        <Select
                          value={currentWorkItem.boqItemId}
                          onChange={(e) => setCurrentWorkItem({...currentWorkItem, boqItemId: e.target.value})}
                          label="BOQ Item"
                        >
                          <MenuItem value=""><em>Select Item...</em></MenuItem>
                          {project.boq.map(b => (
                            <MenuItem key={b.id} value={b.id}>{b.itemNo} - {b.description.substring(0, 40)}...</MenuItem>
                          ))}
                        </Select>
                    </FormControl>
                    <TextField label="Location / Chainage" fullWidth value={currentWorkItem.location} onChange={(e) => setCurrentWorkItem({...currentWorkItem, location: e.target.value})} />
                    <TextField label="Quantity Executed" type="number" fullWidth value={currentWorkItem.quantity || ''} onChange={(e) => setCurrentWorkItem({...currentWorkItem, quantity: parseFloat(e.target.value)})} />
                    <TextField label="Remarks" multiline rows={2} fullWidth value={currentWorkItem.description} onChange={(e) => setCurrentWorkItem({...currentWorkItem, description: e.target.value})} />
                    <TextField label="Evidence Link" fullWidth value={currentLink} onChange={(e) => setCurrentLink(e.target.value)} helperText="Link to site photos or measurement sheets" />

                    <Button
                      onClick={handleAddItem}
                      disabled={!currentWorkItem.boqItemId || !currentWorkItem.quantity}
                      variant="outlined"
                    >
                      Add Entry to Report
                    </Button>
                </Box>
            </Grid>
            <Grid item xs={12} md={7}>
                 <Typography variant="h6" gutterBottom>Items in Report ({workItems.length})</Typography>
                 <Paper variant="outlined" sx={{ overflow: 'hidden', height: 400, display: 'flex', flexDirection: 'column' }}>
                    {workItems.length === 0 ? (
                        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', p:2 }}>
                           <Box sx={{ opacity: 0.3 }}><FileText size={40} /></Box>
                           <Typography>No items added yet</Typography>
                        </Box>
                    ) : (
                        <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Item No</TableCell>
                                        <TableCell>Location</TableCell>
                                        <TableCell align="right">Qty</TableCell>
                                        <TableCell>Links</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {workItems.map((item) => (
                                        <WorkItemRow
                                            key={item.id}
                                            item={item}
                                            boqItems={project.boq}
                                            handleRemoveItem={handleRemoveItem}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                 </Paper>
                 <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={() => setView('LIST')} disabled={submittingReport}>Cancel</Button>
                    <Button variant="contained" color="primary" startIcon={submittingReport ? <CircularProgress size={20} /> : <CheckCircle />} onClick={handleSubmitReport} disabled={workItems.length === 0 || submittingReport}>
                      {submittingReport ? 'Submitting...' : 'Submit & Update BOQ'}
                    </Button>
                 </Box>
            </Grid>
        </Grid>
    </Card>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography variant="h4" fontWeight="bold">Daily Reports</Typography>
          <Typography variant="subtitle1" color="text.secondary">Track daily progress and update BOQ quantities.</Typography>
        </div>
        {view === 'LIST' && (
          <Button variant="contained" startIcon={<Plus />} onClick={() => setView('CREATE')}>
            New Daily Report
          </Button>
        )}
      </Box>

      {view === 'CREATE' ? renderCreateView() : (
        <Card>
           {project.dailyReports.length === 0 ? (
              <Box p={8} textAlign="center" color="text.secondary">No daily reports submitted yet.</Box>
           ) : (
             <TableContainer>
               <Table>
                 <TableHead>
                   <TableRow>
                     <TableCell>Date</TableCell>
                     <TableCell>Report No</TableCell>
                     <TableCell>Items Count</TableCell>
                     <TableCell>Submitted By</TableCell>
                     <TableCell>Status</TableCell>
                     <TableCell align="right">Action</TableCell>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                   {project.dailyReports.map((report) => (
                     <DailyReportRow
                       key={report.id}
                       report={report}
                     />
                   ))}
                 </TableBody>
               </Table>
             </TableContainer>
           )}
        </Card>
      )}
    </Box>
  );
};

export default DailyReportModule;