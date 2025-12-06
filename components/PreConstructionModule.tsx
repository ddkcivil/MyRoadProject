
import React, { useState } from 'react';
import { Project, PreConstructionTask } from '../types';
import { CheckCircle, Clock, AlertCircle, Plus, Calendar, BellRing, Target } from 'lucide-react';

interface Props {
  project: Project;
  onProjectUpdate: (project: Project) => void;
}

const PreConstructionModule: React.FC<Props> = ({ project, onProjectUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [selectedTaskForTrack, setSelectedTaskForTrack] = useState<string | null>(null);
  
  // Forms
  const [newTask, setNewTask] = useState<Partial<PreConstructionTask>>({
    category: 'Survey',
    status: 'Pending',
    description: '',
    remarks: '',
    estStartDate: '',
    estEndDate: '',
    progress: 0
  });

  const [trackForm, setTrackForm] = useState({
      date: new Date().toISOString().split('T')[0],
      progressAdded: 0,
      description: ''
  });

  // --- Logic ---
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const task: PreConstructionTask = {
        id: `pre-${Date.now()}`,
        category: newTask.category as any,
        description: newTask.description || '',
        status: newTask.status as any,
        targetDate: newTask.estEndDate || '', // Default target to end date
        estStartDate: newTask.estStartDate,
        estEndDate: newTask.estEndDate,
        progress: 0,
        remarks: newTask.remarks || '',
        logs: []
    };
    onProjectUpdate({
        ...project,
        preConstruction: [...project.preConstruction, task]
    });
    setIsModalOpen(false);
    setNewTask({ category: 'Survey', status: 'Pending', description: '', remarks: '', estStartDate: '', estEndDate: '', progress: 0 });
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedTaskForTrack) return;
      
      const updated = project.preConstruction.map(t => {
          if (t.id === selectedTaskForTrack) {
              const newProgress = Math.min(100, (t.progress || 0) + Number(trackForm.progressAdded));
              const newLog = {
                  date: trackForm.date,
                  progressAdded: Number(trackForm.progressAdded),
                  description: trackForm.description
              };
              const newStatus = newProgress === 100 ? 'Completed' : newProgress > 0 ? 'In Progress' : t.status;
              return { ...t, progress: newProgress, status: newStatus, logs: [...(t.logs || []), newLog] };
          }
          return t;
      });

      onProjectUpdate({ ...project, preConstruction: updated as any });
      setIsTrackModalOpen(false);
      setTrackForm({ date: new Date().toISOString().split('T')[0], progressAdded: 0, description: '' });
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Completed': return 'bg-green-100 text-green-700';
          case 'In Progress': return 'bg-blue-100 text-blue-700';
          default: return 'bg-amber-100 text-amber-700';
      }
  };

  const today = new Date().toISOString().split('T')[0];
  const dueTasks = project.preConstruction.filter(t => t.status !== 'Completed' && t.estEndDate && t.estEndDate <= today);

  return (
    <div className="space-y-6">
       
       {/* Header with Notification */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pre-Construction Activities</h2>
          <p className="text-slate-500 text-sm">Land Acquisition, Clearances, and Surveys</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={18} /> Add Activity
        </button>
      </div>

      {/* Daily Notification Banner */}
      {dueTasks.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3 text-orange-800">
              <BellRing className="mt-0.5" size={20} />
              <div>
                  <h4 className="font-bold text-sm">Action Required: {dueTasks.length} Tasks Due or Overdue</h4>
                  <ul className="mt-1 space-y-1 text-xs list-disc pl-4">
                      {dueTasks.map(t => (
                          <li key={t.id}>{t.description} (Due: {t.estEndDate})</li>
                      ))}
                  </ul>
              </div>
          </div>
      )}

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.preConstruction.map(task => (
              <div key={task.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col h-full">
                  <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(task.status)}`}>
                      {task.status}
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{task.category}</div>
                  <h3 className="font-semibold text-slate-800 mb-2">{task.description}</h3>
                  
                  <div className="space-y-2 mb-4 flex-1">
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                          <Calendar size={14} /> Est: {task.estStartDate || 'N/A'} <span className="text-slate-300">→</span> {task.estEndDate || 'N/A'}
                      </div>
                      
                      {/* Progress Bar */}
                      <div>
                          <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-slate-600">Progress</span>
                              <span className="font-bold text-slate-800">{task.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${task.progress || 0}%` }}></div>
                          </div>
                      </div>

                      {task.remarks && (
                        <div className="bg-slate-50 p-2 rounded text-xs text-slate-600 italic line-clamp-2">
                            "{task.remarks}"
                        </div>
                      )}
                  </div>
                  
                  <div className="pt-3 border-t border-slate-100 mt-auto">
                      <button 
                         onClick={() => { setSelectedTaskForTrack(task.id); setIsTrackModalOpen(true); }}
                         className="w-full text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"
                      >
                          <Target size={14} /> Track Daily Progress
                      </button>
                  </div>
              </div>
          ))}
          {project.preConstruction.length === 0 && (
              <div className="col-span-full p-12 text-center text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-300">
                  No pre-construction activities logged.
              </div>
          )}
      </div>

       {/* Add Activity Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
             <h3 className="text-lg font-bold text-slate-800 mb-4">Add Pre-Construction Activity</h3>
             <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select 
                     className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                     value={newTask.category}
                     onChange={e => setNewTask({...newTask, category: e.target.value as any})}
                  >
                      <option>Survey</option>
                      <option>Land Acquisition</option>
                      <option>Forest Clearance</option>
                      <option>Utility Shifting</option>
                      <option>Design</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input 
                    required type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                    value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}
                    placeholder="e.g. Joint Verification"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Est. Start</label>
                        <input 
                            required type="date" className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                            value={newTask.estStartDate} onChange={e => setNewTask({...newTask, estStartDate: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Est. End</label>
                        <input 
                            required type="date" className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                            value={newTask.estEndDate} onChange={e => setNewTask({...newTask, estEndDate: e.target.value})}
                        />
                    </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                  <textarea 
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                    value={newTask.remarks} onChange={e => setNewTask({...newTask, remarks: e.target.value})}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Add</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Track Progress Modal */}
      {isTrackModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Track Daily Progress</h3>
                <form onSubmit={handleTrackSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                        <input type="date" required className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={trackForm.date} onChange={e => setTrackForm({...trackForm, date: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Progress Added (%)</label>
                        <input type="number" min="0" max="100" required className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={trackForm.progressAdded} onChange={e => setTrackForm({...trackForm, progressAdded: Number(e.target.value)})} />
                        <p className="text-xs text-slate-400 mt-1">Enter incremental percentage completed today.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description / Activity</label>
                        <input type="text" required className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="e.g. Field work done" value={trackForm.description} onChange={e => setTrackForm({...trackForm, description: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsTrackModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Update Progress</button>
                    </div>
                </form>
             </div>
          </div>
      )}
    </div>
  );
};

export default PreConstructionModule;
