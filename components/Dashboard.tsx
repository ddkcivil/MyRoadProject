
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, Line } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Package, AlertOctagon, MoreHorizontal, ArrowUpRight } from 'lucide-react';
import { Project, AppSettings } from '../types';
import { Box, Grid, Card, CardContent, Typography, LinearProgress, Paper, IconButton, Chip } from '@mui/material';
import StatCard from './StatCard';
import { useTheme } from '@mui/material/styles';

interface Props {
  project: Project;
  settings: AppSettings;
}

const Dashboard: React.FC<Props> = ({ project, settings }) => {
  const theme = useTheme();

  const {
    totalRFIs,
    openRFIs,
    totalTests,
    passRate,
    physicalProgress,
    totalStockValue,
    lowStockItems,
    totalItems,
    financialData,
    progressData,
    currencySymbol
  } = useMemo(() => {
    const totalRFIs = project.rfis.length;
    const openRFIs = project.rfis.filter(r => r.status === 'Open').length;
    const totalTests = project.labTests.length;
    const passedTests = project.labTests.filter(t => t.result === 'Pass').length;
    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    const totalValue = project.boq.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const completedValue = project.boq.reduce((acc, item) => acc + (item.completedQuantity * item.rate), 0);
    const physicalProgress = totalValue > 0 ? Math.round((completedValue / totalValue) * 100) : 0;

    const totalItems = project.inventory.length;
    const lowStockItems = project.inventory.filter(i => i.quantity < 10).length;
    const totalStockValue = project.inventory.reduce((acc, i) => acc + (i.quantity * 500), 0);

    const getCurrencySymbol = (code: string) => {
      switch(code) {
        case 'NPR': return 'Rs.';
        case 'INR': return '₹';
        default: return '$';
      }
    };
    const currencySymbol = getCurrencySymbol(settings.currency);

    const isProj1 = project.id === 'proj-001';
    const progressData = isProj1 ? [
      { name: 'Month 1', planned: 10, actual: 8 },
      { name: 'Month 2', planned: 25, actual: 20 },
      { name: 'Month 3', planned: 45, actual: 35 },
      { name: 'Month 4', planned: 60, actual: 50 },
      { name: 'Month 5', planned: 75, actual: 62 },
      { name: 'Month 6', planned: 90, actual: 80 },
    ] : [
      { name: 'Month 1', planned: 5, actual: 4 },
      { name: 'Month 2', planned: 15, actual: 10 },
      { name: 'Month 3', planned: 25, actual: 15 },
    ];

    const categories = Array.from(new Set(project.boq.map(b => b.category)));
    const financialData = categories.map(cat => ({
      name: cat,
      amount: project.boq.filter(b => b.category === cat).reduce((acc, b) => acc + (b.completedQuantity * b.rate), 0)
    }));

    return {
      totalRFIs,
      openRFIs,
      totalTests,
      passRate,
      physicalProgress,
      totalStockValue,
      lowStockItems,
      totalItems,
      financialData,
      progressData,
      passedTests,
      currencySymbol
    };
  }, [project, settings.currency]);


  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Overview Stats */}
      <Grid container spacing={4} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Physical Progress"
            value={`${physicalProgress}%`}
            subtext={
              <Box component="span" sx={{ color: 'success.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <ArrowUpRight size={14}/> On Track
              </Box>
            }
            icon={TrendingUp}
            gradient={`linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending RFIs"
            value={openRFIs}
            subtext={`${totalRFIs} Total Raised`}
            icon={Clock}
            gradient={`linear-gradient(135deg, ${theme.palette.warning.light} 0%, ${theme.palette.warning.main} 100%)`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Quality Control"
            value={`${passRate}%`}
            subtext={`${totalTests} of ${project.labTests.filter(t => t.result === 'Pass').length} Passed`}
            icon={CheckCircle}
            gradient={`linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Critical Delays"
            value={project.schedule.filter(s => s.status === 'Delayed').length}
            subtext="Items require attention"
            icon={AlertTriangle}
            gradient={`linear-gradient(135deg, ${theme.palette.error.light} 0%, ${theme.palette.error.main} 100%)`}
          />
        </Grid>
      </Grid>

      {/* Main Content Area */}
      <Grid container spacing={4} mb={4}>
         {/* Inventory Summary */}
         <Grid item xs={12} md={4}>
             <Paper sx={{
                 p: 3,
                 height: '100%',
                 background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                 color: 'white',
                 borderRadius: 4,
                 position: 'relative',
                 overflow: 'hidden',
                 boxShadow: `0 10px 20px -5px ${theme.palette.primary.light}`
             }}>
                 <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <div>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Store Inventory</Typography>
                            <Typography variant="h3" fontWeight="bold" my={1}>{totalItems}</Typography>
                            <Chip label="Items" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                        </div>
                        <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                             <Package size={32} />
                        </Box>
                    </Box>
                    <Box mt={4}>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Estimated Value</Typography>
                        <Typography variant="h6" fontWeight="bold">{currencySymbol}{totalStockValue.toLocaleString()}</Typography>
                    </Box>
                 </Box>

                 {/* Decorative Circles */}
                 <Box sx={{ position: 'absolute', top: -20, right: -20, width: 150, height: 150, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                 <Box sx={{ position: 'absolute', bottom: -40, left: -20, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
             </Paper>
         </Grid>

         {/* Low Stock Alert */}
         <Grid item xs={12} md={4}>
             <Card sx={{ height: '100%', border: lowStockItems > 0 ? `1px solid ${theme.palette.error.light}` : `1px solid ${theme.palette.success.light}`, bgcolor: lowStockItems > 0 ? `${theme.palette.error.light}22` : `${theme.palette.success.light}22` }}>
                 <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                     <Box display="flex" justifyContent="space-between" alignItems="center">
                         <Box>
                             <Typography variant="subtitle1" fontWeight="bold" color={lowStockItems > 0 ? 'error.main' : 'success.main'} gutterBottom>
                               {lowStockItems > 0 ? 'Restock Required' : 'Inventory Healthy'}
                             </Typography>
                             <Typography variant="h3" fontWeight="bold" color={lowStockItems > 0 ? 'error.dark' : 'success.dark'}>
                               {lowStockItems}
                             </Typography>
                             <Typography variant="caption" display="block" mt={0.5} color={lowStockItems > 0 ? 'error.main' : 'success.main'}>
                                {lowStockItems > 0 ? 'Items below threshold' : 'All items sufficiently stocked'}
                             </Typography>
                         </Box>
                         <Box sx={{color: lowStockItems > 0 ? theme.palette.error.light : theme.palette.success.light}}><AlertOctagon size={48} /></Box>
                     </Box>
                     {lowStockItems > 0 && (
                         <Box mt={2} pt={2} borderTop="1px dashed rgba(0,0,0,0.1)">
                             <Typography variant="caption" color="error.main" fontWeight="medium">Low: Diesel, Cement</Typography>
                         </Box>
                     )}
                 </CardContent>
             </Card>
         </Grid>

         {/* Fleet Status */}
         <Grid item xs={12} md={4}>
             <Card sx={{ height: '100%' }}>
                 <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                     <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">Fleet Active Status</Typography>
                        <IconButton size="small" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><MoreHorizontal size={16}/></IconButton>
                     </Box>

                     <Box mb={1}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption" fontWeight="bold">Active</Typography>
                            <Typography variant="caption">75%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={75} sx={{ height: 8, borderRadius: 5, bgcolor: 'grey.100', '& .MuiLinearProgress-bar': { bgcolor: 'success.main' } }} />
                     </Box>

                     <Box mt={2}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption" fontWeight="bold">Maintenance</Typography>
                            <Typography variant="caption">25%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={25} sx={{ height: 8, borderRadius: 5, bgcolor: 'grey.100', '& .MuiLinearProgress-bar': { bgcolor: 'warning.main' } }} />
                     </Box>
                 </CardContent>
             </Card>
         </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={4}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={1}>Project S-Curve</Typography>
              <Typography variant="caption" color="text.secondary" mb={3} display="block">Planned vs Actual Cumulative Progress</Typography>

              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={progressData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: theme.palette.text.secondary, fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: theme.palette.text.secondary, fontSize: 12}} />
                    <Tooltip
                      contentStyle={{ backgroundColor: theme.palette.background.paper, borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="planned" stroke={theme.palette.text.disabled} strokeWidth={2} strokeDasharray="5 5" name="Planned %" dot={false} />
                    <Area type="monotone" dataKey="actual" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#colorActual)" strokeWidth={3} name="Actual %" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={1}>Financial Overview</Typography>
              <Typography variant="caption" color="text.secondary" mb={3} display="block">Work Done Amount by Category</Typography>

              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={financialData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={theme.palette.divider} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 500}} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Amount']}
                      cursor={{fill: theme.palette.background.default}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="amount" fill={theme.palette.primary.main} radius={[0, 4, 4, 0]} barSize={24} name={`Amount (${currencySymbol})`} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
