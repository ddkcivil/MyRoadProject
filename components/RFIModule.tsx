
import React, { useState } from 'react';
import { UserRole, RFI, RFIStatus, Project } from '../types';
import { CheckCircle, XCircle, Clock, Plus, Filter } from 'lucide-react';

interface Props {
  userRole: UserRole;
  project: Project;
  onProjectUpdate: (project: Project) => void;
}

const RFIModule: React.FC<Props> = ({ userRole, project, onProjectUpdate }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form State
  const [formData, setFormData] = useState({
    location: '',
    description: '',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newRFI: RFI = {
      id: `rfi-${Date.now()}`,
      rfiNumber: `RFI/NEW/${project.rfis.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      location: formData.location,
      description: formData.description,
      status: RFIStatus.OPEN,
      requestedBy: userRole,
      inspectionDate: ''
    };
    
    onProjectUpdate({
        ...project,
        rfis: [newRFI, ...project.rfis]
    });
    
    setFormData({ location: '', description: '' });
    setIsFormOpen(false);
  };

  const handleStatusChange = (rfiId: string, newStatus: RFIStatus) => {
      const updatedRfis = project.rfis.map(rfi => 
          rfi.id === rfiId ? { ...rfi, status: newStatus, inspectionDate: new Date().toISOString().split('T')[0] } : rfi
      );
      onProjectUpdate({ ...project, rfis: updatedRfis });
  };

  const filteredRfis = filterStatus === 'ALL' 
    ? project.rfis 
    : project.rfis.filter(r => r.status === filterStatus);

  const getStatusBadge = (status: RFIStatus) => {
    switch (status) {
      case RFIStatus.APPROVED: return <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1"><CheckCircle size={12}/> Approved</span>;
      case RFIStatus.REJECTED: return <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium flex items-center gap-1"><XCircle size={12}/> Rejected</span>;
      case RFIStatus.OPEN: return <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium flex items-center gap-1"><Clock size={12}/> Open</span>;
      default: return <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">Closed</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">RFI Management</h2>
          <p className="text-slate-500 text-sm">Requests for Inspection and Approvals</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
             <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
               <option value="ALL">All Status</option>
               <option value={RFIStatus.OPEN}>Open</option>
               <option value={RFIStatus.APPROVED}>Approved</option>
               <option value={RFIStatus.REJECTED}>Rejected</option>
             </select>
             <Filter size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
           </div>
            <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-colors"
            >
            <Plus size={18} />
            Raise RFI
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRfis.length === 0 ? (
            <div className="text-center py-10 text-slate-400 italic bg-white rounded-xl border border-slate-200">
                No RFIs found matching the current filter.
            </div>
        ) : (
            filteredRfis.map((rfi) => (
            <div key={rfi.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {rfi.rfiNumber}
                    </span>
                    <span className="text-xs text-slate-400">{rfi.date}</span>
                    </div>
                    <h3 className="font-medium text-slate-800 mb-1">{rfi.description}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">📍 {rfi.location}</span>
                    <span className="flex items-center gap-1">👤 {rfi.requestedBy}</span>
                    </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <div>
                    <div className="text-xs text-slate-400 mb-1">Insp. Date</div>
                    <div className="text-sm font-medium text-slate-700">{rfi.inspectionDate || 'Pending'}</div>
                    </div>
                    <div>{getStatusBadge(rfi.status)}</div>
                    
                    {/* Action Buttons for PM */}
                    {userRole === UserRole.PROJECT_MANAGER && rfi.status === RFIStatus.OPEN && (
                    <div className="flex gap-2">
                        <button 
                           onClick={() => handleStatusChange(rfi.id, RFIStatus.APPROVED)}
                           className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors"
                        >
                            Approve
                        </button>
                        <button 
                           onClick={() => handleStatusChange(rfi.id, RFIStatus.REJECTED)}
                           className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 transition-colors"
                        >
                            Reject
                        </button>
                    </div>
                    )}
                </div>
                </div>
            </div>
            ))
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">Raise New RFI</h3>
                <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location / Chainage</label>
                <input 
                    type="text" 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="e.g. Ch 12+500 LHS" 
                    required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Work Description</label>
                <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    rows={3} 
                    placeholder="Describe the work ready for inspection..." 
                    required
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Attachments</label>
                <input type="file" accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFIModule;
