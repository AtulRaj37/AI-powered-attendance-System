import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Shield, User, Mail, ShieldCheck, Settings, Edit2, CheckCircle, XCircle, Lock } from 'lucide-react';
import api from '../lib/api';

const Profile = () => {
  const [userData, setUserData] = useState({
    email: '',
    username: '',
    name: '',
    role: '',
    initials: ''
  });

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ email: '', username: '', name: '', password: '' });
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [teacherStats, setTeacherStats] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const fetchProfile = async () => {
        try {
          const res = await api.get('/auth/profile');
          const data = res.data;
          setUserData({
            email: data.email || '',
            username: data.username || '',
            name: data.name || '',
            role: data.role || 'USER',
            initials: (data.name ? data.name.substring(0, 2) : (data.email ? data.email.substring(0, 2) : 'US')).toUpperCase()
          });
          setFormData(prev => ({ ...prev, email: data.email || '', username: data.username || '', name: data.name || '' }));
          if ((data.role || '').toUpperCase() === 'TEACHER') {
            try {
              const statsRes = await api.get('/students/teacher-stats');
              setTeacherStats(statsRes.data);
            } catch {}
          }
        } catch (err) {
          console.error("Failed to fetch profile");
        }
      };
      fetchProfile();
    }
  }, []);

  const handleSave = async () => {
    setStatusMsg({ type: '', text: '' });
    try {
      const payload = {};
      if (formData.email !== userData.email) payload.email = formData.email;
      if (formData.username !== userData.username) payload.username = formData.username;
      if (formData.name !== userData.name) payload.name = formData.name;
      if (formData.password) payload.password = formData.password;
      
      if (Object.keys(payload).length === 0) {
        setEditMode(false);
        return;
      }

      const res = await api.put('/auth/profile', payload);
      const data = res.data;
      
      setUserData(prev => ({
        ...prev,
        email: data.email || prev.email,
        username: data.username || prev.username,
        name: data.name || prev.name,
        initials: (data.name ? data.name.substring(0, 2) : (data.email ? data.email.substring(0, 2) : 'US')).toUpperCase()
      }));
      setFormData({ email: data.email || '', username: data.username || '', name: data.name || '', password: '' });
      setEditMode(false);
      setStatusMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
        <Settings className="text-indigo-600" size={20}/> Account Settings
      </h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow font-bold text-xl text-white flex-shrink-0">
            {userData.initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">{userData.name || userData.username || userData.email}</h2>
            <p className="text-indigo-600 font-medium flex items-center text-xs mt-0.5">
              <ShieldCheck className="w-3 h-3 mr-1" /> {userData.role} Access Privilege
            </p>
          </div>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-xl font-medium transition-colors border border-gray-200 text-sm flex items-center flex-shrink-0"
            >
              <Edit2 className="w-4 h-4 mr-1.5" /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => { setEditMode(false); setFormData({ email: userData.email, username: userData.username, name: userData.name, password: '' }); }}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-xl font-medium transition-colors text-sm flex items-center"
              >
                <XCircle className="w-4 h-4 mr-1" /> Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-1" /> Save
              </button>
            </div>
          )}
        </div>

        {statusMsg.text && (
          <div className={`mx-6 mt-3 p-3 rounded-lg text-sm font-medium ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {statusMsg.text}
          </div>
        )}

        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Profile Details</h3>
              
              <div className={`flex items-center bg-gray-50 p-3 rounded-xl border ${editMode ? 'border-indigo-300 ring-1 ring-indigo-100 bg-white' : 'border-gray-100'} transition-all`}>
                <User className="w-4 h-4 mr-3 text-indigo-500 flex-shrink-0" />
                <div className="w-full">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Full Name</p>
                  {editMode ? (
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full outline-none bg-transparent font-medium text-gray-900"
                      placeholder="e.g. John Doe"
                    />
                  ) : (
                    <p className="font-medium text-gray-900 truncate">{userData.name || 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div className={`flex items-center bg-gray-50 p-3 rounded-xl border ${editMode ? 'border-indigo-300 ring-1 ring-indigo-100 bg-white' : 'border-gray-100'} transition-all`}>
                <User className="w-4 h-4 mr-3 text-indigo-500 flex-shrink-0" />
                <div className="w-full">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Username</p>
                  {editMode ? (
                    <input 
                      type="text" 
                      value={formData.username} 
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full outline-none bg-transparent font-medium text-gray-900"
                      placeholder="e.g. john_123"
                    />
                  ) : (
                    <p className="font-medium text-gray-900 truncate">@{userData.username || 'unknown'}</p>
                  )}
                </div>
              </div>

              <div className={`flex items-center bg-gray-50 p-3 rounded-xl border ${editMode ? 'border-indigo-300 ring-1 ring-indigo-100 bg-white' : 'border-gray-100'} transition-all`}>
                <Mail className="w-4 h-4 mr-3 text-indigo-500 flex-shrink-0" />
                <div className="w-full">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Primary Email</p>
                  {editMode ? (
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full outline-none bg-transparent font-medium text-gray-900"
                      placeholder="name@university.edu"
                    />
                  ) : (
                    <p className="font-medium text-gray-900 truncate">{userData.email}</p>
                  )}
                </div>
              </div>

              {editMode && (
                <div className="flex items-center bg-gray-50 p-3 rounded-xl border border-indigo-300 ring-1 ring-indigo-100 bg-white transition-all">
                  <Lock className="w-4 h-4 mr-3 text-indigo-500 flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">New Password (Optional)</p>
                    <input 
                      type="password" 
                      placeholder="Leave blank to keep current"
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full outline-none bg-transparent font-medium text-gray-900"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 opacity-75">
                <Shield className="w-4 h-4 mr-3 text-gray-400" />
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Security Role (Locked)</p>
                  <p className="font-medium text-gray-600 capitalize">{userData.role.toLowerCase()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">System Preferences</h3>
              {teacherStats ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Teaching Statistics</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Subjects Teaching', value: teacherStats.subjects_teaching },
                      { label: 'Sessions Conducted', value: teacherStats.total_sessions_conducted },
                      { label: 'Avg Attendance', value: `${teacherStats.avg_attendance}%` },
                    ].map(item => (
                      <div key={item.label} className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
                        <p className="text-xl font-bold text-indigo-700">{item.value}</p>
                        <p className="text-xs text-indigo-500 mt-0.5 font-medium leading-tight">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-center text-gray-500 text-sm">
                  No configurable preferences available for this role.
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
