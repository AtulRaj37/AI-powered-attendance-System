import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import {
  Camera, CheckCircle2, AlertCircle, LogOut, Pause, Play,
  X, UserPlus, StopCircle, Clock, Users, Eye, AlertTriangle,
  Shield, Zap, ChevronDown
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v1/attendance/ws';

const Toast = ({ toasts, removeToast }) => (
  <div className="fixed top-5 right-5 z-50 space-y-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium pointer-events-auto ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-red-600' : 'bg-indigo-600'}`}>
        {t.type === 'success' ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}
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

const StatusBadge = ({ status }) => {
  const cfg = {
    PRESENT: { cls: 'bg-emerald-100 text-emerald-800', label: 'Present' },
    ABSENT: { cls: 'bg-red-100 text-red-700', label: 'Absent' },
    LATE: { cls: 'bg-amber-100 text-amber-800', label: 'Late' },
  };
  const { cls, label } = cfg[status] || cfg.ABSENT;
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>;
};

const TeacherSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [sessionInfo, setSessionInfo] = useState(null);
  const [roster, setRoster] = useState([]);
  const [unknownFaces, setUnknownFaces] = useState([]);
  const [elapsed, setElapsed] = useState(0);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const wsRef = useRef(null);
  const sessionStartRef = useRef(Date.now());

  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchSessionData = useCallback(async () => {
    try {
      const [sessionRes, rosterRes] = await Promise.all([
        api.get(`/sessions/${sessionId}/detail`),
        api.get(`/attendance/session/${sessionId}/roster`),
      ]);
      setSessionInfo(sessionRes.data);
      setRoster(rosterRes.data);
    } catch (err) {
      console.error('Failed to fetch session data', err);
    }
  }, [sessionId]);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'attendance_marked' || data.event === 'attendance_override') {
        try {
          const rosterRes = await api.get(`/attendance/session/${sessionId}/roster`);
          setRoster(rosterRes.data);
        } catch {}
        if (data.event === 'attendance_marked') {
          addToast(`✅ ${data.student_name} marked Present`, 'success');
        }
      }
      if (data.event === 'unknown_detected') {
        setUnknownFaces(prev => [{ ...data, id: Date.now() }, ...prev].slice(0, 10));
      }
    };
    return () => { ws.readyState === 1 && ws.close(); };
  }, [sessionId]);

  useEffect(() => {
    fetchSessionData();
    sessionStartRef.current = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchSessionData]);

  const formatElapsed = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraActive(true);
      startRecognitionLoop();
    } catch (err) {
      addToast('Camera access denied. Please allow camera permissions.', 'error');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => { t.stop(); t.enabled = false; });
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startRecognitionLoop = useCallback(() => {
    intervalRef.current = setInterval(async () => {
      if (isPaused || !videoRef.current || !canvasRef.current) return;

      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);

      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        const fd = new FormData();
        fd.append('file', blob, 'frame.jpg');
        fd.append('camera_id', 'webcam');
        try {
          setIsRecognizing(true);
          const res = await api.post(`/attendance/recognize/${sessionId}`, fd);
          if (res.data?.length > 0) {
            setLastResult(res.data[0]);
          }
        } catch (err) {
          console.error('Recognition error:', err);
        } finally {
          setIsRecognizing(false);
        }
      }, 'image/jpeg', 0.7);
    }, 2000);
  }, [sessionId, isPaused]);

  const pauseRecognition = () => {
    setIsPaused(true);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    addToast('Recognition paused', 'info');
  };
  const resumeRecognition = () => {
    setIsPaused(false);
    startRecognitionLoop();
    addToast('Recognition resumed', 'success');
  };

  const overrideStatus = async (studentId, status) => {
    try {
      await api.post('/attendance/override', { student_id: studentId, session_id: Number(sessionId), status });
      addToast(`Status updated to ${status}`, 'success');
      fetchSessionData();
    } catch {
      addToast('Failed to update status', 'error');
    }
  };

  const endSession = async () => {
    if (!window.confirm('End this session? Students not marked will remain Absent.')) return;
    try {
      stopCamera();
      await api.post('/sessions/end', { session_id: Number(sessionId) });
      addToast('Session ended successfully!', 'success');
      setTimeout(() => navigate('/teacher'), 1500);
    } catch {
      addToast('Failed to end session', 'error');
    }
  };

  const presentCount = roster.filter(r => r.status === 'PRESENT').length;
  const absentCount = roster.filter(r => r.status === 'ABSENT').length;
  const lateCount = roster.filter(r => r.status === 'LATE').length;
  const filteredRoster = statusFilter === 'ALL' ? roster : roster.filter(r => r.status === statusFilter);

  return (
    <div className="h-full flex flex-col space-y-4 max-w-7xl mx-auto">
      <Toast toasts={toasts} removeToast={removeToast} />

      {}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">Session #{sessionId}</span>
            {isCameraActive && !isPaused && (
              <span className="text-xs bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"/>LIVE
              </span>
            )}
          </div>
          <h1 className="font-bold text-xl">{sessionInfo?.subject_name || 'Loading…'}</h1>
          <p className="text-indigo-300 text-xs">{sessionInfo?.subject_code} {sessionInfo?.department && `· ${sessionInfo.department}`} {sessionInfo?.semester && `· Sem ${sessionInfo.semester}`}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-center">
            <p className="text-xs text-indigo-400">Elapsed</p>
            <p className="font-mono text-lg font-bold">{formatElapsed(elapsed)}</p>
          </div>
          <div className="flex gap-2">
            {!isCameraActive ? (
              <button onClick={startCamera} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                <Camera size={16}/> Start Feed
              </button>
            ) : isPaused ? (
              <button onClick={resumeRecognition} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                <Play size={16}/> Resume
              </button>
            ) : (
              <button onClick={pauseRecognition} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                <Pause size={16}/> Pause
              </button>
            )}
            <button onClick={endSession} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
              <StopCircle size={16}/> End Session
            </button>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{presentCount}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Present</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{absentCount}</p>
          <p className="text-xs text-red-600 font-semibold mt-1">Absent</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{lateCount}</p>
          <p className="text-xs text-amber-600 font-semibold mt-1">Late</p>
        </div>
      </div>

      {}
      <div className="grid lg:grid-cols-5 gap-4 flex-1">

        {}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-black rounded-2xl overflow-hidden aspect-video relative shadow-lg">
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isCameraActive ? 'opacity-100' : 'opacity-0'}`} />
            <canvas ref={canvasRef} width="640" height="480" className="hidden" />

            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <Camera size={48} className="opacity-30 mb-3"/>
                <p className="text-sm opacity-50">Click "Start Feed" to begin</p>
              </div>
            )}

            {isCameraActive && (
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${isPaused ? 'bg-amber-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                  {isPaused ? '⏸ PAUSED' : '🔴 REC'}
                </div>
                {isRecognizing && <div className="px-2 py-1 bg-indigo-600/80 text-white rounded-full text-xs backdrop-blur-sm flex items-center gap-1"><Zap size={10}/> Scanning</div>}
              </div>
            )}

            {lastResult && isCameraActive && (
              <div className="absolute bottom-3 left-3 right-3">
                <div className={`px-3 py-2 rounded-xl text-sm font-semibold backdrop-blur-sm ${lastResult.name === 'Unknown' ? 'bg-red-600/90 text-white' : 'bg-emerald-600/90 text-white'}`}>
                  {lastResult.name === 'Unknown' ? '⚠️ Unknown Face' : `✅ ${lastResult.name}`}
                  {lastResult.confidence > 0 && <span className="ml-2 opacity-75 text-xs">{(lastResult.confidence * 100).toFixed(0)}%</span>}
                </div>
              </div>
            )}
          </div>

          {}
          {unknownFaces.length > 0 && (
            <div className="bg-white rounded-2xl border border-rose-100 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-rose-700 mb-3 flex items-center gap-2">
                <AlertTriangle size={16}/> Unknown Faces ({unknownFaces.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {unknownFaces.map(face => (
                  <div key={face.id} className="flex items-center justify-between bg-rose-50 rounded-xl p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-rose-200 rounded-lg overflow-hidden flex-shrink-0">
                        {face.image_path && (
                          <img src={`${API_BASE}/${face.image_path}`} alt="Unknown" className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-rose-800">Unknown Face</p>
                        <p className="text-xs text-rose-500">{new Date(face.detected_at || Date.now()).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => navigate('/students')} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1">
                        <UserPlus size={10}/> Register
                      </button>
                      <button onClick={() => setUnknownFaces(prev => prev.filter(f => f.id !== face.id))} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-200 transition-colors">
                        Ignore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-indigo-600"/> Student Roster
              <span className="text-xs text-gray-400 font-normal">{roster.length} students</span>
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

          <div className="flex-1 overflow-y-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Roll No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRoster.map(student => (
                  <tr key={student.student_id} className={`transition-colors ${student.status === 'PRESENT' ? 'bg-emerald-50/30' : student.status === 'LATE' ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{student.roll_number}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                        {student.department && <p className="text-xs text-gray-400">{student.department}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={student.status} />
                      {student.confidence && (
                        <span className="ml-1.5 text-xs text-gray-400">{student.confidence}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{student.timestamp || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {student.status !== 'PRESENT' && (
                          <button onClick={() => overrideStatus(student.student_id, 'PRESENT')} className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-2 py-1 rounded-lg transition-colors font-medium">P</button>
                        )}
                        {student.status !== 'LATE' && (
                          <button onClick={() => overrideStatus(student.student_id, 'LATE')} className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 px-2 py-1 rounded-lg transition-colors font-medium">L</button>
                        )}
                        {student.status !== 'ABSENT' && (
                          <button onClick={() => overrideStatus(student.student_id, 'ABSENT')} className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-2 py-1 rounded-lg transition-colors font-medium">A</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRoster.length === 0 && (
              <div className="py-12 text-center text-gray-400 text-sm">
                No students match this filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherSessionPage;
