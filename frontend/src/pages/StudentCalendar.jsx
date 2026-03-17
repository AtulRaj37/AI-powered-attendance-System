import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const StudentCalendar = () => {
  const navigate = useNavigate();
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    api.get('/students/my-calendar')
      .then(r => setCalendarData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const calendarMap = {};
  calendarData.forEach(d => { calendarMap[d.date] = d; });

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const getDayEntry = (day) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarMap[dateStr] || null;
  };

  const getDayStyle = (entry) => {
    if (!entry) return 'bg-white hover:bg-gray-50 text-gray-700';
    if (entry.day_status === 'present') return 'bg-emerald-500 text-white hover:bg-emerald-600';
    if (entry.day_status === 'absent')  return 'bg-red-500 text-white hover:bg-red-600';
    return 'bg-amber-400 text-white hover:bg-amber-500';
  };

  const presentDays = calendarData.filter(d => d.day_status === 'present').length;
  const absentDays  = calendarData.filter(d => d.day_status === 'absent').length;
  const partialDays = calendarData.filter(d => d.day_status === 'partial').length;

  const selectedEntry = selectedDate ? calendarMap[selectedDate] : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="text-indigo-600" size={24}/> Attendance Calendar
          </h1>
          <p className="text-sm text-gray-500 mt-1">Visual overview of your daily attendance</p>
        </div>
        <button onClick={() => navigate('/student')} className="text-sm text-indigo-600 hover:underline">← Dashboard</button>
      </div>

      {}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-700">{presentDays}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">✅ Full Present Days</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-red-600">{absentDays}</p>
          <p className="text-xs text-red-500 font-semibold mt-1">❌ Absent Days</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-amber-600">{partialDays}</p>
          <p className="text-xs text-amber-600 font-semibold mt-1">🟡 Partial Days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
          {}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={18}/>
            </button>
            <h2 className="font-bold text-gray-900">{MONTHS[viewMonth]} {viewYear}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={18}/>
            </button>
          </div>

          {}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const entry = getDayEntry(day);
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                const isSelected = selectedDate === dateStr;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(entry ? dateStr : null)}
                    className={`aspect-square rounded-xl text-sm font-semibold transition-all flex items-center justify-center
                      ${getDayStyle(entry)}
                      ${isToday ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}
                      ${isSelected ? 'ring-2 ring-indigo-700 ring-offset-1' : ''}
                      ${entry ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          )}

          {}
          <div className="flex gap-4 mt-5 pt-4 border-t border-gray-100 justify-center text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"/><span className="text-gray-500">Present</span></span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"/><span className="text-gray-500">Absent</span></span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block"/><span className="text-gray-500">Partial</span></span>
          </div>
        </div>

        {}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Day Details</h3>
          {!selectedEntry ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm text-center">
              <Calendar size={28} className="mb-2 opacity-40"/>
              Click on a colored date to see details
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-bold text-gray-700">{selectedDate}</p>
              <div className="flex gap-3">
                <div className="bg-emerald-50 rounded-lg px-3 py-2 text-center flex-1">
                  <p className="text-xl font-black text-emerald-700">{selectedEntry.present}</p>
                  <p className="text-xs text-emerald-600">Present</p>
                </div>
                <div className="bg-red-50 rounded-lg px-3 py-2 text-center flex-1">
                  <p className="text-xl font-black text-red-600">{selectedEntry.absent}</p>
                  <p className="text-xs text-red-500">Absent</p>
                </div>
              </div>
              <div className="space-y-2 mt-3">
                {selectedEntry.sessions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-800 truncate">{s.subject}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0
                      ${String(s.status).toUpperCase().includes('PRESENT') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {String(s.status).toUpperCase().includes('PRESENT') ? 'Present' : 'Absent'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCalendar;
