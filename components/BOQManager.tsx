import React, { useState } from 'react';
import { UserRole, Project, WorkCategory, BOQItem, AppSettings } from '../types';
import { Edit2, Save, History, X, Upload, FileText, DollarSign, Hash, BarChart2 } from 'lucide-react';
import { 
    Box, 
    Typography, 
    Button, 
    Paper, 
    Grid, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    TextField, 
    IconButton, 
    Tooltip, 
    Chip,
    Modal,
    Card,
    CardContent
} from '@mui/material';
import ConfirmDialog from './ConfirmDialog'; // Import ConfirmDialog
import { useNotification } from './NotificationContext'; // Import useNotification

interface Props {
  userRole: UserRole;
  project: Project;
  settings: AppSettings;
  onProjectUpdate: (project: Project) => void;
}

// Helper function for history, needs project.dailyReports
const getItemHistory = (boqItemId: string, project: Project) => {
  const history: any[] = [];
  project.dailyReports.forEach(report => {
     report.items.forEach(item => {
        if (item.boqItemId === boqItemId) {
           history.push({
              date: report.date,
              qty: item.quantity,
              location: item.location,
              reportNo: report.reportNumber
           });
        }
     });
  });
  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

interface BOQRowProps {
  item: BOQItem;
  currencySymbol: string;
  canEdit: boolean;
  editingId: string | null;
  editVal: number;
  setEditVal: (val: number) => void;
  handleSave: (id: string) => void;
  handleEditClick: (id: string, current: number) => void;
  setHistoryModalItem: (id: string) => void;
  project: Project; // Pass full project to access dailyReports for history
}

const BOQRow: React.FC<BOQRowProps> = React.memo(({
  item,
  currencySymbol,
  canEdit,
  editingId,
  editVal,
  setEditVal,
  handleSave,
  handleEditClick,
  setHistoryModalItem,
  project // Receive project prop
}) => {
  const totalAmt = item.quantity * item.rate;
  const workDoneAmt = item.completedQuantity * item.rate;
  const isEditing = editingId === item.id;
  // Calculate hasHistory inside BOQRow, using the passed project
  const hasHistory = getItemHistory(item.id, project).length > 0;

  return (
    <TableRow hover key={item.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell component="th" scope="row">{item.itemNo}</TableCell>
      <TableCell>
        {item.description}
        <Chip label={item.category} size="small" sx={{ ml: 1, mt: 0.5, fontSize: '0.7rem' }} />
      </TableCell>
      <TableCell>{item.unit}</TableCell>
      <TableCell align="right">{item.quantity.toLocaleString()}</TableCell>
      <TableCell align="right">{item.rate.toLocaleString()}</TableCell>
      <TableCell align="right" sx={{ fontWeight: 'medium' }}>{totalAmt.toLocaleString()}</TableCell>
      <TableCell align="right">
        {isEditing ? (
          <TextField 
            type="number"
            size="small"
            value={editVal}
            onChange={(e) => setEditVal(Number(e.target.value))}
            sx={{ width: 120 }}
            inputProps={{ style: { textAlign: 'right' } }}
          />
        ) : (
          <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
            {item.completedQuantity.toLocaleString()}
          </Typography>
        )}
      </TableCell>
      <TableCell align="right">{workDoneAmt.toLocaleString()}</TableCell>
      <TableCell align="center">
          <Tooltip title="View Daily Report History">
              <span>
                <IconButton 
                    onClick={() => setHistoryModalItem(item.id)} 
                    disabled={!hasHistory} 
                size="small"
                aria-label="View daily report history"
                    sx={{ 
                      minWidth: { xs: 44, md: 'auto' },
                      minHeight: { xs: 44, md: 'auto' }
                    }}
                >
                    <History size={18} />
                </IconButton>
              </span>
          </Tooltip>
      </TableCell>
      {canEdit && (
        <TableCell align="center">
          {isEditing ? (
            <Tooltip title="Save Update">
              <IconButton 
                onClick={() => handleSave(item.id)} 
                color="success" 
                size="small"
                aria-label="Save quantity update"
                sx={{ 
                  minWidth: { xs: 44, md: 'auto' },
                  minHeight: { xs: 44, md: 'auto' }
                }}
              >
                <Save size={18} />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Manual Adjustment">
              <IconButton 
                onClick={() => handleEditClick(item.id, item.completedQuantity)} 
                size="small" 
                aria-label="Adjust completed quantity"
                sx={{ 
                  minWidth: { xs: 44, md: 'auto' },
                  minHeight: { xs: 44, md: 'auto' }
                }}
              >
                <Edit2 size={16} />
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
      )}
    </TableRow>
  );
});


const BOQManager: React.FC<Props> = ({ userRole, project, settings, onProjectUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState<number>(0);
  const [historyModalItem, setHistoryModalItem] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false); // State for ConfirmDialog
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null); // Action to perform on confirm
  const { showNotification } = useNotification(); // Use notification hook
  
  const canEdit = [UserRole.PROJECT_MANAGER, UserRole.SITE_ENGINEER].includes(userRole);

  const getCurrencySymbol = (code: string) => {
    switch(code) {
      case 'NPR': return 'Rs.';
      case 'INR': return '₹';
      default: return '$';
    }
  };

  const currencySymbol = getCurrencySymbol(settings.currency);

  const handleEditClick = (id: string, current: number) => {
    if (!canEdit) return;
    setEditingId(id);
    setEditVal(current);
  };

  const handleSave = (id: string) => {
    const updatedBoq = project.boq.map(item => 
      item.id === id ? { ...item, completedQuantity: editVal } : item
    );
    onProjectUpdate({ ...project, boq: updatedBoq });
    setEditingId(null);
  };

  const psItems = project.boq.filter(item => item.category === WorkCategory.PROVISIONAL_SUM);
  const nonPsItems = project.boq.filter(item => item.category !== WorkCategory.PROVISIONAL_SUM);
  const sumPS = psItems.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
  const sumOther = nonPsItems.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
  const vat = sumOther * (settings.vatRate / 100);
  const totalProjectValue = sumPS + sumOther + vat;

  const handleImportConfirm = () => {
    // Simulate import
    showNotification("BOQ Imported successfully! (Mock Action)", "success");
    setConfirmOpen(false);
  };

  const handleImport = () => {
    setConfirmAction(() => handleImportConfirm);
    setConfirmOpen(true);
  };

  // getItemHistory function is now defined globally before BOQRow

  const FinancialSummaryCard = ({ title, value, icon: Icon, color }: { title: string; value: string; icon: React.ElementType, color: string }) => (
    <Card sx={{ display: 'flex', alignItems: 'center', p: 2, height: '100%' }}>
        <Box sx={{ p: 1.5, borderRadius: '50%', mr: 2, color: `${color}.main`, background: (theme) => `${theme.palette[color].light}33` }}>
            <Icon size={24} />
        </Box>
        <Box>
            <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'medium' }}>{title}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{value}</Typography>
        </Box>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <div>
                    <Typography variant="h4" fontWeight="bold">Bill of Quantities (BOQ)</Typography>
                    <Typography variant="subtitle1" color="text.secondary">Financial Tracking & Billing</Typography>
                </div>
                <Box display="flex" gap={2}>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Typography variant="caption" display="block">VAT: <strong>{settings.vatRate}%</strong></Typography>
                        <Typography variant="caption" display="block">Currency: <strong>{settings.currency}</strong></Typography>
                    </Paper>
                    <Button variant="contained" color="primary" startIcon={<Upload size={18} />} onClick={handleImport}>
                        Import BOQ
                    </Button>
                </Box>
            </Box>
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}><FinancialSummaryCard title="Sum of PS" value={`${currencySymbol}${sumPS.toLocaleString()}`} icon={FileText} color="info" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><FinancialSummaryCard title="Sum (Other)" value={`${currencySymbol}${sumOther.toLocaleString()}`} icon={Hash} color="secondary" /></Grid>
        <Grid item xs={12} sm={6} lg={3}><FinancialSummaryCard title={`VAT (${settings.vatRate}%)`} value={`${currencySymbol}${vat.toLocaleString()}`} icon={BarChart2} color="warning" /></Grid>
        <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ p: 2, height: '100%', backgroundColor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center' }}>
                 <Box sx={{ p: 1.5, borderRadius: '50%', mr: 2, background: 'rgba(255,255,255,0.2)'}}>
                    <DollarSign size={24} />
                 </Box>
                 <Box>
                    <Typography variant="body2" sx={{ textTransform: 'uppercase', fontWeight: 'medium' }}>Total Value</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{currencySymbol}{totalProjectValue.toLocaleString()}</Typography>
                 </Box>
            </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: '60vh' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '10%' }}>Item No</TableCell>
                    <TableCell sx={{ width: '35%' }}>Description</TableCell>
                    <TableCell sx={{ width: '10%' }}>Unit</TableCell>
                    <TableCell align="right" sx={{ width: '10%' }}>Qty</TableCell>
                    <TableCell align="right" sx={{ width: '10%' }}>Rate</TableCell>
                    <TableCell align="right" sx={{ width: '15%', fontWeight: 'bold' }}>Total Amount</TableCell>
                    <TableCell align="right" sx={{ width: '10%' }}>Completed</TableCell>
                    <TableCell align="right" sx={{ width: '15%' }}>Work Done</TableCell>
                    <TableCell align="center" sx={{ width: '5%' }}>History</TableCell>
                    {canEdit && <TableCell align="center" sx={{ width: '5%' }}>Adjust</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {project.boq.map((item) => (
                    <BOQRow
                      key={item.id}
                      item={item}
                      currencySymbol={currencySymbol}
                      canEdit={canEdit}
                      editingId={editingId}
                      editVal={editVal}
                      setEditVal={setEditVal}
                      handleSave={handleSave}
                      handleEditClick={handleEditClick}
                      setHistoryModalItem={setHistoryModalItem}
                      project={project} // Pass project here
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>

      <Modal open={!!historyModalItem} onClose={() => setHistoryModalItem(null)}>
          <Card sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 700, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Item Work History</Typography>
                  <IconButton onClick={() => setHistoryModalItem(null)} aria-label="Close item work history dialog" size="small" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><X size={20}/></IconButton>
              </Box>
              <CardContent sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
                  <TableContainer>
                      <Table size="small" stickyHeader>
                          <TableHead>
                              <TableRow>
                                  <TableCell>Date</TableCell>
                                  <TableCell>Report No</TableCell>
                                  <TableCell>Location</TableCell>
                                  <TableCell align="right">Qty Added</TableCell>
                              </TableRow>
                          </TableHead>
                          <TableBody>
                              {historyModalItem && getItemHistory(historyModalItem, project).map((h, idx) => (
                                  <TableRow hover key={idx}>
                                      <TableCell>{h.date}</TableCell>
                                      <TableCell><Chip label={h.reportNo} size="small" color="primary" variant="outlined" /></TableCell>
                                      <TableCell>{h.location}</TableCell>
                                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'medium' }}>+{h.qty}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </TableContainer>
              </CardContent>
          </Card>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Import"
        message="Simulate importing 'BOQ_Data.xlsx'?"
        onConfirm={() => {
          confirmAction && confirmAction();
          setConfirmAction(null);
          setConfirmOpen(false);
        }}
        onCancel={() => {
          setConfirmAction(null);
          setConfirmOpen(false);
          showNotification("BOQ Import cancelled.", "info");
        }}
      />
    </Box>
  );
};

export default BOQManager;