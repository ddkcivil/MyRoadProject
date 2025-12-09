
import React, { useState, useRef } from 'react';
import { UserRole, Project, WorkCategory, BOQItem, AppSettings } from '../types';
import { Edit2, Save, AlertCircle, History, X, Upload, Calculator } from 'lucide-react';
import ExcelJS from 'exceljs';

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
  const [importError, setImportError] = useState<string | null>(null); // New state for import errors
  const [showFormatHelp, setShowFormatHelp] = useState(false); // New state for format help modal
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null); // Clear previous errors

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            throw new Error("No worksheets found in the Excel file. Please ensure the file contains at least one sheet with data.");
        }

        const json: any[] = [];
        const headerRow = worksheet.getRow(1);
        const headers: string[] = [];
        // Extract headers including empty cells to maintain column indexing
        headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const header = String(cell.text || '').trim().toLowerCase().replace(/\s+/g, '');
            headers[colNumber - 1] = header;
        });

        // Expected headers for validation (category is optional)
        const requiredHeaders = ['itemno', 'description', 'unit', 'quantity', 'rate'];
        const foundHeaders = headers.filter(h => h && requiredHeaders.includes(h));
        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
        if (missingHeaders.length > 0) {
            const foundHeaderNames = headers.filter(h => h).join(', ');
            throw new Error(`Missing required columns: ${missingHeaders.join(', ')}. Found headers: ${foundHeaderNames}. Please ensure your Excel file has columns named 'Item No', 'Description', 'Unit', 'Quantity', 'Rate' (case insensitive, spaces ignored).`);
        }


        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
                const rowData: any = {};
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const header = headers[colNumber - 1];
                    if (header) { // Only add data for columns with headers
                        rowData[header] = cell.text;
                    }
                });
                json.push(rowData);
            }
        });

        const newBoqItems: BOQItem[] = json.map((row, index) => {
          const unit = row.unit || '';
          // Default category from import, can be overridden
          let category = Object.values(WorkCategory).includes(row.category) ? row.category : WorkCategory.GENERAL;

          // If unit is 'ps', it's always a Provisional Sum item.
          if (unit.trim().toLowerCase() === 'ps') {
            category = WorkCategory.PROVISIONAL_SUM;
          }

          return {
            id: `boq-${Date.now()}-${index}`,
            itemNo: row.itemno || ``,
            description: row.description || '',
            unit: unit,
            quantity: parseFloat(String(row.quantity || '0').replace(/,/g, '')) || 0,
            rate: parseFloat(String(row.rate || '0').replace(/,/g, '')) || 0,
            category: category,
            completedQuantity: 0, 
          }
        });

        onProjectUpdate({ ...project, boq: newBoqItems });
        alert('BOQ data imported successfully!');
      } catch (error: any) {
        console.error("Error parsing Excel file:", error);
        setImportError(error.message || 'Failed to import BOQ data. Please check the file format.');
      }
    };
    reader.readAsArrayBuffer(file);

    // Reset file input
    if(fileInputRef.current) fileInputRef.current.value = '';
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
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".xlsx, .xls"
              aria-label="Import BOQ from Excel file"
            />
            <button
            onClick={() => setShowFormatHelp(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-colors"
            >
                <Upload size={18} /> Import from Excel
            </button>
        </div>
      </div>

      {importError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center gap-3" role="alert">
          <AlertCircle size={20} />
          <span className="block sm:inline">{importError}</span>
          <button onClick={() => setImportError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3 text-red-700" aria-label="Close error message">
            <X size={18} />
          </button>
        </div>
      )}

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
                            aria-label="Edit completed quantity"
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
                            aria-label="View Daily Report History"
                         >
                             <History size={18} />
                         </button>
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <button onClick={() => handleSave(item.id)} className="text-green-600 hover:bg-green-50 p-1 rounded transition-colors" title="Save Update" aria-label="Save Update">
                            <Save size={18} />
                          </button>
                        ) : (
                          <button onClick={() => handleEditClick(item.id, item.completedQuantity)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors" title="Manual Adjustment" aria-label="Manual Adjustment">
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
                      <button onClick={() => setHistoryModalItem(null)} className="text-slate-400 hover:text-slate-600" aria-label="Close history modal"><X size={20}/></button>
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

      {/* Format Help Modal */}
      {showFormatHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-700">Excel Import Format Guide</h3>
              <button onClick={() => setShowFormatHelp(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close format help modal"><X size={20}/></button>
            </div>
            <div className="p-6 text-sm text-slate-700">
              <p className="mb-4">Please ensure your Excel file for BOQ import has the following columns in the first row (case insensitive, spaces are ignored):</p>
              <table className="w-full text-left border-collapse mb-6">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border p-2">Header Name</th>
                    <th className="border p-2">Description</th>
                    <th className="border p-2">Example</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2 font-mono">Item No</td>
                    <td className="border p-2">Unique item number/code</td>
                    <td className="border p-2">2.01a, A-101</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-mono">Description</td>
                    <td className="border p-2">Detailed description of the work item</td>
                    <td className="border p-2">Site Clearance, Sub-grade Preparation</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-mono">Unit</td>
                    <td className="border p-2">Unit of measurement (e.g., sqm, cum, m, nos, PS)</td>
                    <td className="border p-2">sqm, PS</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-mono">Quantity</td>
                    <td className="border p-2">Total contracted quantity (number)</td>
                    <td className="border p-2">5000, 1200.5</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-mono">Rate</td>
                    <td className="border p-2">Cost per unit (number)</td>
                    <td className="border p-2">150, 800.75</td>
                  </tr>
                </tbody>
              </table>
              <p className="font-bold text-slate-800">Example Excel Data:</p>
              <div className="bg-slate-50 p-4 rounded-lg overflow-x-auto">
                <pre className="text-xs font-mono text-slate-600">
{`Item No,Description,Unit,Quantity,Rate
2.01a,Site Clearance and Grubbing,sqm,5000,150
3.05,Sub-grade Preparation,cum,1200,800
4.11,RCC Pipe Culvert 900mm,m,120,4500`}
                </pre>
              </div>
              <p className="text-xs text-slate-500 mt-2">Note: The 'Amount' column is optional and will be calculated automatically as Quantity × Rate.</p>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowFormatHelp(false);
                    handleImportClick();
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <Upload size={18} /> Proceed with Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BOQManager;
