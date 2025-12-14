import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project, RFIStatus, StructureAsset } from '../types';
import { 
  Map as MapIcon, 
  Layers, 
  Truck, 
  AlertTriangle, 
  Activity, 
  Flame, 
  Maximize, 
  Cone,
  Globe,
  X,
  FileUp,
  Settings,
  Satellite,
  Component, 
  Plus,
  Minus,
  RefreshCw,
  Eye,
  EyeOff,
  Target,
  Trash2,
  Waypoints,
  Info
} from 'lucide-react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Declare Leaflet global for TypeScript (since it's loaded via CDN)
declare global {
  interface Window {
    L: any;
  }
}

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
  structures: boolean;
  [key: string]: boolean; // Allow dynamic keys for KML layers
}

type ViewMode = 'SCHEMATIC' | 'MAP';
type BaseLayerType = 'STREET' | 'SATELLITE';

interface SelectedEntity {
  type: 'VEHICLE' | 'RFI' | 'WORKSITE' | 'STRUCTURE';
  data: any;
}

interface KmlSegment {
    coords: [number, number][]; // [lat, lng]
    projectedPoints: { x: number, y: number, dist: number }[];
    length: number;
    startChainage: number;
    endChainage: number;
}

interface KmlLayerGroup {
    id: string;
    name: string; // Layer Name (e.g. "Centerline", "Edge")
    roadName: string; // Road Name (e.g. "Main Highway", "Service Road")
    segments: KmlSegment[];
    totalLength: number;
    color: string;
    svgPath: string;
    bounds: { minLat: number, maxLat: number, minLng: number, maxLng: number };
}

// --- Constants & Config ---
const DEFAULT_PROJECT_LENGTH_KM = 15;
const DEFAULT_ROAD_PATH_D = "M 50 350 C 200 350, 250 150, 400 150 S 750 300, 950 200";

// Mock Geo Coordinates for Project Start (0+000) and End (15+000)
const START_COORDS = [27.6588, 83.4633]; 
const END_COORDS = [27.7588, 83.4633]; // Approx 11km North

const LAYER_COLORS = ['#d946ef', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// --- Helper Functions ---
const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
}

const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

const formatChainage = (km: number) => {
    const k = Math.floor(km);
    const m = Math.round((km - k) * 1000);
    return `${k}+${String(m).padStart(3, '0')}`;
};

// Helper to parse KML into named groups
const parseKML = (text: string): Record<string, [number, number][][]> => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");
  const groups: Record<string, [number, number][][]> = {};
  
  // Method 1: Look for Placemarks with LineStrings
  const placemarks = xmlDoc.getElementsByTagName("Placemark");
  
  for (let i = 0; i < placemarks.length; i++) {
      const placemark = placemarks[i];
      let name = placemark.getElementsByTagName("name")[0]?.textContent || `Layer ${i + 1}`;
      name = name.trim();

      const lineStrings = placemark.getElementsByTagName("LineString");
      
      for (let j = 0; j < lineStrings.length; j++) {
          const coordsStr = lineStrings[j].getElementsByTagName("coordinates")[0]?.textContent;
          if (coordsStr) {
              const segmentPoints: [number, number][] = [];
              const coordPairs = coordsStr.trim().split(/\s+/);
              coordPairs.forEach(pair => {
                  const parts = pair.split(",");
                  if (parts.length >= 2) {
                      const lng = parseFloat(parts[0]);
                      const lat = parseFloat(parts[1]);
                      if (!isNaN(lat) && !isNaN(lng)) {
                          segmentPoints.push([lat, lng]);
                      }
                  }
              });
              if (segmentPoints.length > 0) {
                  if (!groups[name]) groups[name] = [];
                  groups[name].push(segmentPoints);
              }
          }
      }
  }
  
  // Method 2: Fallback if no placemarks but root LineString
  if (placemarks.length === 0) {
      const lineStrings = xmlDoc.getElementsByTagName("LineString");
      if (lineStrings.length > 0) {
          const name = "Imported Path";
          groups[name] = [];
          for (let j = 0; j < lineStrings.length; j++) {
            const coordsStr = lineStrings[j].getElementsByTagName("coordinates")[0]?.textContent;
            if (coordsStr) {
                const segmentPoints: [number, number][] = [];
                const coordPairs = coordsStr.trim().split(/\s+/);
                coordPairs.forEach(pair => {
                    const parts = pair.split(",");
                    if (parts.length >= 2) {
                        const lng = parseFloat(parts[0]);
                        const lat = parseFloat(parts[1]);
                        if (!isNaN(lat) && !isNaN(lng)) {
                            segmentPoints.push([lat, lng]);
                        }
                    }
                });
                if (segmentPoints.length > 0) {
                    groups[name].push(segmentPoints);
                }
            }
        }
      }
  }

  return groups;
};

const getStructureProgress = (str: StructureAsset) => {
    const total = str.components.length;
    if (total === 0) return 0;
    const completed = str.components.filter(c => c.completedQuantity >= c.totalQuantity && c.totalQuantity > 0).length;
    return Math.round((completed / total) * 100);
};

const LayerToggle: React.FC<{
  label: string;
  subLabel?: string;
  layerId: string;
  icon: any;
  isActive: boolean;
  onToggle: () => void;
}> = ({ label, subLabel, layerId, icon: Icon, isActive, onToggle }) => (
    <ListItem secondaryAction={<Switch edge="end" checked={isActive} onChange={onToggle} />}>
        <ListItemIcon><Icon /></ListItemIcon>
        <ListItemText primary={label} secondary={subLabel} />
    </ListItem>
);

const MapModule: React.FC<Props> = ({ project }) => {
  const theme = useTheme(); // Initialize useTheme
  const [activeLayers, setActiveLayers] = useState<LayerState>({
      boundaries: true,
      centerline: true,
      heatMap: false,
      workSites: true,
      machinery: true,
      rfis: true,
      structures: true
  });

  const [viewMode, setViewMode] = useState<ViewMode>('SCHEMATIC');
  const [baseLayer, setBaseLayer] = useState<BaseLayerType>('STREET');
  const [isLiveTracking, setIsLiveTracking] = useState(true);
  const [gpsOffsets, setGpsOffsets] = useState<Record<string, number>>({});
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  
  // Custom KML Data State
  const [kmlLayers, setKmlLayers] = useState<KmlLayerGroup[]>([]);
  const [referenceLayerId, setReferenceLayerId] = useState<string | null>(null); 
  
  // Multiple Road Support
  const [importRoadName, setImportRoadName] = useState("Main Carriageway");
  const [activeRoad, setActiveRoad] = useState<string>("Main Carriageway");

  const [showLayersPanel, setShowLayersPanel] = useState(true);
  const [roadNameError, setRoadNameError] = useState('');
  const [kmlImporting, setKmlImporting] = useState(false);

  // SVG Transformation State (Pan/Zoom)
  const [svgTransform, setSvgTransform] = useState({ x: 0, y: 0, scale: 1 });
  const isDraggingSvg = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Leaflet Map Refs
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layerGroupsRef = useRef<any>({});
  const tileLayerRef = useRef<any>(null);

  const validateRoadName = () => {
      if (!importRoadName.trim()) {
          setRoadNameError('Road Name is required.');
          return false;
      }
      setRoadNameError('');
      return true;
  };

  // Get unique road names from layers
  const roadNames = useMemo(() => {
      const names = new Set(kmlLayers.map(l => l.roadName));
      if (names.size === 0) return ["Main Carriageway"];
      return Array.from(names).sort();
  }, [kmlLayers]);

  // Ensure activeRoad is valid
  useEffect(() => {
      if (roadNames.length > 0 && !roadNames.includes(activeRoad)) {
          setActiveRoad(roadNames[0]);
      }
  }, [roadNames, activeRoad]);

  // Derived Project Length (Specific to Active Road)
  const projectLength = useMemo(() => {
      // Find Reference Layer for the ACTIVE ROAD
      const refLayer = kmlLayers.find(l => l.id === referenceLayerId && l.roadName === activeRoad);
      
      if (refLayer) {
          return parseFloat(refLayer.totalLength.toFixed(2));
      }
      
      // Fallback: Use longest layer of active road
      const activeRoadLayers = kmlLayers.filter(l => l.roadName === activeRoad);
      if (activeRoadLayers.length > 0) {
          const longest = activeRoadLayers.reduce((prev, current) => (prev.totalLength > current.totalLength) ? prev : current);
          return parseFloat(longest.totalLength.toFixed(2));
      }

      return DEFAULT_PROJECT_LENGTH_KM;
  }, [referenceLayerId, kmlLayers, activeRoad]);

  // Reference Layer Data Shortcut
  const referenceData = useMemo(() => {
      // Priority 1: Explicitly selected reference IF it belongs to active road
      const explicit = kmlLayers.find(l => l.id === referenceLayerId && l.roadName === activeRoad);
      if (explicit) return explicit;

      // Priority 2: Try finding "Centerline" or "CL" in active road
      const activeRoadLayers = kmlLayers.filter(l => l.roadName === activeRoad);
      const implicit = activeRoadLayers.find(l => /RC|Centerline|CL|Alignment/i.test(l.name));
      if (implicit) return implicit;

      // Priority 3: Longest layer in active road
      if (activeRoadLayers.length > 0) {
          return activeRoadLayers.reduce((prev, current) => (prev.totalLength > current.totalLength) ? prev : current);
      }

      return null;
  }, [referenceLayerId, kmlLayers, activeRoad]);

  // Simulated GPS Movement
  useEffect(() => {
    if (!isLiveTracking) return;
    const interval = setInterval(() => {
        setGpsOffsets(prev => {
            const next = { ...prev };
            (project.vehicles || []).forEach(v => {
                if (v.status === 'Active') {
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

  // --- Dynamic Position Logic ---
  const getPositionOnRoad = (chainageStr: string, totalLen: number, offsetPercent = 0) => {
      let km = 0;
      if (typeof chainageStr === 'string' && chainageStr.includes('+')) {
          const match = chainageStr.match(/(\d+)\+(\d+)/);
          if (match) {
              km = parseInt(match[1]) + (parseInt(match[2]) / 1000);
          }
      } else {
          km = parseFloat(chainageStr) || 0;
      }

      // Add dynamic GPS offset
      if (offsetPercent !== 0) {
          km += (offsetPercent / 100) * totalLen;
      }
      
      km = Math.max(0, Math.min(totalLen, km));

      // 1. Use Reference KML Geometry if available
      if (referenceData) {
          const targetSegment = referenceData.segments.find(seg => 
              km >= seg.startChainage && km <= seg.endChainage
          ) || referenceData.segments[referenceData.segments.length - 1];

          if (targetSegment) {
              const { projectedPoints } = targetSegment;
              const localKm = km - targetSegment.startChainage;
              
              for (let i = 0; i < projectedPoints.length - 1; i++) {
                  const p1 = projectedPoints[i];
                  const p2 = projectedPoints[i+1];
                  
                  if (localKm >= p1.dist && localKm <= p2.dist) {
                      const segmentLen = p2.dist - p1.dist;
                      const ratio = segmentLen === 0 ? 0 : (localKm - p1.dist) / segmentLen;
                      
                      return {
                          x: p1.x + (p2.x - p1.x) * ratio,
                          y: p1.y + (p2.y - p1.y) * ratio,
                          km
                      };
                  }
              }
              const last = projectedPoints[projectedPoints.length - 1];
              return { x: last.x, y: last.y, km };
          }
      } 
      
      // 2. Default S-Curve Logic
      let t = (km / totalLen) * 100;
      t = Math.max(0, Math.min(100, t));
      const x = t * 9 + 50; 
      let y = 350;
      if (t < 40) {
          const localT = t / 40; 
          y = 350 - (200 * Math.sin(localT * Math.PI / 2)); 
      } else {
          const localT = (t - 40) / 60;
          y = 150 + (50 * Math.sin(localT * Math.PI));
      }
      return { x, y, km };
  };

  const getGeoFromChainage = (chainageStr: string, totalLen: number) => {
      const { km } = getPositionOnRoad(chainageStr, totalLen);
      
      if (referenceData) {
          const targetSegment = referenceData.segments.find(seg => 
              km >= seg.startChainage && km <= seg.endChainage
          ) || referenceData.segments[referenceData.segments.length - 1];

          if (targetSegment) {
              const { coords, projectedPoints } = targetSegment;
              const localKm = km - targetSegment.startChainage;

              for (let i = 0; i < projectedPoints.length - 1; i++) {
                  if (localKm >= projectedPoints[i].dist && localKm <= projectedPoints[i+1].dist) {
                      const segmentLen = projectedPoints[i+1].dist - projectedPoints[i].dist;
                      const ratio = segmentLen === 0 ? 0 : (localKm - projectedPoints[i].dist) / segmentLen;
                      
                      const p1 = coords[i];
                      const p2 = coords[i+1];
                      return [
                          p1[0] + (p2[0] - p1[0]) * ratio,
                          p1[1] + (p2[1] - p1[1]) * ratio
                      ];
                  }
              }
              return coords[coords.length-1];
          }
      }

      const ratio = Math.min(1, Math.max(0, km / totalLen));
      const lat = START_COORDS[0] + (END_COORDS[0] - START_COORDS[0]) * ratio;
      const lng = START_COORDS[1] + (END_COORDS[1] - START_COORDS[1]) * ratio;
      const lngOffset = Math.sin(ratio * Math.PI * 2) * 0.01;
      return [lat, lng + lngOffset];
  };

  // Derived Data
  const heatMapSegments = useMemo(() => {
      const segments = [];
      const step = projectLength / 20; 
      for (let i = 0; i < projectLength; i += step) {
          const intensity = (i * 7) % 10; 
          let color = 'transparent';
          if (intensity > 7) color = viewMode === 'SCHEMATIC' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(220, 38, 38, 0.6)'; 
          else if (intensity > 4) color = viewMode === 'SCHEMATIC' ? 'rgba(234, 179, 8, 0.4)' : 'rgba(202, 138, 4, 0.6)'; 
          
          if (color !== 'transparent') {
              const start = getPositionOnRoad(`${i}+000`, projectLength);
              const end = getPositionOnRoad(`${i + step}+000`, projectLength);
              segments.push({ start, end, color, id: i });
          }
      }
      return segments;
  }, [viewMode, projectLength, referenceData]);

  const activeVehicles = (project.vehicles || []).filter(v => v.status === 'Active');
  const openRFIs = (project.rfis || []).filter(r => r.status === RFIStatus.OPEN);
  const activeWorkSites = (project.schedule || [])
    .filter(s => s.status === 'On Track')
    .map((s, i) => ({
        id: s.id,
        name: s.name,
        location: `${2 + (i*3)}+000`, 
        progress: s.progress
    }));
  const structures = project.structures || [];

  const toggleLayer = (layer: string) => {
      setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleKmlImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
          // Process files sequentially
          Array.from(files).forEach((file: File, fileIndex) => {
              const reader = new FileReader();
              reader.onload = (event) => {
                  const text = event.target?.result as string;
                  try {
                      const groupedSegments = parseKML(text);
                      const newLayers: KmlLayerGroup[] = [];
                      let colorIdx = kmlLayers.length; // Start color from current count

                      // Config for SVG Projection
                      const PAD_X = 50;
                      const PAD_Y = 50;
                      const WIDTH = 900;
                      const HEIGHT = 400;

                      // 1. Calculate Global Bounds from ALL points in this file
                      let allPoints: [number, number][] = [];
                      Object.values(groupedSegments).forEach(segs => segs.forEach(s => allPoints = allPoints.concat(s)));
                      
                      if (allPoints.length === 0) {
                          if (files.length === 1) alert("No valid paths found in KML.");
                          return;
                      }

                      const lats = allPoints.map(p => p[0]);
                      const lngs = allPoints.map(p => p[1]);
                      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
                      const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
                      const latSpan = maxLat - minLat || 0.001;
                      const lngSpan = maxLng - minLng || 0.001;

                      // 2. Process Groups
                      Object.entries(groupedSegments).forEach(([name, segments]) => {
                          let layerLength = 0;
                          const processedSegments: KmlSegment[] = [];
                          const svgPaths: string[] = [];

                          segments.forEach(segCoords => {
                              let segmentLength = 0;
                              const projectedPoints: { x: number, y: number, dist: number }[] = [];
                              
                              // First point
                              const nLat0 = (segCoords[0][0] - minLat) / latSpan;
                              const nLng0 = (segCoords[0][1] - minLng) / lngSpan;
                              projectedPoints.push({
                                  x: PAD_X + (nLng0 * WIDTH),
                                  y: (HEIGHT + PAD_Y) - (nLat0 * HEIGHT),
                                  dist: 0
                              });

                              for (let i = 0; i < segCoords.length - 1; i++) {
                                  const d = getDistanceFromLatLonInKm(
                                      segCoords[i][0], segCoords[i][1],
                                      segCoords[i+1][0], segCoords[i+1][1]
                                  );
                                  segmentLength += d;
                                  
                                  const nLat = (segCoords[i+1][0] - minLat) / latSpan;
                                  const nLng = (segCoords[i+1][1] - minLng) / lngSpan;
                                  
                                  projectedPoints.push({
                                      x: PAD_X + (nLng * WIDTH),
                                      y: (HEIGHT + PAD_Y) - (nLat * HEIGHT),
                                      dist: segmentLength
                                  });
                              }

                              const segPathD = `M ${projectedPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;
                              svgPaths.push(segPathD);

                              processedSegments.push({
                                  coords: segCoords,
                                  projectedPoints,
                                  length: segmentLength,
                                  startChainage: layerLength,
                                  endChainage: layerLength + segmentLength
                              });

                              layerLength += segmentLength;
                          });

                          // Ensure unique ID
                          const layerId = `kml-${name.replace(/\s/g, '_')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                          newLayers.push({
                              id: layerId,
                              name: name,
                              roadName: importRoadName, // Assign the road name from Input
                              segments: processedSegments,
                              totalLength: layerLength,
                              color: LAYER_COLORS[colorIdx % LAYER_COLORS.length],
                              svgPath: svgPaths.join(' '),
                              bounds: { minLat, maxLat, minLng, maxLng }
                          });
                          colorIdx++;
                      });

                      // Update State - APPENDING new layers
                      setKmlLayers(prev => {
                          const updated = [...prev, ...newLayers];
                          return updated;
                      });
                      
                      // Activate new layers
                      setActiveLayers(prev => {
                          const next = { ...prev };
                          newLayers.forEach(l => next[l.id] = true);
                          return next;
                      });

                      // Automatically switch to the new road context if it's new
                      setActiveRoad(importRoadName);
                      setViewMode('SCHEMATIC');

                  } catch (err) {
                      console.error("KML Parse Error:", err);
                      alert("Failed to parse KML file.");
                  }
              };
              reader.readAsText(file);
          });
      }
  };

  const handleClearKml = () => {
      if(confirm("Are you sure you want to clear all imported map layers?")) {
          setKmlLayers([]);
          setReferenceLayerId(null);
      }
  };

  // --- Map Controls Handling ---
  const handleZoomIn = () => {
      if (viewMode === 'MAP' && mapRef.current) {
          mapRef.current.zoomIn();
      } else {
          setSvgTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 5) }));
      }
  };

  const handleZoomOut = () => {
      if (viewMode === 'MAP' && mapRef.current) {
          mapRef.current.zoomOut();
      } else {
          setSvgTransform(prev => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.5) }));
      }
  };

  const handleResetView = () => {
      if (viewMode === 'MAP' && mapRef.current) {
          // Calculate bounds of ACTIVE ROAD layers if available
          let bounds: any = null;
          const activeRoadLayers = kmlLayers.filter(l => l.roadName === activeRoad);
          
          if (activeRoadLayers.length > 0) {
              const allLats = activeRoadLayers.flatMap(l => [l.bounds.minLat, l.bounds.maxLat]);
              const allLngs = activeRoadLayers.flatMap(l => [l.bounds.minLng, l.bounds.maxLng]);
              bounds = window.L.latLngBounds(
                  [Math.min(...allLats), Math.min(...allLngs)],
                  [Math.max(...allLats), Math.max(...allLngs)]
              );
          }
          
          if (bounds) {
              mapRef.current.fitBounds(bounds);
          } else {
              mapRef.current.setView(START_COORDS, 13);
          }
      } else {
          setSvgTransform({ x: 0, y: 0, scale: 1 });
      }
  };

  // --- SVG Pan Logic ---
  const handleSvgMouseDown = (e: React.MouseEvent) => {
      if (viewMode !== 'SCHEMATIC') return;
      isDraggingSvg.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleSvgMouseMove = (e: React.MouseEvent) => {
      if (!isDraggingSvg.current || viewMode !== 'SCHEMATIC') return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      setSvgTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  };

  const handleSvgMouseUp = () => {
      isDraggingSvg.current = false;
  };

  const handleSvgWheel = (e: React.WheelEvent) => {
      if (viewMode !== 'SCHEMATIC') return;
      const scaleFactor = 0.001;
      const newScale = Math.min(Math.max(0.5, svgTransform.scale + (-e.deltaY * scaleFactor)), 5);
      setSvgTransform(prev => ({ ...prev, scale: newScale }));
  };

  const isSchematic = viewMode === 'SCHEMATIC';
  const bgColor = isSchematic ? 'bg-slate-900' : 'bg-slate-100'; 
  const gridColor = isSchematic ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const roadColor = isSchematic ? theme.palette.primary.dark : theme.palette.text.secondary;
  const stripingColor = isSchematic ? theme.palette.warning.main : theme.palette.grey[300];

  // --- Leaflet Map Initialization ---
  useEffect(() => {
    if (viewMode === 'MAP' && mapContainerRef.current && !mapRef.current) {
        if (!window.L) return;

        const centerLat = referenceData ? (referenceData.bounds.minLat + referenceData.bounds.maxLat)/2 : START_COORDS[0];
        const centerLng = referenceData ? (referenceData.bounds.minLng + referenceData.bounds.maxLng)/2 : START_COORDS[1];

        const map = window.L.map(mapContainerRef.current, { zoomControl: false }).setView([centerLat, centerLng], 13);
        mapRef.current = map;

        // Initialize Layer Groups
        layerGroupsRef.current = {
            boundaries: window.L.layerGroup().addTo(map),
            centerline: window.L.layerGroup().addTo(map),
            workSites: window.L.layerGroup().addTo(map),
            machinery: window.L.layerGroup().addTo(map),
            rfis: window.L.layerGroup().addTo(map),
            structures: window.L.layerGroup().addTo(map),
            kmlLayer: window.L.layerGroup().addTo(map)
        };
    } else if (viewMode === 'SCHEMATIC' && mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        tileLayerRef.current = null;
    }
  }, [viewMode]);

  // --- Handle Base Layer Switching ---
  useEffect(() => {
    if (viewMode === 'MAP' && mapRef.current && window.L) {
        if (tileLayerRef.current) {
            mapRef.current.removeLayer(tileLayerRef.current);
        }

        let layerUrl = '';
        let attribution = '';

        if (baseLayer === 'SATELLITE') {
            layerUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
            attribution = 'Tiles &copy; Esri';
        } else {
            layerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            attribution = '&copy; OpenStreetMap';
        }

        tileLayerRef.current = window.L.tileLayer(layerUrl, { attribution }).addTo(mapRef.current);
        tileLayerRef.current.bringToBack();
    }
  }, [viewMode, baseLayer]);

  // --- Update Leaflet Overlays ---
  useEffect(() => {
      if (viewMode !== 'MAP' || !mapRef.current) return;
      const L = window.L;
      const layers = layerGroupsRef.current;

      // 1. Boundaries / Default Path
      layers.boundaries.clearLayers();
      if (activeLayers.boundaries && !referenceData) {
          const boundaryPoints = [];
          for(let i=0; i<=projectLength; i+=0.5) {
              boundaryPoints.push(getGeoFromChainage(`${i}+000`, projectLength));
          }
          L.polyline(boundaryPoints, { 
              color: theme.palette.text.disabled, 
              weight: 40, 
              opacity: 0.2, 
              lineCap: 'round',
              lineJoin: 'round'
          }).addTo(layers.boundaries);
      }

      // 2. KML Layers (All Imported Paths)
      layers.kmlLayer.clearLayers();
      
      // Sort to put reference layer on top
      const sortedLayers = [...kmlLayers].sort((a, b) => {
          if (a.id === referenceLayerId) return 1;
          if (b.id === referenceLayerId) return -1;
          return 0;
      });

      sortedLayers.forEach(layer => {
          if (activeLayers[layer.id]) {
              const isRef = layer.id === referenceLayerId;
              // Dim layers not in active road context
              const isInactiveRoad = layer.roadName !== activeRoad;
              
              const weight = isRef ? 5 : 3;
              const opacity = isInactiveRoad ? 0.2 : (isRef ? 1 : 0.6);
              const dashArray = isRef ? null : '5, 10';
              const color = isInactiveRoad ? theme.palette.text.disabled : layer.color;

              layer.segments.forEach(seg => {
                  if (isRef) {
                      // Thick casing for reference
                      L.polyline(seg.coords, { color: 'white', weight: 8, opacity: 0.8 }).addTo(layers.kmlLayer);
                  }
                  
                  L.polyline(seg.coords, { 
                      color, 
                      weight, 
                      opacity,
                      dashArray 
                  }).bindPopup(`
                      <div class="p-2">
                          <div class="font-bold text-sm">${layer.name}</div>
                          <div class="text-xs text-slate-500 mb-1">${layer.roadName}</div>
                          ${isRef ? 
                              `<div class="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold mb-2 border border-blue-200">Active Reference Alignment</div>` 
                              : ''}
                          <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                              <div class="text-slate-500">Length:</div>
                              <div class="font-mono">${layer.totalLength.toFixed(3)} km</div>
                              ${isRef ? `
                                  <div class="text-slate-500">Start:</div>
                                  <div class="font-mono">0+000</div>
                                  <div class="text-slate-500">End:</div>
                                  <div class="font-mono">${formatChainage(layer.totalLength)}</div>
                              ` : ''}
                          </div>
                      </div>
                  `).addTo(layers.kmlLayer);
              });
          }
      });

      // 4. Machinery (Always visible, projected onto active road if needed)
      layers.machinery.clearLayers();
      if (activeLayers.machinery) {
          activeVehicles.forEach((v, i) => {
              // Note: Ideally vehicle has lat/long. Here we simulate projecting chainage onto ACTIVE road.
              const mockBaseKm = (i * 2.5) + 1;
              const geo = getGeoFromChainage(`${mockBaseKm}+000`, projectLength);
              const marker = L.circleMarker(geo, {
                  radius: 8,
                  fillColor: theme.palette.primary.main,
                  color: theme.palette.common.white,
                  weight: 2,
                  fillOpacity: 0.8
              }).bindPopup(`<b>${v.plateNumber}</b><br>${v.type}`);
              marker.on('click', () => setSelectedEntity({type: 'VEHICLE', data: v}));
              marker.addTo(layers.machinery);
          });
      }

      // 5. RFIs
      layers.rfis.clearLayers();
      if (activeLayers.rfis) {
          openRFIs.forEach(r => {
              // For a real app, check r.roadName === activeRoad. Here we just project all.
              const geo = getGeoFromChainage(r.location, projectLength);
              const icon = L.divIcon({
                  html: `<div style="color: ${theme.palette.error.main};"><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z"/></svg></div>`,
                  className: 'bg-transparent',
                  iconSize: [24, 24],
                  iconAnchor: [12, 24]
              });
              const marker = L.marker(geo, { icon }).bindPopup(`<b>RFI: ${r.rfiNumber}</b><br>${r.location}`);
              marker.on('click', () => setSelectedEntity({type: 'RFI', data: r}));
              marker.addTo(layers.rfis);
          });
      }

      // 6. Work Sites
      layers.workSites.clearLayers();
      if (activeLayers.workSites) {
          activeWorkSites.forEach(site => {
              const geo = getGeoFromChainage(site.location, projectLength);
              const circle = L.circle(geo, {
                  radius: 200,
                  color: theme.palette.success.main,
                  fillColor: theme.palette.success.main,
                  fillOpacity: 0.3
              }).bindPopup(`<b>${site.name}</b><br>Progress: ${site.progress}%`);
              circle.on('click', () => setSelectedEntity({type: 'WORKSITE', data: site}));
              circle.addTo(layers.workSites);
          });
      }

      // 7. Structures
      layers.structures.clearLayers();
      if (activeLayers.structures) {
          structures.forEach(str => {
              const geo = getGeoFromChainage(str.location, projectLength);
              const progress = getStructureProgress(str);
              const color = str.status === 'Completed' ? theme.palette.success.main : str.status === 'In Progress' ? theme.palette.info.main : theme.palette.text.secondary;
              
              const iconHtml = `<div style="background-color: ${color}; width: 14px; height: 14px; transform: rotate(45deg); border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`;
              const icon = L.divIcon({
                  html: iconHtml,
                  className: 'bg-transparent',
                  iconSize: [14, 14],
                  iconAnchor: [7, 7]
              });

              const marker = L.marker(geo, { icon }).bindPopup(`<b>${str.name}</b><br>${str.type}<br>Progress: ${progress}%`);
              marker.on('click', () => setSelectedEntity({type: 'STRUCTURE', data: str}));
              marker.addTo(layers.structures);
          });
      }

  }, [viewMode, activeLayers, project, activeVehicles, openRFIs, activeWorkSites, structures, kmlLayers, referenceLayerId, projectLength, baseLayer, activeRoad]);

    return (

      <Grid container spacing={2} sx={{ height: 'calc(100vh - 160px)' }}>

        <Grid item xs={12} md={4} lg={3}>

          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

            <CardContent>
              <Typography variant="h6" fontWeight="bold">GIS Overview</Typography>
              <List dense>
                  <ListItem>
                      <ListItemText primary="Project Name" secondary={project.name} />
                  </ListItem>
                  <ListItem>
                      <ListItemText primary="Project ID" secondary={project.id} />
                  </ListItem>
                  <ListItem>
                      <ListItemText primary="Active Road" secondary={activeRoad} />
                  </ListItem>
                  <ListItem>
                      <ListItemText primary="Project Length" secondary={`${projectLength.toFixed(2)} km`} />
                  </ListItem>
              </List>

              <Typography variant="subtitle2" fontWeight="bold" mt={2}>Assets Summary</Typography>
              <List dense>
                  <ListItem>
                      <ListItemText primary="Active Machinery" secondary={activeVehicles.length} />
                  </ListItem>
                  <ListItem>
                      <ListItemText primary="Open RFIs" secondary={openRFIs.length} />
                  </ListItem>
                  <ListItem>
                      <ListItemText primary="Active Work Sites" secondary={activeWorkSites.length} />
                  </ListItem>
                  <ListItem>
                      <ListItemText primary="Total Structures" secondary={structures.length} />
                  </ListItem>
              </List>

              {kmlLayers.length > 0 && (
                  <>
                      <Typography variant="subtitle2" fontWeight="bold" mt={2}>KML Layers ({kmlLayers.length})</Typography>
                      <List dense sx={{ maxHeight: 200, overflowY: 'auto' }}>
                                                      {kmlLayers.map(layer => (
                                                          <ListItem 
                                                              key={layer.id} 
                                                              sx={{ 
                                                                  bgcolor: layer.id === referenceLayerId ? 'action.selected' : 'transparent', 
                                                                  borderRadius: 1, 
                                                                  mb: 0.5,
                                                                  cursor: 'pointer'
                                                              }} 
                                                              onClick={() => setReferenceLayerId(layer.id)}
                                                          >
                                                              <ListItemText 
                                                                  primary={<span >{layer.name}</span>} 
                                                                  primaryTypographyProps={{ style: { color: layer.color } }}
                                                                  secondary={`${layer.roadName} - ${layer.totalLength.toFixed(2)} km`} 
                                                              />
                                                              {layer.id === referenceLayerId && (
                                                                  <ListItemIcon sx={{ minWidth: 0, ml: 1 }}>
                                                                      <Target size={16} color="green"/>
                                                                  </ListItemIcon>
                                                              )}
                                                          </ListItem>
                                                      ))}                      </List>
                  </>
              )}

            </CardContent>

            {/* Controls and details will be refactored here */}

          </Card>

        </Grid>

        <Grid item xs={12} md={8} lg={9}>

          <Paper sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>

            {/* MAP CONTAINER (Leaflet) */}
            <div 
              ref={mapContainerRef} 
              id="leaflet-map"
              style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 0, display: viewMode === 'MAP' ? 'block' : 'none' }}
            ></div>

            {/* SVG SCHEMATIC VIEW */}
            {viewMode === 'SCHEMATIC' && (
                  <Box
                      sx={{
                          width: '100%',
                          height: '100%',
                          p: '2rem',
                          cursor: 'grab',
                          position: 'relative',
                          zIndex: 10
                      }}
                      onMouseDown={handleSvgMouseDown}
                      onMouseMove={handleSvgMouseMove}
                      onMouseUp={handleSvgMouseUp}
                      onMouseLeave={handleSvgMouseUp}
                      onWheel={handleSvgWheel}
                  >
                      <svg viewBox="0 0 1000 500">
                          <g transform={`translate(${svgTransform.x}, ${svgTransform.y}) scale(${svgTransform.scale})`} style={{ transformOrigin: 'center' }}>
                          <defs>
                              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                  <feMerge>
                                      <feMergeNode in="coloredBlur"/>
                                      <feMergeNode in="SourceGraphic"/>
                                  </feMerge>
                              </filter>
                              <radialGradient id="workZoneGrad">
                                  <stop offset="0%" stopColor={theme.palette.success.main} stopOpacity="0.6"/>
                                  <stop offset="100%" stopColor={theme.palette.success.main} stopOpacity="0"/>
                              </radialGradient>
                          </defs>

                          {/* Layer 1: Road Alignment (Reference Layer for Active Road) */}
                          <path 
                              d={referenceData ? referenceData.svgPath : DEFAULT_ROAD_PATH_D} 
                              fill="none" 
                              stroke={roadColor} 
                              strokeWidth="14" 
                              strokeLinecap="round" 
                              filter={referenceData ? "url(#glow)" : undefined}
                          />
                          <path 
                              d={referenceData ? referenceData.svgPath : DEFAULT_ROAD_PATH_D} 
                              fill="none" 
                              stroke={stripingColor} 
                              strokeWidth="2" 
                              strokeDasharray="8 8" 
                              strokeOpacity="0.8"
                          />

                          {/* Layer 2: Structures */}
                          {activeLayers.structures && structures.map(str => {
                              const pt = getPositionOnRoad(str.location, projectLength);
                              const isSelected = selectedEntity?.type === 'STRUCTURE' && selectedEntity?.data.id === str.id;
                              const color = str.status === 'Completed' ? '#10b981' : str.status === 'In Progress' ? '#3b82f6' : '#64748b';

                              return (
                                  <g 
                                      key={`str-${str.id}`} 
                                      transform={`translate(${pt.x}, ${pt.y})`}
                                      onClick={(e) => { e.stopPropagation(); setSelectedEntity({type: 'STRUCTURE', data: str}); }}
                                      style={{ cursor: 'pointer' }}
                                  >
                                      <rect 
                                          x="-8" y="-8" width="16" height="16" 
                                          fill={color} 
                                          stroke="white" 
                                          strokeWidth="2"
                                          transform="rotate(45)"
                                          style={{ filter: isSelected ? "drop-shadow(0 0 5px rgba(255,255,255,0.7))" : "none" }}
                                      />
                                      {isSelected && <circle r="20" fill="none" stroke={color} strokeWidth="1" strokeDasharray="4 2" className="animate-spin-slow"/>}
                                  </g>
                              );
                          })}

                          {/* Layer 3: Active Work Sites */}
                          {activeLayers.workSites && activeWorkSites.map((site) => {
                              const pt = getPositionOnRoad(site.location, projectLength);
                              const isSelected = selectedEntity?.type === 'WORKSITE' && selectedEntity?.data.id === site.id;
                              
                              return (
                                  <g 
                                      key={`site-${site.id}`} 
                                      transform={`translate(${pt.x}, ${pt.y})`}
                                      onClick={(e) => { e.stopPropagation(); setSelectedEntity({type: 'WORKSITE', data: site}); }}
                                      style={{ cursor: 'pointer', opacity: isSelected ? 1 : 0.9 }}
                                  >
                                      <circle r={isSelected ? 30 : 25} fill="url(#workZoneGrad)" style={{ animation: isSelected ? "none" : "pulse 1.5s infinite" }} />
                                      <Cone size={14} x="-7" y="-7" style={{ color: theme.palette.success.light, filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))' }} fill="currentColor"/>
                                  </g>
                              );
                          })}

                          {/* Layer 4: Machinery GPS */}
                          {activeLayers.machinery && activeVehicles.map((v, i) => {
                              const mockBaseKm = (i * 2.5) + 1; 
                              const pt = getPositionOnRoad(`${mockBaseKm}+000`, projectLength, gpsOffsets[v.id] || 0);
                              const isSelected = selectedEntity?.type === 'VEHICLE' && selectedEntity?.data.id === v.id;
                              
                              return (
                                  <g 
                                      key={v.id} 
                                      style={{ transition: 'transform 1s linear', cursor: 'pointer' }} 
                                      transform={`translate(${pt.x}, ${pt.y})`} 
                                      onClick={(e) => { e.stopPropagation(); setSelectedEntity({type: 'VEHICLE', data: v}); }}
                                  >
                                      <circle r={isSelected ? 16 : 12} fill={isSelected ? "rgba(99, 102, 241, 0.5)" : "rgba(99, 102, 241, 0.3)"} style={{ animation: isLiveTracking && !isSelected ? "ping 1s infinite" : "none" }} />
                                      <circle r="7" fill={theme.palette.primary.main} stroke={theme.palette.common.white} strokeWidth="1.5" />
                                  </g>
                              );
                          })}

                          {/* Layer 5: Open RFIs (Issues) */}
                          {activeLayers.rfis && openRFIs.map((r, i) => {
                              const pt = getPositionOnRoad(r.location, projectLength);
                              const isSelected = selectedEntity?.type === 'RFI' && selectedEntity?.data.id === r.id;

                              return (
                                  <g 
                                      key={r.id} 
                                      transform={`translate(${pt.x}, ${pt.y - 12})`} 
                                      onClick={(e) => { e.stopPropagation(); setSelectedEntity({type: 'RFI', data: r}); }}
                                      style={{ cursor: 'pointer' }}
                                  >
                                      <path d="M0,0 L0,-14 L-8,-22 L8,-22 L0,-14 Z" fill={isSelected ? theme.palette.error.dark : theme.palette.error.main} stroke={theme.palette.error.dark} strokeWidth="1" />
                                      <circle cx="0" cy="-24" r={isSelected ? 6 : 4} fill={theme.palette.error.main} stroke={theme.palette.common.white} strokeWidth="1.5" />
                                  </g>
                              );
                          })}
                                                </g>
                                            </svg>
                                        </Box>
                                  )}            
            {/* Grid Pattern Background - Only for Schematic */}
            {viewMode === 'SCHEMATIC' && (
                <Box 
                    sx={{
                        position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none',
                        backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`, 
                        backgroundSize: '40px 40px',
                        transform: `translate(${svgTransform.x}px, ${svgTransform.y}px) scale(${svgTransform.scale})`,
                        transformOrigin: 'center'
                    }}
                />
            )}

            {/* Floating Layer Controls */}
            <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000 }}>
                <Card sx={{ width: 250, overflow: 'hidden' }}>
                    <Button 
                        onClick={() => setShowLayersPanel(!showLayersPanel)} 
                        fullWidth 
                        sx={{ justifyContent: 'space-between', p: 2, bgcolor: 'grey.50' }}
                        endIcon={showLayersPanel ? <X size={16}/> : <Settings size={16}/>}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Layers size={16} />
                            <span>Map Layers</span>
                        </Box>
                    </Button>
                    {showLayersPanel && (
                        <CardContent sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            <Typography variant="overline" display="block">View Mode</Typography>
                            <ToggleButtonGroup
                                value={viewMode} exclusive onChange={(_, newView) => newView && setViewMode(newView)} size="small" fullWidth sx={{ mb: 2 }}
                            >
                                <ToggleButton value="SCHEMATIC">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <MapIcon size={16} />
                                        <span>Schematic</span>
                                    </Box>
                                </ToggleButton>
                                <ToggleButton value="MAP">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Globe size={16} />
                                        <span>Real Map</span>
                                    </Box>
                                </ToggleButton>
                            </ToggleButtonGroup>

                            <Typography variant="overline" display="block" mt={2}>KML Layers</Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <TextField 
                                    size="small" 
                                    label="Road Name" 
                                    value={importRoadName} 
                                    onChange={(e) => setImportRoadName(e.target.value)} 
                                    onBlur={validateRoadName}
                                    error={!!roadNameError}
                                    helperText={roadNameError}
                                    fullWidth 
                                />
                                <Button component="label" variant="outlined" startIcon={kmlImporting ? <CircularProgress size={20} /> : <FileUp />} disabled={kmlImporting}>
                                    {kmlImporting ? 'Importing...' : 'KML'}
                                    <input type="file" hidden accept=".kml" multiple onChange={handleKmlImport} disabled={kmlImporting} />
                                </Button>
                            </Box>
                            {kmlLayers.length > 0 && (
                                <List dense>
                                    {kmlLayers.map(layer => (
                                        <LayerToggle key={layer.id} label={layer.name} subLabel={layer.roadName} layerId={layer.id} icon={FileUp} 
                                        isActive={activeLayers[layer.id]} onToggle={() => toggleLayer(layer.id)} />
                                    ))}
                                    <ListItem secondaryAction={<IconButton edge="end" onClick={handleClearKml} aria-label="Clear all KML layers" size="small" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><Trash2 size={16}/></IconButton>}><ListItemText primary="Clear All KML" /></ListItem>
                                </List>
                            )}

                            <Typography variant="overline" display="block" mt={2}>Project Assets</Typography>
                            <List dense>
                                <LayerToggle label="Work Sites" layerId="workSites" icon={Cone} isActive={activeLayers.workSites} onToggle={() => toggleLayer('workSites')} />
                                <LayerToggle label="Structures" layerId="structures" icon={Component} isActive={activeLayers.structures} onToggle={() => toggleLayer('structures')} />
                                <LayerToggle label="Fleet GPS" layerId="machinery" icon={Truck} isActive={activeLayers.machinery} onToggle={() => toggleLayer('machinery')} />
                                <LayerToggle label="RFIs" layerId="rfis" icon={AlertTriangle} isActive={activeLayers.rfis} onToggle={() => toggleLayer('rfis')} />
                            </List>
                        </CardContent>
                    )}
                </Card>
            </Box>

            {/* Right Side Controls */}
            <Box sx={{ position: 'absolute', top: '50%', right: 16, transform: 'translateY(-50%)', zIndex: 1000 }}>
                <Card sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <IconButton onClick={handleZoomIn} aria-label="Zoom in" size="small" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><Plus /></IconButton>
                    <IconButton onClick={handleResetView} aria-label="Reset map view" size="small" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><RefreshCw /></IconButton>
                    <IconButton onClick={handleZoomOut} aria-label="Zoom out" size="small" sx={{ minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}><Minus /></IconButton>
                </Card>
            </Box>

            {/* Live Tracking Toggle */}
            <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 1000 }}>
                <Button variant="contained" onClick={() => setIsLiveTracking(!isLiveTracking)} startIcon={<Globe />} color={isLiveTracking ? 'success' : 'primary'}>
                    {isLiveTracking ? 'Live Tracking ON' : 'Live Tracking OFF'}
                </Button>
            </Box>

          </Paper>
        </Grid>
      </Grid>
    );
}

export default MapModule;
