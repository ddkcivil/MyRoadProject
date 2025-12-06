import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Package, AlertOctagon } from 'lucide-react';
import { Project, AppSettings } from '../types';

interface Props {
  project: Project;
  settings: AppSettings;
}

const Dashboard: React.FC<Props> = ({ project, settings }) => {
  // Compute real stats from project data
  const totalRFIs = project.rfis.length;
  const openRFIs = project.rfis.filter(r => r.status === 'Open').length;
  const totalTests = project.labTests.length;
  const passedTests = project.labTests.filter(t => t.result === 'Pass').length;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  const totalValue = project.boq.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
  const completedValue = project.boq.reduce((acc, item) => acc + (item.completedQuantity * item.rate), 0);
  const physicalProgress = totalValue > 0 ? Math.round((completedValue / totalValue) * 100) : 0;

  // Inventory stats
  const totalItems = project.inventory.length;
  const lowStockItems = project.inventory.filter(i => i.quantity < 10).length; // Mock low stock threshold
  const totalStockValue = project.inventory.reduce((acc, i) => acc + (i.quantity * 500), 0); // Mock rate 500/unit for visualization

  // Currency Helper
  const getCurrencySymbol = (code: string) => {
    switch(code) {
      case 'NPR': return 'Rs.';
      case 'INR': return '₹';
      default: return '$';
    }
  };
  const currencySymbol = getCurrencySymbol(settings.currency);

  // Mock chart data generation based on project ID (just to vary the visuals)
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

  // Group BOQ data for chart
  const categories = Array.from(new Set(project.boq.map(b => b.category)));
  const financialData = categories.map(cat => ({
    name: cat,
    amount: project.boq.filter(b => b.category === cat).reduce((acc, b) => acc + (b.completedQuantity * b.rate), 0)
  }));

  const StatCard = ({ title, value, trend, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        <span className="text-sm font-medium text-slate-500">{trend}</span>
      </div>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      <p className="text-sm text-slate-500 mt-1">{title}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Physical Progress" 
          value={`${physicalProgress}%`} 
          trend="Cumulative" 
          icon={TrendingUp} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Open RFIs" 
          value={openRFIs} 
          trend={`${totalRFIs} Total raised`} 
          icon={Clock} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Tests Passed" 
          value={`${passRate}%`} 
          trend={`${passedTests} / ${totalTests} Tests`} 
          icon={CheckCircle} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Pending Issues" 
          value={project.schedule.filter(s => s.status === 'Delayed').length} 
          trend="Delayed Tasks" 
          icon={AlertTriangle} 
          color="bg-rose-500" 
        />
      </div>
      
      {/* Inventory Summary Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-6 rounded-xl shadow-md flex items-center justify-between col-span-1">
             <div>
                 <p className="text-indigo-100 mb-1">Total Store Inventory</p>
                 <h3 className="text-3xl font-bold">{totalItems} <span className="text-lg font-normal opacity-75">Items</span></h3>
                 <p className="text-xs mt-2 bg-white/20 px-2 py-1 rounded inline-block">Est. Value: {currencySymbol}{totalStockValue.toLocaleString()}</p>
             </div>
             <Package size={48} className="text-indigo-300 opacity-50" />
         </div>
         <div className={`p-6 rounded-xl shadow-md flex items-center justify-between col-span-1 border ${lowStockItems > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
             <div>
                 <p className={`mb-1 font-medium ${lowStockItems > 0 ? 'text-red-700' : 'text-green-700'}`}>Low Stock Alerts</p>
                 <h3 className={`text-3xl font-bold ${lowStockItems > 0 ? 'text-red-800' : 'text-green-800'}`}>{lowStockItems}</h3>
                 <p className={`text-xs mt-2 opacity-75 ${lowStockItems > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {lowStockItems > 0 ? 'Restock immediately' : 'Inventory healthy'}
                 </p>
             </div>
             <AlertOctagon size={48} className={lowStockItems > 0 ? 'text-red-300' : 'text-green-300'} />
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 col-span-1 flex flex-col justify-center">
             <div className="text-sm text-slate-500 mb-2">Fleet Active Status</div>
             <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
                 <div className="h-full bg-emerald-500" style={{ width: '75%' }}></div>
             </div>
             <div className="flex justify-between text-xs text-slate-400">
                 <span>Active (75%)</span>
                 <span>Maintenance (25%)</span>
             </div>
         </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* S-Curve / Progress Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Planned vs Actual Progress (S-Curve)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="planned" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="Planned %" />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} name="Actual %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Financial Work Done (By Category)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={financialData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Amount']}
                  cursor={{fill: '#f1f5f9'}} 
                  contentStyle={{ borderRadius: '8px' }} 
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={30} name={`Amount (${currencySymbol})`} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;