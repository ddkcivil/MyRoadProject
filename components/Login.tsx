import React, { useState } from 'react';
import { UserRole } from '../types';
import { User, Lock, Mail, ArrowLeft, UserPlus, Shield } from 'lucide-react';

interface Props {
  onLogin: (role: UserRole, name: string) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
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
    
    // Simulate login delay
    setTimeout(() => {
        // Mock authentication logic based on email content or fallback
        let role = UserRole.PROJECT_MANAGER;
        let name = "Project Manager";
        
        // Simple mock logic for testing roles
        if (email.includes('admin')) { role = UserRole.ADMIN; name = "Administrator"; }
        else if (email.includes('site')) { role = UserRole.SITE_ENGINEER; name = "Site Engineer"; }
        else if (email.includes('lab')) { role = UserRole.LAB_TECHNICIAN; name = "Lab Tech"; }
        else if (email.includes('super')) { role = UserRole.SUPERVISOR; name = "Supervisor"; }
        
        onLogin(role, name);
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
          // Pre-fill login
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="bg-blue-600 p-8 text-center relative">
            <div className="w-16 h-16 bg-white/20 rounded-xl mx-auto flex items-center justify-center mb-4 backdrop-blur-sm">
                <span className="text-3xl font-bold text-white">R</span>
            </div>
            <h1 className="text-2xl font-bold text-white">RoadMaster Pro</h1>
            <p className="text-blue-100 text-sm mt-2">Construction Management System</p>
        </div>
        
        <div className="p-8">
            {message && (
                <div className={`mb-4 p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* LOGIN FORM */}
            {view === 'LOGIN' && (
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="name@company.com"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-slate-700">Password</label>
                            <button type="button" onClick={() => setView('RESET')} className="text-xs text-blue-600 hover:text-blue-800">Forgot Password?</button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="••••••••"
                            />
                        </div>
                    </div>
                    
                    <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center justify-center"
                    >
                    {loading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : "Sign In"}
                    </button>

                    <div className="text-center pt-2">
                        <span className="text-sm text-slate-500">Don't have an account? </span>
                        <button type="button" onClick={() => setView('REGISTER')} className="text-sm font-bold text-blue-600 hover:text-blue-800">Register</button>
                    </div>
                </form>
            )}

            {/* REGISTER FORM */}
            {view === 'REGISTER' && (
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                              type="text" required value={regName} onChange={(e) => setRegName(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                              type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="name@company.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-3 text-slate-400" size={18} />
                            <select 
                                value={regRole} onChange={(e) => setRegRole(e.target.value as UserRole)}
                                className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                              type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••"
                            />
                        </div>
                    </div>
                    
                    <button 
                        type="submit" disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <><UserPlus size={18}/> Create Account</>}
                    </button>
                    <button type="button" onClick={() => setView('LOGIN')} className="w-full text-sm text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1">
                        <ArrowLeft size={14} /> Back to Login
                    </button>
                </form>
            )}

            {/* RESET FORM */}
            {view === 'RESET' && (
                <form onSubmit={handleReset} className="space-y-5">
                    <div className="text-center text-sm text-slate-500 mb-4">
                        Enter your email address and we'll send you a link to reset your password.
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                              type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="name@company.com"
                            />
                        </div>
                    </div>
                    
                    <button 
                        type="submit" disabled={loading}
                        className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center"
                    >
                        {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Send Reset Link"}
                    </button>
                    <button type="button" onClick={() => setView('LOGIN')} className="w-full text-sm text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1">
                        <ArrowLeft size={14} /> Back to Login
                    </button>
                </form>
            )}
            
            {/* Demo Credentials Footer (Only on Login) */}
            {view === 'LOGIN' && (
                <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
                    <p className="font-semibold mb-1">Demo Accounts:</p>
                    <div className="space-y-1 font-mono bg-slate-50 p-2 rounded">
                        <div className="flex justify-between px-2"><span>Admin:</span> <span className="text-slate-600">admin@road.com</span></div>
                        <div className="flex justify-between px-2"><span>PM:</span> <span className="text-slate-600">pm@road.com</span></div>
                        <div className="flex justify-between px-2"><span>Site Eng:</span> <span className="text-slate-600">site@road.com</span></div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Login;