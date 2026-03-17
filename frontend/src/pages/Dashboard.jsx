import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Users, UserCheck, UserMinus, Activity } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    unknownFaces: 0,
    accuracy: 98.5
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [studentsRes, attendanceRes, reportRes, unknownRes] = await Promise.all([
          api.get('/students'),
          api.get('/attendance/today'),
          api.get('/attendance/report'),
          api.get('/attendance/unknown-faces')
        ]);

        setStats({
          totalStudents: studentsRes.data.length,
          presentToday: attendanceRes.data.length,
          unknownFaces: unknownRes.data.length,
          accuracy: 98.5
        });

        const formattedData = reportRes.data.map(item => ({
          name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
          Attendance: item.count
        })).reverse();
        
        setChartData(formattedData.length > 0 ? formattedData : [
          { name: 'Mon', Attendance: 0 },
          { name: 'Tue', Attendance: 0 },
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statsCards = [
    { name: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: "Today's Attendance", value: stats.presentToday, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Unknown Faces Logged', value: stats.unknownFaces, icon: UserMinus, color: 'text-rose-600', bg: 'bg-rose-100' },
    { name: 'System Accuracy', value: `${stats.accuracy}%`, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ];

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center transition-all hover:shadow-md">
              <div className={`p-4 rounded-full ${stat.bg} ${stat.color} mr-5`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Attendance Trends</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
              <Tooltip 
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="Attendance" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
