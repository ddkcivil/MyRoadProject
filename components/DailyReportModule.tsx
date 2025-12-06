
import React, { useState } from 'react';
import { Project, UserRole, DailyReport, DailyWorkItem } from '../types';
import { FileText, Plus, Calendar, MapPin, Hash, CheckCircle, ArrowRight, Link as LinkIcon } from 'lucide-react';

interface Props {
  project: Project;
  userRole: UserRole;
  onProjectUpdate: (project: Project) => void;
}

const DailyReportModule: React.FC<Props> = ({ project, userRole, onProjectUpdate }) => {
  const [view, setView] = useState<'LIST' | 'CREATE'>('LIST');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State for creating a new report
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
    
    const finalItem = { ...currentWorkItem };
    if (currentLink) {
        finalItem.links = [...(finalItem.links || []), currentLink];
    }

    setWorkItems([...workItems, { ...finalItem, id: `item-${Date.now()}` }]);
    setCurrentWorkItem({
      boqItemId: '',
      location: '',
      quantity: 0,
      description: '',
      links: []
    });
    setCurrentLink('');
  };

  const handleSubmitReport = () => {
    if (workItems.length === 0) return;

    const newReport: DailyReport = {
      id: `dpr-${Date.now()}`,
      date: reportDate,
      reportNumber: `DPR-${reportDate}`,
      items: workItems as DailyWorkItem[],
      status: 'Approved', // Auto-approve for this demo to immediately reflect in BOQ
      submittedBy: userRole
    };

    // 1. Update BOQ Quantities
    const updatedBoq = project.boq.map(boqItem => {
      const reportItemsForBoq = workItems.filter(wi => wi.boqItemId === boqItem.id);
      const totalAdded = reportItemsForBoq.reduce((sum, wi) => sum + (wi.quantity || 0), 0);
      
      if (totalAdded > 0) {
        return { ...boqItem, completedQuantity: boqItem.completedQuantity + totalAdded };
      }
      return boqItem;
    });

    // 2. Update Project
    onProjectUpdate({
      ...project,
      boq: updatedBoq,
      dailyReports: [newReport, ...project.dailyReports]
    });

    setView('LIST');
    setWorkItems([]);
  };

  const renderCreateView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">New Daily Progress Report</h3>
          <p className="text-xs text-slate-500">Enter executed quantities for today</p>
        </div>
        <input 
          type="date" 
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Add Item Form */}
        <div className="lg:col-span-1 space-y-4 border-r border-slate-100 pr-6">
          <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-blue-600"/> Add Work Item
          </h4>
          
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">BOQ Item</label>
            <select 
              value={currentWorkItem.boqItemId}
              onChange={(e) => setCurrentWorkItem({...currentWorkItem, boqItemId: e.target.value})}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Item...</option>
              {project.boq.map(b => (
                <option key={b.id} value={b.id}>{b.itemNo} - {b.description.substring(0, 40)}...</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Location / Chainage</label>
            <div className="flex items-center gap-2">
               <MapPin size={16} className="text-slate-400" />
               <input 
                 type="text" 
                 placeholder="e.g. 10+200 to 10+400"
                 value={currentWorkItem.location}
                 onChange={(e) => setCurrentWorkItem({...currentWorkItem, location: e.target.value})}
                 className="flex-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
               />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Quantity Executed</label>
            <div className="flex items-center gap-2">
               <Hash size={16} className="text-slate-400" />
               <input 
                 type="number" 
                 placeholder="0.00"
                 value={currentWorkItem.quantity || ''}
                 onChange={(e) => setCurrentWorkItem({...currentWorkItem, quantity: parseFloat(e.target.value)})}
                 className="flex-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
               />
            </div>
          </div>

          <div>
             <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Associated Link / Evidence</label>
             <div className="flex items-center gap-2">
               <LinkIcon size={16} className="text-slate-400" />
               <input 
                 type="text" 
                 placeholder="e.g. Drive URL / Photo Link"
                 value={currentLink}
                 onChange={(e) => setCurrentLink(e.target.value)}
                 className="flex-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
               />
             </div>
             <p className="text-[10px] text-slate-400 mt-1">Add links to site photos or measurement sheets.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Remarks</label>
            <textarea 
               rows={2}
               placeholder="Brief description of work..."
               value={currentWorkItem.description}
               onChange={(e) => setCurrentWorkItem({...currentWorkItem, description: e.target.value})}
               className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button 
            onClick={handleAddItem}
            disabled={!currentWorkItem.boqItemId || !currentWorkItem.quantity}
            className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Entry
          </button>
        </div>

        {/* Right: List of added items */}
        <div className="lg:col-span-2 flex flex-col">
           <h4 className="font-semibold text-slate-700 mb-4">Items in Report ({workItems.length})</h4>
           
           <div className="flex-1 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mb-6">
              {workItems.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-sm">
                   <FileText size={32} className="mb-2 opacity-20" />
                   No items added yet
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2">Item No</th>
                      <th className="px-4 py-2">Location</th>
                      <th className="px-4 py-2 text-right">Qty</th>
                      <th className="px-4 py-2">Links</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {workItems.map((item, idx) => {
                      const boqItem = project.boq.find(b => b.id === item.boqItemId);
                      return (
                        <tr key={idx} className="bg-white">
                          <td className="px-4 py-2 font-medium text-slate-700">
                            {boqItem?.itemNo}
                            <div className="text-xs text-slate-400 font-normal truncate w-32">{boqItem?.description}</div>
                          </td>
                          <td className="px-4 py-2 text-slate-600">{item.location}</td>
                          <td className="px-4 py-2 text-right font-mono">{item.quantity}</td>
                          <td className="px-4 py-2 text-slate-500 italic">
                              {item.links && item.links.length > 0 ? (
                                <span className="text-blue-600 flex items-center gap-1"><LinkIcon size={12}/> {item.links.length} Linked</span>
                              ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
           </div>

           <div className="flex justify-end gap-3">
             <button onClick={() => setView('LIST')} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">
               Cancel
             </button>
             <button 
               onClick={handleSubmitReport}
               disabled={workItems.length === 0}
               className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg shadow-green-200 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <CheckCircle size={18} /> Submit & Update BOQ
             </button>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Daily Work Program & Reports</h2>
          <p className="text-slate-500 text-sm">Track daily progress and update BOQ quantities.</p>
        </div>
        {view === 'LIST' && (
          <button 
            onClick={() => setView('CREATE')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Plus size={18} />
            New Daily Report
          </button>
        )}
      </div>

      {view === 'CREATE' && renderCreateView()}

      {view === 'LIST' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           {project.dailyReports.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                 No daily reports submitted yet. Start by creating a new one.
              </div>
           ) : (
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                 <tr>
                   <th className="px-6 py-4">Date</th>
                   <th className="px-6 py-4">Report No</th>
                   <th className="px-6 py-4">Items Count</th>
                   <th className="px-6 py-4">Submitted By</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4 text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {project.dailyReports.map((report) => (
                   <tr key={report.id} className="hover:bg-slate-50">
                     <td className="px-6 py-4 text-slate-700 font-medium flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" /> {report.date}
                     </td>
                     <td className="px-6 py-4 text-slate-600 font-mono text-xs">{report.reportNumber}</td>
                     <td className="px-6 py-4 text-slate-600">
                       <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{report.items.length}</span>
                     </td>
                     <td className="px-6 py-4 text-slate-600">{report.submittedBy}</td>
                     <td className="px-6 py-4">
                       <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                         <CheckCircle size={12} /> {report.status}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <button className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1 justify-end">
                          View Details <ArrowRight size={14} />
                        </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
        </div>
      )}
    </div>
  );
};

export default DailyReportModule;
