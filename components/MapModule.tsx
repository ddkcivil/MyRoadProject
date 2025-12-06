
import React, { useState, useEffect, useMemo } from 'react';
import { Project, RFIStatus } from '../types';
import { 
  Map as MapIcon, 
  Layers, 
  Truck, 
  AlertTriangle, 
  Activity, 
  Eye, 
  EyeOff, 
  Flame, 
  Maximize, 
  Cone,
  Globe,
  LayoutTemplate,
  X,
  Navigation
} from 'lucide-react';

interface Props {
  project: Project;
}

interface LayerState {
  boundaries: boolean;
  centerline: boolean;
  heatMap: boolean;
  workSites: boolean;
  machinery: boolean;
  rfis: boolean;
}

type ViewMode = 'SCHEMATIC' | 'SATELLITE';

interface SelectedEntity {
  type: 'VEHICLE' | 'RFI' | 'WORKSITE';
  data: any;
}

// --- Constants & Config ---
const PROJECT_LENGTH_KM = 15;
// The SVG Path definition representing the road alignment (Bezier Curve)
const ROAD_PATH_D = "M 50 350 C 200 350, 250 150, 400 150 S 750 300, 950 200";

// --- Helper Functions ---

const getPositionOnRoad = (chainageStr: string, offsetPercent = 0) => {
    let km = 0;
    // Extract KM from format like "10+500" or just use raw number
    if (typeof chainageStr === 'string' && chainageStr.includes('+')) {
        const match = chainageStr.match(/(\d+)\+(\d+)/);
        if (match) {
            km = parseInt(match[1]) + (parseInt(match[2]) / 1000);
        }
    } else {
        // Fallback
        km = parseFloat(chainageStr) || 0;
    }

    // Normalize to 0-100% of the path
    let t = (km / PROJECT_LENGTH_KM) * 100;
    t += offsetPercent; // Add live GPS offset
    t = Math.max(0, Math.min(100, t)); // Clamp

    // Parametric approximation of the specific S-Curve in ROAD_PATH_D
    const x = t * 9 + 50; 
    
    let y = 350;
    if (t < 40) {
        // First curve segment (0-40%)
        const localT = t / 40; 
        y = 350 - (200 * Math.sin(localT * Math.PI / 2)); 
    } else {
        // Second curve segment (40-100%)
        const localT = (t - 40) / 60;
        y = 150 + (50 * Math.sin(localT * Math.PI));
    }

    return { x, y, km };
};

const MapModule: React.FC<Props> = ({ project }) => {
  // --- State ---
  const [activeLayers, setActiveLayers] = useState<LayerState>({
      boundaries: true,
      centerline: true,
      heatMap: false,
      workSites: true,
      machinery: true,
      rfis: true
  });

  const [viewMode, setViewMode] = useState<ViewMode>('SCHEMATIC');
  const [isLiveTracking, setIsLiveTracking] = useState(true);
  const [gpsOffsets, setGpsOffsets] = useState<Record<string, number>>({});
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);

  // --- Effects ---

  // Simulated GPS Movement Logic
  useEffect(() => {
    if (!isLiveTracking) return;

    const interval = setInterval(() => {
        setGpsOffsets(prev => {
            const next = { ...prev };
            // Defensive check: ensure vehicles array exists
            (project.vehicles || []).forEach(v => {
                if (v.status === 'Active') {
                    // Random movement drift 
                    const current = next[v.id] || 0;
                    const shift = (Math.random() - 0.5) * 0.5; 
                    next[v.id] = Math.max(-2, Math.min(2, current + shift));
                }
            });
            return next;
        });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLiveTracking, project.vehicles]);

  // --- Derived Data ---

  // Generate heatmap segments
  const heatMapSegments = useMemo(() => {
      const segments = [];
      for (let i = 0; i < PROJECT_LENGTH_KM; i++) {
          const intensity = (i * 7) % 10; 
          let color = 'transparent';
          // Adjust opacity based on view mode for better visibility
          if (intensity > 7) color = viewMode === 'SCHEMATIC' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(220, 38, 38, 0.6)'; // Red
          else if (intensity > 4) color = viewMode === 'SCHEMATIC' ? 'rgba(234, 179, 8, 0.4)' : 'rgba(202, 138, 4, 0.6)'; // Yellow
          
          if (color !== 'transparent') {
              const start = getPositionOnRoad(`${i}+000`);
              const end = getPositionOnRoad(`${i+1}+000`);
              segments.push({ start, end, color, id: i });
          }
      }
      return segments;
  }, [viewMode]);

  // Filter Active Data (Safe Access)
  const activeVehicles = (project.vehicles || []).filter(v => v.status === 'Active');
  const openRFIs = (project.rfis || []).filter(r => r.status === RFIStatus.OPEN);
  
  const activeWorkSites = (project.schedule || [])
    .filter(s => s.status === 'On Track')
    .map((s, i) => ({
        id: s.id,
        name: s.name,
        location: `${2 + (i*3)}+000`, // Mock location distribution
        progress: s.progress
    }));

  // --- Render Helpers ---

  const toggleLayer = (layer: keyof LayerState) => {
      setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Styles based on View Mode
  const isSchematic = viewMode === 'SCHEMATIC';
  const bgColor = isSchematic ? 'bg-slate-900' : 'bg-emerald-950'; // Dark blue vs Dark Green/Earth
  const gridColor = isSchematic ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)';
  const roadColor = isSchematic ? '#1e293b' : '#3f3f46'; 
  const stripingColor = isSchematic ? '#fbbf24' : '#e4e4e7';

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6">
       
       {/* Sidebar Controls */}
       <div className="w-full md:w-80 bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col overflow-y-auto">
           
           {/* Header Area */}
           {selectedEntity ? (
               <div className="mb-4">
                   <button onClick={() => setSelectedEntity(null)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mb-2">
                       <X size={12}/> Close Details
                   </button>
                   <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                       {selectedEntity.type === 'VEHICLE' && <Truck size={20} className="text-indigo-600"/>}
                       {selectedEntity.type === 'RFI' && <AlertTriangle size={20} className="text-rose-600"/>}
                       {selectedEntity.type === 'WORKSITE' && <Cone size={20} className="text-emerald-600"/>}
                       {selectedEntity.type === 'VEHICLE' ? 'Fleet Details' : selectedEntity.type === 'RFI' ? 'RFI Details' : 'Work Zone'}
                   </h3>
               </div>
           ) : (
               <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                   <MapIcon size={20} className="text-blue-600"/> GIS Control Center
               </h3>
           )}
           
           {/* Controls / Details Panel */}
           <div className="space-y-6 flex-1">
               
               {selectedEntity ? (
                   // --- Details View ---
                   <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                       {selectedEntity.type === 'VEHICLE' && (
                           <>
                               <div>
                                   <div className="text-xs text-slate-400 uppercase">Plate Number</div>
                                   <div className="font-mono font-medium text-slate-800">{selectedEntity.data.plateNumber}</div>
                               </div>
                               <div>
                                   <div className="text-xs text-slate-400 uppercase">Type</div>
                                   <div className="font-medium text-slate-800">{selectedEntity.data.type}</div>
                               </div>
                               <div>
                                   <div className="text-xs text-slate-400 uppercase">Driver</div>
                                   <div className="font-medium text-slate-800">{selectedEntity.data.driver}</div>
                               </div>
                               <div>
                                   <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">
                                       <Activity size={12}/> Active
                                   </span>
                               </div>
                           </>
                       )}
                       {selectedEntity.type === 'RFI' && (
                           <>
                               <div>
                                   <div className="text-xs text-slate-400 uppercase">RFI Number</div>
                                   <div className="font-mono font-medium text-slate-800">{selectedEntity.data.rfiNumber}</div>
                               </div>
                               <div>
                                   <div className="text-xs text-slate-400 uppercase">Location</div>
                                   <div className="font-medium text-slate-800">{selectedEntity.data.location}</div>
                               </div>
                               <div>
                                   <div className="text-xs text-slate-400 uppercase">Issue</div>
                                   <div className="font-medium text-sm text-slate-800">{selectedEntity.data.description}</div>
                               </div>
                               <div className="pt-2">
                                   <button className="w-full bg-blue-600 text-white text-xs py-2 rounded hover:bg-blue-700 font-medium">View Full Report</button>
                               </div>
                           </>
                       )}
                       {selectedEntity.type === 'WORKSITE' && (
                           <>
                               <div>
                                   <div className="text-xs text-slate-400 uppercase">Task Name</div>
                                   <div className="font-medium text-slate-800">{selectedEntity.data.name}</div>
                               </div>
                               <div>
                                   <div className="text-xs text-slate-400 uppercase">Location Base</div>
                                   <div className="font-mono font-medium text-slate-800">{selectedEntity.data.location}</div>
                               </div>
                               <div>
                                   <div className="text-xs text-slate-400 uppercase">Schedule Progress</div>
                                   <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                                       <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${selectedEntity.data.progress}%` }}></div>
                                   </div>
                                   <div className="text-right text-xs mt-1 font-bold text-slate-600">{selectedEntity.data.progress}%</div>
                               </div>
                           </>
                       )}
                   </div>
               ) : (
               // --- Layers View ---
               <>
               {/* View Mode Toggle */}
               <div className="p-1 bg-slate-100 rounded-lg flex mb-4">
                   <button 
                     onClick={() => setViewMode('SCHEMATIC')}
                     className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'SCHEMATIC' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                       <LayoutTemplate size={14}/> Schematic
                   </button>
                   <button 
                     onClick={() => setViewMode('SATELLITE')}
                     className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'SATELLITE' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                       <Globe size={14}/> Satellite
                   </button>
               </div>

               {/* Base Layers */}
               <div className="space-y-3">
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                       <Layers size={12}/> Base Layers
                   </h4>
                   
                   <div 
                     onClick={() => toggleLayer('boundaries')}
                     className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${activeLayers.boundaries ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}
                   >
                       <div className="flex items-center gap-3">
                           <Maximize size={16} className={activeLayers.boundaries ? 'text-blue-600' : 'text-slate-400'}/>
                           <span className="text-sm font-medium text-slate-700">Project ROW</span>
                       </div>
                       {activeLayers.boundaries ? <Eye size={14} className="text-blue-500"/> : <EyeOff size={14} className="text-slate-400"/>}
                   </div>

                   <div 
                     onClick={() => toggleLayer('centerline')}
                     className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${activeLayers.centerline ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}
                   >
                       <div className="flex items-center gap-3">
                           <Activity size={16} className={activeLayers.centerline ? 'text-blue-600' : 'text-slate-400'}/>
                           <span className="text-sm font-medium text-slate-700">Road Alignment</span>
                       </div>
                       {activeLayers.centerline ? <Eye size={14} className="text-blue-500"/> : <EyeOff size={14} className="text-slate-400"/>}
                   </div>
               </div>

               {/* Analysis Layers */}
               <div className="space-y-3">
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                       <Activity size={12}/> Analysis & Progress
                   </h4>

                   <div 
                     onClick={() => toggleLayer('heatMap')}
                     className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${activeLayers.heatMap ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}
                   >
                       <div className="flex items-center gap-3">
                           <Flame size={16} className={activeLayers.heatMap ? 'text-amber-600' : 'text-slate-400'}/>
                           <span className="text-sm font-medium text-slate-700">Progress Heatmap</span>
                       </div>
                       {activeLayers.heatMap ? <Eye size={14} className="text-amber-500"/> : <EyeOff size={14} className="text-slate-400"/>}
                   </div>

                   <div 
                     onClick={() => toggleLayer('workSites')}
                     className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${activeLayers.workSites ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}
                   >
                       <div className="flex items-center gap-3">
                           <Cone size={16} className={activeLayers.workSites ? 'text-emerald-600' : 'text-slate-400'}/>
                           <span className="text-sm font-medium text-slate-700">Active Work Zones</span>
                       </div>
                       {activeLayers.workSites ? <Eye size={14} className="text-emerald-500"/> : <EyeOff size={14} className="text-slate-400"/>}
                   </div>
               </div>

               {/* Real-time Objects */}
               <div className="space-y-3">
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                       <Truck size={12}/> Live Objects
                   </h4>
                   
                   <div 
                     onClick={() => toggleLayer('machinery')}
                     className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${activeLayers.machinery ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}
                   >
                       <div className="flex items-center gap-3">
                           <Truck size={16} className={activeLayers.machinery ? 'text-indigo-600' : 'text-slate-400'}/>
                           <span className="text-sm font-medium text-slate-700">Fleet GPS</span>
                       </div>
                       {activeLayers.machinery ? <Eye size={14} className="text-indigo-500"/> : <EyeOff size={14} className="text-slate-400"/>}
                   </div>

                   <div 
                     onClick={() => toggleLayer('rfis')}
                     className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${activeLayers.rfis ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}
                   >
                       <div className="flex items-center gap-3">
                           <AlertTriangle size={16} className={activeLayers.rfis ? 'text-rose-600' : 'text-slate-400'}/>
                           <span className="text-sm font-medium text-slate-700">Open Issues (RFI)</span>
                       </div>
                       {activeLayers.rfis ? <Eye size={14} className="text-rose-500"/> : <EyeOff size={14} className="text-slate-400"/>}
                   </div>
               </div>
               </>
               )}
           </div>

           <div className="mt-6 pt-4 border-t border-slate-200">
               <button 
                 onClick={() => setIsLiveTracking(!isLiveTracking)}
                 className={`w-full py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
                     isLiveTracking 
                     ? 'bg-white text-green-600 border-green-200 hover:bg-green-50' 
                     : 'bg-green-600 text-white border-transparent hover:bg-green-700'
                 }`}
               >
                   {isLiveTracking ? '● Live Updates On' : '○ Live Updates Paused'}
               </button>
           </div>
       </div>

       {/* Map Visualization Area */}
       <div className={`flex-1 ${bgColor} rounded-xl shadow-inner relative overflow-hidden flex items-center justify-center border border-slate-800 group transition-colors duration-500`}>
           
           {/* Grid Pattern Background */}
           <div className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{ 
                    backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`, 
                    backgroundSize: '40px 40px' 
                }}>
           </div>
           
           {/* Top Right Stats Overlay */}
           <div className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur text-white p-3 rounded-lg border border-slate-700 text-xs font-mono shadow-xl z-10 pointer-events-none">
               <div className="mb-1 font-bold text-slate-300">PROJECT METRICS</div>
               <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                   <span className="text-slate-500">Length:</span> <span>{PROJECT_LENGTH_KM.toFixed(2)} Km</span>
                   <span className="text-slate-500">Active GPS:</span> <span className="text-green-400">{activeVehicles.length} Units</span>
                   <span className="text-slate-500">Alerts:</span> <span className="text-rose-400">{openRFIs.length} Active</span>
                   <span className="text-slate-500">Mode:</span> <span className="text-blue-300">{viewMode}</span>
               </div>
           </div>

           {/* Compass Rose */}
           <div className="absolute bottom-6 right-6 pointer-events-none opacity-50">
               <div className={`relative w-12 h-12 border-2 ${isSchematic ? 'border-slate-500' : 'border-white/50'} rounded-full flex items-center justify-center`}>
                   <span className="absolute -top-3 bg-transparent px-1 text-[10px] font-bold text-slate-400">N</span>
                   <div className="w-0.5 h-3 bg-red-500 absolute top-2"></div>
                   <div className={`w-0.5 h-3 ${isSchematic ? 'bg-slate-500' : 'bg-white/50'} absolute bottom-2`}></div>
               </div>
           </div>

           {/* The Map SVG */}
           <svg viewBox="0 0 1000 500" className="w-full h-full p-8 md:p-12 cursor-grab active:cursor-grabbing">
               
               {/* Definitions for glows/shadows */}
               <defs>
                   <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                       <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                       <feMerge>
                           <feMergeNode in="coloredBlur"/>
                           <feMergeNode in="SourceGraphic"/>
                       </feMerge>
                   </filter>
                   {/* Gradient for Work Sites */}
                   <radialGradient id="workZoneGrad">
                       <stop offset="0%" stopColor="#10b981" stopOpacity="0.6"/>
                       <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                   </radialGradient>
               </defs>

               {/* Layer 1: Boundaries (Right of Way) */}
               {activeLayers.boundaries && (
                   <path 
                     d={ROAD_PATH_D} 
                     fill="none" 
                     stroke={isSchematic ? "#cbd5e1" : "#f0fdf4"} 
                     strokeWidth="60" 
                     strokeLinecap="butt" 
                     strokeOpacity="0.1"
                   />
               )}

               {/* Layer 2: Heatmap (Historical Progress) */}
               {activeLayers.heatMap && heatMapSegments.map((seg) => (
                   <line 
                     key={`heat-${seg.id}`}
                     x1={seg.start.x} y1={seg.start.y}
                     x2={seg.end.x} y2={seg.end.y}
                     stroke={seg.color}
                     strokeWidth="35"
                     strokeLinecap="round"
                     filter="url(#glow)"
                   />
               ))}

               {/* Layer 3: Centerline (Road Alignment) */}
               {activeLayers.centerline && (
                   <>
                       {/* Base Line */}
                       <path 
                         d={ROAD_PATH_D} 
                         fill="none" 
                         stroke={roadColor} 
                         strokeWidth="14" 
                         strokeLinecap="round" 
                       />
                       {/* Center Striping */}
                       <path 
                         d={ROAD_PATH_D} 
                         fill="none" 
                         stroke={stripingColor} 
                         strokeWidth="2" 
                         strokeDasharray="8 8" 
                         strokeOpacity="0.8"
                       />
                   </>
               )}

               {/* Layer 4: Active Work Sites */}
               {activeLayers.workSites && activeWorkSites.map((site) => {
                   const pt = getPositionOnRoad(site.location);
                   const isSelected = selectedEntity?.type === 'WORKSITE' && selectedEntity?.data.id === site.id;
                   
                   return (
                       <g 
                         key={`site-${site.id}`} 
                         transform={`translate(${pt.x}, ${pt.y})`}
                         onClick={(e) => { e.stopPropagation(); setSelectedEntity({type: 'WORKSITE', data: site}); }}
                         className="cursor-pointer hover:opacity-90"
                       >
                           <circle r={isSelected ? 30 : 25} fill="url(#workZoneGrad)" className={isSelected ? "" : "animate-pulse"} />
                           <circle r={isSelected ? 30 : 25} stroke={isSelected ? "#34d399" : "transparent"} strokeWidth="2" fill="none" />
                           <Cone size={14} x="-7" y="-7" className="text-emerald-300 drop-shadow-sm" fill="currentColor"/>
                       </g>
                   );
               })}

               {/* KM Markers (Always Visible if centerline is on) */}
               {activeLayers.centerline && [0, 3, 6, 9, 12, 15].map(km => {
                   const pt = getPositionOnRoad(`${km}+000`);
                   return (
                       <g key={`km-${km}`} className="pointer-events-none">
                           <circle cx={pt.x} cy={pt.y} r="3" fill="#64748b" stroke={isSchematic ? "#0f172a" : "#064e3b"} strokeWidth="1"/>
                           <text x={pt.x} y={pt.y + 20} fill={isSchematic ? "#94a3b8" : "#a7f3d0"} fontSize="9" textAnchor="middle" fontFamily="monospace">Km {km}</text>
                       </g>
                   );
               })}

               {/* Layer 5: Machinery GPS */}
               {activeLayers.machinery && activeVehicles.map((v, i) => {
                   const mockBaseKm = (i * 2.5) + 1; 
                   const pt = getPositionOnRoad(`${mockBaseKm}+000`, gpsOffsets[v.id] || 0);
                   const isSelected = selectedEntity?.type === 'VEHICLE' && selectedEntity?.data.id === v.id;
                   
                   return (
                       <g 
                         key={v.id} 
                         style={{ transition: 'transform 1s linear' }} 
                         transform={`translate(${pt.x}, ${pt.y})`} 
                         onClick={(e) => { e.stopPropagation(); setSelectedEntity({type: 'VEHICLE', data: v}); }}
                         className="cursor-pointer group/machine"
                       >
                           {/* Selection/Pulse ring */}
                           <circle r={isSelected ? 16 : 12} fill={isSelected ? "rgba(99, 102, 241, 0.5)" : "rgba(99, 102, 241, 0.3)"} className={isLiveTracking && !isSelected ? "animate-ping" : ""} />
                           <circle r={isSelected ? 16 : 12} stroke={isSelected ? "#818cf8" : "transparent"} strokeWidth="2" fill="none" />
                           {/* Icon backing */}
                           <circle r="7" fill="#4f46e5" stroke="#fff" strokeWidth="1.5" />
                           
                           {/* Tooltip (Only if not selected) */}
                           {!isSelected && (
                               <g className="opacity-0 group-hover/machine:opacity-100 transition-opacity pointer-events-none">
                                   <rect x="-40" y="-40" width="80" height="24" rx="4" fill="#0f172a" fillOpacity="0.9" />
                                   <text x="0" y="-24" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">{v.plateNumber}</text>
                               </g>
                           )}
                       </g>
                   );
               })}

               {/* Layer 6: Open RFIs (Issues) */}
               {activeLayers.rfis && openRFIs.map((r, i) => {
                   const pt = getPositionOnRoad(r.location);
                   const isSelected = selectedEntity?.type === 'RFI' && selectedEntity?.data.id === r.id;

                   return (
                       <g 
                         key={r.id} 
                         transform={`translate(${pt.x}, ${pt.y - 12})`} 
                         onClick={(e) => { e.stopPropagation(); setSelectedEntity({type: 'RFI', data: r}); }}
                         className="cursor-pointer group/rfi"
                       >
                           {/* Pin Shape */}
                           <path d="M0,0 L0,-14 L-8,-22 L8,-22 L0,-14 Z" fill={isSelected ? "#b91c1c" : "#ef4444"} stroke="#7f1d1d" strokeWidth="1" />
                           <circle cx="0" cy="-24" r={isSelected ? 6 : 4} fill="#ef4444" stroke="#fff" strokeWidth="1.5" />
                           
                           {/* Tooltip */}
                           {!isSelected && (
                               <g className="opacity-0 group-hover/rfi:opacity-100 transition-opacity pointer-events-none">
                                   <rect x="-50" y="-55" width="100" height="20" rx="4" fill="#ef4444" />
                                   <text x="0" y="-42" fill="white" fontSize="9" textAnchor="middle">RFI: {r.rfiNumber}</text>
                               </g>
                           )}
                       </g>
                   );
               })}

           </svg>
       </div>
    </div>
  );
};

export default MapModule;
