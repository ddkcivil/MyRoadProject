
import React, { useState } from 'react';
import { UserRole, Project, WorkCategory, BOQItem, AppSettings } from '../types';
import { Edit2, Save, AlertCircle, History, X, Upload, Calculator } from 'lucide-react';

interface Props {
  userRole: UserRole;
  project: Project;
  settings: AppSettings;
  onProjectUpdate: (project: Project) => void;
}

const BOQManager: React.FC<Props> = ({ userRole, project, settings, onProjectUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState<number>(0);
  const [historyModalItem, setHistoryModalItem] = useState<string | null>(null);
  
  // Permission check: Only PM and Site Engineer can update progress
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

  // --- Financial Calculations ---
  const psItems = project.boq.filter(item => item.category === WorkCategory.PROVISIONAL_SUM);
  const nonPsItems = project.boq.filter(item => item.category !== WorkCategory.PROVISIONAL_SUM);

  const sumPS = psItems.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
  const sumOther = nonPsItems.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
  // Use VAT Rate from Settings
  const vat = sumOther * (settings.vatRate / 100);
  const totalProjectValue = sumPS + sumOther + vat;

  const completedValue = project.boq.reduce((acc, item) => acc + (item.completedQuantity * item.rate), 0);

  // --- Dummy Import ---
  const handleImport = () => {
      const confirmImport = window.confirm("Simulate importing 'BOQ_Data.xlsx'?");
      if(confirmImport) {
          alert("BOQ Imported successfully! (Mock Action)");
          // Logic to parse file would go here
      }
  };

  // Get history for a specific item
  const getItemHistory = (boqItemId: string) => {
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

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Bill of Quantities (BOQ)</h2>
          <p className="text-slate-500 text-sm">Financial Tracking & Billing</p>
        </div>
        <div className="flex gap-2">
            <div className="bg-slate-100 px-3 py-2 rounded text-xs text-slate-500 font-medium flex flex-col items-end">
                <span>VAT: {settings.vatRate}%</span>
                <span>Currency: {settings.currency}</span>
            </div>
            <button 
            onClick={handleImport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-colors"
            >
                <Upload size={18} /> Import from Excel
            </button>
        </div>
      </div>

      {/* Financial Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="p-2">
              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Sum of PS (Provisional Sum)</div>
              <div className="text-xl font-mono font-medium text-slate-800">{currencySymbol}{sumPS.toLocaleString()}</div>
          </div>
          <div className="p-2">
              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Sum (Other than PS)</div>
              <div className="text-xl font-mono font-medium text-slate-800">{currencySymbol}{sumOther.toLocaleString()}</div>
          </div>
          <div className="p-2 bg-slate-50/50">
              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">VAT ({settings.vatRate}% of Non-PS)</div>
              <div className="text-xl font-mono font-medium text-slate-600">{currencySymbol}{vat.toLocaleString()}</div>
          </div>
          <div className="p-2 bg-blue-50/50 text-blue-900 rounded-r-lg">
              <div className="text-xs text-blue-500 uppercase font-bold mb-1">Total Project Value</div>
              <div className="text-2xl font-mono font-bold">{currencySymbol}{totalProjectValue.toLocaleString()}</div>
          </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Item No</th>
                <th className="px-6 py-4 w-1/3">Description</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4 text-right">Qty</th>
                <th className="px-6 py-4 text-right">Rate</th>
                <th className="px-6 py-4 text-right bg-slate-100">Total Amount</th>
                <th className="px-6 py-4 text-right">Completed</th>
                <th className="px-6 py-4 text-right">Work Done ({currencySymbol})</th>
                <th className="px-6 py-4 text-right">History</th>
                {canEdit && <th className="px-6 py-4 text-right">Adjust</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {project.boq.map((item) => {
                const totalAmt = item.quantity * item.rate;
                const workDoneAmt = item.completedQuantity * item.rate;
                const isEditing = editingId === item.id;
                const hasHistory = getItemHistory(item.id).length > 0;
                const isPS = item.category === WorkCategory.PROVISIONAL_SUM;
                
                return (
                  <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isPS ? 'bg-yellow-50/30' : ''}`}>
                    <td className="px-6 py-4 font-medium text-slate-700">{item.itemNo}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <div>{item.description}</div>
                      <span className="text-xs text-slate-400 inline-block mt-1 px-2 py-0.5 bg-slate-100 rounded-full">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{item.unit}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-600">{item.quantity.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-600">{item.rate.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-slate-800 bg-slate-50">
                        {totalAmt.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <input 
                            type="number" 
                            value={editVal}
                            onChange={(e) => setEditVal(Number(e.target.value))}
                            className="w-24 text-right border border-blue-400 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                      ) : (
                        <span className="font-mono font-medium text-blue-600">{item.completedQuantity.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-600">
                      {workDoneAmt.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                         <button 
                            onClick={() => setHistoryModalItem(item.id)}
                            className={`p-1.5 rounded-full transition-colors ${hasHistory ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-300 cursor-not-allowed'}`}
                            disabled={!hasHistory}
                            title="View Daily Report History"
                         >
                             <History size={18} />
                         </button>
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <button onClick={() => handleSave(item.id)} className="text-green-600 hover:bg-green-50 p-1 rounded transition-colors" title="Save Update">
                            <Save size={18} />
                          </button>
                        ) : (
                          <button onClick={() => handleEditClick(item.id, item.completedQuantity)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors" title="Manual Adjustment">
                            <Edit2 size={16} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {historyModalItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-700">Item History</h3>
                      <button onClick={() => setHistoryModalItem(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>
                  <div className="p-0 max-h-[60vh] overflow-y-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 text-xs uppercase sticky top-0">
                              <tr>
                                  <th className="px-6 py-3">Date</th>
                                  <th className="px-6 py-3">Report No</th>
                                  <th className="px-6 py-3">Location</th>
                                  <th className="px-6 py-3 text-right">Qty Added</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {getItemHistory(historyModalItem).map((h, idx) => (
                                  <tr key={idx}>
                                      <td className="px-6 py-3 text-slate-600">{h.date}</td>
                                      <td className="px-6 py-3 font-mono text-xs text-blue-600">{h.reportNo}</td>
                                      <td className="px-6 py-3 text-slate-600">{h.location}</td>
                                      <td className="px-6 py-3 text-right font-medium text-green-600">+{h.qty}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default BOQManager;
