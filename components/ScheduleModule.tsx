
import React, { useState } from 'react';
import { Project, ScheduleTask, UserRole } from '../types';
import { CalendarClock, Plus, Edit2, Trash2, X, Check, AlertTriangle, Clock } from 'lucide-react';

interface Props {
    project: Project;
    userRole: UserRole;
    onProjectUpdate: (project: Project) => void;
}

const ScheduleModule: React.FC<Props> = ({ project, userRole, onProjectUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<ScheduleTask>>({});

  const canEdit = [UserRole.PROJECT_MANAGER, UserRole.ADMIN, UserRole.SITE_ENGINEER].includes(userRole);

  const handleOpenModal = (task?: ScheduleTask) => {
      if (task) {
          setEditingTask(task);
      } else {
          setEditingTask({
              name: '',
              startDate: new Date().toISOString().split('T')[0],
              endDate: '',
              progress: 0,
              status: 'On Track'
          });
      }
      setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!editingTask.name || !editingTask.startDate || !editingTask.endDate) return;

      let updatedSchedule: ScheduleTask[];
      
      if (editingTask.id) {
          // Update
          updatedSchedule = project.schedule.map(t => t.id === editingTask.id ? { ...t, ...editingTask } as ScheduleTask : t);
      } else {
          // Create
          const newTask: ScheduleTask = {
              id: `task-${Date.now()}`,
              name: editingTask.name!,
              startDate: editingTask.startDate!,
              endDate: editingTask.endDate!,
              progress: Number(editingTask.progress) || 0,
              status: editingTask.status as any || 'On Track'
          };
          updatedSchedule = [...project.schedule, newTask];
      }
      
      // Sort by start date
      updatedSchedule.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      onProjectUpdate({
          ...project,
          schedule: updatedSchedule
      });
      setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
      if(window.confirm("Delete this task?")) {
          onProjectUpdate({
              ...project,
              schedule: project.schedule.filter(t => t.id !== id)
          });
      }
  };

  // Calculations for Gantt visualization
  // Find min start and max end to define the range
  const dates = project.schedule.flatMap(t => [new Date(t.startDate).getTime(), new Date(t.endDate).getTime()]);
  const minDate = dates.length ? Math.min(...dates) : new Date().getTime();
  const maxDate = dates.length ? Math.max(...dates) : new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
  const totalDuration = maxDate - minDate || 1; // avoid divide by zero

  const getPosition = (start: string, end: string) => {
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      const left = ((s - minDate) / totalDuration) * 100;
      const width = ((e - s) / totalDuration) * 100;
      return { left: `${Math.max(0, left)}%`, width: `${Math.max(0.5, width)}%` };
  };

  return (
      <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <h2 className="text-2xl font-bold text-slate-800">Master Work Schedule</h2>
                  <p className="text-slate-500 text-sm">Project Timeline & Critical Path</p>
              </div>
              {canEdit && (
                  <button 
                      onClick={() => handleOpenModal()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                      <Plus size={18} /> Add Task
                  </button>
              )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Clock size={20}/></div>
                  <div>
                      <div className="text-2xl font-bold text-slate-800">{project.schedule.length}</div>
                      <div className="text-xs text-slate-500">Total Tasks</div>
                  </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Check size={20}/></div>
                  <div>
                      <div className="text-2xl font-bold text-slate-800">{project.schedule.filter(t => t.status === 'Completed').length}</div>
                      <div className="text-xs text-slate-500">Completed</div>
                  </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertTriangle size={20}/></div>
                  <div>
                      <div className="text-2xl font-bold text-slate-800">{project.schedule.filter(t => t.status === 'Delayed').length}</div>
                      <div className="text-xs text-slate-500">Delayed</div>
                  </div>
              </div>
          </div>

          {/* Gantt / List View */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <div>Task Name</div>
                  <div className="text-right">Timeline / Action</div>
              </div>
              
              <div className="divide-y divide-slate-100">
                  {project.schedule.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 italic">No tasks scheduled. Add a task to get started.</div>
                  ) : (
                      project.schedule.map(task => {
                          const pos = getPosition(task.startDate, task.endDate);
                          const colorClass = task.status === 'Completed' ? 'bg-green-500' : task.status === 'Delayed' ? 'bg-red-500' : 'bg-blue-500';
                          
                          return (
                              <div key={task.id} className="group hover:bg-slate-50 transition-colors p-4">
                                  <div className="flex flex-col md:flex-row gap-4 mb-3">
                                      <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                              <span className="font-semibold text-slate-800">{task.name}</span>
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                                                  task.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-200' :
                                                  task.status === 'Delayed' ? 'bg-red-50 text-red-600 border-red-200' :
                                                  'bg-blue-50 text-blue-600 border-blue-200'
                                              }`}>{task.status}</span>
                                          </div>
                                          <div className="text-xs text-slate-500 flex gap-3 mt-1">
                                              <span>{task.startDate} → {task.endDate}</span>
                                              <span className="font-medium text-slate-700">{task.progress}% Done</span>
                                          </div>
                                      </div>
                                      
                                      {canEdit && (
                                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button onClick={() => handleOpenModal(task)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                                                  <Edit2 size={16} />
                                              </button>
                                              <button onClick={() => handleDelete(task.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                                                  <Trash2 size={16} />
                                              </button>
                                          </div>
                                      )}
                                  </div>

                                  {/* Bar Container */}
                                  <div className="w-full h-6 bg-slate-100 rounded-full relative overflow-hidden">
                                      {/* Background placeholder for entire duration */}
                                      <div 
                                          className="absolute top-1 bottom-1 bg-slate-200 rounded opacity-30"
                                          style={{ left: pos.left, width: pos.width }}
                                      ></div>
                                      
                                      {/* Actual progress bar */}
                                      <div 
                                          className={`absolute top-1 bottom-1 rounded shadow-sm flex items-center justify-end px-2 text-[10px] text-white font-medium transition-all ${colorClass}`}
                                          style={{ 
                                              left: pos.left, 
                                              width: `calc(${pos.width} * ${task.progress / 100})`,
                                              minWidth: task.progress > 0 ? '4px' : '0' 
                                          }}
                                      >
                                      </div>
                                  </div>
                              </div>
                          );
                      })
                  )}
              </div>
              
              {/* Timeline Labels (Simple) */}
              <div className="p-2 bg-slate-50 border-t border-slate-100 flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>{new Date(minDate).toLocaleDateString()}</span>
                  <span>{new Date(minDate + totalDuration / 2).toLocaleDateString()}</span>
                  <span>{new Date(maxDate).toLocaleDateString()}</span>
              </div>
          </div>

          {/* Modal */}
          {isModalOpen && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                  <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-slate-800">{editingTask.id ? 'Edit Task' : 'Add New Task'}</h3>
                          <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                      </div>

                      <form onSubmit={handleSave} className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Task Name</label>
                              <input 
                                  required 
                                  type="text" 
                                  value={editingTask.name || ''} 
                                  onChange={e => setEditingTask({...editingTask, name: e.target.value})}
                                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  placeholder="e.g. Foundation Excavation"
                              />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                                  <input 
                                      required 
                                      type="date" 
                                      value={editingTask.startDate || ''} 
                                      onChange={e => setEditingTask({...editingTask, startDate: e.target.value})}
                                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                                  <input 
                                      required 
                                      type="date" 
                                      value={editingTask.endDate || ''} 
                                      onChange={e => setEditingTask({...editingTask, endDate: e.target.value})}
                                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Progress (%)</label>
                                  <input 
                                      type="number" 
                                      min="0" max="100"
                                      value={editingTask.progress ?? 0} 
                                      onChange={e => setEditingTask({...editingTask, progress: Number(e.target.value)})}
                                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                  <select 
                                      value={editingTask.status || 'On Track'} 
                                      onChange={e => setEditingTask({...editingTask, status: e.target.value as any})}
                                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  >
                                      <option value="On Track">On Track</option>
                                      <option value="Delayed">Delayed</option>
                                      <option value="Completed">Completed</option>
                                  </select>
                              </div>
                          </div>

                          <div className="pt-4 flex justify-end gap-3">
                              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-md">
                                  Save Task
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          )}
      </div>
  );
};

export default ScheduleModule;
