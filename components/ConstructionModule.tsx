
import React, { useState } from 'react';
import { Project, WorkCategory, UserRole, DailyReport, DailyWorkItem } from '../types';
import { Hammer, TrendingUp, AlertTriangle, CheckCircle, Plus, X } from 'lucide-react';

interface Props {
  project: Project;
  userRole: UserRole;
  onProjectUpdate: (project: Project) => void;
}

const ConstructionModule: React.FC<Props> = ({ project, userRole, onProjectUpdate }) => {
  const [activeTab, setActiveTab] = useState<WorkCategory>(WorkCategory.STRUCTURES);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedBoqItem, setSelectedBoqItem] = useState<string | null>(null);
  
  // Progress Form State
  const [progressForm, setProgressForm] = useState({
      date: new Date().toISOString().split('T')[0],
      location: '',
      quantity: 0,
      description: ''
  });

  const constructionCategories = [
      { id: WorkCategory.STRUCTURES, label: 'Structures' },
      { id: WorkCategory.PAVEMENT, label: 'Pavement' },
      { id: WorkCategory.DRAINAGE, label: 'Drainage' },
      { id: WorkCategory.FOOTPATH, label: 'Footpath' },
      { id: WorkCategory.FURNITURE, label: 'Road Furniture' },
      { id: WorkCategory.EARTHWORK, label: 'Earthwork' }, // Including Earthwork as base
  ];

  // Filter BOQ items based on selected category
  const filteredItems = project.boq.filter(item => item.category === activeTab);

  const handleOpenUpdate = (boqItemId: string) => {
      setSelectedBoqItem(boqItemId);
      setProgressForm({
          date: new Date().toISOString().split('T')[0],
          location: '',
          quantity: 0,
          description: ''
      });
      setIsUpdateModalOpen(true);
  };

  const handleSubmitProgress = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedBoqItem) return;

      const boqItem = project.boq.find(b => b.id === selectedBoqItem);
      if (!boqItem) return;

      const qtyToAdd = Number(progressForm.quantity);

      // 1. Create a Daily Work Item
      const workItem: DailyWorkItem = {
          id: `dw-${Date.now()}`,
          boqItemId: selectedBoqItem,
          location: progressForm.location,
          quantity: qtyToAdd,
          description: progressForm.description || `Construction update for ${boqItem.itemNo}`,
          links: []
      };

      // 2. Create a Daily Report (Auto-approved for simplicity in this flow)
      const newReport: DailyReport = {
          id: `dpr-constr-${Date.now()}`,
          date: progressForm.date,
          reportNumber: `DPR-C-${Date.now().toString().slice(-6)}`,
          status: 'Approved',
          submittedBy: userRole,
          items: [workItem]
      };

      // 3. Update BOQ Quantity
      const updatedBoq = project.boq.map(item => 
          item.id === selectedBoqItem 
          ? { ...item, completedQuantity: item.completedQuantity + qtyToAdd }
          : item
      );

      // 4. Update Project
      onProjectUpdate({
          ...project,
          boq: updatedBoq,
          dailyReports: [newReport, ...project.dailyReports]
      });

      setIsUpdateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Construction Monitoring</h2>
          <p className="text-slate-500 text-sm">Track physical progress of structures and road works</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 border-b border-slate-200">
          {constructionCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`
                   px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors
                   ${activeTab === cat.id 
                     ? 'bg-blue-600 text-white shadow-sm' 
                     : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200'}
                `}
              >
                  {cat.label}
              </button>
          ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                  <Hammer size={48} className="mx-auto mb-3 opacity-20" />
                  <p>No BOQ items found for {activeTab}.</p>
              </div>
          ) : (
              filteredItems.map(item => {
                  const percentage = Math.min(100, Math.round((item.completedQuantity / item.quantity) * 100));
                  const isCompleted = percentage >= 100;
                  const isOverLimit = item.completedQuantity > item.quantity;
                  
                  return (
                      <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col hover:border-blue-300 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                              <span className="bg-slate-100 text-slate-600 font-mono text-xs px-2 py-0.5 rounded">{item.itemNo}</span>
                              {isCompleted ? (
                                  <span className="text-green-600 flex items-center gap-1 text-xs font-bold"><CheckCircle size={14}/> Done</span>
                              ) : (
                                  <span className="text-blue-600 flex items-center gap-1 text-xs font-bold"><TrendingUp size={14}/> In Progress</span>
                              )}
                          </div>
                          
                          <h3 className="font-semibold text-slate-800 text-sm mb-3 line-clamp-2 min-h-[40px]" title={item.description}>
                              {item.description}
                          </h3>

                          <div className="space-y-3 flex-1">
                              <div className="flex justify-between text-xs text-slate-500">
                                  <span>Progress</span>
                                  <span className="font-medium text-slate-700">{percentage}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${isOverLimit ? 'bg-red-500' : isCompleted ? 'bg-green-500' : 'bg-blue-600'}`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3 mt-auto">
                                  <div>
                                      <div className="text-slate-400">Scope</div>
                                      <div className="font-mono font-medium">{item.quantity} {item.unit}</div>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-slate-400">Completed</div>
                                      <div className={`font-mono font-medium ${isOverLimit ? 'text-red-600' : 'text-slate-800'}`}>
                                          {item.completedQuantity} {item.unit}
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <button 
                             onClick={() => handleOpenUpdate(item.id)}
                             disabled={isCompleted && !isOverLimit}
                             className="mt-4 w-full py-2 bg-slate-50 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 hover:border-blue-200 transition-all"
                          >
                              <Plus size={14} /> Update Progress
                          </button>
                          
                          {isOverLimit && (
                              <div className="mt-2 text-[10px] text-red-500 flex items-center gap-1">
                                  <AlertTriangle size={12} /> Quantity exceeds BOQ scope!
                              </div>
                          )}
                      </div>
                  );
              })
          )}
      </div>

      {/* Update Progress Modal */}
      {isUpdateModalOpen && selectedBoqItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 text-lg">Update Construction Work</h3>
                      <button onClick={() => setIsUpdateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>
                  
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                      <strong>Item:</strong> {project.boq.find(b => b.id === selectedBoqItem)?.itemNo} <br/>
                      <span className="opacity-75">{project.boq.find(b => b.id === selectedBoqItem)?.description.substring(0, 60)}...</span>
                  </div>

                  <form onSubmit={handleSubmitProgress} className="space-y-4">
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                          <input 
                            type="date" required 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            value={progressForm.date}
                            onChange={e => setProgressForm({...progressForm, date: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Work Location</label>
                          <input 
                            type="text" required placeholder="e.g. Ch 12+500 RHS"
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            value={progressForm.location}
                            onChange={e => setProgressForm({...progressForm, location: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Quantity Done Today</label>
                          <input 
                            type="number" required step="0.01"
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            value={progressForm.quantity || ''}
                            onChange={e => setProgressForm({...progressForm, quantity: parseFloat(e.target.value)})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Description / Remarks</label>
                          <textarea 
                            rows={2} placeholder="Details of work execution..."
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            value={progressForm.description}
                            onChange={e => setProgressForm({...progressForm, description: e.target.value})}
                          />
                      </div>
                      <div className="pt-2 flex justify-end gap-3">
                          <button type="button" onClick={() => setIsUpdateModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Progress</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default ConstructionModule;
