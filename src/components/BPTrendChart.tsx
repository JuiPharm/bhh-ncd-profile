import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Observation } from '../types';
import { formatDate } from '../lib/dates';

interface BPTrendChartProps {
  observations: Observation[];
}

export const BPTrendChart: React.FC<BPTrendChartProps> = ({ observations }) => {
  // 1. Group SBP and DBP by date to display them together on the chart
  const dataMap: Record<string, { dateStr: string; dateVal: number; SBP?: number; DBP?: number }> = {};
  
  observations.forEach((obs) => {
    if (obs.observation_type !== 'SBP' && obs.observation_type !== 'DBP') return;
    const dateStr = formatDate(obs.observation_date);
    const dateVal = new Date(obs.observation_date).getTime();
    const value = parseFloat(obs.value);
    
    if (isNaN(value)) return;
    
    if (!dataMap[dateStr]) {
      dataMap[dateStr] = { dateStr, dateVal };
    }
    
    if (obs.observation_type === 'SBP') {
      dataMap[dateStr].SBP = value;
    } else {
      dataMap[dateStr].DBP = value;
    }
  });

  // Convert map to sorted array
  const chartData = Object.values(dataMap)
    .sort((a, b) => a.dateVal - b.dateVal)
    .slice(-15); // Show last 15 readings for legibility

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
        <p className="text-slate-400 text-sm">No blood pressure observations recorded.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80 pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="dateStr" 
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis 
            domain={[40, 200]}
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          
          {/* Reference Lines for hypertension threshold */}
          <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'SBP Max (140)', position: 'insideBottomRight', fill: '#ef4444', fontSize: 9 }} />
          <ReferenceLine y={90} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'DBP Max (90)', position: 'insideBottomRight', fill: '#f97316', fontSize: 9 }} />

          <Line
            name="Systolic (SBP)"
            type="monotone"
            dataKey="SBP"
            stroke="#ef4444"
            strokeWidth={3}
            activeDot={{ r: 6 }}
            connectNulls
          />
          <Line
            name="Diastolic (DBP)"
            type="monotone"
            dataKey="DBP"
            stroke="#3b82f6"
            strokeWidth={3}
            activeDot={{ r: 6 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
