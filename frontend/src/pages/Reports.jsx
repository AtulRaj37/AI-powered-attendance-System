import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import {
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { Download, FileText, Calendar, RefreshCw, BarChart3, Users, TrendingUp, Filter } from 'lucide-react';

const COLORS = ['#6366f1', '#ef4444', '#f59e0b'];

const Reports = () => {
  const [logs, setLogs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [sessionData, setSessionData] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchLogs();
    fetchSubjects();
    const timer = setInterval(fetchLogs, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedSubject !== 'all') {
      fetchSubjectAnalytics(selectedSubject);
    }
  }, [selectedSubject]);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/attendance/today');
      setLogs(res.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects/');
      setSubjects(res.data);
    } catch {}
  };

  const fetchSubjectAnalytics = async (subjectId) => {
    try {
      const [sessRes, rankRes] = await Promise.all([
        api.get(`/subjects/${subjectId}/reports`),
        api.get(`/subjects/${subjectId}/student-rankings`),
      ]);
      setSessionData(sessRes.data.map(s => ({
        date: s.date,
        present: s.present_count,
        absent: Math.max(0, (rankRes.data.length || 0) - s.present_count),
        rate: rankRes.data.length > 0 ? Math.round(s.present_count / rankRes.data.length * 100) : 0,
      })).reverse());
      setRankings(rankRes.data);
    } catch {}
  };

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Student Name', 'Roll Number', 'Time', 'Camera ID', 'Confidence'];
    const rows = logs.map(l => [l.id, l.student_name, l.roll_number, l.time, l.camera_id, (l.confidence * 100).toFixed(1) + '%']);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI('data:text/csv;charset=utf-8,' + csvContent));
    link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pieData = selectedSubject !== 'all' && rankings.length > 0 ? [
    { name: 'Present', value: rankings.reduce((a, r) => a + r.present_sessions, 0) },
    { name: 'Absent', value: rankings.reduce((a, r) => a + (r.total_sessions - r.present_sessions), 0) },
  ] : [
    { name: 'Present', value: logs.length },
    { name: 'Other', value: 0 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="text-indigo-600" size={26}/> Attendance Analytics
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Last updated: {lastRefresh.toLocaleTimeString()}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3 flex-wrap items-center">
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="all">All Subjects (Today)</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} — {s.code}</option>)}
          </select>
          <button onClick={fetchLogs} className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors">
            <RefreshCw size={16} className="mr-1.5"/> Refresh
          </button>
          <button onClick={exportCSV} disabled={logs.length === 0} className="flex items-center px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
            <Download size={16} className="mr-1.5"/> CSV
          </button>
          <button onClick={() => window.print()} className="flex items-center px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-medium transition-colors">
            <FileText size={16} className="mr-1.5"/> PDF
          </button>
        </div>
      </div>

      {}
      {selectedSubject !== 'all' && (
        <>
          <div className="grid lg:grid-cols-3 gap-6">
            {}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600"/> Attendance Trend
              </h2>
              {sessionData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No session data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={sessionData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)}/>
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%"/>
                    <Tooltip formatter={(v) => `${v}%`}/>
                    <Line type="monotone" dataKey="rate" name="Attendance %" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }}/>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Distribution</h2>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" nameKey="name">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} sessions`, n]}/>
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users size={18} className="text-indigo-600"/>
              <h2 className="font-bold text-gray-900">Student Rankings — Attendance %</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Rank', 'Student', 'Roll No.', 'Sessions Present', 'Attendance %'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rankings.map((r, i) => (
                    <tr key={r.student_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <span className={`text-sm font-bold ${i === 0 ? 'text-amber-600' : i === 1 ? 'text-gray-600' : i === 2 ? 'text-amber-800' : 'text-gray-400'}`}>
                          #{i + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{r.name}</td>
                      <td className="px-5 py-3 text-sm font-mono text-gray-600">{r.roll_number}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{r.present_sessions}/{r.total_sessions}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-2">
                            <div className={`h-2 rounded-full ${r.attendance_pct >= 75 ? 'bg-emerald-500' : r.attendance_pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${r.attendance_pct}%` }}/>
                          </div>
                          <span className={`text-sm font-bold ${r.attendance_pct >= 75 ? 'text-emerald-700' : r.attendance_pct >= 50 ? 'text-amber-700' : 'text-red-600'}`}>{r.attendance_pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rankings.length === 0 && (
                    <tr><td colSpan="5" className="px-5 py-10 text-center text-gray-400 text-sm">Select a subject to see rankings.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Calendar size={18} className="text-indigo-600"/>
          <h3 className="font-semibold text-gray-800">Today's Attendance Logs ({logs.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Roll No.', 'Name', 'Time Present', 'Camera Source', 'AI Confidence'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="px-5 py-4 text-center text-sm text-gray-400">Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="5" className="px-5 py-10 text-center text-sm text-gray-400">No attendance recorded in the last 24 hours.</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-mono text-gray-600">{log.roll_number}</td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-900">{log.student_name}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{log.time}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{log.camera_id}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${log.confidence > 0.8 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {(log.confidence * 100).toFixed(1)}%
                    </span>
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

export default Reports;
