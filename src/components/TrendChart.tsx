import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Observation } from '../types';
import { formatDate } from '../lib/dates';

interface TrendChartProps {
  observations: Observation[];
  type: 'Weight' | 'BMI' | 'HbA1c' | 'LDL' | 'Glucose' | 'Uric Acid' | 'Creatinine';
  color?: string;
  warningThreshold?: number;
  label?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  observations,
  type,
  color = '#537eb7',
  warningThreshold,
  label = type,
}) => {
  const filtered = observations
    .filter((obs) => obs.observation_type === type)
    .map((obs) => ({
      dateStr: formatDate(obs.observation_date),
      dateVal: new Date(obs.observation_date).getTime(),
      value: parseFloat(obs.value),
      unit: obs.unit,
    }))
    .filter((obs) => !isNaN(obs.value))
    .sort((a, b) => a.dateVal - b.dateVal)
    .slice(-15); // limit to last 15 entries for visual cleanliness

  if (filtered.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
        <p className="text-slate-400 text-xs">No {label} observations recorded.</p>
      </div>
    );
  }

  const unit = filtered[0].unit;

  return (
    <div className="w-full h-56 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={filtered} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="dateStr" 
            tick={{ fill: '#64748b', fontSize: 9 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 9 }}
            axisLine={{ stroke: '#cbd5e1' }}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            formatter={(value: any) => [`${value} ${unit}`, label]}
          />
          
          {warningThreshold !== undefined && (
            <ReferenceLine 
              y={warningThreshold} 
              stroke="#ef4444" 
              strokeDasharray="3 3" 
              label={{ value: `Limit (${warningThreshold})`, position: 'insideBottomRight', fill: '#ef4444', fontSize: 8 }}
            />
          )}

          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#gradient-${type})`}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
