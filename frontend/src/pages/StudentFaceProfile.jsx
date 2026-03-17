import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Camera, CheckCircle, AlertTriangle, RefreshCw, User } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const StudentFaceProfile = () => {
  const navigate = useNavigate();
  const [faceData, setFaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  const load = () => {
    setLoading(true);
    setImgError(false);
    api.get('/students/my-face')
      .then(r => setFaceData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Camera className="text-indigo-600" size={24}/> Face Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">Your registered face for attendance recognition</p>
        </div>
        <button onClick={() => navigate('/student')} className="text-sm text-indigo-600 hover:underline">← Dashboard</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        {}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">{faceData?.name || 'Unknown'}</h2>
          <p className="text-sm text-gray-400 mt-0.5">Student Face Registration</p>
        </div>

        {}
        <div className="flex justify-center mb-6">
          {faceData?.face_registered && faceData?.face_image_url && !imgError ? (
            <div className="relative">
              <img
                src={`${API_BASE}${faceData.face_image_url}`}
                alt="Registered face"
                onError={() => setImgError(true)}
                className="w-48 h-48 rounded-2xl object-cover border-4 border-indigo-200 shadow-lg"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white shadow">
                <CheckCircle size={16} className="text-white"/>
              </div>
            </div>
          ) : (
            <div className="w-48 h-48 rounded-2xl border-4 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <User size={48} className="mb-2 opacity-40"/>
              <p className="text-sm">No face photo</p>
            </div>
          )}
        </div>

        {}
        <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl mb-6 ${faceData?.face_registered ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
          {faceData?.face_registered ? (
            <>
              <CheckCircle size={18} className="text-emerald-600"/>
              <span className="text-sm font-semibold text-emerald-700">
                Face registered ({faceData.embedding_count} embedding{faceData.embedding_count !== 1 ? 's' : ''})
              </span>
            </>
          ) : (
            <>
              <AlertTriangle size={18} className="text-red-500"/>
              <span className="text-sm font-semibold text-red-700">Face not registered</span>
            </>
          )}
        </div>

        {}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-700">
          <p className="font-semibold mb-1">How face registration works</p>
          <ul className="space-y-1 text-xs text-indigo-600 list-disc list-inside">
            <li>Your teacher captures your face using the Student Management page.</li>
            <li>The system stores a face embedding for AI recognition.</li>
            <li>During sessions, the AI matches your face to mark attendance.</li>
            <li>If recognition fails, ask your teacher to re-capture your face.</li>
          </ul>
        </div>

        {}
        <button
          onClick={load}
          className="w-full mt-5 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
        >
          <RefreshCw size={15}/> Refresh Status
        </button>
      </div>
    </div>
  );
};

export default StudentFaceProfile;
