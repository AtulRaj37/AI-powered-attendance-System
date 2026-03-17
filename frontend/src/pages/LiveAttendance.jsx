import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Camera, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

const LiveAttendance = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [debugStatus, setDebugStatus] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);
  const sessionIdRef = useRef(sessionId);

  useEffect(() => {
    sessionIdRef.current = sessionId;
    console.log('[LiveAttendance] sessionId from URL:', sessionId);
  }, [sessionId]);

  useEffect(() => {
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v1/attendance/ws';
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents(prev => [data, ...prev].slice(0, 50));
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (ws.readyState === 1) {
        ws.close();
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      startRecognitionLoop();
    } catch (err) {
      console.error("Error accessing camera", err);
      alert("Please allow camera access.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startRecognitionLoop = useCallback(() => {
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, 640, 480);
      
      const currentSessionId = sessionIdRef.current;
      
      canvasRef.current.toBlob(async (blob) => {
        if(!blob) return;
        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');
        formData.append('camera_id', 'camera_dashboard_01');

        try {
          if (currentSessionId) {
            console.log('[LiveAttendance] Sending frame to session:', currentSessionId);
            setDebugStatus(`Sending frame... session_id=${currentSessionId}`);
            const res = await api.post(`/attendance/recognize/${currentSessionId}`, formData);
            console.log('[LiveAttendance] Response:', res.data);
          } else {
            console.warn('[LiveAttendance] No session_id in URL! Cannot recognize.');
            setDebugStatus('⚠ No session_id in URL. Start a session from Teacher Hub first.');
          }
        } catch (err) {
          console.error('[LiveAttendance] Recognition error:', err.response?.data || err.message);
          setDebugStatus(`Error: ${err.response?.data?.detail || err.message}`);
        }
      }, 'image/jpeg');
      
    }, 2000);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const endSession = async () => {
      if (!sessionId) return navigate('/teacher');
      try {
          await api.post('/sessions/end', { session_id: parseInt(sessionId) });
          navigate('/teacher');
      } catch (err) {
          console.error(err);
          navigate('/teacher');
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      
      {}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden relative">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-semibold text-gray-800 flex items-center">
            <Camera className="mr-2 text-indigo-600" size={20} /> Continuous Capture Feed
          </h2>
          <div className="flex gap-2">
            {!isCameraActive ? (
              <button onClick={startCamera} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                Start Feed
              </button>
            ) : (
              <button onClick={stopCamera} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm animate-pulse">
                Pause
              </button>
            )}
            
            <button onClick={endSession} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center">
              <LogOut className="w-4 h-4 mr-1"/> Finish Capture
            </button>
          </div>
        </div>

        {}
        <div className={`px-4 py-1 text-xs font-mono ${sessionId ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {sessionId
            ? `🟢 Session #${sessionId} active${debugStatus ? ' | ' + debugStatus : ''}`
            : '🔴 No session_id in URL — go to Teacher Hub and click "Capture Attendance" on a subject first!'
          }
        </div>
        
        <div className="flex-1 bg-gray-900 relative">
          {!isCameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-center p-6">
              <Camera size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium text-white mb-2">Passive Capture Offline</p>
              <p className="text-sm max-w-md">The system evaluates video frames in the background to automatically identify students. Click "Start Feed" to begin real-time face authentication.</p>
            </div>
          )}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className={`w-full h-full object-cover ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
          />
          <canvas ref={canvasRef} width="640" height="480" className="hidden" />
          
          {}
          {isCameraActive && (
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-mono flex items-center backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-ping" /> REC
            </div>
          )}
        </div>
      </div>

      {}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-800 flex justify-between items-center">
            Attendance Capture Events
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-medium">WS Live</span>
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {events.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">
              No recent attendance events.
            </div>
          ) : (
            events.map((ev, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-xl shadow-sm border animate-fade-in-up ${
                  ev.event === 'unknown_detected' 
                    ? 'bg-rose-50 border-rose-100' 
                    : 'bg-white border-indigo-100'
                }`}
              >
                {ev.event === 'attendance_marked' ? (
                  <div className="flex items-start">
                    <CheckCircle2 className="text-emerald-500 mt-1 mr-3 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="font-bold text-gray-900">{ev.student_name}</h4>
                      <p className="text-xs text-gray-500 font-mono mt-1">{ev.roll_number} • {ev.time}</p>
                      <p className="text-xs text-indigo-600 mt-2 font-medium bg-indigo-50 inline-block px-2 py-1 rounded">Camera: {ev.camera_id}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <AlertCircle className="text-rose-500 mt-1 mr-3 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="font-bold text-gray-900">Unknown Face Detected</h4>
                      <p className="text-xs text-gray-500 font-mono mt-1">Camera: {ev.camera_id}</p>
                      {}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
    </div>
  );
};

export default LiveAttendance;
