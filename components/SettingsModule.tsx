
import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Bell, Mail, Calendar, AlertCircle } from 'lucide-react';
import { AppSettings } from '../types';

interface Props {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
}

const SettingsModule: React.FC<Props> = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);

  // Sync prop changes
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
          <p className="text-slate-500 text-sm">Configure defaults for new projects</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
          
          <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">General Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                        value={formData.companyName}
                        onChange={e => setFormData({...formData, companyName: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Default Currency</label>
                      <select 
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                        value={formData.currency}
                        onChange={e => setFormData({...formData, currency: e.target.value})}
                      >
                          <option value="USD">USD ($)</option>
                          <option value="NPR">NPR (Rs.)</option>
                          <option value="INR">INR (₹)</option>
                      </select>
                  </div>
              </div>
          </div>

          <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Financial Defaults</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Default VAT Rate (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        required
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                        value={formData.vatRate}
                        onChange={e => setFormData({...formData, vatRate: parseFloat(e.target.value)})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Fiscal Year Start</label>
                      <input 
                        type="date" 
                        required
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                        value={formData.fiscalYearStart}
                        onChange={e => setFormData({...formData, fiscalYearStart: e.target.value})}
                      />
                  </div>
              </div>
          </div>

          <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Notification Preferences</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Bell size={16}/> Channels</h4>
                      <div className="space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={formData.notifications.enableEmail}
                                onChange={e => setFormData({...formData, notifications: {...formData.notifications, enableEmail: e.target.checked}})}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" 
                              />
                              <span className="text-sm text-slate-700 flex items-center gap-2"><Mail size={14} className="text-slate-400"/> Email Notifications</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={formData.notifications.enableInApp}
                                onChange={e => setFormData({...formData, notifications: {...formData.notifications, enableInApp: e.target.checked}})}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" 
                              />
                              <span className="text-sm text-slate-700 flex items-center gap-2"><Bell size={14} className="text-slate-400"/> In-App Alerts</span>
                          </label>
                      </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><AlertCircle size={16}/> Triggers & Rules</h4>
                      <div className="space-y-3">
                           <label className="flex items-center justify-between gap-3 cursor-pointer">
                              <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    checked={formData.notifications.notifyUpcoming}
                                    onChange={e => setFormData({...formData, notifications: {...formData.notifications, notifyUpcoming: e.target.checked}})}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" 
                                />
                                <span className="text-sm text-slate-700 flex items-center gap-2"><Calendar size={14} className="text-slate-400"/> Upcoming Deadlines</span>
                              </div>
                          </label>
                          
                          {formData.notifications.notifyUpcoming && (
                              <div className="ml-6 flex items-center gap-2 p-2 bg-white border border-slate-200 rounded">
                                  <span className="text-xs text-slate-500">Notify</span>
                                  <input 
                                    type="number" 
                                    min="1" max="30"
                                    value={formData.notifications.daysBefore}
                                    onChange={e => setFormData({...formData, notifications: {...formData.notifications, daysBefore: parseInt(e.target.value) || 1}})}
                                    className="w-12 border border-slate-300 rounded p-1 text-xs text-center focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                  <span className="text-xs text-slate-500">days before due date</span>
                              </div>
                          )}
                          
                          <label className="flex items-center gap-3 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={formData.notifications.notifyOverdue}
                                onChange={e => setFormData({...formData, notifications: {...formData.notifications, notifyOverdue: e.target.checked}})}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" 
                              />
                              <span className="text-sm text-slate-700 text-rose-600 font-medium">Alert on Overdue Tasks</span>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-slate-200">
                              <input 
                                type="checkbox" 
                                checked={formData.notifications.dailyDigest}
                                onChange={e => setFormData({...formData, notifications: {...formData.notifications, dailyDigest: e.target.checked}})}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" 
                              />
                              <span className="text-sm text-slate-700">Send Daily Activity Digest</span>
                          </label>
                      </div>
                  </div>
              </div>
          </div>

          <div className="pt-4 flex justify-end items-center gap-4 border-t border-slate-100">
              {saved && <span className="text-green-600 flex items-center gap-1 text-sm font-medium"><CheckCircle size={16}/> Settings Saved</span>}
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium shadow-sm hover:bg-indigo-700 flex items-center gap-2 transition-colors">
                  <Save size={18} /> Save Configuration
              </button>
          </div>
      </form>
    </div>
  );
};

export default SettingsModule;
