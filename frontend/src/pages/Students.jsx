import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { UserPlus, Camera, Trash2, X, Eye } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);;
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newStudentId, setNewStudentId] = useState(null);
  const [previewStudent, setPreviewStudent] = useState(null);

  const [formData, setFormData] = useState({ name: '', roll_number: '', department: '' });
  const [captureStatus, setCaptureStatus] = useState('');
  const [capturePreview, setCapturePreview] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const streamRef = useRef(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudentDetails = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/students/', formData);
      setNewStudentId(res.data.id);
      setSelectedStudent(res.data);
      setAddStep(2);
      startCamera();
      fetchStudents();
    } catch (err) {
      alert("Error adding student: " + (err.response?.data?.detail || err.message));
    }
  };

  const closeAddWizard = () => {
    setShowAddModal(false);
    setAddStep(1);
    setFormData({ name: '', roll_number: '', department: '' });
    setNewStudentId(null);
    setSelectedStudent(null);
    stopCamera();
    setCaptureStatus('');
    setCapturePreview(null);
  };

  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to delete this student and all their data?')) {
      try {
        await api.delete(`/students/${id}`);
        fetchStudents();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera", err);
      setCaptureStatus('Error accessing camera.');
    }
  };

  const stopCamera = () => {
    const activeStream = streamRef.current;
    if (activeStream) {
      activeStream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const captureAndRegister = async (isWizard = false) => {
    if (!videoRef.current || !canvasRef.current || !selectedStudent) return;
    
    setCaptureStatus('Capturing face...');
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 400, 300);
    
    const previewUrl = canvasRef.current.toDataURL('image/jpeg');
    setCapturePreview(previewUrl);
    setCaptureStatus('Analyzing face data...');
    
    canvasRef.current.toBlob(async (blob) => {
      const fd = new FormData();
      fd.append('files', blob, 'capture.jpg'); 

      try {
        const res = await api.post(`/students/${selectedStudent.id}/register-face`, fd);
        const detail = res.data.detail;
        const hasErrors = res.data.errors && res.data.errors.length > 0;
        setCaptureStatus(hasErrors ? `⚠️ ${detail} (${res.data.errors.join(', ')})` : `✅ ${detail}`);
        setTimeout(() => {
          if (isWizard) {
            closeAddWizard();
          } else {
            closeFaceModal();
          }
        }, 2500);
      } catch (err) {
        setCaptureStatus("❌ Error: " + (err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || err.message));
        setCapturePreview(null);
      }
    }, 'image/jpeg');
  };

  const openFaceModal = (student) => {
    setSelectedStudent(student);
    setShowFaceModal(true);
    setCaptureStatus('');
    startCamera();
  };

  const closeFaceModal = () => {
    stopCamera();
    setShowFaceModal(false);
    setSelectedStudent(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
        >
          <UserPlus size={18} className="mr-2" /> Add Student
        </button>
      </div>

      {}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dept</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Face</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">No students found.</td></tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {student.face_image_url ? (
                        <button onClick={() => setPreviewStudent(student)} className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-400 shadow hover:border-emerald-600 transition-colors flex-shrink-0" title="View face photo">
                          <img src={API_BASE + student.face_image_url} alt={student.name} className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 flex-shrink-0">
                          <Camera size={16} />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.roll_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {student.face_embedding_count > 0
                      ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">✓ Registered</span>
                      : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Not Registered</span>
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${ (student.attendance_pct || 0) >= 75 ? 'bg-emerald-500' : (student.attendance_pct || 0) >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${student.attendance_pct || 0}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${ (student.attendance_pct || 0) >= 75 ? 'text-emerald-700' : (student.attendance_pct || 0) >= 50 ? 'text-amber-700' : 'text-red-600'}`}>{student.attendance_pct || 0}%</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{student.sessions_attended || 0}/{student.total_sessions || 0} sessions</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.last_seen || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <button onClick={() => navigate(`/students/${student.id}`)} className="text-indigo-600 hover:text-indigo-900 text-xs bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors">
                        <Eye size={13} className="inline mr-1"/>Profile
                      </button>
                      <button onClick={() => openFaceModal(student)} className="text-violet-600 hover:text-violet-900 text-xs bg-violet-50 hover:bg-violet-100 px-2.5 py-1.5 rounded-lg transition-colors">
                        <Camera size={13} className="inline mr-1"/>{student.face_embedding_count > 0 ? 'Re-Register' : 'Add Face'}
                      </button>
                      <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-900 text-xs bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors">
                        <Trash2 size={13} className="inline mr-1"/>Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {}
      {previewStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 px-4" onClick={() => setPreviewStudent(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900">{previewStudent.name}</h3>
                <p className="text-sm text-gray-500">Roll: {previewStudent.roll_number} &bull; {previewStudent.department}</p>
              </div>
              <button onClick={() => setPreviewStudent(null)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>
            <div className="rounded-xl overflow-hidden border-4 border-emerald-200 mx-auto" style={{width:'256px',height:'256px'}}>
              <img src={API_BASE + previewStudent.face_image_url} alt={previewStudent.name} className="w-full h-full object-cover" />
            </div>
            <p className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">✓ Face Registered</p>
            <button onClick={() => { setPreviewStudent(null); openFaceModal(previewStudent); }} className="mt-3 block w-full text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              <Camera size={16} className="inline mr-1" /> Update Photo
            </button>
          </div>
        </div>
      )}

      {}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          {addStep === 1 ? (
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in relative">
              <button onClick={closeAddWizard} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Step 1: Student Details</h2>
              <p className="text-sm text-gray-500 mb-6">Enter demographic information before registering facial biometrics.</p>
              
              <form onSubmit={handleAddStudentDetails} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Roll Number</label>
                  <input required type="text" value={formData.roll_number} onChange={e=>setFormData({...formData, roll_number: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <input type="text" value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 border px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                  <button type="button" onClick={closeAddWizard} className="bg-white border text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center">
                    Next: Capture Face <Camera size={16} className="ml-2" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-fade-in relative text-center">
              <button onClick={closeAddWizard} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Step 2: Initialize Biometrics</h2>
              <p className="text-sm text-gray-500 mb-4">Position face in frame, then click "Complete Enrollment" for <strong>{formData.name}</strong>.</p>
              
              <div className="relative mx-auto w-[400px] h-[300px] bg-gray-900 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 mb-4 shadow-inner">
                {}
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity ${capturePreview ? 'opacity-0' : 'opacity-100'}`}
                />
                {}
                {capturePreview && (
                  <img 
                    src={capturePreview} 
                    alt="Captured frame"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <canvas ref={canvasRef} width="400" height="300" className="hidden" />
                {}
                {!capturePreview && (
                  <div className="absolute top-3 left-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs font-mono flex items-center backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-ping" /> LIVE
                  </div>
                )}
                {}
                {capturePreview && (
                  <div className="absolute top-3 left-3 bg-emerald-600/80 text-white px-2 py-1 rounded-full text-xs font-mono backdrop-blur-sm">
                    ✓ CAPTURED
                  </div>
                )}
              </div>

              {captureStatus && (
                <div className={`p-3 rounded-md mb-4 text-sm font-medium ${
                  captureStatus.includes('❌') || captureStatus.includes('Error') 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : captureStatus.includes('⚠️') 
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : captureStatus.includes('✅') 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-50 text-indigo-700'
                }`}>
                  {captureStatus}
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <button 
                  onClick={closeAddWizard} 
                  className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Skip for Now
                </button>
                <button 
                  onClick={() => captureAndRegister(true)}
                  disabled={!!capturePreview && captureStatus.includes('Analyzing')}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Camera size={18} className="mr-2" /> Complete Enrollment
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {}
      {showFaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-fade-in relative text-center">
            <button onClick={closeFaceModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Register Face: {selectedStudent?.name}</h2>
            <p className="text-sm text-gray-500 mb-6">Look directly at the camera. Make sure lighting is good.</p>
            
            <div className="relative mx-auto w-[400px] h-[300px] bg-gray-900 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 mb-4 shadow-inner">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas ref={canvasRef} width="400" height="300" className="hidden" />
            </div>

            {captureStatus && (
              <div className={`p-3 rounded-md mb-4 text-sm font-medium ${captureStatus.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'}`}>
                {captureStatus}
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button 
                onClick={closeFaceModal} 
                className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={captureAndRegister} 
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center transition-colors shadow-md"
              >
                <Camera size={18} className="mr-2" /> Capture & Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
