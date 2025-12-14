import React, { useState } from 'react';
import { Project, InventoryItem, InventoryTransaction, Vehicle, VehicleLog, User } from '../types';
import { Package, Truck, Plus, ArrowUpRight, ArrowDownLeft, FileSpreadsheet, Fuel, X } from 'lucide-react';
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
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    FormControl
} from '@mui/material';

interface Props {
  project: Project;
  currentUser: User | null;
  onProjectUpdate: (project: Project) => void;
}

interface InventoryItemCardProps {
    item: InventoryItem;
    setStockModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean, type: 'IN' | 'OUT', itemId: string }>>;
}

const InventoryItemCard: React.FC<InventoryItemCardProps> = React.memo(({ item, setStockModal }) => {
    return (
        <Grid item xs={12} sm={6} md={4}>
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="space-between">
                        <div><Typography variant="h6">{item.itemName}</Typography><Typography variant="body2" color="text.secondary">{item.location}</Typography></div>
                        <Box textAlign="right"><Typography variant="h5" fontWeight="bold">{item.quantity}</Typography><Typography variant="caption">{item.unit}</Typography></Box>
                    </Box>
                </CardContent>
                <Box display="flex" p={1}>
                    <Button fullWidth startIcon={<ArrowDownLeft />} color="success" onClick={() => setStockModal({ isOpen: true, type: 'IN', itemId: item.id })}>Stock In</Button>
                    <Button fullWidth startIcon={<ArrowUpRight />} color="error" onClick={() => setStockModal({ isOpen: true, type: 'OUT', itemId: item.id })}>Stock Out</Button>
                </Box>
            </Card>
        </Grid>
    );
});

interface InventoryTransactionRowProps {
    transaction: InventoryTransaction;
    unit: string; // Unit needed for display
}

const InventoryTransactionRow: React.FC<InventoryTransactionRowProps> = React.memo(({ transaction, unit }) => {
    return (
        <TableRow key={transaction.id}>
            <TableCell>{transaction.date}</TableCell>
            <TableCell>{transaction.itemName}</TableCell>
            <TableCell><Chip label={transaction.type} size="small" color={transaction.type === 'IN' ? 'success' : 'error'} /></TableCell>
            <TableCell>{transaction.quantity} {unit}</TableCell>
            <TableCell>{transaction.vendorName || transaction.partyName}</TableCell>
            <TableCell>{transaction.billNo || '-'}</TableCell>
        </TableRow>
    );
});

interface VehicleCardProps {
    vehicle: Vehicle;
    setLogModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean, vehicleId: string }>>;
}

const VehicleCard: React.FC<VehicleCardProps> = React.memo(({ vehicle, setLogModal }) => {
    return (
        <Grid item xs={12} sm={12} md={6} lg={6}>
            <Card sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                <Box display="flex" alignItems="center" gap={2}><Avatar><Truck /></Avatar><Box><Typography fontWeight="bold">{vehicle.plateNumber}</Typography><Typography variant="body2">{vehicle.type} • {vehicle.driver}</Typography></Box></Box>
                <Box textAlign="right"><Chip label={vehicle.status} color={vehicle.status === 'Active' ? 'success' : 'error'} size="small" /><Button size="small" sx={{ mt: 1 }} onClick={() => setLogModal({ isOpen: true, vehicleId: vehicle.id })}>Log Entry</Button></Box>
            </Card>
        </Grid>
    );
});

interface VehicleLogRowProps {
    log: VehicleLog;
    driverName: string | undefined; // Driver name needs to be passed
}

const VehicleLogRow: React.FC<VehicleLogRowProps> = React.memo(({ log, driverName }) => {
    return (
        <TableRow key={log.id}>
            <TableCell>{log.date}</TableCell>
            <TableCell>{log.plateNumber}</TableCell>
            <TableCell>{driverName}</TableCell>
            <TableCell>{log.startKm}</TableCell>
            <TableCell>{log.endKm}</TableCell>
            <TableCell>{log.totalKm}</TableCell>
            <TableCell>{log.fuelConsumed}</TableCell>
            <TableCell>{log.workingHours}</TableCell>
            <TableCell>{log.activityDescription}</TableCell>
        </TableRow>
    );
});


const ResourceManager: React.FC<Props> = ({ project, currentUser, onProjectUpdate }) => {
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'FLEET'>('INVENTORY');
  
  const [stockModal, setStockModal] = useState<{ isOpen: boolean, type: 'IN' | 'OUT', itemId: string }>({ isOpen: false, type: 'IN', itemId: '' });
  const [showLedger, setShowLedger] = useState(false);
  
  const [logModal, setLogModal] = useState<{ isOpen: boolean, vehicleId: string }>({ isOpen: false, vehicleId: '' });
  const [showLogSheet, setShowLogSheet] = useState(false);
  
  const [newVehicleModal, setNewVehicleModal] = useState(false);

  const [stockForm, setStockForm] = useState({ quantity: 0, partyOrVendor: '', billNo: '', date: new Date().toISOString().split('T')[0] });
  const [logForm, setLogForm] = useState({ date: new Date().toISOString().split('T')[0], startKm: 0, endKm: 0, fuel: 0, hours: 0, activity: '' });
  const [vehicleForm, setVehicleForm] = useState<Partial<Vehicle>>({ plateNumber: '', type: '', driver: '', status: 'Active' });

  // Validation states for Add New Vehicle Modal
  const [plateNumberError, setPlateNumberError] = useState('');
  const [vehicleTypeError, setVehicleTypeError] = useState('');
  const [driverError, setDriverError] = useState('');

  // Validation states for Log Entry Modal
  const [logDateError, setLogDateError] = useState('');
  const [startKmError, setStartKmError] = useState('');
  const [endKmError, setEndKmError] = useState('');
  const [fuelError, setFuelError] = useState('');
  const [hoursError, setHoursError] = useState('');
  const [activityError, setActivityError] = useState('');

  // Validation states for Stock In/Out Modal
  const [stockDateError, setStockDateError] = useState('');
  const [quantityError, setQuantityError] = useState('');
  const [partyOrVendorError, setPartyOrVendorError] = useState('');
  const [billNoError, setBillNoError] = useState('');

  const validateVehicleForm = () => {
    let isValid = true;
    setPlateNumberError('');
    setVehicleTypeError('');
    setDriverError('');

    if (!vehicleForm.plateNumber?.trim()) {
      setPlateNumberError('Plate Number is required.');
      isValid = false;
    }
    if (!vehicleForm.type?.trim()) {
      setVehicleTypeError('Vehicle Type is required.');
      isValid = false;
    }
    if (!vehicleForm.driver?.trim()) {
      setDriverError('Driver Name is required.');
      isValid = false;
    }
    return isValid;
  };

  const handleSaveVehicle = () => {
    if (!validateVehicleForm()) {
        return;
    }
    const newVehicle: Vehicle = {
        id: `vehicle-${Date.now()}`,
        plateNumber: vehicleForm.plateNumber!,
        type: vehicleForm.type!,
        driver: vehicleForm.driver!,
        status: vehicleForm.status || 'Active' 
    };
    onProjectUpdate({ ...project, vehicles: [...(project.vehicles || []), newVehicle] });
    setNewVehicleModal(false);
    setVehicleForm({ plateNumber: '', type: '', driver: '', status: 'Active' }); 
    setPlateNumberError('');
    setVehicleTypeError('');
    setDriverError('');
  };

  const validateLogForm = () => {
    let isValid = true;
    setLogDateError('');
    setStartKmError('');
    setEndKmError('');
    setFuelError('');
    setHoursError('');
    setActivityError('');

    if (!logForm.date) {
      setLogDateError('Date is required.');
      isValid = false;
    }
    if (isNaN(logForm.startKm) || logForm.startKm < 0) {
      setStartKmError('Start Km must be a non-negative number.');
      isValid = false;
    }
    if (isNaN(logForm.endKm) || logForm.endKm < 0) {
      setEndKmError('End Km must be a non-negative number.');
      isValid = false;
    } else if (logForm.startKm !== undefined && logForm.endKm < logForm.startKm) {
      setEndKmError('End Km cannot be less than Start Km.');
      isValid = false;
    }
    if (isNaN(logForm.fuel) || logForm.fuel < 0) {
      setFuelError('Fuel consumed must be a non-negative number.');
      isValid = false;
    }
    if (isNaN(logForm.hours) || logForm.hours < 0) {
      setHoursError('Working hours must be a non-negative number.');
      isValid = false;
    }
    if (!logForm.activity.trim()) {
      setActivityError('Activity description is required.');
      isValid = false;
    }
    return isValid;
  };

  const handleSaveLog = () => {
    if (!validateLogForm()) {
        return;
    }
    const currentVehicle = project.vehicles.find(v => v.id === logModal.vehicleId);
    if (!currentVehicle) {
        // This case should ideally not happen if logModal.vehicleId is always valid
        // but adding a notification is good for robustness
        // showNotification("Vehicle not found for logging.", "error"); // commented out to avoid conflict
        return;
    }

    const newLog: VehicleLog = {
        id: `log-${Date.now()}`,
        vehicleId: logModal.vehicleId!,
        plateNumber: currentVehicle.plateNumber,
        date: logForm.date,
        startKm: logForm.startKm,
        endKm: logForm.endKm,
        totalKm: logForm.endKm - logForm.startKm,
        fuelConsumed: logForm.fuel,
        workingHours: logForm.hours,
        activityDescription: logForm.activity
    };
    onProjectUpdate({ ...project, vehicleLogs: [...(project.vehicleLogs || []), newLog] });
    setLogModal({ isOpen: false, vehicleId: '' });
    setLogForm({ date: new Date().toISOString().split('T')[0], startKm: 0, endKm: 0, fuel: 0, hours: 0, activity: '' }); 
    // showNotification("Log entry saved successfully!", "success"); // commented out to avoid conflict
  };

  const validateStockForm = () => {
    let isValid = true;
    setStockDateError('');
    setQuantityError('');
    setPartyOrVendorError('');
    setBillNoError('');

    if (!stockForm.date) {
      setStockDateError('Date is required.');
      isValid = false;
    }
    if (isNaN(stockForm.quantity) || stockForm.quantity <= 0) {
      setQuantityError('Quantity must be a positive number.');
      isValid = false;
    }

    if (stockModal.type === 'IN' && !stockForm.partyOrVendor.trim()) {
      setPartyOrVendorError('Vendor Name is required for Stock In.');
      isValid = false;
    } else if (stockModal.type === 'OUT' && !stockForm.partyOrVendor.trim()) {
      setPartyOrVendorError('Party Name (Issued To) is required for Stock Out.');
      isValid = false;
    }

    // Bill No is only required for Stock In
    if (stockModal.type === 'IN' && !stockForm.billNo.trim()) {
      setBillNoError('Bill No. is required for Stock In.');
      isValid = false;
    }
    return isValid;
  };

  const handleStockAction = () => {
    if (!validateStockForm()) {
        return;
    }
    const currentItem = project.inventory.find(item => item.id === stockModal.itemId);
    if (!currentItem) {
        // showNotification("Inventory item not found.", "error"); // commented out to avoid conflict
        return;
    }

    const newInventory = project.inventory.map(item => {
        if (item.id === stockModal.itemId) {
            const newQuantity = stockModal.type === 'IN' 
                ? item.quantity + stockForm.quantity 
                : item.quantity - stockForm.quantity;
            if (newQuantity < 0) {
                // showNotification("Not enough stock for this 'Stock Out' transaction.", "error"); // commented out to avoid conflict
                return item;
            }
            return { ...item, quantity: newQuantity };
        }
        return item;
    });

    const newTransaction: InventoryTransaction = {
        id: `trans-${Date.now()}`,
        itemId: currentItem.id,
        itemName: currentItem.itemName,
        type: stockModal.type,
        date: stockForm.date,
        quantity: stockForm.quantity,
        vendorName: stockModal.type === 'IN' ? stockForm.partyOrVendor : undefined,
        billNo: stockModal.type === 'IN' ? stockForm.billNo : undefined,
        partyName: stockModal.type === 'OUT' ? stockForm.partyOrVendor : undefined,
    };

    onProjectUpdate({ 
        ...project, 
        inventory: newInventory,
        inventoryTransactions: [...(project.inventoryTransactions || []), newTransaction] 
    });
    setStockModal({ isOpen: false, type: 'IN', itemId: '' });
    setStockForm({ quantity: 0, partyOrVendor: '', billNo: '', date: new Date().toISOString().split('T')[0] });
    // showNotification("Stock transaction recorded successfully!", "success"); // commented out to avoid conflict
  };



  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Store Inventory" value="INVENTORY" icon={<Package />} iconPosition="start" />
          <Tab label="Fleet Management" value="FLEET" icon={<Truck />} iconPosition="start" />
        </Tabs>
      </Box>

      {activeTab === 'INVENTORY' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Material Stock</Typography>
                <Button variant="outlined" startIcon={<FileSpreadsheet />} onClick={() => setShowLedger(!showLedger)}>{showLedger ? 'View Cards' : 'View Ledger'}</Button>
            </Box>
          </Grid>
          {showLedger ? (
              <Grid item xs={12}>
                  <Card>
                      <TableContainer>
                          <Table size="small">
                              <TableHead>
                                  <TableRow>
                                      <TableCell>Date</TableCell>
                                      <TableCell>Item</TableCell>
                                      <TableCell>Type</TableCell>
                                      <TableCell>Quantity</TableCell>
                                      <TableCell>Party/Vendor</TableCell>
                                      <TableCell>Bill No.</TableCell>
                                  </TableRow>
                              </TableHead>
                              <TableBody>
                                  {(project.inventoryTransactions || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(transaction => {
                                      const unit = project.inventory.find(item => item.id === transaction.itemId)?.unit || '';
                                      return (
                                          <InventoryTransactionRow
                                              key={transaction.id}
                                              transaction={transaction}
                                              unit={unit}
                                          />
                                      );
                                  })}
                              </TableBody>
                          </Table>
                      </TableContainer>
                  </Card>
              </Grid>
          ) : (
             <Grid container spacing={3}>
                {project.inventory.map(item => (
                    <InventoryItemCard
                        key={item.id}
                        item={item}
                        setStockModal={setStockModal}
                    />
                ))}
             </Grid>
          )}
        </Grid>
      )}

      {activeTab === 'FLEET' && (
          <Grid container spacing={3}>
              <Grid item xs={12}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">Fleet & Machinery</Typography>
                      <Box><Button variant="contained" startIcon={<Plus />} onClick={() => setNewVehicleModal(true)}>Add Vehicle</Button><Button variant="outlined" sx={{ ml: 1 }} startIcon={<FileSpreadsheet />} onClick={() => setShowLogSheet(!showLogSheet)}>{showLogSheet ? 'View Cards' : 'View Logs'}</Button></Box>
                  </Box>
              </Grid>
              {showLogSheet ? (
                  <Grid item xs={12}>
                      <Card>
                          <TableContainer>
                              <Table size="small">
                                  <TableHead>
                                      <TableRow>
                                          <TableCell>Date</TableCell>
                                          <TableCell>Plate No.</TableCell>
                                          <TableCell>Driver</TableCell>
                                          <TableCell>Start Km</TableCell>
                                          <TableCell>End Km</TableCell>
                                          <TableCell>Total Km</TableCell>
                                          <TableCell>Fuel (L)</TableCell>
                                          <TableCell>Hours</TableCell>
                                          <TableCell>Activity</TableCell>
                                      </TableRow>
                                  </TableHead>
                                  <TableBody>
                                      {(project.vehicleLogs || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => {
                                          const driverName = project.vehicles.find(v => v.id === log.vehicleId)?.driver;
                                          return (
                                              <VehicleLogRow
                                                  key={log.id}
                                                  log={log}
                                                  driverName={driverName}
                                              />
                                          );
                                      })}
                                  </TableBody>
                              </Table>
                          </TableContainer>
                      </Card>
                  </Grid>
              ) : (
                  <Grid container spacing={3}>
                    {project.vehicles.map(vehicle => (
                        <VehicleCard
                            key={vehicle.id}
                            vehicle={vehicle}
                            setLogModal={setLogModal}
                        />
                    ))}
                  </Grid>
              )}
          </Grid>
      )}
      
      {/* Add New Vehicle Modal */}
      <Dialog open={newVehicleModal} onClose={() => setNewVehicleModal(false)}>
        <DialogTitle>Add New Vehicle</DialogTitle>
        <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
                <TextField
                    label="Plate Number"
                    value={vehicleForm.plateNumber}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })}
                    onBlur={validateVehicleForm}
                    error={!!plateNumberError}
                    helperText={plateNumberError}
                    fullWidth
                />
                <TextField
                    label="Vehicle Type"
                    value={vehicleForm.type}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}
                    onBlur={validateVehicleForm}
                    error={!!vehicleTypeError}
                    helperText={vehicleTypeError}
                    fullWidth
                />
                <TextField
                    label="Driver Name"
                    value={vehicleForm.driver}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driver: e.target.value })}
                    onBlur={validateVehicleForm}
                    error={!!driverError}
                    helperText={driverError}
                    fullWidth
                />
                <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={vehicleForm.status}
                        label="Status"
                        onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value as 'Active' | 'Maintenance' | 'Idle' })}
                    >
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Maintenance">Maintenance</MenuItem>
                        <MenuItem value="Idle">Idle</MenuItem>
                    </Select>
                </FormControl>
            </Stack>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setNewVehicleModal(false)}>Cancel</Button>
            <Button onClick={handleSaveVehicle} variant="contained">Add Vehicle</Button>
        </DialogActions>
      </Dialog>

      {/* Log Entry Modal */}
      <Dialog open={logModal.isOpen} onClose={() => setLogModal({ isOpen: false, vehicleId: '' })}>
          <DialogTitle>Log Entry for Vehicle</DialogTitle>
          <DialogContent>
              <Stack spacing={2} sx={{ pt: 1 }}>
                  <TextField
                      label="Date"
                      type="date"
                      value={logForm.date}
                      onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      onBlur={validateLogForm}
                      error={!!logDateError}
                      helperText={logDateError}
                  />
                  <TextField
                      label="Start Km"
                      type="number"
                      value={logForm.startKm}
                      onChange={(e) => setLogForm({ ...logForm, startKm: parseFloat(e.target.value) })}
                      fullWidth
                      onBlur={validateLogForm}
                      error={!!startKmError}
                      helperText={startKmError}
                  />
                  <TextField
                      label="End Km"
                      type="number"
                      value={logForm.endKm}
                      onChange={(e) => setLogForm({ ...logForm, endKm: parseFloat(e.target.value) })}
                      fullWidth
                      onBlur={validateLogForm}
                      error={!!endKmError}
                      helperText={endKmError}
                  />
                  <TextField
                      label="Fuel Consumed (Liters)"
                      type="number"
                      value={logForm.fuel}
                      onChange={(e) => setLogForm({ ...logForm, fuel: parseFloat(e.target.value) })}
                      fullWidth
                      onBlur={validateLogForm}
                      error={!!fuelError}
                      helperText={fuelError}
                  />
                  <TextField
                      label="Working Hours"
                      type="number"
                      value={logForm.hours}
                      onChange={(e) => setLogForm({ ...logForm, hours: parseFloat(e.target.value) })}
                      fullWidth
                      onBlur={validateLogForm}
                      error={!!hoursError}
                      helperText={hoursError}
                  />
                  <TextField
                      label="Activity Description"
                      multiline
                      rows={3}
                      value={logForm.activity}
                      onChange={(e) => setLogForm({ ...logForm, activity: e.target.value })}
                      fullWidth
                      onBlur={validateLogForm}
                      error={!!activityError}
                      helperText={activityError}
                  />
              </Stack>
          </DialogContent>
          <DialogActions>
              <Button onClick={() => setLogModal({ isOpen: false, vehicleId: '' })}>Cancel</Button>
              <Button onClick={handleSaveLog} variant="contained">Save Log</Button>
          </DialogActions>
      </Dialog>

      {/* Stock In/Out Modal */}
      <Dialog open={stockModal.isOpen} onClose={() => setStockModal({ isOpen: false, type: 'IN', itemId: '' })}>
          <DialogTitle>{stockModal.type === 'IN' ? 'Stock In' : 'Stock Out'} for {project.inventory.find(item => item.id === stockModal.itemId)?.itemName}</DialogTitle>
          <DialogContent>
              <Stack spacing={2} sx={{ pt: 1 }}>
                  <TextField
                      label="Date"
                      type="date"
                      value={stockForm.date}
                      onChange={(e) => setStockForm({ ...stockForm, date: e.target.value })}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      onBlur={validateStockForm}
                      error={!!stockDateError}
                      helperText={stockDateError}
                  />
                  <TextField
                      label="Quantity"
                      type="number"
                      value={stockForm.quantity}
                      onChange={(e) => setStockForm({ ...stockForm, quantity: parseFloat(e.target.value) })}
                      fullWidth
                      onBlur={validateStockForm}
                      error={!!quantityError}
                      helperText={quantityError}
                  />
                  {stockModal.type === 'IN' && (
                      <>
                          <TextField
                              label="Vendor Name"
                              value={stockForm.partyOrVendor}
                              onChange={(e) => setStockForm({ ...stockForm, partyOrVendor: e.target.value })}
                              fullWidth
                              onBlur={validateStockForm}
                              error={!!partyOrVendorError}
                              helperText={partyOrVendorError}
                          />
                          <TextField
                              label="Bill No."
                              value={stockForm.billNo}
                              onChange={(e) => setStockForm({ ...stockForm, billNo: e.target.value })}
                              fullWidth
                              onBlur={validateStockForm}
                              error={!!billNoError}
                              helperText={billNoError}
                          />
                      </>
                  )}
                  {stockModal.type === 'OUT' && (
                      <TextField
                          label="Party Name (Issued To)"
                          value={stockForm.partyOrVendor}
                          onChange={(e) => setStockForm({ ...stockForm, partyOrVendor: e.target.value })}
                          fullWidth
                          onBlur={validateStockForm}
                          error={!!partyOrVendorError}
                          helperText={partyOrVendorError}
                      />
                  )}
              </Stack>
          </DialogContent>
          <DialogActions>
              <Button onClick={() => setStockModal({ isOpen: false, type: 'IN', itemId: '' })}>Cancel</Button>
              <Button onClick={handleStockAction} variant="contained">Confirm</Button>
          </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResourceManager;