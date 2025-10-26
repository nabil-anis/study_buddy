import React, { useState, useEffect } from 'react';
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Card className="!p-4">
      <h3 className="text-md font-bold mb-4 px-2 text-[#134686]">Weekly Progress</h3>
      <div className="w-full h-48">
        {isMounted && (
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(19, 70, 134, 0.2)" />
                <XAxis dataKey="name" tick={{ fill: '#134686', fontSize: 12 }} stroke="rgba(19, 70, 134, 0.4)" />
                <YAxis yAxisId="left" orientation="left" stroke="rgba(19, 70, 134, 0.4)" tick={{ fill: '#134686', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(19, 70, 134, 0.4)" tick={{ fill: '#134686', fontSize: 12 }} />
                <Tooltip
                contentStyle={{
                    backgroundColor: 'rgba(217, 233, 207, 0.9)',
                    border: '1px solid rgba(19, 70, 134, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#134686',
                }}
                labelStyle={{ fontWeight: 'bold' }}
                cursor={{fill: 'rgba(19, 70, 134, 0.1)'}}
                />
                <Legend wrapperStyle={{fontSize: "12px", color: "#134686"}}/>
                <Bar yAxisId="left" dataKey="Study Time (hrs)" fill="#134686" />
                <Bar yAxisId="right" dataKey="Progress (%)" fill="#FEB21A" />
            </BarChart>
            </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default StudyChart;