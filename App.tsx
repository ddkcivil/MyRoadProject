
import React, { useState, useEffect, useReducer, useContext } from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Avatar, 
  Badge,
  Menu,
  useMediaQuery,
  Button,
  Fade,
  Tooltip
} from '@mui/material';
import { 
  LayoutDashboard, 
  ClipboardList, 
  HardHat, 
  FlaskConical, 
  Truck, 
  FileText, 
  Settings, 
  Menu as MenuIcon,
  Bot,
  CalendarClock,
  Briefcase,
  ClipboardCheck,
  Users,
  Compass,
  Hammer,
  Map as MapIcon,
  Bell,
  LogOut,
  Search,
  ChevronRight,
  MessageSquare // Added Message Icon
} from 'lucide-react';
import { UserRole, Project, AppSettings, Message, WorkCategory, RFIStatus, StructureType } from './types';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import BOQManager from './components/BOQManager';
import RFIModule from './components/RFIModule';
import LabModule from './components/LabModule';
import ResourceManager from './components/ResourceManager';
import DocumentsModule from './components/DocumentsModule';
import ScheduleModule from './components/ScheduleModule';
import DailyReportModule from './components/DailyReportModule';
import ProjectsList from './components/ProjectsList';
import AIChatModal from './components/AIChatModal';
import PreConstructionModule from './components/PreConstructionModule';
import UserManagement from './components/UserManagement';
import SettingsModule from './components/SettingsModule';
import ConstructionModule from './components/ConstructionModule';
import MapModule from './components/MapModule';
import MessagesModule from './components/MessagesModule'; // Added Import

// Contexts
import { AuthContext, AuthProvider, SettingsContext, SettingsProvider } from './AuthAndSettingsContext';


// --- Premium Theme Setup ---
// Define the base theme first
const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3c3d69', // Dark Blue/Purple
      light: '#707292', // Lighter shade for primary
      dark: '#2b245b',  // Derived darker shade from primary
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8febe8', // Light Teal/Cyan
      light: '#c4bccd', // Lighter shade from background, good for secondary accent
      dark: '#3c3d69', // Derived darker shade from secondary
      contrastText: '#2b245b',
    },
    background: {
      default: '#c4bccd', // Light Grey/Purple
      paper: '#ffffff',
    },
    text: {
      primary: '#2b245b', // Dark text
      secondary: '#707292', // Lighter text
      disabled: '#707292',
    },
    error: { main: '#ef4444' }, // Using a valid hex code for red
    warning: { main: '#f59e0b' }, // Keeping original
    success: { main: '#22c55e' }, // Keeping original
    divider: '#707292', // Adjusted divider color
  },
  typography: {
    fontFamily: '"Figtree", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, fontSize: '2.5rem', letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.025em' },
    h3: { fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.025em' },
    h4: { fontWeight: 600, fontSize: '1.5rem' },
    h5: { fontWeight: 600, fontSize: '1.25rem' },
    h6: { fontWeight: 600, fontSize: '1.1rem' },
    subtitle1: { fontWeight: 500, fontSize: '1rem' },
    subtitle2: { fontWeight: 500, fontSize: '0.9rem' },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.875rem' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
    // Directly reference color if theme is not yet finalized, or pass baseTheme to createTheme
    caption: { fontSize: '0.75rem', color: '#707292' },
  },
  shape: {
    borderRadius: 12,
  },
});

// Create the final theme with component overrides
const theme = createTheme(baseTheme, {
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          padding: baseTheme.spacing(1.25, 2.5),
          transition: 'transform 0.15s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            transform: 'translateY(-2px)'
          },
          '&:active': {
            transform: 'translateY(0)'
          }
        },
        containedPrimary: {
           background: `linear-gradient(135deg, ${baseTheme.palette.primary.main} 0%, ${baseTheme.palette.primary.dark} 100%)`,
           boxShadow: `0 4px 12px ${baseTheme.palette.primary.light}33`,
           '&:hover': {
              boxShadow: `0 6px 18px ${baseTheme.palette.primary.light}55`,
           }
        },
      },
    },
    MuiCard: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${baseTheme.palette.divider}`,
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)',
           transition: 'box-shadow 0.3s cubic-bezier(.25,.8,.25,1), transform 0.3s cubic-bezier(.25,.8,.25,1)',
          '&:hover': {
             boxShadow: '0 10px 20px rgba(0,0,0,0.07), 0 3px 6px rgba(0,0,0,0.05)',
             transform: 'translateY(-2px)'
          }
        },
      },
    },
     MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Remove default gradient
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }
      }
    },
    MuiAppBar: {
        styleOverrides: {
            root: {
                backgroundColor: baseTheme.palette.background.paper,
                borderBottom: `1px solid ${baseTheme.palette.divider}`,
            },
            colorInherit: {
                 backgroundColor: baseTheme.palette.background.paper,
                 color: baseTheme.palette.text.primary,
            }
        }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          backgroundColor: baseTheme.palette.primary.dark,
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#ffffff',
            transition: 'all 0.2s ease-in-out',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: baseTheme.palette.primary.main
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: '1px',
            }
          }
        }
      }
    }
  },
});

const drawerWidth = 280;

const App: React.FC = () => {
  const { authState, dispatchAuth } = useContext(AuthContext);
  const { settingsState, dispatchSettings } = useContext(SettingsContext);

  // --- Data States (main application data) ---
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Nav State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  
  // Notification Simulation State
  const [notifications, setNotifications] = useState<string[]>([]);
  const [anchorElNotif, setAnchorElNotif] = useState<null | HTMLElement>(null);
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentProject = allProjects.find(p => p.id === selectedProjectId);
  const currentUser = allUsers.find(u => u.id === authState.currentUserId);

  // --- Mock Data Definitions (moved from constants.ts, used for initial seed) ---
  const MOCK_USERS_DEFINITION: User[] = [
    { id: 'u1', name: 'Admin User', email: 'admin@roadmaster.com', phone: '9779800000001', role: UserRole.ADMIN },
    { id: 'u2', name: 'Rajesh Kumar', email: 'pm@roadmaster.com', phone: '9779841234567', role: UserRole.PROJECT_MANAGER },
    { id: 'u3', name: 'John Doe', email: 'site@roadmaster.com', phone: '9779812345678', role: UserRole.SITE_ENGINEER },
    { id: 'u4', name: 'Sarah Lee', email: 'lab@roadmaster.com', phone: '9779809876543', role: UserRole.LAB_TECHNICIAN },
    { id: 'u5', name: 'Vikram Singh', email: 'supervisor@roadmaster.com', phone: '9779865432109', role: UserRole.SUPERVISOR },
  ];

  const MOCK_MESSAGES_INITIAL_DEFINITION: Message[] = [
    { 
        id: 'm1', 
        senderId: 'u2', 
        receiverId: 'general', 
        content: 'Team, please ensure all daily progress reports are submitted by 5 PM today.', 
        timestamp: new Date(Date.now() - 86400000).toISOString(), 
        read: true 
    },
    { 
        id: 'm2', 
        senderId: 'u3', 
        receiverId: 'general', 
        content: 'Noted sir. GSB work is ongoing at Ch 12+500, will update accordingly.', 
        timestamp: new Date(Date.now() - 82800000).toISOString(), 
        read: true 
    },
    { 
        id: 'm3', 
        senderId: 'u4', 
        receiverId: 'u2', 
        content: 'Sir, the cube test results for the Culvert at 10+200 are ready. Shall I upload?', 
        timestamp: new Date(Date.now() - 3600000).toISOString(), 
        read: false 
    },
  ];

  const PROJECT_1_BOQ = [
    {
      id: '1',
      itemNo: '2.01',
      description: 'Clearing and Grubbing of Road Land including uprooting rank vegetation, grass, bushes, shrubs, saplings and trees',
      unit: 'Ha',
      quantity: 15.5,
      rate: 50000,
      category: WorkCategory.EARTHWORK,
      completedQuantity: 12.0
    },
    {
      id: '2',
      itemNo: '3.01',
      description: 'Excavation in Soil for Roadway via mechanical means including cutting and loading in tippers',
      unit: 'cum',
      quantity: 45000,
      rate: 120,
      category: WorkCategory.EARTHWORK,
      completedQuantity: 30000
    },
    {
      id: '3',
      itemNo: '4.05',
      description: 'Granular Sub-Base (GSB) Grade-I with well graded material, spreading in uniform layers with motor grader',
      unit: 'cum',
      quantity: 12500,
      rate: 1800,
      category: WorkCategory.PAVEMENT,
      completedQuantity: 6000
    },
    {
      id: '4',
      itemNo: '4.08',
      description: 'Wet Mix Macadam (WMM) base course providing, laying, spreading and compacting graded stone aggregate',
      unit: 'cum',
      quantity: 10000,
      rate: 2100,
      category: WorkCategory.PAVEMENT,
      completedQuantity: 2000
    },
    {
      id: '13',
      itemNo: '5.02',
      description: 'Prime Coat over Granular Base (Low Viscosity Bitumen Emulsion)',
      unit: 'sqm',
      quantity: 10000,
      rate: 45,
      category: WorkCategory.PAVEMENT,
      completedQuantity: 0
    },
    {
      id: '14',
      itemNo: '5.03.1',
      description: 'Tack Coat using Bitumen Emulsion (Rapid Setting)',
      unit: 'sqm',
      quantity: 13000,
      rate: 25,
      category: WorkCategory.PAVEMENT,
      completedQuantity: 0
    },
    {
      id: '9',
      itemNo: '5.01',
      description: 'Dense Bituminous Macadam (DBM) using crushed aggregates of specified grading, premixed with bituminous binder',
      unit: 'cum',
      quantity: 8000,
      rate: 6500,
      category: WorkCategory.PAVEMENT,
      completedQuantity: 0
    },
    {
      id: '10',
      itemNo: '5.03',
      description: 'Bituminous Concrete (BC) grading 1 for wearing course, transporting to site, laying with paver finisher',
      unit: 'cum',
      quantity: 5000,
      rate: 8500,
      category: WorkCategory.PAVEMENT,
      completedQuantity: 0
    },
    {
      id: '5',
      itemNo: '6.02',
      description: 'RCC M-25 Box Culvert (2m x 2m) construction including reinforcement and shuttering',
      unit: 'cum',
      quantity: 450,
      rate: 8500,
      category: WorkCategory.DRAINAGE,
      completedQuantity: 450
    },
    {
      id: 'drain-1',
      itemNo: '6.05',
      description: 'Construction of Unlined Trapezoidal Drain',
      unit: 'rm',
      quantity: 5000,
      rate: 150,
      category: WorkCategory.DRAINAGE,
      completedQuantity: 1200
    },
    {
      id: 'drain-2',
      itemNo: '6.06',
      description: 'RCC M25 Rectangular Covered Drain',
      unit: 'rm',
      quantity: 2000,
      rate: 3500,
      category: WorkCategory.DRAINAGE,
      completedQuantity: 0
    },
    {
      id: '11',
      itemNo: '9.01',
      description: 'Interlocking Paver Blocks (60mm) for Footpath including sand bedding',
      unit: 'sqm',
      quantity: 2000,
      rate: 800,
      category: WorkCategory.FOOTPATH,
      completedQuantity: 500
    },
    {
      id: '12',
      itemNo: '9.02',
      description: 'Precast Concrete Kerb Stone (M25) of size 450x300x150mm',
      unit: 'rm',
      quantity: 1000,
      rate: 450,
      category: WorkCategory.FOOTPATH,
      completedQuantity: 200
    },
    {
      id: '6',
      itemNo: '8.01',
      description: 'Thermoplastic Road Marking with hot applied thermoplastic compound',
      unit: 'sqm',
      quantity: 2500,
      rate: 650,
      category: WorkCategory.FURNITURE,
      completedQuantity: 0
    },
    {
      id: 'furn-2',
      itemNo: '8.04',
      description: 'Traffic Sign Boards (Warning/Regulatory)',
      unit: 'nos',
      quantity: 50,
      rate: 4500,
      category: WorkCategory.FURNITURE,
      completedQuantity: 10
    },
    {
      id: '7',
      itemNo: 'PS.01',
      description: 'Provisional Sum for Utility Shifting',
      unit: 'LS',
      quantity: 1,
      rate: 500000,
      category: WorkCategory.PROVISIONAL_SUM,
      completedQuantity: 0.5
    },
    {
      id: '8',
      itemNo: 'PS.02',
      description: 'Provisional Sum for Environmental Monitoring',
      unit: 'LS',
      quantity: 1,
      rate: 250000,
      category: WorkCategory.PROVISIONAL_SUM,
      completedQuantity: 0.2
    }
  ];

  const PROJECT_2_BOQ = [
    {
      id: 'p2-1',
      itemNo: '2.01',
      description: 'Clearing and Grubbing (Hill Road)',
      unit: 'Ha',
      quantity: 8.0,
      rate: 65000,
      category: WorkCategory.EARTHWORK,
      completedQuantity: 1.0
    },
    {
      id: 'p2-2',
      itemNo: '3.02',
      description: 'Rock Excavation (Blasting)',
      unit: 'cum',
      quantity: 15000,
      rate: 450,
      category: WorkCategory.EARTHWORK,
      completedQuantity: 2000
    },
    {
      id: 'p2-3',
      itemNo: '6.05',
      description: 'Retaining Wall Construction',
      unit: 'cum',
      quantity: 5000,
      rate: 4200,
      category: WorkCategory.STRUCTURES,
      completedQuantity: 500
    },
    {
      id: 'p2-4',
      itemNo: '8.05',
      description: 'Metal Beam Crash Barrier',
      unit: 'rm',
      quantity: 3000,
      rate: 3200,
      category: WorkCategory.FURNITURE,
      completedQuantity: 0
    }
  ];

  // --- Mock Data Helpers ---

  const mockRFIs: RFI[] = [
    {
      id: 'rfi-101',
      rfiNumber: 'RFI/CH/10+200/01',
      date: '2023-10-25',
      location: 'Ch 10+200 (LHS)',
      description: 'Inspection of GSB Layer prior to WMM',
      status: RFIStatus.APPROVED,
      requestedBy: 'John Doe (Site Eng)',
      inspectionDate: '2023-10-26'
    },
    {
      id: 'rfi-102',
      rfiNumber: 'RFI/STR/BC/02',
      date: '2023-10-27',
      location: 'Box Culvert at Ch 12+100',
      description: 'Reinforcement checking for Top Slab',
      status: RFIStatus.OPEN,
      requestedBy: 'Mike Smith (Supervisor)',
      inspectionDate: '2023-10-28'
    },
    {
      id: 'rfi-103',
      rfiNumber: 'RFI/CH/11+000/03',
      date: '2023-10-28',
      location: 'Ch 11+000',
      description: 'Embankment Layer 5 Compaction',
      status: RFIStatus.REJECTED,
      requestedBy: 'John Doe (Site Eng)',
      inspectionDate: '2023-10-28'
    }
  ];

  const mockLabTests: LabTest[] = [
    {
      id: 't-1',
      testName: 'Field Dry Density (FDD)',
      sampleId: 'S-1023',
      date: '2023-10-26',
      location: 'Ch 10+200',
      result: 'Pass',
      technician: 'Sarah L.'
    },
    {
      id: 't-2',
      testName: 'Aggregate Impact Value',
      sampleId: 'Agg-45',
      date: '2023-10-25',
      location: 'Crusher Plant',
      result: 'Pass',
      technician: 'Sarah L.'
    },
    {
      id: 't-3',
      testName: 'Bitumen Extraction',
      sampleId: 'BM-02',
      date: '2023-10-28',
      location: 'Batching Plant',
      result: 'Pending',
      technician: 'Raj P.'
    },
    {
      id: 't-4',
      testName: 'Cube Compressive Strength (7 Days)',
      sampleId: 'C-200',
      date: '2023-10-20',
      location: 'Culvert @ 12+100',
      result: 'Pass',
      technician: 'Sarah L.'
    }
  ];

  const mockSchedule: ScheduleTask[] = [
    {
      id: 's-1',
      name: 'Site Clearance (Km 0-5)',
      startDate: '2023-09-01',
      endDate: '2023-09-15',
      progress: 100,
      status: 'Completed'
    },
    {
      id: 's-2',
      name: 'Culvert Construction (Km 2.5)',
      startDate: '2023-09-10',
      endDate: '2023-10-10',
      progress: 100,
      status: 'Completed'
    },
    {
      id: 's-3',
      name: 'GSB Layer (Km 0-5)',
      startDate: '2023-10-01',
      endDate: '2023-11-01',
      progress: 60,
      status: 'On Track'
    },
    {
      id: 's-4',
      name: 'WMM Layer (Km 0-5)',
      startDate: '2023-10-20',
      endDate: '2023-11-20',
      progress: 20,
      status: 'Delayed'
    },
    {
      id: 's-5',
      name: 'Bituminous Macadam',
      startDate: '2023-11-15',
      endDate: '2023-12-15',
      progress: 0,
      status: 'On Track'
    }
  ];

  const mockInventory: InventoryItem[] = [
    { id: 'i-1', itemName: 'Cement (OPC 53)', quantity: 450, unit: 'Bags', location: 'Main Store', lastUpdated: '2023-10-27' },
    { id: 'i-2', itemName: 'Steel Rebar (12mm)', quantity: 12.5, unit: 'MT', location: 'Yard A', lastUpdated: '2023-10-25' },
    { id: 'i-3', itemName: 'Diesel', quantity: 2500, unit: 'Liters', location: 'Fuel Station', lastUpdated: '2023-10-28' },
    { id: 'i-4', itemName: 'Bitumen (VG-30)', quantity: 40, unit: 'Drum', location: 'Bitumen Yard', lastUpdated: '2023-10-29' },
    { id: 'i-5', itemName: 'Admixture', quantity: 5, unit: 'Liters', location: 'Chemical Store', lastUpdated: '2023-10-29' }
  ];

  const mockTransactions: InventoryTransaction[] = [
    { id: 'tx-1', itemId: 'i-1', itemName: 'Cement (OPC 53)', type: 'IN', date: '2023-10-01', quantity: 1000, vendorName: 'Ultratech Supplier', billNo: 'INV-9988' },
    { id: 'tx-2', itemId: 'i-1', itemName: 'Cement (OPC 53)', type: 'OUT', date: '2023-10-05', quantity: 100, partyName: 'Culvert Team (Ch 2+500)', billNo: 'REQ-001' },
    { id: 'tx-3', itemId: 'i-1', itemName: 'Cement (OPC 53)', type: 'OUT', date: '2023-10-15', quantity: 200, partyName: 'Drain Team (Ch 5+000)', billNo: 'REQ-005' },
    { id: 'tx-4', itemId: 'i-1', itemName: 'Cement (OPC 53)', type: 'OUT', date: '2023-10-25', quantity: 250, partyName: 'Culvert Team (Ch 2+500)', billNo: 'REQ-012' },
    { id: 'tx-5', itemId: 'i-3', itemName: 'Diesel', type: 'IN', date: '2023-10-01', quantity: 5000, vendorName: 'Indian Oil Corp', billNo: 'DSL-2023-88' },
    { id: 'tx-6', itemId: 'i-3', itemName: 'Diesel', type: 'OUT', date: '2023-10-02', quantity: 200, partyName: 'Excavator KA-05-MN-1212', billNo: 'DSL-OUT-01' },
    { id: 'tx-7', itemId: 'i-3', itemName: 'Diesel', type: 'OUT', date: '2023-10-10', quantity: 150, partyName: 'Tipper KA-01-HG-4455', billNo: 'DSL-OUT-05' },
  ];

  const mockVehicles: Vehicle[] = [
    { id: 'v-1', plateNumber: 'KA-01-HG-4455', type: 'Tipper Truck', status: 'Active', driver: 'Ramesh' },
    { id: 'v-2', plateNumber: 'KA-05-MN-1212', type: 'Excavator', status: 'Maintenance', driver: 'Suresh' },
    { id: 'v-3', plateNumber: 'KA-01-ZZ-9988', type: 'Grader', status: 'Active', driver: 'Mahesh' },
    { id: 'v-4', plateNumber: 'KA-02-BB-3322', type: 'Water Tanker', status: 'Active', driver: 'Ganesh' },
    { id: 'v-5', plateNumber: 'KA-01-AB-1234', type: 'Roller', status: 'Idle', driver: 'Raju' },
  ];

  const mockVehicleLogs: VehicleLog[] = [
    { id: 'vl-1', vehicleId: 'v-1', plateNumber: 'KA-01-HG-4455', date: '2023-10-25', startKm: 10200, endKm: 10350, totalKm: 150, fuelConsumed: 40, workingHours: 9, activityDescription: 'GSB Material shifting' },
    { id: 'vl-2', vehicleId: 'v-1', plateNumber: 'KA-01-HG-4455', date: '2023-10-26', startKm: 10350, endKm: 10500, totalKm: 150, fuelConsumed: 38, workingHours: 8.5, activityDescription: 'GSB Material shifting' },
    { id: 'vl-3', vehicleId: 'v-1', plateNumber: 'KA-01-HG-4455', date: '2023-10-27', startKm: 10500, endKm: 10620, totalKm: 120, fuelConsumed: 45, workingHours: 8, activityDescription: 'GSB Material shifting' },
    { id: 'vl-4', vehicleId: 'v-3', plateNumber: 'KA-01-ZZ-9988', date: '2023-10-27', startKm: 5600, endKm: 5650, totalKm: 50, fuelConsumed: 60, workingHours: 7, activityDescription: 'Grading at Ch 12+000' },
    { id: 'vl-5', vehicleId: 'v-4', plateNumber: 'KA-02-BB-3322', date: '2023-10-27', startKm: 8900, endKm: 8960, totalKm: 60, fuelConsumed: 20, workingHours: 6, activityDescription: 'Watering for Embankment' },
  ];

  const mockDocuments: ProjectDocument[] = [
    { 
        id: 'd-1', 
        name: 'Contract_Agreement.pdf', 
        type: 'PDF', 
        date: '2023-08-15', 
        size: '4.2 MB', 
        folder: 'Contracts',
        subject: 'Main Contract Agreement',
        tags: ['Important', 'Signed'] 
    },
    { 
        id: 'd-2', 
        name: 'Site_Handover_Plan.pdf', 
        type: 'PDF', 
        date: '2023-09-01', 
        size: '1.5 MB', 
        folder: 'Drawings',
        subject: 'Site Handover Layout', 
        refNo: 'NHAI/2023/SH/01',
        tags: ['Approved'] 
    },
    { 
        id: 'd-3', 
        name: 'Oct_Monthly_Report.pdf', 
        type: 'PDF', 
        date: '2023-10-31', 
        size: '2.8 MB', 
        folder: 'Reports',
        subject: 'Monthly Progress Report October',
        tags: ['Monthly'] 
    },
    { 
        id: 'd-4', 
        name: 'Design_Drawing_Culvert.pdf', 
        type: 'PDF', 
        date: '2023-09-10', 
        size: '5.1 MB', 
        folder: 'Drawings',
        subject: 'GFC Drawings for Box Culvert', 
        refNo: 'DES/STR/005',
        tags: ['GFC', 'Structural'] 
    },
  ];

  const mockDailyReports: DailyReport[] = [
      {
          id: 'dpr-001',
          date: '2023-10-30',
          reportNumber: 'DPR-2023-10-30',
          status: 'Approved',
          submittedBy: 'Site Engineer',
          items: [
              {
                  id: 'dw-1',
                  boqItemId: '1', 
                  location: 'Ch 12+000 to 12+500',
                  quantity: 0.5,
                  description: 'Clearing done on RHS',
                  links: ['https://drive.google.com/photo1']
              }
          ]
      },
      {
          id: 'dpr-002',
          date: '2023-10-29',
          reportNumber: 'DPR-2023-10-29',
          status: 'Approved',
          submittedBy: 'Site Engineer',
          items: [
              {
                  id: 'dw-2',
                  boqItemId: '2', 
                  location: 'Ch 10+500',
                  quantity: 500,
                  description: 'Soil Excavation in tough soil'
              },
              {
                  id: 'dw-3',
                  boqItemId: '1', 
                  location: 'Ch 13+000',
                  quantity: 0.2,
                  description: 'Bush clearing'
              }
          ]
      }
  ];

  const mockPreConstruction: PreConstructionTask[] = [
      { 
        id: 'pre-1', 
        category: 'Survey', 
        description: 'Joint Survey with Authority Engineer', 
        status: 'Completed', 
        targetDate: '2023-08-10', 
        estStartDate: '2023-08-01',
        estEndDate: '2023-08-10',
        progress: 100,
        remarks: 'Completed successfully' 
      },
      { 
        id: 'pre-2', 
        category: 'Land Acquisition', 
        description: 'Compensation for 5 structures in Ch 5+000', 
        status: 'In Progress', 
        targetDate: '2023-12-01', 
        estStartDate: '2023-11-01',
        estEndDate: '2023-12-05',
        progress: 60,
        remarks: 'District Office processing' 
      },
      { 
        id: 'pre-3', 
        category: 'Forest Clearance', 
        description: 'Stage-1 Clearance Application', 
        status: 'Pending', 
        targetDate: '2024-01-15', 
        estStartDate: '2023-12-01',
        estEndDate: '2024-01-15',
        progress: 10,
        remarks: 'File preparation ongoing' 
      },
      { 
        id: 'pre-4', 
        category: 'Design', 
        description: 'Submission of GAD for Major Bridge', 
        status: 'Completed', 
        targetDate: '2023-09-01', 
        estStartDate: '2023-08-15',
        estEndDate: '2023-09-01',
        progress: 100,
        remarks: 'Approved by AE' 
      },
      { 
        id: 'pre-5', 
        category: 'Utility Shifting', 
        description: 'Electric Pole shifting estimate', 
        status: 'In Progress', 
        targetDate: '2023-11-30', 
        estStartDate: '2023-11-01',
        estEndDate: '2023-11-30',
        progress: 40,
        remarks: 'Joint verification done' 
      },
  ];

  const mockStructures: StructureAsset[] = [
      {
        id: 'str-001',
        name: 'Box Culvert at Ch 12+500',
        type: StructureType.BOX_CULVERT,
        location: '12+500',
        status: 'In Progress',
        components: [
          { id: 'c1', name: 'Structural Excavation', unit: 'cum', totalQuantity: 150, completedQuantity: 150 },
          { id: 'c2', name: 'PCC M15', unit: 'cum', totalQuantity: 25, completedQuantity: 25 },
          { id: 'c3', name: 'Bottom Slab Rebar', unit: 'MT', totalQuantity: 4.5, completedQuantity: 4.5 },
          { id: 'c4', name: 'Bottom Slab RCC M25', unit: 'cum', totalQuantity: 60, completedQuantity: 60 },
          { id: 'c5', name: 'Wall Rebar', unit: 'MT', totalQuantity: 8, completedQuantity: 2 },
          { id: 'c6', name: 'Wall RCC M25', unit: 'cum', totalQuantity: 90, completedQuantity: 0 },
          { id: 'c7', name: 'Top Slab RCC M25', unit: 'cum', totalQuantity: 60, completedQuantity: 0 },
        ]
      },
      {
        id: 'str-002',
        name: 'Hume Pipe Culvert at Ch 10+200',
        type: StructureType.PIPE_CULVERT,
        location: '10+200',
        status: 'Completed',
        components: [
          { id: 'c1', name: 'Excavation', unit: 'cum', totalQuantity: 45, completedQuantity: 45 },
          { id: 'c2', name: 'Bedding PCC', unit: 'cum', totalQuantity: 10, completedQuantity: 10 },
          { id: 'c3', name: 'Pipe Laying (1200mm Dia)', unit: 'rm', totalQuantity: 12, completedQuantity: 12 },
          { id: 'c4', name: 'Headwall RCC', unit: 'cum', totalQuantity: 15, completedQuantity: 15 },
        ]
      },
      {
        id: 'str-003',
        name: 'Pipe Culvert at Ch 10+500',
        type: StructureType.PIPE_CULVERT,
        size: '900mm Dia',
        location: '10+500',
        status: 'Not Started',
        components: [
          { id: 'c1', name: 'Structural Excavation', unit: 'cum', totalQuantity: 150, completedQuantity: 0 },
          { id: 'c2', name: 'PCC M15', unit: 'cum', totalQuantity: 25, completedQuantity: 0 },
          { id: 'c3', name: 'Pipe Laying (900mm NP4)', unit: 'rm', totalQuantity: 12, completedQuantity: 0 },
        ]
      },
      {
        id: 'str-004',
        name: 'Pipe Culvert (NP3 Design)',
        type: StructureType.PIPE_CULVERT,
        size: '900mm Dia',
        location: '10+500',
        status: 'Not Started',
        components: [
          { id: 'nc-1', name: 'Structural Excavation', unit: 'cum', totalQuantity: 150, completedQuantity: 0 },
          { id: 'nc-2', name: 'PCC M15', unit: 'cum', totalQuantity: 25, completedQuantity: 0 },
          { id: 'nc-3', name: 'Pipe Laying (900mm NP3)', unit: 'rm', totalQuantity: 12, completedQuantity: 0 },
        ]
      },
      {
        id: 'str-005',
        name: 'Pipe Culvert at Ch 10+500 (Additional)',
        type: StructureType.PIPE_CULVERT,
        size: '900mm Dia',
        location: '10+500',
        status: 'Not Started',
        components: [
          { id: 'nc-new-1', name: 'Structural Excavation', unit: 'cum', totalQuantity: 150, completedQuantity: 0 },
          { id: 'nc-new-2', name: 'PCC M15', unit: 'cum', totalQuantity: 25, completedQuantity: 0 },
          { id: 'nc-new-3', name: 'Pipe Laying (900mm NP4)', unit: 'rm', totalQuantity: 12, completedQuantity: 0 },
        ]
      }
  ];

  const MOCK_PROJECTS_INITIAL_DEFINITION: Project[] = [
    {
      id: 'proj-001',
      name: 'Urban Resilience and Livability Improvement Project (URLIP)',
      code: 'URLIP-TM',
      location: 'Tilottama Municipality',
      client: 'Tilottama Municipality',
      engineer: 'BDA',
      contractor: 'LONGJIAN-SAGUN JOINT VENTURE',
      contractNo: 'URLIP/TT/CWO1',
      startDate: '2025-11-29',
      endDate: '2028-12-01',
      boq: PROJECT_1_BOQ,
      rfis: mockRFIs,
      labTests: mockLabTests,
      schedule: mockSchedule,
      inventory: mockInventory,
      inventoryTransactions: mockTransactions,
      vehicles: mockVehicles,
      vehicleLogs: mockVehicleLogs,
      documents: mockDocuments,
      dailyReports: mockDailyReports,
      preConstruction: mockPreConstruction,
      structures: mockStructures
    },
    {
      id: 'proj-002',
      name: 'State Highway 22 Upgrade',
      code: 'SH-22-PKG-II',
      location: 'Western Ghats Section',
      client: 'KRDCL',
      engineer: 'MSV International',
      contractor: 'Dilip Buildcon Ltd',
      contractNo: 'KRDCL/SH22/PKG2',
      startDate: '2023-08-01',
      endDate: '2025-08-01',
      boq: PROJECT_2_BOQ,
      rfis: [
        {
          id: 'p2-rfi-1',
          rfiNumber: 'RFI/SH/02+500',
          date: '2023-11-01',
          location: 'Ch 2+500',
          description: 'Rock Toe wall foundation level',
          status: RFIStatus.APPROVED,
          requestedBy: 'Site Eng 2',
          inspectionDate: '2023-11-02'
        }
      ],
      labTests: [
        {
          id: 'p2-t-1',
          testName: 'Compressive Strength (Concrete)',
          sampleId: 'CUBE-01',
          date: '2023-11-05',
          location: 'Lab 2',
          result: 'Fail',
          technician: 'Technician B'
        }
      ],
      schedule: [
        {
          id: 'p2-s-1',
          name: 'Forest Clearance',
          startDate: '2023-08-01',
          endDate: '2023-10-01',
          progress: 100,
          status: 'Completed'
        },
        {
          id: 'p2-s-2',
          name: 'Earth Cutting',
          startDate: '2023-10-05',
          endDate: '2023-12-05',
          progress: 15,
          status: 'On Track'
        }
      ],
      inventory: [
        { id: 'p2-i-1', itemName: 'Explosives (Gelatin)', quantity: 50, unit: 'Kg', location: 'Magazine', lastUpdated: '2023-11-01' },
        { id: 'p2-i-2', itemName: 'Diesel', quantity: 500, unit: 'Liters', location: 'Site Tank', lastUpdated: '2023-11-05' },
      ],
      inventoryTransactions: [],
      vehicles: [
        { id: 'p2-v-1', plateNumber: 'KA-19-AA-1111', type: 'Rock Breaker', status: 'Active', driver: 'Raju' },
        { id: 'p2-v-2', plateNumber: 'KA-19-BB-2222', type: 'Tipper', status: 'Idle', driver: 'Babu' },
      ],
      vehicleLogs: [],
      documents: [
        { id: 'p2-d-1', name: 'Forest_Clearance_Letter.pdf', type: 'PDF', date: '2023-07-20', size: '1.2 MB', folder: 'Clearances' },
        { id: 'p2-d-2', name: 'Env_Impact_Assessment.pdf', type: 'PDF', date: '2023-06-15', size: '12.5 MB', folder: 'Reports' }
      ],
      dailyReports: [],
      preConstruction: [],
      structures: []
    }
  ];

  // --- Initial Data Loading from Local Storage or Mocks ---
  useEffect(() => {
    setIsLoadingData(true);
    const storedProjects = localStorage.getItem('projects');
    const storedUsers = localStorage.getItem('users');
    const storedMessages = localStorage.getItem('messages');
    const storedSelectedProjectId = localStorage.getItem('selectedProjectId');

    if (storedProjects) {
      setAllProjects(JSON.parse(storedProjects));
    } else {
      setAllProjects(MOCK_PROJECTS_INITIAL_DEFINITION);
    }

    if (storedUsers) {
      setAllUsers(JSON.parse(storedUsers));
    } else {
      setAllUsers(MOCK_USERS_DEFINITION);
    }

    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    } else {
      setMessages(MOCK_MESSAGES_INITIAL_DEFINITION);
    }

    if (storedSelectedProjectId) {
      setSelectedProjectId(storedSelectedProjectId);
    } else if (allProjects.length > 0) { // Automatically select first project if available
      setSelectedProjectId(allProjects[0].id);
    }
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      setIsLoadingData(false);
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, []);

  // --- Local Storage Persistence Effects ---
  useEffect(() => {
    if (!isLoadingData) { // Only save once initial data is loaded
      localStorage.setItem('projects', JSON.stringify(allProjects));
    }
  }, [allProjects, isLoadingData]);

  useEffect(() => {
    if (!isLoadingData) { // Only save once initial data is loaded
      localStorage.setItem('messages', JSON.stringify(messages));
    }
  }, [messages, isLoadingData]);

  useEffect(() => {
    if (!isLoadingData) { // Only save once initial data is loaded
      localStorage.setItem('users', JSON.stringify(allUsers));
    }
  }, [allUsers, isLoadingData]);


  useEffect(() => {
    if (!isLoadingData) { // Only save once initial data is loaded
      localStorage.setItem('selectedProjectId', selectedProjectId || '');
    }
  }, [selectedProjectId, isLoadingData]);

  const unreadMessagesCount = messages.filter(m => m.receiverId === authState.currentUserId && !m.read).length; 

  // --- Render Views ---

  if (!authState.isAuthenticated) { 
      return (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Login />
        </ThemeProvider>
      );
  }

  // Projects List View
  if (!projectState.selectedProjectId) { 
      return (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
            <Toolbar>
               <Box display="flex" alignItems="center" gap={2} flexGrow={1}>
                   <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <Briefcase size={20} />
                   </Box>
                   <Typography variant="h6" fontWeight="bold" color="text.primary">MyRoad Project</Typography>
               </Box>
               <Box display="flex" alignItems="center" gap={2}>
                   <Avatar sx={{ bgcolor: 'secondary.light', width: 32, height: 32, fontSize: 14 }}>{authState.userName.charAt(0)}</Avatar> 
                   <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>{authState.userName}</Typography> 
                   <Button variant="outlined" color="inherit" onClick={handleLogout} startIcon={<LogOut size={16}/>}>Logout</Button>
               </Box>
            </Toolbar>
          </AppBar>
          <Box p={4} maxWidth="1200px" mx="auto">
              <ProjectsList 
                projects={projectState.projects} 
                userRole={authState.userRole} 
                onSelectProject={handleProjectSelect}
                onSaveProject={handleSaveProject}
                onDeleteProject={handleDeleteProject}
              />
          </Box>
        </ThemeProvider>
      );
  }

  if (!currentProject) return null;

  const renderContent = () => {
    const componentProps = { 
      project: currentProject, 
      userRole: authState.userRole, 
      onProjectUpdate: handleProjectUpdate,
      currentUser: currentUser,
    };

    switch (activeTab) {
      case 'dashboard': return <Dashboard project={currentProject} settings={settingsState.appSettings} />;
      case 'messages': return <MessagesModule currentUser={currentUser} users={MOCK_USERS} messages={messages} onSendMessage={handleSendMessage} />;
      case 'map': return <MapModule key={currentProject.id} {...componentProps} />;
      case 'precon': return <PreConstructionModule key={currentProject.id} {...componentProps} />;
      case 'schedule': return <ScheduleModule key={currentProject.id} {...componentProps} />;
      case 'construction': return <ConstructionModule key={currentProject.id} {...componentProps} />;
      case 'daily': return <DailyReportModule key={currentProject.id} {...componentProps} />;
      case 'boq': return <BOQManager key={currentProject.id} {...componentProps} settings={settingsState.appSettings} />;
      case 'rfi': return <RFIModule key={currentProject.id} {...componentProps} />;
      case 'lab': return <LabModule key={currentProject.id} {...componentProps} />;
      case 'resources': return <ResourceManager key={currentProject.id} {...componentProps} />;
      case 'docs': return <DocumentsModule key={currentProject.id} {...componentProps} />;
      case 'users': return hasAdminPrivileges ? <UserManagement /> : null;
      case 'settings': return hasAdminPrivileges ? <SettingsModule /> : null;
      default: return <Dashboard project={currentProject} settings={settingsState.appSettings} />;
    }
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'primary.dark', color: 'white' }}>
      {/* Sidebar Header */}
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, minHeight: 70 }}>
        <Box sx={{ width: 36, height: 36, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 10px ${theme.palette.primary.main}55` }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>M</Typography>
        </Box>
        <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', letterSpacing: '-0.5px' }}>MyRoad</Typography>
      </Toolbar>
      
      {/* Project Selector in Sidebar */}
      <Box sx={{ px: 2, pb: 3, pt: 1 }}>
        <Button 
          fullWidth 
          variant="outlined" 
          onClick={() => dispatchProject({ type: 'SELECT_PROJECT', payload: null })} // Use dispatchProject
          startIcon={<Briefcase size={16}/>}
          endIcon={<ChevronRight size={14} style={{ opacity: 0.5 }} />}
          sx={{ 
            justifyContent: 'space-between', 
            bgcolor: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(255,255,255,0.1)',
            color: 'grey.300', 
            textTransform: 'none',
            fontSize: '0.85rem',
            px: 2,
            py: 1,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'primary.light', color: 'white' }
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentProject?.code || 'Select Project'}</span>
        </Button>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2 }}>
        <List component="nav" aria-label="main mailbox folders">
          {navItems.map((item) => {
             const isActive = activeTab === item.id;
             return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  onClick={() => { setActiveTab(item.id); if(isMobile) setMobileOpen(false); }}
                  selected={isActive}
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    color: isActive ? 'common.white' : 'grey.400',
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.main,
                      boxShadow: `0 4px 12px ${theme.palette.primary.dark}33`,
                      '&:hover': { 
                        backgroundColor: theme.palette.primary.dark,
                      }
                    },
                    '&:hover': {
                      backgroundColor: !isActive ? `rgba(255, 255, 255, 0.05)` : theme.palette.primary.dark,
                      color: 'common.white',
                    },
                    mb: 0.5,
                    px: 2,
                    py: 1.25,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                    {item.id === 'messages' ? (
                         <Badge badgeContent={unreadMessagesCount} color="error" variant="dot">
                             <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                         </Badge>
                    ) : (
                         <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} /> 
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ 
                        fontSize: '0.85rem', 
                        fontWeight: isActive ? 600 : 400 
                    }} 
                  />
                  {isActive && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'secondary.main' }} />}
                </ListItemButton>
              </ListItem>
             );
          })}
        </List>
      </Box>

      {/* User Footer */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.primary.light}22`, bgcolor: 'rgba(0,0,0,0.2)' }}>
         <Box display="flex" alignItems="center" gap={2} mb={2} sx={{ px: 1 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light', border: '2px solid rgba(255,255,255,0.1)' }}>{authState.userName.charAt(0)}</Avatar>
            <Box overflow="hidden">
              <Typography variant="subtitle2" sx={{ color: 'white', lineHeight: 1.2 }} noWrap>{authState.userName}</Typography>
              <Typography variant="caption" sx={{ color: 'grey.500' }} noWrap>{authState.userRole}</Typography>
            </Box>
         </Box>
         <Button 
           fullWidth 
           size="small" 
           variant="text"
           color="error" 
           startIcon={<LogOut size={16}/>} 
           onClick={handleLogout}
           sx={{ justifyContent: 'flex-start', color: 'grey.400', '&:hover': { color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
         >
           Sign Out
         </Button>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        
        {/* AppBar */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            bgcolor: 'background.paper',
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: 'text.primary',
            zIndex: (theme) => theme.zIndex.drawer + 1
          }}
        >
          <Toolbar sx={{ minHeight: 64 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              size="medium" // Explicitly set size
              sx={{ mr: 2, display: { md: 'none' }, minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}
            >
              <MenuIcon />
            </IconButton>
            
            {/* Page Title & Breadcrumb */}
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {navItems.find(i => i.id === activeTab)?.label}
                </Typography>
                <ChevronRight size={16} className="text-slate-300" />
                <Typography variant="body2" color="text.secondary">{currentProject?.code || 'No Project Selected'}</Typography>
            </Box>

            {/* Top Right Actions */}
            <Box display="flex" alignItems="center" gap={2}>
              {/* Search Bar (Visual Only) */}
              <Box sx={{ 
                  display: { xs: 'none', md: 'flex' }, 
                  alignItems: 'center', 
                  bgcolor: 'background.default', 
                  borderRadius: 2, 
                  px: 2, 
                  py: 0.8,
                  border: `1px solid ${theme.palette.divider}`,
                  width: 200
              }}>
                  <Search size={16} className="text-slate-400 mr-2" />
                  <Typography variant="caption" color="text.disabled">Search...</Typography>
              </Box>

              <IconButton onClick={(e) => setAnchorElNotif(e.currentTarget)} size="medium" sx={{ color: 'text.secondary', minWidth: { xs: 44, md: 'auto' }, minHeight: { xs: 44, md: 'auto' } }}>
                <Badge badgeContent={unreadMessagesCount} color="error" variant="dot">
                  <Bell size={20} />
                </Badge>
              </IconButton>
              
              <Menu
                anchorEl={anchorElNotif}
                open={Boolean(anchorElNotif)}
                onClose={() => setAnchorElNotif(null)}
                PaperProps={{
                    elevation: 3,
                    sx: { width: 320, mt: 1.5, borderRadius: 3 }
                }}
              >
                 <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" fontWeight="bold">Notifications</Typography>
                    {notifications.length > 0 && <Button size="small" sx={{ fontSize: '0.7rem' }} onClick={() => setNotifications([])}>Clear</Button>}
                 </Box>
                 <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {notifications.length === 0 ? (
                       <Box p={3} textAlign="center" color="text.secondary">
                           <Bell size={24} className="opacity-20 mb-2 mx-auto"/>
                           <Typography variant="body2">No new notifications</Typography>
                       </Box>
                    ) : (
                       notifications.map((n, i) => (
                         <Box key={i} sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.background.default}`, '&:hover': { bgcolor: 'action.hover' } }}>
                            <Typography variant="body2">{n}</Typography>
                         </Box>
                       ))
                    )}
                 </Box>
              </Menu>

              <Button 
                variant="contained" 
                color="primary"
                startIcon={<Bot size={18}/>}
                onClick={() => setIsAIModalOpen(true)}
                sx={{ 
                    borderRadius: 20, 
                    px: 2.5, 
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                    boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)'
                }}
              >
                AI Assistant
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Drawer */}
        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawerContent}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none', bgcolor: 'secondary.dark' },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{ 
              flexGrow: 1, 
              width: { md: `calc(100% - ${drawerWidth}px)` }, 
              height: '100%',
              overflowY: 'auto',
              bgcolor: 'background.default',
              pt: '64px' // AppBar height
          }}
        >
          <Box maxWidth="1600px" mx="auto" p={{ xs: 2, md: 4 }}>
             <Fade in={true} key={activeTab} timeout={300}>
                <Box>
                    {renderContent()}
                </Box>
             </Fade>
          </Box>
        </Box>

        {isAIModalOpen && (
          <AIChatModal 
            project={currentProject}
            onClose={() => setIsAIModalOpen(false)} 
          />
        )}

      </Box>
    </ThemeProvider>
  );
};

export default App;
