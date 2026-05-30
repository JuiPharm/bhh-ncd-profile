import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { apiRequest } from '../lib/api';
import { Layout } from '../components/Layout';
import { formatDateWithTime } from '../lib/dates';
import { Settings, ShieldAlert, History, Key, Loader } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditResponse {
  success: boolean;
  logs: AuditLog[];
}

export const Admin: React.FC = () => {
  const { isAdmin } = useAuth();

  const { data, isLoading, error } = useQuery<AuditResponse>({
    queryKey: ['adminAuditLogs'],
    queryFn: () => apiRequest<AuditResponse>('admin.auditLogs', 'POST'),
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  if (!isAdmin) {
    return (
      <Layout currentRoute="admin">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-red-800 text-sm font-semibold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          <span>Access Denied. You must be an administrator to view this page.</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentRoute="admin">
      <div className="space-y-6">
        <div>
          <h2 className="font-bold text-2xl text-slate-800">Admin Control Center</h2>
          <p className="text-slate-500 text-xs mt-1">Audit logs, system events, and database actions tracking</p>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b pb-3 border-slate-50">
            <History className="h-5 w-5 text-hospital-600" />
            <h3 className="font-bold text-slate-800 text-sm">System Audit Trail</h3>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="h-6 w-6 text-hospital-600 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-red-500 text-xs py-4">Failed to load audit logs. Confirm script properties are configured.</p>
          ) : data?.logs && data.logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 uppercase tracking-wider font-semibold">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Operator User</th>
                    <th className="px-4 py-3">Database Action</th>
                    <th className="px-4 py-3">Target Table</th>
                    <th className="px-4 py-3">Record ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-750">
                  {data.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500 font-mono">{formatDateWithTime(log.timestamp)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{log.user}</td>
                      <td className="px-4 py-3 font-semibold text-hospital-700">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                          log.action.includes('delete')
                            ? 'bg-red-50 text-red-700'
                            : log.action.includes('create')
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">{log.table_name}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-400 max-w-[120px] truncate" title={log.record_id}>
                        {log.record_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-400 text-xs py-6 text-center">No system operations logged in audit trails.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};
