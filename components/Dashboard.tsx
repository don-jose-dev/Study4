import React from 'react';
import { UserStats, ModuleType } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Trophy, Target, Clock, AlertCircle } from 'lucide-react';

interface Props {
  stats: UserStats;
}

const Dashboard: React.FC<Props> = ({ stats }) => {
  const data = Object.entries(stats.moduleProgress).map(([key, value]) => ({
    name: key,
    progress: value as number,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-dutch-orange/10 text-dutch-orange rounded-lg">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Points</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.totalPoints}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Current Level</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.level}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Day Streak</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.streak}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Weak Area</p>
            <h3 className="text-lg font-bold text-slate-800 truncate">Writing</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Module Progress</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.progress > 80 ? '#10B981' : entry.progress > 40 ? '#0ea5e9' : '#F59E0B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Study Coach</h2>
          <div className="space-y-3">
             <div className="p-4 rounded-lg bg-primary-50 border border-primary-100">
               <h4 className="font-semibold text-primary-700 text-sm mb-1">Practice Speaking</h4>
               <p className="text-xs text-primary-600">Your speaking score is lagging. Try a 5 min session with the AI Tutor.</p>
               <button onClick={() => window.location.hash = '/tutor'} className="mt-3 w-full py-2 bg-white text-primary-600 text-xs font-bold rounded shadow-sm hover:bg-blue-50">Start Session</button>
             </div>
             <div className="p-4 rounded-lg bg-orange-50 border border-orange-100">
               <h4 className="font-semibold text-orange-700 text-sm mb-1">Review KNM</h4>
               <p className="text-xs text-orange-600">3 new flashcards are due for review today.</p>
                <button onClick={() => window.location.hash = '/flashcards'} className="mt-3 w-full py-2 bg-white text-orange-600 text-xs font-bold rounded shadow-sm hover:bg-orange-50">Review Now</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;