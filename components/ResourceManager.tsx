
import React, { useState } from 'react';
import { Project, InventoryItem, InventoryTransaction, Vehicle, VehicleLog } from '../types';
import { Package, Truck, Plus, ArrowUpRight, ArrowDownLeft, FileSpreadsheet, Fuel, X } from 'lucide-react';

interface Props {
  project: Project;
  onProjectUpdate: (project: Project) => void;
}

const ResourceManager: React.FC<Props> = ({ project, onProjectUpdate }) => {
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'FLEET'>('INVENTORY');
  
  // Modal States
  const [stockModal, setStockModal] = useState<{ isOpen: boolean, type: 'IN' | 'OUT', itemId: string }>({ isOpen: false, type: 'IN', itemId: '' });
  const [showLedger, setShowLedger] = useState(false);
  
  const [logModal, setLogModal] = useState<{ isOpen: boolean, vehicleId: string }>({ isOpen: false, vehicleId: '' });
  const [showLogSheet, setShowLogSheet] = useState(false);
  
  const [newVehicleModal, setNewVehicleModal] = useState(false);

  // Form States
  const [stockForm, setStockForm] = useState({ quantity: 0, partyOrVendor: '', billNo: '', date: new Date().toISOString().split('T')[0] });
  const [logForm, setLogForm] = useState({ 
     date: new Date().toISOString().split('T')[0],
     startKm: 0, 
     endKm: 0, 
     fuel: 0, 
     hours: 0,
     activity: ''
  });
  const [vehicleForm, setVehicleForm] = useState<Partial<Vehicle>>({ plateNumber: '', type: '', driver: '', status: 'Active' });

  // --- Inventory Logic ---
  const handleStockUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      const { type, itemId } = stockModal;
      const item = project.inventory.find(i => i.id === itemId);
      if(!item) return;

      const qty = Number(stockForm.quantity);
      const newQty = type === 'IN' ? item.quantity + qty : item.quantity - qty;

      const updatedInv = project.inventory.map(i => i.id === itemId ? { ...i, quantity: newQty, lastUpdated: stockForm.date } : i);
      
      const tx: InventoryTransaction = {
          id: `tx-${Date.now()}`,
          itemId,
          itemName: item.itemName,
          type,
          date: stockForm.date,
          quantity: qty,
          billNo: stockForm.billNo,
          vendorName: type === 'IN' ? stockForm.partyOrVendor : undefined,
          partyName: type === 'OUT' ? stockForm.partyOrVendor : undefined,
      };

      onProjectUpdate({
          ...project,
          inventory: updatedInv,
          inventoryTransactions: [tx, ...(project.inventoryTransactions || [])]
      });

      setStockModal({ ...stockModal, isOpen: false });
      setStockForm({ quantity: 0, partyOrVendor: '', billNo: '', date: new Date().toISOString().split('T')[0] });
  };

  // --- Fleet Logic ---
  const handleLogEntry = (e: React.FormEvent) => {
      e.preventDefault();
      const vehicle = project.vehicles.find(v => v.id === logModal.vehicleId);
      if(!vehicle) return;

      const totalKm = logForm.endKm - logForm.startKm;
      
      const newLog: VehicleLog = {
          id: `log-${Date.now()}`,
          vehicleId: vehicle.id,
          plateNumber: vehicle.plateNumber,
          date: logForm.date,
          startKm: logForm.startKm,
          endKm: logForm.endKm,
          totalKm,
          fuelConsumed: logForm.fuel,
          workingHours: logForm.hours,
          activityDescription: logForm.activity
      };

      onProjectUpdate({
          ...project,
          vehicleLogs: [newLog, ...(project.vehicleLogs || [])]
      });

      setLogModal({ ...logModal, isOpen: false });
      setLogForm({ date: new Date().toISOString().split('T')[0], startKm: 0, endKm: 0, fuel: 0, hours: 0, activity: '' });
  };

  const handleAddVehicle = (e: React.FormEvent) => {
      e.preventDefault();
      const newVehicle: Vehicle = {
          id: `v-${Date.now()}`,
          plateNumber: vehicleForm.plateNumber || '',
          type: vehicleForm.type || '',
          driver: vehicleForm.driver || '',
          status: 'Active'
      };
      onProjectUpdate({
          ...project,
          vehicles: [...project.vehicles, newVehicle]
      });
      setNewVehicleModal(false);
      setVehicleForm({ plateNumber: '', type: '', driver: '', status: 'Active' });
  };


  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex space-x-4 border-b border-slate-200">
         <button 
           onClick={() => setActiveTab('INVENTORY')}
           className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'INVENTORY' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
         >
           Store Inventory
         </button>
         <button 
           onClick={() => setActiveTab('FLEET')}
           className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'FLEET' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
         >
           Fleet Management
         </button>
      </div>

      {activeTab === 'INVENTORY' && (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2"><Package size={20}/> Material Stock</h3>
                <button onClick={() => setShowLedger(!showLedger)} className="flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded transition-colors">
                    <FileSpreadsheet size={16}/> {showLedger ? 'View Cards' : 'View Ledger Sheet'}
                </button>
             </div>

             {showLedger ? (
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                     <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">Transaction Ledger (Billing Trace)</div>
                     <table className="w-full text-sm text-left">
                         <thead className="bg-slate-50 text-slate-500 font-medium">
                             <tr>
                                 <th className="px-6 py-3">Date</th>
                                 <th className="px-6 py-3">Item</th>
                                 <th className="px-6 py-3">Type</th>
                                 <th className="px-6 py-3">Party / Vendor</th>
                                 <th className="px-6 py-3">Bill No</th>
                                 <th className="px-6 py-3 text-right">Quantity</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                             {(project.inventoryTransactions || []).map(tx => (
                                 <tr key={tx.id} className="hover:bg-slate-50">
                                     <td className="px-6 py-3 text-slate-600">{tx.date}</td>
                                     <td className="px-6 py-3 font-medium text-slate-800">{tx.itemName}</td>
                                     <td className="px-6 py-3">
                                         <span className={`px-2 py-0.5 rounded text-xs font-bold ${tx.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{tx.type}</span>
                                     </td>
                                     <td className="px-6 py-3 text-slate-600">{tx.type === 'IN' ? tx.vendorName : tx.partyName}</td>
                                     <td className="px-6 py-3 font-mono text-slate-500 text-xs">{tx.billNo}</td>
                                     <td className="px-6 py-3 text-right font-mono">{tx.quantity}</td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {project.inventory.map(item => (
                        <div key={item.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg">{item.itemName}</h4>
                                    <div className="text-xs text-slate-500">{item.location}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-slate-900">{item.quantity}</div>
                                    <div className="text-xs text-slate-500">{item.unit}</div>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                <button 
                                  onClick={() => setStockModal({ isOpen: true, type: 'IN', itemId: item.id })}
                                  className="flex-1 flex items-center justify-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 py-2 rounded text-xs font-medium transition-colors"
                                >
                                    <ArrowDownLeft size={14} /> Stock In
                                </button>
                                <button 
                                  onClick={() => setStockModal({ isOpen: true, type: 'OUT', itemId: item.id })}
                                  className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 py-2 rounded text-xs font-medium transition-colors"
                                >
                                    <ArrowUpRight size={14} /> Stock Out
                                </button>
                            </div>
                        </div>
                    ))}
                    <button className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors min-h-[160px]">
                        <Plus size={32} className="mb-2"/>
                        <span className="text-sm font-medium">New Item</span>
                    </button>
                </div>
             )}
        </div>
      )}

      {activeTab === 'FLEET' && (
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2"><Truck size={20}/> Fleet & Machinery</h3>
                <div className="flex gap-3">
                     <button onClick={() => setNewVehicleModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded shadow-sm flex items-center gap-2 text-sm font-medium">
                        <Plus size={16}/> Add Vehicle
                     </button>
                     <button onClick={() => setShowLogSheet(!showLogSheet)} className="flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded transition-colors">
                        <FileSpreadsheet size={16}/> {showLogSheet ? 'View Cards' : 'View Logs'}
                     </button>
                </div>
              </div>

              {showLogSheet ? (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">Vehicle Daily Log Sheet</div>
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 font-medium">
                              <tr>
                                  <th className="px-6 py-3">Date</th>
                                  <th className="px-6 py-3">Vehicle No</th>
                                  <th className="px-6 py-3">Activity</th>
                                  <th className="px-6 py-3 text-right">Start KM</th>
                                  <th className="px-6 py-3 text-right">End KM</th>
                                  <th className="px-6 py-3 text-right">Total KM</th>
                                  <th className="px-6 py-3 text-right">Fuel (L)</th>
                                  <th className="px-6 py-3 text-right">Hours</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {(project.vehicleLogs || []).map(log => (
                                  <tr key={log.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-3 text-slate-600">{log.date}</td>
                                      <td className="px-6 py-3 font-mono font-medium text-slate-800">{log.plateNumber}</td>
                                      <td className="px-6 py-3 text-slate-600">{log.activityDescription}</td>
                                      <td className="px-6 py-3 text-right font-mono text-slate-500">{log.startKm}</td>
                                      <td className="px-6 py-3 text-right font-mono text-slate-500">{log.endKm}</td>
                                      <td className="px-6 py-3 text-right font-bold text-slate-800">{log.totalKm}</td>
                                      <td className="px-6 py-3 text-right text-orange-600 font-medium">{log.fuelConsumed}</td>
                                      <td className="px-6 py-3 text-right text-slate-600">{log.workingHours}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {project.vehicles.map(vehicle => (
                          <div key={vehicle.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <div className="p-3 bg-slate-100 rounded-lg text-slate-500">
                                      <Truck size={24} />
                                  </div>
                                  <div>
                                      <div className="font-bold text-slate-800">{vehicle.plateNumber}</div>
                                      <div className="text-sm text-slate-500">{vehicle.type} • {vehicle.driver}</div>
                                  </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${vehicle.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {vehicle.status}
                                  </span>
                                  <button 
                                     onClick={() => setLogModal({ isOpen: true, vehicleId: vehicle.id })}
                                     className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded flex items-center gap-1 font-medium"
                                  >
                                      <Plus size={12} /> Log Entry
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {/* --- Modals --- */}
      
      {/* Stock Modal */}
      {stockModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">{stockModal.type === 'IN' ? 'Stock In (Purchase)' : 'Stock Out (Issue)'}</h3>
                  <form onSubmit={handleStockUpdate} className="space-y-4">
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                          <input type="date" required className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={stockForm.date} onChange={e => setStockForm({...stockForm, date: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">{stockModal.type === 'IN' ? 'Vendor Name' : 'Issued To (Party)'}</label>
                          <input type="text" required className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={stockForm.partyOrVendor} onChange={e => setStockForm({...stockForm, partyOrVendor: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Bill / Req No.</label>
                          <input type="text" required className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={stockForm.billNo} onChange={e => setStockForm({...stockForm, billNo: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
                          <input type="number" required className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: Number(e.target.value)})} />
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                          <button type="button" onClick={() => setStockModal({ ...stockModal, isOpen: false })} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                          <button type="submit" className={`px-4 py-2 text-white rounded-lg text-sm font-medium ${stockModal.type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                              {stockModal.type === 'IN' ? 'Add Stock' : 'Issue Stock'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Log Modal */}
      {logModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Daily Vehicle Log</h3>
                  <form onSubmit={handleLogEntry} className="space-y-4">
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                          <input type="date" required className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={logForm.date} onChange={e => setLogForm({...logForm, date: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Start KM</label>
                              <input type="number" required className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={logForm.startKm} onChange={e => setLogForm({...logForm, startKm: Number(e.target.value)})} />
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">End KM</label>
                              <input type="number" required className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={logForm.endKm} onChange={e => setLogForm({...logForm, endKm: Number(e.target.value)})} />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Fuel (Litres)</label>
                              <input type="number" required className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={logForm.fuel} onChange={e => setLogForm({...logForm, fuel: Number(e.target.value)})} />
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Working Hours</label>
                              <input type="number" required className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={logForm.hours} onChange={e => setLogForm({...logForm, hours: Number(e.target.value)})} />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Activity Description</label>
                          <input type="text" required className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="e.g. Earthwork at Ch 10+500" value={logForm.activity} onChange={e => setLogForm({...logForm, activity: e.target.value})} />
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                          <button type="button" onClick={() => setLogModal({ ...logModal, isOpen: false })} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Log</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* New Vehicle Modal */}
      {newVehicleModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Add New Fleet / Machinery</h3>
                <form onSubmit={handleAddVehicle} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Registration No / Plate</label>
                        <input type="text" required className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                           placeholder="e.g. KA-01-AB-1234"
                           value={vehicleForm.plateNumber} onChange={e => setVehicleForm({...vehicleForm, plateNumber: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Type / Model</label>
                        <input type="text" required className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                           placeholder="e.g. Excavator 220"
                           value={vehicleForm.type} onChange={e => setVehicleForm({...vehicleForm, type: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Driver / Operator</label>
                        <input type="text" required className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                           placeholder="e.g. Ram Singh"
                           value={vehicleForm.driver} onChange={e => setVehicleForm({...vehicleForm, driver: e.target.value})} 
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setNewVehicleModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Add Vehicle</button>
                    </div>
                </form>
             </div>
          </div>
      )}

    </div>
  );
};

export default ResourceManager;
