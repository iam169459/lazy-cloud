import { useState } from 'react';
import { Scan, Database, Cloud, Loader2, Check, AlertTriangle, HardDrive, FileX, RefreshCw, Wrench, Zap } from 'lucide-react';
import { api, formatBytes } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import DataTable, { Column, Action } from '@/components/DataTable';

interface Props {
  token: string;
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

interface StorageScanResult {
  buckets: { provider: string; bucket: string; files: { key: string; size: number }[]; error?: string }[];
  summary: {
    totalBuckets: number;
    totalS3Objects: number;
    totalDbRecords: number;
    orphanedFiles: number;
    orphanedItems: { key: string; size: number; provider_id: string; provider_name: string; bucket_name: string }[];
    totalStorageBytes: number;
  };
}

interface DbScanResult {
  records: { fileId: string; name: string; provider: string; exists: boolean; error?: string }[];
  summary: {
    totalDbRecords: number;
    verified: number;
    missing: number;
    missingFiles: { id: string; name: string; reason: string }[];
  };
}

export default function AdminScan({ token, onNotify }: Props) {
  const { colors } = useTheme();
  const [scanningStorage, setScanningStorage] = useState(false);
  const [scanningDb, setScanningDb] = useState(false);
  const [storageResult, setStorageResult] = useState<StorageScanResult | null>(null);
  const [dbResult, setDbResult] = useState<DbScanResult | null>(null);
  const [fixing, setFixing] = useState(false);
  const [autoFixing, setAutoFixing] = useState(false);
  const [fixedKeys, setFixedKeys] = useState<Set<string>>(new Set());

  const handleStorageScan = async () => {
    setScanningStorage(true);
    setFixedKeys(new Set());
    sounds.upload();
    try {
      const result = await api.scanStorage(token);
      setStorageResult(result);
      if (result.summary.orphanedFiles > 0) {
        onNotify('error', `Found ${result.summary.orphanedFiles} orphaned files in S3 (no DB record)`);
      } else {
        onNotify('success', `Storage scan complete: ${result.summary.totalS3Objects} files found, all accounted for`);
      }
    } catch (e: any) {
      onNotify('error', `Storage scan failed: ${e.message}`);
    } finally {
      setScanningStorage(false);
    }
  };

  const handleDbScan = async () => {
    setScanningDb(true);
    sounds.upload();
    try {
      const result = await api.scanDatabase(token);
      setDbResult(result);
      if (result.summary.missing > 0) {
        onNotify('error', `Found ${result.summary.missing} DB records with missing S3 files`);
      } else {
        onNotify('success', `Database scan complete: all ${result.summary.totalDbRecords} records verified`);
      }
    } catch (e: any) {
      onNotify('error', `Database scan failed: ${e.message}`);
    } finally {
      setScanningDb(false);
    }
  };

  const handleFixOrphaned = async (items: { key: string; provider_id: string; size: number }[]) => {
    setFixing(true);
    sounds.upload();
    try {
      const result = await api.fixOrphaned(items, token);
      const newFixed = new Set(fixedKeys);
      for (const r of result.results) { if (r.success) newFixed.add(r.key); }
      setFixedKeys(newFixed);
      if (storageResult) {
        setStorageResult({
          ...storageResult,
          summary: {
            ...storageResult.summary,
            orphanedFiles: storageResult.summary.orphanedFiles - result.fixed,
            orphanedItems: storageResult.summary.orphanedItems.filter((item) => !newFixed.has(item.key)),
          },
        });
      }
      if (result.fixed > 0) onNotify('success', `Fixed ${result.fixed} orphaned file(s) — added to database`);
      if (result.failed > 0) onNotify('error', `Failed to fix ${result.failed} file(s)`);
    } catch (e: any) {
      onNotify('error', `Fix failed: ${e.message}`);
    } finally {
      setFixing(false);
    }
  };

  const handleAutoFix = async () => {
    setAutoFixing(true);
    sounds.upload();
    try {
      const result = await api.autoFix(token);
      if (result.fixed > 0) {
        const newFixed = new Set(fixedKeys);
        for (const r of result.results) { if (r.success) newFixed.add(r.key); }
        setFixedKeys(newFixed);
        onNotify('success', `Auto-fixed ${result.fixed} orphaned file(s) — all imported to database`);
      } else {
        onNotify('success', 'No orphaned files found — everything is in sync');
      }
      handleStorageScan();
    } catch (e: any) {
      onNotify('error', `Auto-fix failed: ${e.message}`);
    } finally {
      setAutoFixing(false);
    }
  };

  // Orphaned items table columns
  const orphanedColumns: Column<{ key: string; size: number; provider_id: string; provider_name: string; bucket_name: string }>[] = [
    {
      key: 'key',
      label: 'File',
      sortable: true,
      render: (row) => {
        const fileName = row.key.split('/').slice(1).join('/') || row.key;
        const isFixed = fixedKeys.has(row.key);
        return (
          <div className="flex items-center gap-2">
            <span className={`status-badge ${isFixed ? 'status-success' : 'status-danger'}`}>
              {isFixed ? 'Fixed' : 'Orphaned'}
            </span>
            <span className="text-xs font-mono truncate max-w-[240px]" style={{ color: isFixed ? '#22c55e' : colors.text }}>{fileName}</span>
          </div>
        );
      },
    },
    {
      key: 'provider_name',
      label: 'Provider',
      render: (row) => (
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: colors.textMuted }}>
          {row.provider_name}
        </span>
      ),
    },
    {
      key: 'bucket_name',
      label: 'Bucket',
      render: (row) => (
        <span className="text-[11px] font-mono" style={{ color: colors.textDim }}>{row.bucket_name}</span>
      ),
    },
    {
      key: 'size',
      label: 'Size',
      sortable: true,
      render: (row) => (
        <span className="text-[11px] font-mono" style={{ color: colors.textMuted }}>{formatBytes(row.size)}</span>
      ),
    },
  ];

  const orphanedActions: Action<{ key: string; size: number; provider_id: string; provider_name: string; bucket_name: string }>[] = [
    {
      label: 'Fix',
      icon: fixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />,
      onClick: (row) => handleFixOrphaned([{ key: row.key, provider_id: row.provider_id, size: row.size }]),
      disabled: (row) => fixing || fixedKeys.has(row.key),
      hidden: (row) => fixedKeys.has(row.key),
    },
  ];

  // Missing files table columns
  const missingColumns: Column<{ id: string; name: string; reason: string }>[] = [
    {
      key: 'name',
      label: 'File',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="status-badge status-danger">Missing</span>
          <span className="text-xs font-mono truncate max-w-[240px]">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (row) => (
        <span className="text-[11px] font-mono" style={{ color: '#ef4444' }}>{row.reason}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Scan Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Storage Scan */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ fontFamily: "'Fira Code', monospace" }}>Storage Scan</h3>
              <p className="text-[11px]" style={{ color: colors.textDim }}>Scan all S3 buckets</p>
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: colors.textDim }}>
            Lists every object in all configured buckets and compares against database records.
          </p>
          <button onClick={handleStorageScan} disabled={scanningStorage} className="btn btn-primary text-xs w-full">
            {scanningStorage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />}
            {scanningStorage ? 'Scanning...' : 'Scan Storage'}
          </button>
        </div>

        {/* Database Scan */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ fontFamily: "'Fira Code', monospace" }}>Database Scan</h3>
              <p className="text-[11px]" style={{ color: colors.textDim }}>Verify all DB records</p>
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: colors.textDim }}>
            Checks every database record to ensure its corresponding S3 object still exists.
          </p>
          <button onClick={handleDbScan} disabled={scanningDb} className="btn btn-secondary text-xs w-full">
            {scanningDb ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
            {scanningDb ? 'Scanning...' : 'Scan Database'}
          </button>
        </div>

        {/* Auto Fix */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ fontFamily: "'Fira Code', monospace" }}>Auto Fix</h3>
              <p className="text-[11px]" style={{ color: colors.textDim }}>Scan & import orphans</p>
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: colors.textDim }}>
            Automatically scan all buckets and import any orphaned files into the database.
          </p>
          <button onClick={handleAutoFix} disabled={autoFixing} className="btn btn-primary text-xs w-full" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
            {autoFixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {autoFixing ? 'Fixing...' : 'Auto Fix All'}
          </button>
        </div>
      </div>

      {/* Storage Scan Results */}
      {storageResult && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="w-4 h-4" style={{ color: '#22c55e' }} />
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Buckets</span>
              </div>
              <p className="text-xl font-bold">{storageResult.summary.totalBuckets}</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4" style={{ color: '#3b82f6' }} />
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>S3 Files</span>
              </div>
              <p className="text-xl font-bold">{storageResult.summary.totalS3Objects}</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4" style={{ color: '#22c55e' }} />
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>DB Records</span>
              </div>
              <p className="text-xl font-bold">{storageResult.summary.totalDbRecords}</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileX className="w-4 h-4" style={{ color: storageResult.summary.orphanedFiles > 0 ? '#ef4444' : '#22c55e' }} />
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Orphaned</span>
              </div>
              <p className="text-xl font-bold" style={{ color: storageResult.summary.orphanedFiles > 0 ? '#ef4444' : '#22c55e' }}>
                {storageResult.summary.orphanedFiles}
              </p>
            </div>
          </div>

          {/* Success banner */}
          {storageResult.summary.orphanedFiles === 0 && storageResult.buckets.some((b) => !b.error) && (
            <div className="glass-card p-4 flex items-center gap-3" style={{ border: '1px solid rgba(34,197,94,0.2)' }}>
              <Check className="w-5 h-5" style={{ color: '#22c55e' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>All storage files accounted for</p>
                <p className="text-xs" style={{ color: colors.textDim }}>{storageResult.summary.totalS3Objects} files in {storageResult.summary.totalBuckets} buckets — all have matching DB records.</p>
              </div>
            </div>
          )}

          {/* Orphaned Files Table */}
          {storageResult.summary.orphanedItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: "'Fira Code', monospace" }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} />
                  Orphaned Files
                </h3>
                <button
                  onClick={() => handleFixOrphaned(storageResult.summary.orphanedItems.map((item) => ({ key: item.key, provider_id: item.provider_id, size: item.size })))}
                  disabled={fixing}
                  className="btn btn-primary text-xs"
                >
                  {fixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
                  Fix All ({storageResult.summary.orphanedItems.length})
                </button>
              </div>
              <DataTable
                columns={orphanedColumns}
                data={storageResult.summary.orphanedItems}
                actions={orphanedActions}
                keyExtractor={(row) => row.key}
                searchPlaceholder="Search files..."
                searchKeys={['key', 'provider_name', 'bucket_name']}
                pageSize={8}
                emptyTitle="No orphaned files"
              />
            </div>
          )}
        </div>
      )}

      {/* Database Scan Results */}
      {dbResult && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4" style={{ color: '#3b82f6' }} />
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Total Records</span>
              </div>
              <p className="text-xl font-bold">{dbResult.summary.totalDbRecords}</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4" style={{ color: '#22c55e' }} />
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Verified</span>
              </div>
              <p className="text-xl font-bold" style={{ color: '#22c55e' }}>{dbResult.summary.verified}</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileX className="w-4 h-4" style={{ color: dbResult.summary.missing > 0 ? '#ef4444' : '#22c55e' }} />
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Missing</span>
              </div>
              <p className="text-xl font-bold" style={{ color: dbResult.summary.missing > 0 ? '#ef4444' : '#22c55e' }}>
                {dbResult.summary.missing}
              </p>
            </div>
          </div>

          {/* Success banner */}
          {dbResult.summary.missing === 0 && (
            <div className="glass-card p-4 flex items-center gap-3" style={{ border: '1px solid rgba(34,197,94,0.2)' }}>
              <Check className="w-5 h-5" style={{ color: '#22c55e' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>All database records verified</p>
                <p className="text-xs" style={{ color: colors.textDim }}>{dbResult.summary.totalDbRecords} records — all have matching S3 objects.</p>
              </div>
            </div>
          )}

          {/* Missing Files Table */}
          {dbResult.summary.missingFiles.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ fontFamily: "'Fira Code', monospace" }}>
                <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
                Missing Files (in DB, not in S3)
              </h3>
              <DataTable
                columns={missingColumns}
                data={dbResult.summary.missingFiles}
                keyExtractor={(row) => row.id}
                searchPlaceholder="Search files..."
                searchKeys={['name', 'reason']}
                pageSize={8}
                emptyTitle="No missing files"
              />
            </div>
          )}
        </div>
      )}

      {/* Empty state — no scans run yet */}
      {!storageResult && !dbResult && !scanningStorage && !scanningDb && (
        <div className="glass-card p-12 text-center">
          <Scan className="w-10 h-10 mx-auto mb-3" style={{ color: colors.textDim }} />
          <p className="text-sm font-medium" style={{ color: colors.textMuted }}>No scans run yet</p>
          <p className="text-xs mt-1" style={{ color: colors.textDim }}>Select a scan type above to verify storage and database integrity.</p>
        </div>
      )}
    </div>
  );
}
