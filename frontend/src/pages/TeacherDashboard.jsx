import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import {
  BookOpen, PlayCircle, Plus, Loader2, XCircle, Edit2, Trash2,
  BarChart3, Users, Clock, TrendingUp, CheckCircle, AlertTriangle,
  Eye, Zap, Monitor, X, Save
} from 'lucide-react';

const Toast = ({ toasts, removeToast }) => (
  <div className="fixed top-5 right-5 z-50 space-y-2 pointer-events-none">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium pointer-events-auto animate-fade-in-up transition-all
          ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-red-600' : 'bg-indigo-600'}`}
      >
        {t.type === 'success' ? <CheckCircle size={16}/> : t.type === 'error' ? <AlertTriangle size={16}/> : <Zap size={16}/>}
        {t.message}
        <button onClick={() => removeToast(t.id)} className="ml-2 opacity-70 hover:opacity-100"><X size={14}/></button>
      </div>
    ))}
  </div>
);

function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return { toasts, addToast, removeToast };
}

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const TeacherDashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [stats, setStats] = useState({ today_sessions: 0, active_sessions: 0, total_students: 0, avg_attendance: 0, total_subjects: 0, sessions_this_week: 0 });
  const [aiStats, setAiStats] = useState({ faces_detected_today: 0, avg_confidence: 0, unknown_faces_today: 0, recognition_rate: 0, false_positives: 0, last_recognition_time: null, camera_status: 'Offline' });

  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', department: '', semester: '' });
  const [isCreating, setIsCreating] = useState(false);

  const [editSubject, setEditSubject] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', code: '', department: '', semester: '' });
  const [isSaving, setIsSaving] = useState(false);

  const { toasts, addToast, removeToast } = useToast();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [subRes, sessRes, statsRes, aiRes] = await Promise.all([
        api.get('/subjects/'),
        api.get('/sessions/active'),
        api.get('/subjects/stats').catch(() => ({ data: {} })),
        api.get('/attendance/ai-stats').catch(() => ({ data: {} })),
      ]);
      setSubjects(subRes.data);
      setActiveSessions(sessRes.data);
      if (statsRes.data) setStats(statsRes.data);
      if (aiRes.data) setAiStats(aiRes.data);
    } catch (err) {
      console.error("Failed to fetch teacher data:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const startSession = async (subjectId) => {
    try {
      const res = await api.post('/sessions/start', { subject_id: subjectId, duration_minutes: 60 });
      const sessionId = res.data.session_id;
      navigate(`/session/${sessionId}`);
    } catch (err) {
      addToast("Failed to start session.", 'error');
    }
  };

  const forceEndSession = async (sessionId) => {
    if (!window.confirm('End this session? All absent students will be finalized.')) return;
    try {
      await api.post('/sessions/end', { session_id: sessionId });
      addToast("Session ended.", 'success');
      fetchData();
    } catch (err) {
      addToast('Could not end session.', 'error');
    }
  };

  const resumeSession = (sessionId) => navigate(`/session/${sessionId}`);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post('/subjects/', formData);
      setFormData({ name: '', code: '', department: '', semester: '' });
      setShowCreate(false);
      addToast(`"${formData.name}" created!`, 'success');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to create subject", 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (subj) => {
    if (!window.confirm(`Delete "${subj.name}"? This will remove all sessions and attendance data.`)) return;
    try {
      await api.delete(`/subjects/${subj.id}`);
      addToast(`"${subj.name}" deleted.`, 'success');
      fetchData();
    } catch (err) {
      addToast("Failed to delete subject.", 'error');
    }
  };

  const openEdit = (subj) => {
    setEditSubject(subj);
    setEditForm({ name: subj.name, code: subj.code, department: subj.department || '', semester: subj.semester || '' });
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      await api.put(`/subjects/${editSubject.id}`, editForm);
      addToast("Subject updated!", 'success');
      setEditSubject(null);
      fetchData();
    } catch (err) {
      addToast("Failed to update subject.", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toast toasts={toasts} removeToast={removeToast} />

      {}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your subjects, sessions and attendance</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all hover:shadow-md"
        >
          <Plus size={18} /> New Subject
        </button>
      </div>

      {}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Clock} label="Today's Sessions" value={stats.today_sessions} color="bg-indigo-500" sub="sessions today" />
        <StatCard icon={PlayCircle} label="Active Sessions" value={stats.active_sessions} color="bg-emerald-500" sub="currently live" />
        <StatCard icon={Users} label="Total Students" value={stats.total_students} color="bg-violet-500" sub="registered" />
        <StatCard icon={TrendingUp} label="Avg Attendance" value={`${stats.avg_attendance}%`} color="bg-amber-500" sub="across all subjects" />
        <StatCard icon={BookOpen} label="Total Subjects" value={stats.total_subjects} color="bg-cyan-500" sub="subjects managed" />
        <StatCard icon={BarChart3} label="This Week" value={stats.sessions_this_week} color="bg-rose-500" sub="sessions this week" />
      </div>

      {}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-5 text-white shadow-lg">
        <h2 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Monitor size={16}/> AI Monitoring Panel — Last 24 Hours
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {[
            { label: 'Faces Detected', value: aiStats.faces_detected_today },
            { label: 'Avg Confidence', value: `${aiStats.avg_confidence}%` },
            { label: 'Unknown Faces', value: aiStats.unknown_faces_today },
            { label: 'Recognition Rate', value: `${aiStats.recognition_rate}%` },
            { label: 'False Positives', value: aiStats.false_positives ?? 0 },
            { label: 'Last Recognition', value: aiStats.last_recognition_time ?? '—' },
            { label: 'Camera Status', value: aiStats.camera_status ?? 'Offline', highlight: (aiStats.camera_status === 'Active') },
          ].map(item => (
            <div key={item.label} className={`rounded-xl p-3 backdrop-blur-sm ${ item.highlight ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white/10'}`}>
              <p className="text-xs text-indigo-300 font-medium">{item.label}</p>
              <p className={`text-xl font-bold mt-1 ${ item.highlight ? 'text-emerald-300' : ''}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {}
      {activeSessions.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm">
          <h2 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            Live Sessions
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {activeSessions.map(sess => (
              <div key={sess.session_id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border border-emerald-100">
                <div>
                  <h3 className="font-bold text-gray-900">{sess.subject_name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Session #{sess.session_id} · Started {sess.start_time}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => resumeSession(sess.session_id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                    Resume
                  </button>
                  <button onClick={() => forceEndSession(sess.session_id)} className="bg-red-100 hover:bg-red-200 text-red-700 p-1.5 rounded-lg transition-colors" title="End session">
                    <XCircle size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-600" /> My Subjects
            <span className="text-sm font-normal text-gray-400 ml-1">({subjects.length})</span>
          </h2>
          <button onClick={() => navigate('/session-history')} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors">
            <BarChart3 size={16}/> Session History
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <BookOpen className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-gray-500 font-medium">No subjects yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first subject to get started</p>
            <button onClick={() => setShowCreate(true)} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              + Create Subject
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {subjects.map(sub => (
              <div key={sub.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col ${ sub.has_active_session ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-gray-100'}`}>
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-lg font-semibold">
                      {sub.code}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      sub.session_status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                      sub.session_status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {sub.session_status === 'ACTIVE' && <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-ping" />}
                      {sub.session_status ?? 'INACTIVE'}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-0.5">{sub.name}</h3>
                  {(sub.department || sub.semester) && (
                    <p className="text-xs text-gray-400 mb-3">
                      {[sub.department, sub.semester ? `Sem ${sub.semester}` : null].filter(Boolean).join(' • ')}
                    </p>
                  )}
                  <div className="flex gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Users size={12}/> {sub.total_students} students</span>
                    <span className="flex items-center gap-1"><Clock size={12}/> {sub.session_count} sessions</span>
                  </div>
                </div>

                <div className="border-t border-gray-50 p-4 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => sub.has_active_session ? resumeSession(sub.active_session_id) : startSession(sub.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      sub.has_active_session
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    <PlayCircle size={14}/> {sub.has_active_session ? 'Resume' : 'Start'}
                  </button>
                  <button
                    onClick={() => navigate(`/reports?subject=${sub.id}`)}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                  >
                    <BarChart3 size={14}/> Reports
                  </button>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEdit(sub)}
                      className="flex-1 flex items-center justify-center py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all"
                      title="Edit subject"
                    >
                      <Edit2 size={14}/>
                    </button>
                    <button
                      onClick={() => handleDelete(sub)}
                      className="flex-1 flex items-center justify-center py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                      title="Delete subject"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900">Create New Subject</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {[
                { label: 'Subject Name *', key: 'name', placeholder: 'e.g. Data Structures', required: true },
                { label: 'Course Code *', key: 'code', placeholder: 'e.g. CS-301', required: true },
                { label: 'Department', key: 'department', placeholder: 'e.g. Computer Science', required: false },
                { label: 'Semester', key: 'semester', placeholder: 'e.g. 3rd', required: false },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input
                    type="text" required={f.required}
                    value={formData[f.key]}
                    onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                  {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16}/>} Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {editSubject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900">Edit Subject</h2>
              <button onClick={() => setEditSubject(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Subject Name', key: 'name' },
                { label: 'Course Code', key: 'code' },
                { label: 'Department', key: 'department' },
                { label: 'Semester', key: 'semester' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input
                    type="text"
                    value={editForm[f.key]}
                    onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditSubject(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveEdit} disabled={isSaving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                  {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
