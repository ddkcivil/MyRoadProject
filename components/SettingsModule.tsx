import React, { useState, useEffect, useContext } from 'react';
import { Save, CheckCircle, Bell, Mail, Calendar, AlertCircle } from 'lucide-react';
import { AppSettings } from '../types';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Switch,
    FormControlLabel,
    Divider,
    Paper
} from '@mui/material';
import { SettingsContext } from '../AuthAndSettingsContext'; // Import SettingsContext

interface Props {
  // settings: AppSettings; // Removed, now using context
  // onUpdate: (settings: AppSettings) => void; // Removed, now using context
}

const SettingsModule: React.FC<Props> = () => {
  const { settingsState, dispatchSettings } = useContext(SettingsContext); // Use SettingsContext
  const [formData, setFormData] = useState<AppSettings>(settingsState.appSettings); // Initialize with context state
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false); // Add loading state

  // Validation states
  const [companyNameError, setCompanyNameError] = useState('');
  const [vatRateError, setVatRateError] = useState('');
  const [fiscalYearStartError, setFiscalYearStartError] = useState('');

  useEffect(() => {
    setFormData(settingsState.appSettings); // Update form data when context settings change
  }, [settingsState.appSettings]);

  const validateForm = () => {
    let isValid = true;
    setCompanyNameError('');
    setVatRateError('');
    setFiscalYearStartError('');

    if (!formData.companyName.trim()) {
      setCompanyNameError('Company Name is required.');
      isValid = false;
    }

    if (isNaN(formData.vatRate) || formData.vatRate < 0 || formData.vatRate > 100) {
      setVatRateError('VAT Rate must be a number between 0 and 100.');
      isValid = false;
    }

    if (!formData.fiscalYearStart) {
      setFiscalYearStartError('Fiscal Year Start date is required.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true); // Set loading to true
    dispatchSettings({ type: 'UPDATE_SETTINGS', payload: formData }); // Dispatch UPDATE_SETTINGS action
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setLoading(false); // Set loading to false after timeout
    }, 2000);
  };

  return (
    <Box maxWidth="lg" mx="auto">
       <Box mb={3}>
          <Typography variant="h4" fontWeight="bold">System Settings</Typography>
          <Typography variant="subtitle1" color="text.secondary">Configure defaults for new projects</Typography>
        </Box>

      <Card component="form" onSubmit={handleSubmit}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Box>
                  <Typography variant="h6" gutterBottom>General Configuration</Typography>
                  <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                          <TextField 
                            label="Company Name" 
                            fullWidth 
                            required 
                            value={formData.companyName} 
                            onChange={e => setFormData({...formData, companyName: e.target.value})} 
                            onBlur={validateForm}
                            error={!!companyNameError}
                            helperText={companyNameError}
                          />
                      </Grid>
                      <Grid item xs={12} md={6}>
                          <FormControl fullWidth><InputLabel>Default Currency</InputLabel><Select label="Default Currency" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}><MenuItem value="USD">USD ($)</MenuItem><MenuItem value="NPR">NPR (Rs.)</MenuItem><MenuItem value="INR">INR (₹)</MenuItem></Select></FormControl>
                      </Grid>
                  </Grid>
              </Box>
              <Divider />
              <Box>
                  <Typography variant="h6" gutterBottom>Financial Defaults</Typography>
                  <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                          <TextField 
                            label="Default VAT Rate (%)" 
                            type="number" 
                            fullWidth 
                            required 
                            value={formData.vatRate} 
                            onChange={e => setFormData({...formData, vatRate: parseFloat(e.target.value)})} 
                            onBlur={validateForm}
                            error={!!vatRateError}
                            helperText={vatRateError}
                          />
                      </Grid>
                      <Grid item xs={12} md={6}>
                          <TextField 
                            label="Fiscal Year Start" 
                            type="date" 
                            fullWidth 
                            required 
                            InputLabelProps={{ shrink: true }} 
                            value={formData.fiscalYearStart} 
                            onChange={e => setFormData({...formData, fiscalYearStart: e.target.value})} 
                            onBlur={validateForm}
                            error={!!fiscalYearStartError}
                            helperText={fiscalYearStartError}
                          />
                      </Grid>
                  </Grid>
              </Box>
              <Divider />
              <Box>
                  <Typography variant="h6" gutterBottom>Notification Preferences</Typography>
                  <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Channels</Typography>
                              <FormControlLabel control={<Switch checked={formData.notifications.enableEmail} onChange={e => setFormData({...formData, notifications: {...formData.notifications, enableEmail: e.target.checked}})}/>} label="Email Notifications" />
                              <FormControlLabel control={<Switch checked={formData.notifications.enableInApp} onChange={e => setFormData({...formData, notifications: {...formData.notifications, enableInApp: e.target.checked}})}/>} label="In-App Alerts" />
                          </Paper>
                      </Grid>
                      <Grid item xs={12} md={6}>
                          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Rules & Triggers</Typography>
                              <FormControlLabel control={<Switch checked={formData.notifications.notifyUpcoming} onChange={e => setFormData({...formData, notifications: {...formData.notifications, notifyUpcoming: e.target.checked}})}/>} label="Upcoming Deadlines" />
                              {formData.notifications.notifyUpcoming && 
                                <TextField 
                                  size="small" 
                                  label="Days Before" 
                                  type="number" 
                                  value={formData.notifications.daysBefore} 
                                  onChange={e => setFormData({...formData, notifications: {...formData.notifications, daysBefore: parseInt(e.target.value) || 1}})} 
                                  sx={{ ml: 4, width: 150 }} 
                                  onBlur={validateForm} // Not strictly required, but good practice
                                  error={!!vatRateError} // Reusing vatRateError for simplicity, or add a dedicated one
                                  helperText={vatRateError ? 'Must be a number.' : ''}
                                />
                              }
                              <FormControlLabel control={<Switch checked={formData.notifications.notifyOverdue} onChange={e => setFormData({...formData, notifications: {...formData.notifications, notifyOverdue: e.target.checked}})}/>} label="Overdue Task Alerts" />
                              <FormControlLabel control={<Switch checked={formData.notifications.dailyDigest} onChange={e => setFormData({...formData, notifications: {...formData.notifications, dailyDigest: e.target.checked}})}/>} label="Daily Activity Digest" />
                          </Paper>
                      </Grid>
                  </Grid>
              </Box>
          </CardContent>
          <Divider />
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
              {saved && <Typography color="success.main" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CheckCircle size={16}/> Settings Saved</Typography>}
              <Button type="submit" variant="contained" startIcon={<Save />} disabled={loading}>Save Configuration</Button>
          </Box>
      </Card>
    </Box>
  );
};

export default SettingsModule;