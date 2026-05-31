import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { Layout } from '../components/Layout';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  TrendingDown,
  Calendar,
  Sparkles,
  HeartPulse
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { formatDate } from '../lib/dates';

interface SummaryData {
  totalPatients: number;
  dmCount: number;
  htCount: number;
  lipidCount: number;
  ckdCount: number;
  uncontrolledBP: number;
  uncontrolledDM: number;
  abnormalLDL: number;
}

interface MonthlyCount {
  month: string;
  count: number;
}

interface RecentPatient {
  id: string;
  hn: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

interface DashboardSummaryResponse {
  success: boolean;
  summary: SummaryData;
  monthlyObservations: MonthlyCount[];
  recentPatients: RecentPatient[];
}

export const Dashboard: React.FC = () => {
  const { data, isLoading, error } = useQuery<DashboardSummaryResponse>({
    queryKey: ['dashboardSummary'],
    queryFn: () => apiRequest<DashboardSummaryResponse>('dashboard.summary', 'GET'),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  if (isLoading) {
    return (
      <Layout currentRoute="dashboard">
        <div className="space-y-6">
          <div className="h-8 w-48 bg-slate-200 animate-pulse rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-32 bg-slate-200 animate-pulse rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-slate-200 animate-pulse rounded-xl"></div>
            <div className="h-80 bg-slate-200 animate-pulse rounded-xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout currentRoute="dashboard">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-red-800 text-sm font-semibold">
          Error loading dashboard summary: {error instanceof Error ? error.message : 'Unknown error'}
          <br /><br />
          <span className="text-xs font-mono bg-red-100 p-1 rounded">Please verify your Web App URL and check the Network tab for details.</span>
        </div>
      </Layout>
    );
  }

  const { summary, monthlyObservations, recentPatients } = data;

  // Disease Distribution Pie chart data
  const pieData = [
    { name: 'Diabetes (DM)', value: summary.dmCount, color: '#f59e0b' },
    { name: 'Hypertension (HT)', value: summary.htCount, color: '#ef4444' },
    { name: 'Dyslipidemia', value: summary.lipidCount, color: '#3b82f6' },
    { name: 'CKD', value: summary.ckdCount, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  // Cards layout configuration
  const statCards = [
    {
      title: 'Total Registry Patients',
      value: summary.totalPatients,
      sub: 'Active cases in clinic',
      icon: Users,
      color: 'bg-hospital-500 text-white',
      badge: null
    },
    {
      title: 'Uncontrolled BP',
      value: summary.uncontrolledBP,
      sub: 'SBP ≥ 140 or DBP ≥ 90',
      icon: HeartPulse,
      color: 'bg-white text-slate-800 border border-slate-100',
      badge: summary.uncontrolledBP > 0 ? { text: 'Critical', bg: 'bg-red-50 text-red-750' } : null
    },
    {
      title: 'Uncontrolled Diabetes',
      value: summary.uncontrolledDM,
      sub: 'HbA1c ≥ 7.0%',
      icon: Activity,
      color: 'bg-white text-slate-800 border border-slate-100',
      badge: summary.uncontrolledDM > 0 ? { text: 'Alert', bg: 'bg-amber-50 text-amber-750' } : null
    },
    {
      title: 'High LDL Cholesterol',
      value: summary.abnormalLDL,
      sub: 'LDL ≥ 100 mg/dL',
      icon: TrendingUp,
      color: 'bg-white text-slate-800 border border-slate-100',
      badge: summary.abnormalLDL > 0 ? { text: 'Elevated', bg: 'bg-blue-50 text-blue-750' } : null
    }
  ];

  return (
    <Layout currentRoute="dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-2xl text-slate-800 leading-tight">Dashboard Overview</h2>
            <p className="text-slate-500 text-xs mt-1">BHH NCD Registry & Clinical Quality Indicators</p>
          </div>
          <div className="bg-hospital-50 border border-hospital-100/50 rounded-xl px-4 py-2 flex items-center gap-2 self-start">
            <Sparkles className="h-4 w-4 text-hospital-600" />
            <span className="text-xs text-hospital-800 font-semibold">Active Session Connected</span>
          </div>
        </div>

        {/* Statistical Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, idx) => (
            <div key={idx} className={`rounded-xl p-5 shadow-sm transition-all hover:shadow-md ${card.color}`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className={`block text-xs font-semibold ${card.color.includes('text-white') ? 'text-hospital-200' : 'text-slate-500'}`}>
                    {card.title}
                  </span>
                  <span className="block font-bold text-3xl mt-2 tracking-tight">{card.value}</span>
                </div>
                <div className={`p-2.5 rounded-lg ${card.color.includes('text-white') ? 'bg-hospital-600' : 'bg-slate-55'}`}>
                  <card.icon className={`h-5 w-5 ${card.color.includes('text-white') ? 'text-white' : 'text-slate-500'}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-[10px] ${card.color.includes('text-white') ? 'text-hospital-300' : 'text-slate-400'}`}>
                  {card.sub}
                </span>
                {card.badge && (
                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${card.badge.bg}`}>
                    {card.badge.text}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Graphs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Disease Pie Distribution */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Patient NCD Distribution</h3>
            {pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value} Patients`, 'Registry']} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                No active disease registry diagnoses found.
              </div>
            )}
          </div>

          {/* Follow-up Bar Chart */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Monthly Clinic Observations Count</h3>
            {monthlyObservations.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyObservations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#cbd5e1' }} />
                    <Tooltip formatter={(value: any) => [`${value} Logs`, 'Observations']} />
                    <Bar dataKey="count" fill="#40649c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                No monthly observations data available.
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Recent Patients and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Patients */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm lg:col-span-2">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Recently Registered Patients</h3>
            {recentPatients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-550 uppercase tracking-wider font-semibold">
                      <th className="px-4 py-3">HN</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Registered Date</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-750">
                    {recentPatients.map((pat) => (
                      <tr key={pat.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-semibold text-hospital-700">{pat.hn}</td>
                        <td className="px-4 py-3 font-semibold">{pat.first_name} {pat.last_name}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(pat.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => window.location.hash = `#/patients/${pat.id}`}
                            className="text-hospital-600 hover:text-hospital-800 font-bold hover:underline"
                          >
                            Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                No patient records logged yet.
              </div>
            )}
          </div>

          {/* Quality Indicators Alert Panel */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Registry Flags</h3>
            <div className="space-y-3">
              {summary.uncontrolledBP > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg flex gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-bold text-red-800">Uncontrolled BP Cases</span>
                    <span className="text-[10px] text-red-700 block mt-0.5">
                      {summary.uncontrolledBP} patients have BP ≥ 140/90 mmHg.
                    </span>
                  </div>
                </div>
              )}
              {summary.uncontrolledDM > 0 && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-lg flex gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-bold text-amber-800">Uncontrolled DM Cases</span>
                    <span className="text-[10px] text-amber-700 block mt-0.5">
                      {summary.uncontrolledDM} patients have HbA1c ≥ 7.0%.
                    </span>
                  </div>
                </div>
              )}
              {summary.abnormalLDL > 0 && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg flex gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-bold text-blue-800">Hyperlipidemia Cases</span>
                    <span className="text-[10px] text-blue-700 block mt-0.5">
                      {summary.abnormalLDL} patients have LDL cholesterol ≥ 100 mg/dL.
                    </span>
                  </div>
                </div>
              )}

              {summary.uncontrolledBP === 0 && summary.uncontrolledDM === 0 && summary.abnormalLDL === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs italic">
                  All clinical quality metrics within normal ranges.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
