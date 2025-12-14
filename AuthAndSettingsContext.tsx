import React, { createContext, useReducer, useContext, ReactNode } from 'react';
import { UserRole, AppSettings } from './types'; // Assuming types.ts is in the same directory or accessible

// --- Auth Context ---
export interface AuthState {
  isAuthenticated: boolean;
  userRole: UserRole;
  userName: string;
  currentUserId: string;
}

export type AuthAction = 
  | { type: 'LOGIN'; payload: { role: UserRole; name: string; userId: string } }
  | { type: 'LOGOUT' }
  | { type: 'UNKNOWN_ACTION' }; // Added for testing purposes

export const initialAuthState: AuthState = {
  isAuthenticated: false,
  userRole: UserRole.GUEST,
  userName: '',
  currentUserId: '',
};

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        userRole: action.payload.role,
        userName: action.payload.name,
        currentUserId: action.payload.userId,
      };
    case 'LOGOUT':
      return {
        ...initialAuthState,
      };
    default:
      return state;
  }
};

export const AuthContext = createContext<{
  authState: AuthState;
  dispatchAuth: React.Dispatch<AuthAction>;
}>({
  authState: initialAuthState,
  dispatchAuth: () => undefined,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, dispatchAuth] = useReducer(authReducer, initialAuthState);

  return (
    <AuthContext.Provider value={{ authState, dispatchAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Settings Context ---
export interface SettingsState {
  appSettings: AppSettings;
}

export type SettingsAction = 
  | { type: 'UPDATE_SETTINGS'; payload: AppSettings }
  | { type: 'UNKNOWN_ACTION' }; // Added for testing purposes

export const initialSettingsState: SettingsState = {
  appSettings: {
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
  },
};

export const settingsReducer = (state: SettingsState, action: SettingsAction): SettingsState => {
  switch (action.type) {
    case 'UPDATE_SETTINGS':
      return { ...state, appSettings: action.payload };
    default:
      return state;
  }
};

export const SettingsContext = createContext<{
  settingsState: SettingsState;
  dispatchSettings: React.Dispatch<SettingsAction>;
}>({
  settingsState: initialSettingsState,
  dispatchSettings: () => undefined,
});

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settingsState, dispatchSettings] = useReducer(settingsReducer, initialSettingsState);

  return (
    <SettingsContext.Provider value={{ settingsState, dispatchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};