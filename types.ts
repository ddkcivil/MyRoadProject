
export enum UserRole {
  PROJECT_MANAGER = 'Project Manager',
  SITE_ENGINEER = 'Site Engineer',
  SUPERVISOR = 'Supervisor',
  LAB_TECHNICIAN = 'Lab Technician',
  ADMIN = 'Admin'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface NotificationPreferences {
  enableEmail: boolean;
  enableInApp: boolean;
  notifyUpcoming: boolean;
  daysBefore: number; // Days before deadline to notify
  notifyOverdue: boolean;
  dailyDigest: boolean;
}

export interface AppSettings {
  companyName: string;
  currency: string; // 'USD', 'NPR', 'INR'
  vatRate: number; // Percentage, e.g., 13
  fiscalYearStart: string; // YYYY-MM-DD
  notifications: NotificationPreferences;
}

export enum RFIStatus {
  OPEN = 'Open',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CLOSED = 'Closed'
}

export enum WorkCategory {
  EARTHWORK = 'Earthwork',
  PAVEMENT = 'Pavement',
  DRAINAGE = 'Drainage',
  STRUCTURES = 'Structures',
  FURNITURE = 'Road Furniture',
  FOOTPATH = 'Foothpath',
  GENERAL = 'General',
  PROVISIONAL_SUM = 'Provisional Sum'
}

export interface BOQItem {
  id: string;
  itemNo: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  category: WorkCategory;
  completedQuantity: number;
}

export interface RFI {
  id: string;
  rfiNumber: string;
  date: string;
  location: string;
  description: string;
  status: RFIStatus;
  requestedBy: string;
  inspectionDate: string;
}

export interface LabTest {
  id: string;
  testName: string;
  sampleId: string;
  date: string;
  location: string;
  result: 'Pass' | 'Fail' | 'Pending';
  technician: string;
}

export interface ScheduleTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'On Track' | 'Delayed' | 'Completed';
}

export interface InventoryItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  location: string;
  lastUpdated: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'IN' | 'OUT';
  date: string;
  quantity: number;
  // Stock In fields
  vendorName?: string;
  billNo?: string;
  // Stock Out fields
  partyName?: string; // Who took it
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  status: 'Active' | 'Maintenance' | 'Idle';
  driver: string;
}

export interface VehicleLog {
  id: string;
  vehicleId: string;
  plateNumber: string;
  date: string;
  startKm: number;
  endKm: number;
  totalKm: number;
  fuelConsumed: number; // Liters
  workingHours: number;
  activityDescription: string;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: 'PDF' | 'DOCX' | 'XLSX' | 'IMAGE';
  date: string;
  size: string;
  refNo?: string;
  subject?: string;
  content?: string; // Base64 or URL for preview
}

export interface DailyWorkItem {
  id: string;
  boqItemId: string;
  location: string; 
  quantity: number;
  description: string;
  links?: string[]; 
}

export interface DailyReport {
  id: string;
  date: string;
  reportNumber: string;
  items: DailyWorkItem[];
  status: 'Draft' | 'Submitted' | 'Approved';
  submittedBy: string;
  approvedBy?: string;
}

export interface PreConstructionLog {
    date: string;
    progressAdded: number;
    description: string;
}

export interface PreConstructionTask {
  id: string;
  category: 'Land Acquisition' | 'Forest Clearance' | 'Utility Shifting' | 'Survey' | 'Design';
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  targetDate: string;
  estStartDate?: string;
  estEndDate?: string;
  progress: number; // 0-100
  remarks: string;
  logs?: PreConstructionLog[];
}

export interface Project {
  id: string;
  name: string;
  code: string;
  location: string;
  client: string;
  engineer: string;
  contractor: string;
  contractNo: string;
  startDate: string;
  endDate: string;
  boq: BOQItem[];
  rfis: RFI[];
  labTests: LabTest[];
  schedule: ScheduleTask[];
  inventory: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  vehicles: Vehicle[];
  vehicleLogs: VehicleLog[];
  documents: ProjectDocument[];
  dailyReports: DailyReport[];
  preConstruction: PreConstructionTask[];
}
