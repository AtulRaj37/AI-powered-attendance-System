import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ArrowLeft, User, BookOpen, CheckCircle2, XCircle, Clock, Award } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const StatusBadge = ({ status }) => {
  const cfg = {
    PRESENT: 'bg-emerald-100 text-emerald-800',
    ABSENT: 'bg-red-100 text-red-600',
    LATE: 'bg-amber-100 text-amber-700',
  };
  const s = typeof status === 'string' ? status : status?.value || 'ABSENT';
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg[s] || cfg.ABSENT}`}>{s}</span>;
};

const StudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    api.get(`/students/${studentId}/profile`)
      .then(r => setProfile(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }
  if (!profile) return <div className="text-center py-20 text-gray-400">Student not found.</div>;

  const filteredHistory = profile.history.filter(h => {
    if (statusFilter === 'ALL') return true;
    const s = typeof h.status === 'string' ? h.status : h.status?.value;
    return s === statusFilter;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {}
      <button onClick={() => navigate('/students')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft size={16}/> Back to Student Management
      </button>

      {}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <div className="flex-shrink-0">
          {profile.face_image_url ? (
            <img
              src={`${API_BASE}${profile.face_image_url}`}
              alt={profile.name}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-indigo-100"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <User size={40} className="text-indigo-400"/>
            </div>
          )}
          <div className={`text-center mt-2 text-xs font-semibold px-2 py-1 rounded-full ${profile.face_registered ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
            {profile.face_registered ? '✓ Face Registered' : '✗ No Face'}
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Roll No: <span className="font-mono font-semibold text-gray-700">{profile.roll_number}</span></p>
          {profile.department && <p className="text-gray-500 text-sm">{profile.department}</p>}
        </div>
        {}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Attendance', value: `${profile.attendance_pct}%`, icon: Award, color: profile.attendance_pct >= 75 ? 'text-emerald-600' : profile.attendance_pct >= 50 ? 'text-amber-600' : 'text-red-500' },
            { label: 'Total Sessions', value: profile.total_sessions, icon: BookOpen, color: 'text-indigo-600' },
            { label: 'Attended', value: profile.sessions_attended, icon: CheckCircle2, color: 'text-emerald-600' },
            { label: 'Missed', value: profile.sessions_missed, icon: XCircle, color: 'text-red-500' },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <item.icon size={18} className={`mx-auto mb-1 ${item.color}`}/>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Attendance Rate</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${profile.attendance_pct >= 75 ? 'bg-emerald-500' : profile.attendance_pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${profile.attendance_pct}%` }}
            />
          </div>
          <span className={`text-2xl font-bold ${profile.attendance_pct >= 75 ? 'text-emerald-600' : profile.attendance_pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
            {profile.attendance_pct}%
          </span>
        </div>
        {profile.attendance_pct < 75 && (
          <p className="text-xs text-red-500 mt-2">⚠️ Below the required 75% attendance threshold.</p>
        )}
      </div>

      {}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Clock size={18} className="text-indigo-600"/> Attendance History ({profile.history.length})
          </h2>
          <div className="flex gap-1.5">
            {['ALL', 'PRESENT', 'ABSENT', 'LATE'].map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${statusFilter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Date', 'Subject', 'Status', 'Time Marked'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredHistory.length === 0 ? (
                <tr><td colSpan="4" className="px-5 py-10 text-center text-sm text-gray-400">No records match this filter.</td></tr>
              ) : filteredHistory.map((h, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-mono text-gray-600">{h.date}</td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-gray-900">{h.subject}</p>
                    {h.subject_code && <p className="text-xs text-gray-400">{h.subject_code}</p>}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={h.status} /></td>
                  <td className="px-5 py-3 text-sm font-mono text-gray-400">{h.time_marked || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
