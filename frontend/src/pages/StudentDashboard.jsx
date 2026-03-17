import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, Calendar, CheckCircle, XCircle, BookOpen, Flame,
  AlertTriangle, User, Target, Bell, ChevronRight, Clock
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const StatusBadge = ({ status }) => {
  const s = String(status).toUpperCase();
  if (s.includes('PRESENT')) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><CheckCircle size={11}/> Present</span>;
  if (s.includes('LATE'))    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full"><Clock size={11}/> Late</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full"><XCircle size={11}/> Absent</span>;
};

const StatCard = ({ icon: Icon, label, value, sub, color, bg }) => (
  <div className={`${bg} rounded-2xl p-5 border border-transparent shadow-sm flex items-center gap-4`}>
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, attRes] = await Promise.all([
          api.get('/students/my-dashboard'),
          api.get('/students/my-attendance'),
        ]);
        setData(dashRes.data);
        setAttendance(attRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <AlertTriangle size={40} className="mb-3 text-amber-400" />
      <p className="font-semibold">Student profile not linked.</p>
      <p className="text-sm mt-1">Contact your admin to link your account.</p>
    </div>
  );

  const { student, stats, today_classes, per_subject, weekly_trend, prediction } = data;
  const pct = stats.attendance_pct;
  const pctColor = pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
  const pctBarColor = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';

  const pieData = [
    { name: 'Present', value: stats.attended },
    { name: 'Absent', value: stats.missed },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, <span className="text-indigo-600">{student.name.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{student.roll_number} · {student.department}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/student/subjects')} className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium transition-colors">
            <BookOpen size={15}/> My Subjects
          </button>
          <button onClick={() => navigate('/student/calendar')} className="flex items-center gap-1.5 text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-medium transition-colors shadow-sm">
            <Calendar size={15}/> Calendar
          </button>
        </div>
      </div>

      {}
      {pct < 75 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="flex-shrink-0 text-red-500"/>
          <p className="text-sm font-medium">
            ⚠️ Your attendance is <strong>{pct}%</strong> — below the 75% threshold.
            {prediction.classes_needed > 0 && ` Attend ${prediction.classes_needed} more consecutive classes to reach 75%.`}
          </p>
        </div>
      )}

      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Attendance" value={`${pct}%`} sub={`${stats.attended}/${stats.total_classes} classes`} color="bg-indigo-600" bg="bg-indigo-50" />
        <StatCard icon={CheckCircle} label="Attended" value={stats.attended} sub="classes present" color="bg-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={XCircle} label="Missed" value={stats.missed} sub="classes absent" color="bg-red-500" bg="bg-red-50" />
        <StatCard icon={Flame} label="Streak" value={stats.streak} sub="consecutive present" color="bg-orange-500" bg="bg-orange-50" />
      </div>

      {}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Overall Attendance</p>
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none"
                  stroke={pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={`${pct} ${100 - pct}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black ${pctColor}`}>{pct}%</span>
                <span className="text-xs text-gray-400">attendance</span>
              </div>
            </div>
            <div className="flex gap-6 mt-4 text-center">
              <div><p className="text-xl font-bold text-emerald-600">{stats.attended}</p><p className="text-xs text-gray-400">Present</p></div>
              <div><p className="text-xl font-bold text-red-500">{stats.missed}</p><p className="text-xs text-gray-400">Absent</p></div>
            </div>
          </div>

          {}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-600"/> Today's Classes
            </h3>
            {today_classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 text-gray-400">
                <Calendar size={28} className="mb-2 opacity-40"/>
                <p className="text-sm">No classes scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {today_classes.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{c.subject}</p>
                      <p className="text-xs text-gray-400">{c.code}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Target size={18}/>
              <h3 className="font-semibold">Attendance Prediction</h3>
            </div>
            <p className="text-indigo-200 text-sm mb-4">Target: {prediction.target_pct}% attendance</p>
            {pct >= prediction.target_pct ? (
              <div>
                <p className="text-2xl font-black">🎉 On Track!</p>
                <p className="text-indigo-200 text-sm mt-1">You've already met the minimum attendance requirement.</p>
              </div>
            ) : (
              <div>
                <p className="text-4xl font-black">{prediction.classes_needed}</p>
                <p className="text-indigo-200 text-sm mt-1">more consecutive classes needed to reach {prediction.target_pct}%</p>
              </div>
            )}
          </div>

          {}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-600"/> Subject Breakdown
            </h3>
            {per_subject.length === 0 ? (
              <p className="text-gray-400 text-sm">No subject data yet.</p>
            ) : (
              <div className="space-y-3">
                {per_subject.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">{s.subject}</span>
                      <span className={`text-sm font-bold ${s.pct >= 75 ? 'text-emerald-600' : s.pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{s.pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full transition-all ${s.pct >= 75 ? 'bg-emerald-500' : s.pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{s.present}/{s.total} classes</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-3">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Bell size={16} className="text-indigo-600"/> Notifications</h3>
            <div className="space-y-2">
              {pct < 75 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0"/>
                  <div>
                    <p className="text-sm font-semibold text-red-800">Low Attendance Warning</p>
                    <p className="text-xs text-red-600 mt-0.5">Your attendance is {pct}%, below the required 75% threshold.</p>
                  </div>
                </div>
              )}
              {!student.face_registered && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0"/>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Face Not Registered</p>
                    <p className="text-xs text-amber-600 mt-0.5">You haven't registered your face yet. Contact your teacher to register.</p>
                  </div>
                </div>
              )}
              {stats.streak >= 5 && (
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <Flame size={16} className="text-orange-500 mt-0.5 flex-shrink-0"/>
                  <div>
                    <p className="text-sm font-semibold text-orange-800">🔥 {stats.streak}-Class Streak!</p>
                    <p className="text-xs text-orange-600 mt-0.5">Keep it up! You've been present for {stats.streak} consecutive classes.</p>
                  </div>
                </div>
              )}
              {pct >= 75 && student.face_registered && stats.streak < 5 && (
                <div className="p-3 bg-emerald-50 rounded-xl text-sm text-emerald-700 border border-emerald-100">
                  ✅ All good! You're meeting attendance requirements.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-indigo-600"/> Attendance Trend (Last 8 Weeks)</h3>
            {weekly_trend.every(w => w.total === 0) ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data available yet.</div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weekly_trend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                    <XAxis dataKey="week" tick={{ fontSize: 11 }}/>
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }}/>
                    <Tooltip formatter={(v) => [`${v}%`, 'Attendance']}/>
                    <Line type="monotone" dataKey="pct" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                    {}
                    <Line type="monotone" dataKey={() => 75} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="75% Target"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Attendance % by Subject</h3>
            {per_subject.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data available.</div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={per_subject} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                    <XAxis dataKey="code" tick={{ fontSize: 10 }}/>
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }}/>
                    <Tooltip formatter={(v, n, p) => [`${v}%`, p.payload.subject]}/>
                    <Bar dataKey="pct" radius={[6, 6, 0, 0]} fill="#6366f1">
                      {per_subject.map((s, i) => (
                        <Cell key={i} fill={s.pct >= 75 ? '#10b981' : s.pct >= 50 ? '#f59e0b' : '#ef4444'}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Present vs Absent</h3>
            {stats.total_classes === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet.</div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      <Cell fill="#6366f1"/>
                      <Cell fill="#f87171"/>
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]}/>
                    <Legend/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Attendance History</h3>
          </div>
          {attendance.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No attendance records yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Date', 'Subject', 'Code', 'Status', 'Time'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attendance.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-gray-700 font-mono">{log.session_date}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{log.subject}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-400">{log.subject_code}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={log.status}/></td>
                      <td className="px-5 py-3.5 text-sm text-gray-400">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
