import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Calendar, Filter, Eye, Clock, Users, ChevronDown, Search } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const cfg = {
    ACTIVE: 'bg-emerald-100 text-emerald-800',
    COMPLETED: 'bg-gray-100 text-gray-700',
    SCHEDULED: 'bg-indigo-100 text-indigo-700',
  };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg[status] || cfg.COMPLETED}`}>{status}</span>;
};

const SessionHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [histRes, subRes] = await Promise.all([
          api.get('/sessions/history'),
          api.get('/subjects/'),
        ]);
        setSessions(histRes.data);
        setSubjects(subRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filtered = sessions.filter(s => {
    if (subjectFilter !== 'ALL' && String(s.subject_id) !== subjectFilter) return false;
    if (search && !s.subject_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const AttendancePct = ({ present, total }) => {
    const pct = total > 0 ? Math.round(present / total * 100) : 0;
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-16">
          <div className={`h-1.5 rounded-full transition-all ${pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-gray-600 font-medium">{pct}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="text-indigo-600" size={24}/> Session History
          </h1>
          <p className="text-sm text-gray-500 mt-1">View all past and active sessions</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search subject..." className="pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <select
            value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={String(s.id)}>{s.name} ({s.code})</option>)}
          </select>
        </div>
      </div>

      {}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Sessions</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-emerald-600">{sessions.filter(s => s.status === 'ACTIVE').length}</p>
          <p className="text-xs text-gray-500 mt-1">Active Now</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-indigo-600">{sessions.filter(s => s.status === 'COMPLETED').length}</p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </div>
      </div>

      {}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Sessions ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Date', 'Subject', 'Duration', 'Attendance', 'Present', 'Absent', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded-lg animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="px-5 py-12 text-center text-sm text-gray-400">No sessions found.</td></tr>
              ) : filtered.map(s => (
                <tr key={s.session_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-sm text-gray-700 font-mono">{s.date}</td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-gray-900">{s.subject_name}</p>
                    <p className="text-xs text-gray-400">{s.subject_code}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 flex items-center gap-1.5">
                    <Clock size={13} className="text-gray-400"/> {s.duration}
                  </td>
                  <td className="px-5 py-4">
                    <AttendancePct present={s.present_count} total={s.total_students} />
                    <p className="text-xs text-gray-400 mt-0.5">{s.present_count}/{s.total_students} present</p>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={s.status} /></td>
                  <td className="px-5 py-4 text-sm font-semibold text-emerald-700">{s.present_count ?? '—'}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-red-600">{s.total_students != null && s.present_count != null ? s.total_students - s.present_count : '—'}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => navigate(`/session/${s.session_id}`)}
                      className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Eye size={12}/> View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SessionHistory;
