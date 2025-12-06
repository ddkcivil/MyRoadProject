
import { Project, RFIStatus, WorkCategory, User, UserRole, RFI, LabTest, ScheduleTask, InventoryItem, InventoryTransaction, Vehicle, VehicleLog, ProjectDocument, DailyReport, PreConstructionTask, DailyWorkItem } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@roadmaster.com', role: UserRole.ADMIN },
  { id: 'u2', name: 'Rajesh Kumar', email: 'pm@roadmaster.com', role: UserRole.PROJECT_MANAGER },
  { id: 'u3', name: 'John Doe', email: 'site@roadmaster.com', role: UserRole.SITE_ENGINEER },
  { id: 'u4', name: 'Sarah Lee', email: 'lab@roadmaster.com', role: UserRole.LAB_TECHNICIAN },
  { id: 'u5', name: 'Vikram Singh', email: 'supervisor@roadmaster.com', role: UserRole.SUPERVISOR },
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
  { id: 'd-1', name: 'Contract_Agreement.pdf', type: 'PDF', date: '2023-08-15', size: '4.2 MB', subject: 'Main Contract Agreement' },
  { id: 'd-2', name: 'Site_Handover_Plan.pdf', type: 'PDF', date: '2023-09-01', size: '1.5 MB', subject: 'Site Handover Layout', refNo: 'NHAI/2023/SH/01' },
  { id: 'd-3', name: 'Oct_Monthly_Report.pdf', type: 'PDF', date: '2023-10-31', size: '2.8 MB', subject: 'Monthly Progress Report October' },
  { id: 'd-4', name: 'Design_Drawing_Culvert.pdf', type: 'PDF', date: '2023-09-10', size: '5.1 MB', subject: 'GFC Drawings for Box Culvert', refNo: 'DES/STR/005' },
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

export const MOCK_PROJECTS: Project[] = [
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
    preConstruction: mockPreConstruction
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
      { id: 'p2-d-1', name: 'Forest_Clearance_Letter.pdf', type: 'PDF', date: '2023-07-20', size: '1.2 MB' },
      { id: 'p2-d-2', name: 'Env_Impact_Assessment.pdf', type: 'PDF', date: '2023-06-15', size: '12.5 MB' }
    ],
    dailyReports: [],
    preConstruction: []
  }
];
