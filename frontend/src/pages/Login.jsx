import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { ScanFace, User, BookOpen, ShieldCheck, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [activeTab, setActiveTab] = useState('STUDENT');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    setError('');
    setSuccessMsg('');
    if (activeTab === 'ADMIN') {
        setIsLogin(true);
    }
  }, [activeTab, isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append('username', email); 
        formData.append('password', password);

        const response = await axios.post('http://localhost:8000/api/v1/auth/login', formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const token = response.data.access_token;
        const decoded = jwtDecode(token);
        
        if (decoded.role !== activeTab) {
          setError(`Access denied. Your account is registered as a ${decoded.role}. Please switch to the correct tab.`);
          return;
        }

        localStorage.setItem('token', token);
        navigate('/app');
      } else {
        const payload = {
          email,
          username,
          name,
          password,
          role: activeTab,
          ...(activeTab === 'STUDENT' && { roll_number: rollNumber, department })
        };

        await axios.post('http://localhost:8000/api/v1/auth/signup', payload);
        
        setSuccessMsg('Account securely provisioned! You may now sign in.');
        setTimeout(() => setIsLogin(true), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication sequence failed. Check your data.');
    } finally {
      setLoading(false);
    }
  };

  const activeTheme = {
    STUDENT: { from: 'from-blue-600', to: 'to-indigo-600', text: 'text-blue-600', ring: 'focus:ring-blue-500' },
    TEACHER: { from: 'from-emerald-500', to: 'to-teal-600', text: 'text-emerald-600', ring: 'focus:ring-emerald-500' },
    ADMIN: { from: 'from-purple-600', to: 'to-violet-600', text: 'text-purple-600', ring: 'focus:ring-purple-500' }
  }[activeTab];

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gray-900 font-sans">
      
      {}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-pulse bg-gradient-to-br ${activeTheme.from} ${activeTheme.to} transition-all duration-1000`}></div>
        <div className={`absolute top-[40%] right-[10%] w-[50vw] h-[50vw] rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse bg-gradient-to-tr ${activeTheme.to} ${activeTheme.from} transition-all duration-1000`} style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-center gap-10 p-6">
        
        {}
        <div className="flex-1 text-white lg:pr-16 hidden lg:flex flex-col justify-center">
          <div className="inline-flex items-center space-x-3 mb-8 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 w-max shadow-2xl">
            <ScanFace className="text-white w-6 h-6 animate-pulse" />
            <span className="font-semibold tracking-widest uppercase text-sm">AI Attend Platform</span>
          </div>
          
          <h1 className="text-6xl font-black tracking-tight leading-[1.1] mb-6 drop-shadow-lg">
            Attendance, <br />
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${activeTheme.from} ${activeTheme.to} filter brightness-125 transition-all duration-500`}>
              Reimagined.
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 font-light leading-relaxed max-w-lg mb-10 drop-shadow-md">
            Seamless facial recognition for modern campuses. Eliminate roll calls. Accelerate workflows. Protect integrity.
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-4 bg-black/30 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-xl max-w-md backdrop-saturate-150 transform transition hover:-translate-y-1">
              <ShieldCheck className="text-emerald-400 w-8 h-8" />
              <div>
                <h4 className="text-white font-bold leading-tight">Zero-Trust Security</h4>
                <p className="text-sm text-gray-400">Strict end-to-end payload encryption.</p>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl backdrop-saturate-200 border border-white/20 shadow-2xl rounded-3xl p-8 lg:p-10 relative overflow-hidden">
          
          {}
          <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${activeTheme.from} ${activeTheme.to} rounded-full blur-[80px] opacity-50`}></div>

          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-gray-300 mt-2 text-sm">
                {isLogin ? 'Enter your credentials to continue.' : 'Join your campus ecosystem today.'}
              </p>
            </div>

            {}
            <div className="flex p-1.5 bg-black/40 backdrop-blur-md rounded-2xl mb-8 border border-white/10 shadow-inner">
                {['STUDENT', 'TEACHER', 'ADMIN'].map((role) => (
                  <button 
                    key={role}
                    onClick={() => setActiveTab(role)}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex justify-center items-center ${activeTab === role ? 'bg-white text-gray-900 shadow-md transform scale-100' : 'text-gray-400 hover:text-white hover:bg-white/5 transform scale-95'}`}
                  >
                    {role === 'STUDENT' && <User size={16} className="mr-1.5" />}
                    {role === 'TEACHER' && <BookOpen size={16} className="mr-1.5" />}
                    {role === 'ADMIN' && <ShieldCheck size={16} className="mr-1.5" />}
                    {role.charAt(0) + role.slice(1).toLowerCase()}
                  </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {}
              {error && (
                <div className="flex items-center bg-red-500/20 border border-red-500/50 p-4 rounded-xl backdrop-blur-sm animate-fade-in-up">
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                  <p className="ml-3 text-sm text-red-200 font-medium">{error}</p>
                </div>
              )}
              {successMsg && (
                <div className="flex items-center bg-emerald-500/20 border border-emerald-500/50 p-4 rounded-xl backdrop-blur-sm animate-fade-in-up">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <p className="ml-3 text-sm text-emerald-200 font-medium">{successMsg}</p>
                </div>
              )}

              {}
              {!isLogin && (
                <div className="space-y-5 animate-fade-in-up">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Full Name</label>
                      <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                        className={`block w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${activeTheme.ring} focus:border-transparent transition-all shadow-inner`}
                        placeholder="e.g. John Doe" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Username</label>
                      <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                        className={`block w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${activeTheme.ring} focus:border-transparent transition-all shadow-inner`}
                        placeholder="john_d123" />
                    </div>
                  </div>
                  {activeTab === 'STUDENT' && (
                    <div className="flex gap-4 mt-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Roll No.</label>
                        <input type="text" required value={rollNumber} onChange={(e) => setRollNumber(e.target.value)}
                          className={`block w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${activeTheme.ring} focus:border-transparent transition-all shadow-inner`}
                          placeholder="CS-101" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Dept.</label>
                        <input type="text" required value={department} onChange={(e) => setDepartment(e.target.value)}
                          className={`block w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${activeTheme.ring} focus:border-transparent transition-all shadow-inner`}
                          placeholder="Computer Sci." />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Email Address or Username</label>
                <input type="text" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${activeTheme.ring} focus:border-transparent transition-all shadow-inner`}
                  placeholder="name@university.edu or username" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Secure Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full px-4 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${activeTheme.ring} focus:border-transparent transition-all shadow-inner`}
                  placeholder="••••••••••••" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r ${activeTheme.from} ${activeTheme.to} hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${activeTheme.ring} shadow-lg transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4 overflow-hidden`}
              >
                {}
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full rotate-12 transition-transform duration-700 ease-out group-hover:translate-x-full"></div>
                
                {loading ? (
                    <span className="flex items-center relative z-10">
                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                        Processing Securely...
                    </span>
                ) : (
                    <span className="flex items-center relative z-10">
                        {isLogin ? 'Access Dashboard' : 'Register Account'}
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
                    </span>
                )}
              </button>
            </form>

            {activeTab !== 'ADMIN' && (
              <div className="mt-8 text-center">
                <span className="text-gray-400 text-sm">
                  {isLogin ? "Don't have an account?" : "Already hold credentials?"}
                </span>
                <button 
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className={`ml-2 text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r ${activeTheme.from} ${activeTheme.to} hover:brightness-125 transition-all`}
                >
                  {isLogin ? 'Sign up here' : 'Sign in securely'}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
