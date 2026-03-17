import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { BookOpen, AlertTriangle, ChevronRight, Users, TrendingUp, GraduationCap } from 'lucide-react';

const StudentSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/students/my-subjects')
      .then(r => setSubjects(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="text-indigo-600" size={24}/> My Subjects
        </h1>
        <p className="text-sm text-gray-500 mt-1">All subjects with your attendance records</p>
      </div>

      {subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 text-gray-400">
          <BookOpen size={40} className="mb-3 opacity-40"/>
          <p className="font-semibold">No subjects found</p>
          <p className="text-sm mt-1">Your attendance has no records yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subjects.map(sub => {
            const pct = sub.attendance_pct;
            const barColor = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
            const textColor = pct >= 75 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-700' : 'text-red-600';
            const bgColor = pct >= 75 ? 'bg-emerald-50 border-emerald-100' : pct >= 50 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100';

            return (
              <div key={sub.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                {}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <GraduationCap size={18} className="text-indigo-600"/>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{sub.name}</h3>
                      <p className="text-xs text-gray-400">{sub.code}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${bgColor} ${textColor}`}>
                    {pct}%
                  </span>
                </div>

                {}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{sub.present}/{sub.total} classes attended</span>
                    <span className={pct < 75 ? 'text-red-500 font-medium' : 'text-emerald-600 font-medium'}>
                      {pct < 75 ? `Need ${Math.max(0, Math.ceil((0.75 * sub.total - sub.present) / 0.25))} more` : '✓ On track'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className={`h-2 rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }}/>
                  </div>
                </div>

                {}
                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1">
                    <Users size={12}/>
                    <span>{sub.teacher}</span>
                  </div>
                  {sub.department && <span className="bg-gray-100 px-2 py-0.5 rounded-full">{sub.department}</span>}
                  {sub.semester && <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Sem {sub.semester}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {}
      <button onClick={() => navigate('/student')} className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
        ← Back to Dashboard
      </button>
    </div>
  );
};

export default StudentSubjects;
