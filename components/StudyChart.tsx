import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from './GlassCard';

const data = [
  { name: 'Mon', 'Study Time (hrs)': 4, 'Progress (%)': 60 },
  { name: 'Tue', 'Study Time (hrs)': 3, 'Progress (%)': 45 },
  { name: 'Wed', 'Study Time (hrs)': 5, 'Progress (%)': 75 },
  { name: 'Thu', 'Study Time (hrs)': 2, 'Progress (%)': 30 },
  { name: 'Fri', 'Study Time (hrs)': 6, 'Progress (%)': 90 },
  { name: 'Sat', 'Study Time (hrs)': 8, 'Progress (%)': 100 },
  { name: 'Sun', 'Study Time (hrs)': 1, 'Progress (%)': 15 },
];

const StudyChart: React.FC = () => {
  return (
    <Card className="!p-4">
      <h3 className="text-md font-bold mb-4 px-2 text-zinc-200">Weekly Progress</h3>
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
            <YAxis yAxisId="left" orientation="left" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" stroke="#a1a1aa" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(9, 9, 11, 0.9)',
                border: '1px solid #3f3f46',
                borderRadius: '0.5rem',
                color: '#f4f4f5',
              }}
              labelStyle={{ fontWeight: 'bold' }}
              cursor={{fill: '#27272a'}}
            />
            <Legend wrapperStyle={{fontSize: "12px", color: "#a1a1aa"}}/>
            <Bar yAxisId="left" dataKey="Study Time (hrs)" fill="#3b82f6" />
            <Bar yAxisId="right" dataKey="Progress (%)" fill="#14b8a6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default StudyChart;