import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  HardHat, 
  FlaskConical, 
  Truck, 
  FileText, 
  Settings, 
  Menu,
  X,
  Bot,
  CalendarClock,
  Briefcase,
  ClipboardCheck,
  FolderOpen,
  Users,
  Compass,
  Hammer,
  Map as MapIcon,
  Bell
} from 'lucide-react';
import { UserRole, Project, AppSettings } from './types';
import { MOCK_PROJECTS } from './constants';

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

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.PROJECT_MANAGER);
  const [userName, setUserName] = useState('');

  // Nav State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  
  // Data State
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Notification Simulation State
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // App Settings State (Defaults)
  const [appSettings, setAppSettings] = useState<AppSettings>({
    companyName: 'MyRoad Project Ltd.',
    currency: 'USD',
    vatRate: 13,
    fiscalYearStart: '2023-07-16',
    notifications: {
      enableEmail: true,
      enableInApp: true,
      notifyUpcoming: true,
      daysBefore: 3,
      notifyOverdue: true,
      dailyDigest: true
    }
  });

  const currentProject = projects.find(p => p.id === selectedProjectId);

  // Simulate receiving data from site staff
  useEffect(() => {
    if (!isAuthenticated || !currentProject) return;

    const messages = [
      "Site Eng: New RFI submitted for Ch 12+500",
      "Lab Tech: Compaction Test passed at Borrow Pit A",
      "Supervisor: Excavator 220 active at Km 5",
      "Admin: Updated material stock for Cement",
      "GPS Tracker: Paver P-102 moved to Zone B (Ch 8+000)"
    ];

    const interval = setInterval(() => {
        // Randomly add a notification every 15-30 seconds to simulate real-time data
        if (Math.random() > 0.7) {
            const msg = messages[Math.floor(Math.random() * messages.length)];
            const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            setNotifications(prev => [`${time} - ${msg}`, ...prev].slice(0, 5));
        }
    }, 15000);

    return () => clearInterval(interval);
  }, [isAuthenticated, currentProject]);

  const handleLogin = (role: UserRole, name: string) => {
      setIsAuthenticated(true);
      setUserRole(role);
      setUserName(name);
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setSelectedProjectId(null);
  };

  // Centralized update handler passed to all children
  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleProjectSelect = (id: string) => {
    setSelectedProjectId(id);
    setActiveTab('dashboard'); // Navigate to dashboard when a project is selected
  };

  const handleSaveProject = (projectData: Partial<Project>) => {
    if (projectData.id) {
      // Update existing
      setProjects(prev => prev.map(p => 
        p.id === projectData.id ? { ...p, ...projectData } as Project : p
      ));
    } else {
      // Create New
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: projectData.name || 'New Project',
        code: projectData.code || 'NEW-001',
        location: projectData.location || '',
        client: projectData.client || '',
        engineer: projectData.engineer || '',
        contractor: projectData.contractor || '',
        contractNo: projectData.contractNo || '',
        startDate: projectData.startDate || new Date().toISOString().split('T')[0],
        endDate: projectData.endDate || '',
        boq: [],
        rfis: [],
        labTests: [],
        schedule: [],
        inventory: [],
        inventoryTransactions: [],
        vehicles: [],
        vehicleLogs: [],
        documents: [],
        dailyReports: [],
        preConstruction: []
      };
      setProjects([newProject, ...projects]);
    }
  };

  const handleDeleteProject = (id: string) => {
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
       setProjects(projects.filter(p => p.id !== id));
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'GIS & Tracking', icon: MapIcon },
    { id: 'precon', label: 'Pre-Construction', icon: Compass },
    { id: 'schedule', label: 'Schedule & Plan', icon: CalendarClock },
    { id: 'construction', label: 'Construction Works', icon: Hammer },
    { id: 'daily', label: 'Daily Work Reports', icon: ClipboardCheck },
    { id: 'boq', label: 'BOQ & Billing', icon: ClipboardList },
    { id: 'rfi', label: 'RFI Management', icon: HardHat },
    { id: 'lab', label: 'Lab & Quality', icon: FlaskConical },
    { id: 'resources', label: 'Resources (Store/Fleet)', icon: Truck },
    { id: 'docs', label: 'Correspondence', icon: FileText },
  ];

  // Only Admin and Project Manager see User Management and Settings
  const hasAdminPrivileges = userRole === UserRole.ADMIN || userRole === UserRole.PROJECT_MANAGER;

  if (hasAdminPrivileges) {
      navItems.push({ id: 'users', label: 'User Management', icon: Users });
  }

  // --- View Rendering Logic ---

  // 1. Not Logged In
  if (!isAuthenticated) {
      return <Login onLogin={handleLogin} />;
  }

  // 2. Logged In, No Project Selected
  if (!selectedProjectId) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col">
              <header className="bg-slate-900 text-white h-16 px-8 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2 font-bold text-xl">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">M</div>
                      <span>MyRoad Project</span>
                  </div>
                  <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-300">Welcome, {userName}</span>
                      <button onClick={handleLogout} className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors">Logout</button>
                  </div>
              </header>
              <div className="flex-1 max-w-7xl mx-auto w-full p-8">
                  <ProjectsList 
                    projects={projects} 
                    userRole={userRole}
                    onSelectProject={handleProjectSelect}
                    onSaveProject={handleSaveProject}
                    onDeleteProject={handleDeleteProject}
                  />
              </div>
          </div>
      );
  }

  // 3. Main App (Project Selected)
  if (!currentProject) return null; // Should not happen

  const renderContent = () => {
    const props = { 
      key: currentProject.id, // Force remount on project switch
      project: currentProject, 
      userRole,
      onProjectUpdate: handleProjectUpdate 
    };

    switch (activeTab) {
      case 'dashboard': return <Dashboard project={currentProject} settings={appSettings} />;
      case 'map': return <MapModule {...props} />;
      case 'precon': return <PreConstructionModule {...props} />;
      case 'schedule': return <ScheduleModule {...props} />;
      case 'construction': return <ConstructionModule {...props} />;
      case 'daily': return <DailyReportModule {...props} />;
      case 'boq': return <BOQManager {...props} settings={appSettings} />;
      case 'rfi': return <RFIModule {...props} />;
      case 'lab': return <LabModule {...props} />;
      case 'resources': return <ResourceManager {...props} />;
      case 'docs': return <DocumentsModule {...props} />;
      case 'users': return hasAdminPrivileges ? <UserManagement /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      case 'settings': return hasAdminPrivileges ? <SettingsModule settings={appSettings} onUpdate={setAppSettings} /> : <div className="p-8 text-center text-red-500">Access Denied</div>;
      default: return <Dashboard project={currentProject} settings={appSettings} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {!isSidebarOpen && (
        <div className="fixed top-4 left-4 z-50 md:hidden">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-white shadow-md rounded-md text-slate-600"
          >
            <Menu size={24} />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 flex flex-col
        `}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              M
            </div>
            <span>MyRoad</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-800 bg-slate-800/30">
             <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400 uppercase">
                <Briefcase size={12} /> Current Project
             </div>
             <button 
               onClick={() => setSelectedProjectId(null)}
               className="w-full text-left bg-slate-900 border border-slate-700 text-white text-sm rounded p-2 hover:border-blue-500 transition-colors flex justify-between items-center group"
             >
               <span className="truncate font-medium">{currentProject.code}</span>
               <span className="text-xs text-slate-500 group-hover:text-blue-400">Switch</span>
             </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium
                    ${activeTab === item.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                  `}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 mb-3 px-2">
               <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs">{userName.charAt(0)}</div>
               <div className="overflow-hidden">
                   <div className="text-sm font-medium truncate">{userName}</div>
                   <div className="text-xs text-slate-500 truncate">{userRole}</div>
               </div>
           </div>
           
           {/* Only show Settings button here for Admin/PM */}
           {hasAdminPrivileges && (
             <button 
               onClick={() => setActiveTab('settings')}
               className={`flex items-center gap-3 px-3 py-2 text-sm font-medium w-full transition-colors rounded mb-1 ${activeTab === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
             >
               <Settings size={18} /> Settings
             </button>
           )}

           <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-rose-400 hover:text-rose-300 text-sm font-medium w-full transition-colors hover:bg-slate-800 rounded">
            <X size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <h1 className="text-xl font-semibold text-slate-800">
             {activeTab === 'settings' ? 'System Settings' : navItems.find(i => i.id === activeTab)?.label}
          </h1>
          
          <div className="flex items-center gap-4">
               
               {/* Notification Bell (Simulates Sync) */}
               <div className="relative">
                  <button 
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative"
                  >
                      <Bell size={20} />
                      {notifications.length > 0 && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                      )}
                  </button>
                  
                  {showNotifDropdown && (
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-500">
                              Incoming Data Stream
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                              {notifications.length === 0 ? (
                                  <div className="p-4 text-center text-sm text-slate-400">All synced. No new updates.</div>
                              ) : (
                                  notifications.map((n, i) => (
                                      <div key={i} className="px-4 py-3 border-b border-slate-50 hover:bg-blue-50 text-sm text-slate-700 animate-in fade-in slide-in-from-top-2 duration-300">
                                          {n}
                                      </div>
                                  ))
                              )}
                          </div>
                          <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 text-center">
                              <button onClick={() => setNotifications([])} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                  Mark all as read
                              </button>
                          </div>
                      </div>
                  )}
               </div>

               <div className="hidden md:block text-right border-l border-slate-200 pl-4">
                <div className="text-sm font-bold text-slate-900">{currentProject.name}</div>
                <div className="text-xs text-slate-500 flex items-center justify-end gap-1">
                   <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                   Sync Active | {currentProject.location}
                </div>
               </div>
             <button 
               onClick={() => setIsAIModalOpen(true)}
               className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full shadow-lg shadow-indigo-200 transition-all text-sm font-medium"
             >
               <Bot size={18} />
               <span className="hidden sm:inline">AI Assistant</span>
             </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
        
        {/* AI Modal */}
        {isAIModalOpen && (
          <AIChatModal 
            project={currentProject}
            onClose={() => setIsAIModalOpen(false)} 
          />
        )}
      </main>
    </div>
  );
};

export default App;