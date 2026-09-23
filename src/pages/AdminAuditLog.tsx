import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, Download, Search, Filter } from 'lucide-react';
import { api, AuditLogEntry, formatDate } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import DataTable, { Column, BulkAction } from '@/components/DataTable';
import { FormSection, FormField, FormActions, SaveButton, CancelButton } from '@/components/Form';

interface Props {
  token: string;
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

export default function AdminAuditLog({ token, onNotify }: Props) {
  const { colors } = useTheme();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filters, setFilters] = useState({ action: '', adminId: '', dateFrom: '', dateTo: '' });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { logs: loadedLogs } = await api.getAuditLogs(token, pageSize, page * pageSize);
      setLogs(loadedLogs);
      setTotalLogs(loadedLogs.length + page * pageSize);
    } catch (e: any) {
      onNotify('error', e.message);
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize, onNotify]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'created_at',
      label: 'Time',
      sortable: true,
      width: '160px',
      render: (row) => <span className="text-xs font-mono whitespace-nowrap" style={{ color: colors.textMuted }}>{formatDate(row.created_at)}</span>,
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: colors.success }}>
          {row.action}
        </span>
      ),
    },
    {
      key: 'admin_id',
      label: 'Admin',
      sortable: true,
      render: (row) => <span className="text-xs" style={{ color: row.admin_id ? colors.textMuted : colors.textDim }}>{row.admin_id || 'System'}</span>,
    },
    {
      key: 'details',
      label: 'Details',
      render: (row) => (
        <span className="text-xs truncate max-w-[300px]" style={{ color: colors.textDim }}>
          {row.details || '—'}
        </span>
      ),
    },
    {
      key: 'ip_address',
      label: 'IP',
      render: (row) => <span className="text-[10px] font-mono" style={{ color: colors.textDim }}>{row.ip_address || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={loadLogs} disabled={loading} className="btn btn-secondary text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
            className="input py-1.5 px-3 text-xs"
            style={{ width: 'auto' }}
          >
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={logs}
        keyExtractor={(row) => row.id}
        searchPlaceholder="Search audit log..."
        searchKeys={['action', 'admin_id', 'details', 'ip_address', 'user_agent']}
        pageSize={pageSize}
        loading={loading}
        emptyIcon={<Search className="w-10 h-10" />}
        emptyTitle="No audit log entries"
        emptyDescription="Admin actions will appear here."
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono" style={{ color: colors.textDim }}>
          Page {page + 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="btn btn-secondary text-xs p-1.5"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={logs.length < pageSize || loading}
            className="btn btn-secondary text-xs p-1.5"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}