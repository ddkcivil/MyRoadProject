
import React, { useState } from 'react';
import { Project, UserRole, BOQItem } from '../types';
import { Search, Plus, Trash2, Edit, CheckCircle, X } from 'lucide-react';

interface Props {
  projects: Project[];
  userRole: UserRole;
  onSelectProject: (projectId: string) => void;
  onSaveProject: (project: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
}

const ProjectsList: React.FC<Props> = ({ projects, userRole, onSelectProject, onSaveProject, onDeleteProject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Project>>({});

  // Privilege Check: Only Admin and PM can Edit/Delete/Create
  const hasEditPrivilege = userRole === UserRole.ADMIN || userRole === UserRole.PROJECT_MANAGER;

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenNew = () => {
    setEditForm({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditForm(project);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProject(editForm);
    setIsModalOpen(false);
  };

  const calculateProgress = (boq: BOQItem[]) => {
    const totalValue = boq.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    if (totalValue === 0) return 0;
    const completedValue = boq.reduce((sum, item) => sum + (item.completedQuantity * item.rate), 0);
    return Math.round((completedValue / totalValue) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Projects</h2>
        {hasEditPrivilege && (
          <button onClick={handleOpenNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-200 flex items-center gap-2 font-medium transition-all">
             <Plus size={18} /> New Project
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         {/* Header & Search */}
         <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-600 text-white">
            <div className="font-semibold">All Projects</div>
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300" size={16} />
               <input 
                 type="text" 
                 placeholder="Search projects..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-9 pr-4 py-1.5 rounded-lg bg-indigo-500/50 border border-indigo-400/30 text-white placeholder-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 w-full sm:w-64"
               />
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="bg-indigo-50 text-indigo-900 font-medium border-b border-indigo-100">
                  <tr>
                     <th className="px-6 py-4 whitespace-nowrap">Name</th>
                     <th className="px-6 py-4 whitespace-nowrap">Client</th>
                     <th className="px-6 py-4 whitespace-nowrap">Contractor</th>
                     <th className="px-6 py-4 whitespace-nowrap">Contract No</th>
                     <th className="px-6 py-4 whitespace-nowrap">Dates</th>
                     <th className="px-6 py-4 whitespace-nowrap w-32">Progress</th>
                     <th className="px-6 py-4 whitespace-nowrap text-center">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map(project => {
                     const progress = calculateProgress(project.boq);
                     return (
                        <tr key={project.id} className="hover:bg-slate-50 transition-colors group">
                           <td className="px-6 py-4 font-medium text-indigo-600 cursor-pointer" onClick={() => onSelectProject(project.id)}>
                              {project.name}
                              <div className="text-xs text-slate-400 font-normal">{project.location}</div>
                           </td>
                           <td className="px-6 py-4 text-slate-600">{project.client}</td>
                           <td className="px-6 py-4 text-slate-600">{project.contractor}</td>
                           <td className="px-6 py-4 font-mono text-xs text-slate-500">{project.contractNo}</td>
                           <td className="px-6 py-4 text-xs text-slate-600">
                              <div>{project.startDate}</div>
                              <div className="text-slate-400">to</div>
                              <div>{project.endDate}</div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                 <div className="flex justify-between text-xs mb-1">
                                    <span className="font-semibold text-slate-700">{progress}%</span>
                                 </div>
                                 <div className="w-full bg-slate-200 rounded-full h-1.5">
                                    <div 
                                       className={`h-1.5 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                                       style={{ width: `${progress}%` }}
                                    ></div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                 {/* Everyone can Select */}
                                 <button onClick={() => onSelectProject(project.id)} className="p-1.5 text-white bg-cyan-500 rounded hover:bg-cyan-600 shadow-sm" title="Select Project">
                                    <CheckCircle size={16} />
                                 </button>
                                 
                                 {/* Only Admin/PM can Edit/Delete */}
                                 {hasEditPrivilege && (
                                   <>
                                     <button onClick={() => handleOpenEdit(project)} className="p-1.5 text-white bg-amber-500 rounded hover:bg-amber-600 shadow-sm" title="Edit">
                                        <Edit size={16} />
                                     </button>
                                     <button onClick={() => onDeleteProject(project.id)} className="p-1.5 text-white bg-rose-500 rounded hover:bg-rose-600 shadow-sm" title="Delete">
                                        <Trash2 size={16} />
                                     </button>
                                   </>
                                 )}
                              </div>
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
         <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
            <span>Showing {filteredProjects.length} entries</span>
            <div className="flex gap-1">
               <button className="px-3 py-1 rounded border bg-white hover:bg-slate-50 disabled:opacity-50">Previous</button>
               <button className="px-3 py-1 rounded border bg-white hover:bg-slate-50 disabled:opacity-50">Next</button>
            </div>
         </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">{editForm.id ? 'Edit Project' : 'New Project'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
             </div>
             
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                    <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="e.g. Highway Expansion Package 4" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Code</label>
                    <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={editForm.code || ''} onChange={e => setEditForm({...editForm, code: e.target.value})} placeholder="e.g. HW-PKG-04" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contract No</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={editForm.contractNo || ''} onChange={e => setEditForm({...editForm, contractNo: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Client / Employer</label>
                    <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={editForm.client || ''} onChange={e => setEditForm({...editForm, client: e.target.value})} placeholder="e.g. NHAI / PWD" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Authority Engineer / Consultant</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={editForm.engineer || ''} onChange={e => setEditForm({...editForm, engineer: e.target.value})} />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contractor</label>
                    <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={editForm.contractor || ''} onChange={e => setEditForm({...editForm, contractor: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input required type="date" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={editForm.startDate || ''} onChange={e => setEditForm({...editForm, startDate: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input type="date" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={editForm.endDate || ''} onChange={e => setEditForm({...editForm, endDate: e.target.value})} />
                  </div>
                  
                   <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={editForm.location || ''} onChange={e => setEditForm({...editForm, location: e.target.value})} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-4">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
                   <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-md shadow-indigo-200">
                      {editForm.id ? 'Save Changes' : 'Create Project'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProjectsList;
