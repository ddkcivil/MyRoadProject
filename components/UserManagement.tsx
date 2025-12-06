
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';
import { UserPlus, Trash2, Mail, Shield } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.SITE_ENGINEER });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = {
        id: `u-${Date.now()}`,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
    };
    setUsers([...users, user]);
    setIsModalOpen(false);
    setNewUser({ name: '', email: '', role: UserRole.SITE_ENGINEER });
  };

  const removeUser = (id: string) => {
      setUsers(users.filter(u => u.id !== id));
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
          <p className="text-slate-500 text-sm">Manage system access and roles</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium"
        >
          <UserPlus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {users.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                                  {user.name.charAt(0)}
                              </div>
                              {user.name}
                          </td>
                          <td className="px-6 py-4">
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                                 <Shield size={12}/> {user.role}
                              </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 flex items-center gap-2">
                              <Mail size={14} /> {user.email}
                          </td>
                          <td className="px-6 py-4 text-right">
                              <button onClick={() => removeUser(user.id)} className="text-slate-400 hover:text-red-600 p-1 transition-colors">
                                  <Trash2 size={16} />
                              </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
             <h3 className="text-lg font-bold text-slate-800 mb-4">Add New User</h3>
             <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                    value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input required type="email" className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                    value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                      {Object.values(UserRole).map(role => (
                          <option key={role} value={role}>{role}</option>
                      ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Add User</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
