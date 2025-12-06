
import React, { useState } from 'react';
import { UserRole, Project, LabTest } from '../types';
import { Beaker, FileText, Plus, Check, X } from 'lucide-react';

interface Props {
  userRole: UserRole;
  project: Project;
  onProjectUpdate: (project: Project) => void;
}

const LabModule: React.FC<Props> = ({ userRole, project, onProjectUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    testName: '',
    sampleId: '',
    location: ''
  });

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    const test: LabTest = {
      id: `test-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      result: 'Pending',
      technician: userRole,
      ...newTest
    };
    
    onProjectUpdate({
      ...project,
      labTests: [test, ...project.labTests]
    });
    setIsModalOpen(false);
    setNewTest({ testName: '', sampleId: '', location: '' });
  };

  const handleUpdateResult = (id: string, result: 'Pass' | 'Fail') => {
    const updatedTests = project.labTests.map(t => 
      t.id === id ? { ...t, result } : t
    );
    onProjectUpdate({ ...project, labTests: updatedTests });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Material Laboratory</h2>
          <p className="text-slate-500 text-sm">Daily Quality Control & Assurance Updates</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Register Sample
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {project.labTests.length === 0 ? (
             <div className="p-10 text-center text-slate-500">No lab tests recorded for this project yet.</div>
        ) : (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                    <th className="px-6 py-4">Sample ID</th>
                    <th className="px-6 py-4">Test Name</th>
                    <th className="px-6 py-4">Source / Location</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Result</th>
                    <th className="px-6 py-4">Technician</th>
                    <th className="px-6 py-4">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {project.labTests.map((test) => (
                    <tr key={test.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-slate-600">{test.sampleId}</td>
                    <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2">
                        <Beaker size={16} className="text-purple-500" />
                        {test.testName}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{test.location}</td>
                    <td className="px-6 py-4 text-slate-500">{test.date}</td>
                    <td className="px-6 py-4">
                        <span className={`
                        px-2 py-1 rounded-full text-xs font-semibold
                        ${test.result === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 
                            test.result === 'Fail' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}
                        `}>
                        {test.result}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{test.technician}</td>
                    <td className="px-6 py-4">
                      {test.result === 'Pending' ? (
                        <div className="flex items-center gap-2">
                           <button onClick={() => handleUpdateResult(test.id, 'Pass')} className="p-1 hover:bg-emerald-100 text-emerald-600 rounded" title="Mark Pass"><Check size={16}/></button>
                           <button onClick={() => handleUpdateResult(test.id, 'Fail')} className="p-1 hover:bg-red-100 text-red-600 rounded" title="Mark Fail"><X size={16}/></button>
                        </div>
                      ) : (
                        <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs font-medium">
                           <FileText size={14} /> View
                        </button>
                      )}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
        )}
      </div>

      {/* Add Test Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
             <h3 className="text-lg font-bold text-slate-800 mb-4">Register New Sample</h3>
             <form onSubmit={handleAddTest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Test Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                    placeholder="e.g. Soil Compaction Test"
                    value={newTest.testName}
                    onChange={e => setNewTest({...newTest, testName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sample ID</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                    placeholder="e.g. S-105"
                    value={newTest.sampleId}
                    onChange={e => setNewTest({...newTest, sampleId: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Source / Location</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                    placeholder="e.g. Borrow Pit A / Ch 10+500"
                    value={newTest.location}
                    onChange={e => setNewTest({...newTest, location: e.target.value})}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">Register</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabModule;
