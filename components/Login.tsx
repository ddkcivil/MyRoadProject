import React, { useState, useContext } from 'react';
import { UserRole } from '../types';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Alert,
  Link,
  Container
} from '@mui/material';
import { useTheme } from '@mui/material/styles'; // Import useTheme
import { UserPlus, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../AuthAndSettingsContext'; // Import AuthContext

interface Props {
  // onLogin: (role: UserRole, name: string) => void; // Removed, now using context
}

const Login: React.FC<Props> = () => {
  const theme = useTheme(); // Initialize useTheme
  const { dispatchAuth } = useContext(AuthContext); // Use AuthContext
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'RESET'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>(UserRole.SITE_ENGINEER);

  // Reset State
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    setTimeout(() => {
        let role = UserRole.PROJECT_MANAGER;
        let name = "Project Manager";
        let userId = "u2"; // Default PM
        if (email.includes('admin')) { role = UserRole.ADMIN; name = "Administrator"; userId = "u1"; }
        else if (email.includes('site')) { role = UserRole.SITE_ENGINEER; name = "Site Engineer"; userId = "u3"; }
        else if (email.includes('lab')) { role = UserRole.LAB_TECHNICIAN; name = "Lab Tech"; userId = "u4"; }
        else if (email.includes('super')) { role = UserRole.SUPERVISOR; name = "Supervisor"; userId = "u5"; }
        
        dispatchAuth({ type: 'LOGIN', payload: { role, name, userId } }); // Dispatch LOGIN action
        setLoading(false);
    }, 1000);
  };

  const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setTimeout(() => {
          setLoading(false);
          setMessage({ type: 'success', text: 'Registration successful! Please login.' });
          setView('LOGIN');
          setEmail(regEmail);
      }, 1000);
  };

  const handleReset = (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setTimeout(() => {
          setLoading(false);
          setMessage({ type: 'success', text: `Password reset link sent to ${resetEmail}` });
          setTimeout(() => setView('LOGIN'), 2000);
      }, 1000);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: 'primary.main', p: 4, textAlign: 'center', color: 'white' }}>
             <Box sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                <Typography variant="h4" fontWeight="bold">M</Typography>
             </Box>
             <Typography variant="h5" fontWeight="bold">MyRoad Project</Typography>
             <Typography variant="body2" sx={{ opacity: 0.8 }}>Construction Management System</Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            {message && <Alert severity={message.type} sx={{ mb: 3 }}>{message.text}</Alert>}

            {/* LOGIN FORM */}
            {view === 'LOGIN' && (
              <form onSubmit={handleLogin}>
                <Box display="flex" flexDirection="column" gap={3}>
                  <TextField 
                    label="Email Address" 
                    type="email" 
                    fullWidth 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                  <Box>
                    <TextField 
                      label="Password" 
                      type="password" 
                      fullWidth 
                      required 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                    />
                    <Box textAlign="right" mt={1}>
                       <Link component="button" type="button" onClick={() => setView('RESET')} underline="hover" sx={{ fontSize: '0.875rem' }}>
                         Forgot Password?
                       </Link>
                    </Box>
                  </Box>

                  <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>

                  <Typography variant="body2" align="center" color="text.secondary">
                    Don't have an account? {' '}
                    <Link component="button" type="button" onClick={() => setView('REGISTER')} fontWeight="bold" underline="hover">
                      Register
                    </Link>
                  </Typography>
                </Box>
              </form>
            )}

            {/* REGISTER FORM */}
            {view === 'REGISTER' && (
              <form onSubmit={handleRegister}>
                 <Box display="flex" flexDirection="column" gap={3}>
                    <TextField label="Full Name" fullWidth required value={regName} onChange={e => setRegName(e.target.value)} />
                    <TextField label="Email" type="email" fullWidth required value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                    
                    <FormControl fullWidth>
                      <InputLabel>Role</InputLabel>
                      <Select value={regRole} label="Role" onChange={(e) => setRegRole(e.target.value as UserRole)}>
                         {Object.values(UserRole).map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                      </Select>
                    </FormControl>

                    <TextField label="Password" type="password" fullWidth required value={regPassword} onChange={e => setRegPassword(e.target.value)} />

                    <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} startIcon={<UserPlus size={18}/>}>
                      {loading ? 'Creating...' : 'Create Account'}
                    </Button>

                    <Button startIcon={<ArrowLeft size={16}/>} onClick={() => setView('LOGIN')}>
                      Back to Login
                    </Button>
                 </Box>
              </form>
            )}

            {/* RESET FORM */}
            {view === 'RESET' && (
              <form onSubmit={handleReset}>
                <Box display="flex" flexDirection="column" gap={3}>
                   <Typography variant="body2" color="text.secondary" align="center">
                     Enter your email address and we'll send you a link to reset your password.
                   </Typography>
                   <TextField label="Email Address" type="email" fullWidth required value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                   
                   <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                      {loading ? 'Sending...' : 'Send Reset Link'}
                   </Button>

                   <Button startIcon={<ArrowLeft size={16}/>} onClick={() => setView('LOGIN')}>
                      Back to Login
                   </Button>
                </Box>
              </form>
            )}

            {view === 'LOGIN' && (
               <Box mt={4} pt={3} borderTop={`1px solid ${theme.palette.divider}`} textAlign="center">
                  <Typography variant="caption" color="text.secondary" display="block" mb={1} fontWeight="bold">Demo Accounts:</Typography>
                  <Box display="flex" flexDirection="column" gap={0.5} sx={{ bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
                     <Typography variant="caption" fontFamily="monospace">Admin: admin@road.com</Typography>
                     <Typography variant="caption" fontFamily="monospace">PM: pm@road.com</Typography>
                     <Typography variant="caption" fontFamily="monospace">Site: site@road.com</Typography>
                  </Box>
               </Box>
            )}

          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;