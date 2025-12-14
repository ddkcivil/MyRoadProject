import { authReducer, initialAuthState, AuthAction, AuthState, settingsReducer, initialSettingsState, SettingsAction, SettingsState } from '../AuthAndSettingsContext';
import { UserRole } from '../types'; // Assuming UserRole is defined in types.ts

describe('authReducer', () => {
  it('should return the initial state', () => {
    expect(authReducer(initialAuthState, {} as AuthAction)).toEqual(initialAuthState);
  });

  it('should handle LOGIN action correctly', () => {
    const loginAction: AuthAction = {
      type: 'LOGIN',
      payload: { role: UserRole.ADMIN, name: 'Test Admin', userId: 'u123' },
    };
    const expectedState: AuthState = {
      isAuthenticated: true,
      userRole: UserRole.ADMIN,
      userName: 'Test Admin',
      currentUserId: 'u123',
    };
    expect(authReducer(initialAuthState, loginAction)).toEqual(expectedState);
  });

  it('should handle LOGOUT action correctly', () => {
    const currentState: AuthState = {
      isAuthenticated: true,
      userRole: UserRole.PROJECT_MANAGER,
      userName: 'Test PM',
      currentUserId: 'u456',
    };
    const logoutAction: AuthAction = { type: 'LOGOUT' };
    expect(authReducer(currentState, logoutAction)).toEqual(initialAuthState);
  });

  it('should not modify state for unknown action types', () => {
    const currentState: AuthState = {
      isAuthenticated: true,
      userRole: UserRole.SITE_ENGINEER,
      userName: 'Test Site',
      currentUserId: 'u789',
    };
    const unknownAction: AuthAction = { type: 'UNKNOWN_ACTION' } as AuthAction; // Cast to bypass type checking for test
    expect(authReducer(currentState, unknownAction)).toEqual(currentState);
  });
});

describe('settingsReducer', () => {
  it('should return the initial state', () => {
    expect(settingsReducer(initialSettingsState, {} as SettingsAction)).toEqual(initialSettingsState);
  });

  it('should handle UPDATE_SETTINGS action correctly', () => {
    const newSettings = {
      companyName: 'New Company',
      currency: 'EUR',
      vatRate: 20,
      fiscalYearStart: '2024-01-01',
      notifications: {
        enableEmail: false,
        enableInApp: false,
        notifyUpcoming: false,
        daysBefore: 5,
        notifyOverdue: false,
        dailyDigest: false,
      },
    };
    const updateAction: SettingsAction = { type: 'UPDATE_SETTINGS', payload: newSettings };
    const expectedState: SettingsState = {
      appSettings: newSettings,
    };
    expect(settingsReducer(initialSettingsState, updateAction)).toEqual(expectedState);
  });

  it('should not modify state for unknown action types', () => {
    const currentState: SettingsState = {
      appSettings: {
        companyName: 'Existing Company',
        currency: 'USD',
        vatRate: 10,
        fiscalYearStart: '2023-07-01',
        notifications: {
          enableEmail: true,
          enableInApp: true,
          notifyUpcoming: true,
          daysBefore: 3,
          notifyOverdue: true,
          dailyDigest: true,
        },
      },
    };
    const unknownAction: SettingsAction = { type: 'UNKNOWN_ACTION' } as SettingsAction; // Cast to bypass type checking for test
    expect(settingsReducer(currentState, unknownAction)).toEqual(currentState);
  });
});