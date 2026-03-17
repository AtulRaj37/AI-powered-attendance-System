import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { 
  LayoutDashboard, 
  Users, 
  Video, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Settings,
  Bell,
  ChevronDown,
  UserCircle,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Scan
} from 'lucide-react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '', role: '' });
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  let userRole = 'USER';
  let userEmail = '';
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.role || 'USER';
      userEmail = decoded.sub || '';
    } catch (e) {}
  }

  useEffect(() => {
    if (!token) return;
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setProfile({ name: data.name || '', email: data.email || '', role: data.role || userRole });
      })
      .catch(() => {});
  }, [token]);

  const displayName = profile.name || profile.email?.split('@')[0] || userEmail.split('@')[0] || 'User';
  const displayRole = profile.role || userRole;
  const displayEmail = profile.email || userEmail;
  const initials = displayName.substring(0, 2).toUpperCase();

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  let navigation = [];
  if (userRole === 'ADMIN') {
    navigation = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Student Management', href: '/students', icon: Users },
      { name: 'Account Settings', href: '/profile', icon: Settings },
    ];
  } else if (userRole === 'TEACHER') {
    navigation = [
      { name: 'Teacher Hub', href: '/teacher', icon: LayoutDashboard },
      { name: 'Session History', href: '/session-history', icon: Video },
      { name: 'Analytics & Reports', href: '/reports', icon: BarChart3 },
      { name: 'Student Management', href: '/students', icon: Users },
      { name: 'Account Settings', href: '/profile', icon: Settings },
    ];
  } else if (userRole === 'STUDENT') {
    navigation = [
      { name: 'My Attendance', href: '/student', icon: BarChart3 },
      { name: 'My Subjects', href: '/student/subjects', icon: BookOpen },
      { name: 'Calendar', href: '/student/calendar', icon: CalendarDays },
      { name: 'Face Profile', href: '/student/face', icon: Scan },
      { name: 'Account Settings', href: '/profile', icon: Settings },
    ];
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-indigo-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-xl ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {}
        <div className="flex items-center justify-between h-16 px-5 bg-indigo-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow flex-shrink-0">
              <GraduationCap size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight tracking-wide">Attend AI</p>
              <p className="text-indigo-400 text-[10px] font-medium leading-tight tracking-wider">Smart Attendance Platform</p>
            </div>
          </div>
          <button className="lg:hidden text-gray-300 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1 mt-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActive 
                    ? 'bg-indigo-700 text-white shadow-sm' 
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`}
              >
                <Icon className={`mr-3 h-4 w-4 ${isActive ? 'text-indigo-200' : 'text-indigo-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-indigo-800">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center px-4 py-2.5 text-sm font-medium rounded-lg text-indigo-200 hover:bg-indigo-800 hover:text-white transition-colors duration-200"
          >
            <LogOut className="mr-3 h-4 w-4 text-indigo-400" />
            Logout
          </button>
        </div>
      </div>

      {}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {}
        <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 lg:px-6 z-10 flex-shrink-0">
          {}
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden text-gray-500 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-colors" 
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            {}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <GraduationCap size={15} className="text-white" />
              </div>
              <span className="font-bold text-gray-900 text-sm">Attend AI</span>
            </div>
          </div>

          {}
          <div className="flex items-center gap-2 ml-auto">
            {}
            <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            {}
            <div className="w-px h-6 bg-gray-200 mx-1" />

            {}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                {}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white flex-shrink-0 shadow-sm">
                  {initials}
                </div>
                {}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-900 leading-tight capitalize">{displayName}</p>
                  <p className="text-xs text-gray-400 leading-tight capitalize">{displayRole.toLowerCase()}</p>
                </div>
                <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                  {}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 capitalize truncate">{displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{displayEmail}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                      <UserCircle size={16} className="text-gray-400" />
                      My Profile
                    </button>
                    <button
                      onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                      <Settings size={16} className="text-gray-400" />
                      Account Settings
                    </button>
                  </div>

                  <div className="pt-1 border-t border-gray-100">
                    <button
                      onClick={() => { handleLogout(); setDropdownOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} className="text-red-400" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
        
        {}
        <footer className="w-full bg-white border-t py-3 text-center flex-shrink-0">
          <p className="text-gray-400 font-medium text-xs tracking-wide">
            Engineered with Precision by <span className="text-indigo-500 font-bold ml-1">Atul Raj</span>, <span className="text-indigo-500 font-bold">Ananda Sekhar Rauta</span>, <span className="text-indigo-500 font-bold">Kaushal Kumar</span> &amp; <span className="text-indigo-500 font-bold">Biswajit Sahu</span>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
