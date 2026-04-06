import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export const DynamicChart = ({ type, data, dataKeyX, dataKeyY }) => {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-500 italic">No data available for chart</div>;

  const getChart = () => {
    if (type === 'bar') {
      return (
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey={dataKeyX} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} minTickGap={20} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.05)'}} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', color: '#fff' }} />
          <Bar dataKey={dataKeyY} fill="#a855f7" radius={[4, 4, 0, 0]} />
        </BarChart>
      );
    } 
    else if (type === 'pie') {
      const COLORS = ['#38bdf8', '#a855f7', '#ec4899', '#facc15', '#4ade80'];
      return (
        <PieChart>
          <Pie data={data} dataKey={dataKeyY} nameKey={dataKeyX} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', color: '#fff' }} />
        </PieChart>
      );
    }
    
    // Default to line/area
    return (
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey={dataKeyX} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#38bdf8' }} />
        <Area type="monotone" dataKey={dataKeyY} stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorClose)" />
      </AreaChart>
    );
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {getChart()}
      </ResponsiveContainer>
    </div>
  );
};
