import { useState } from 'react';
import { Scan, Database, Cloud, Loader2, Check, AlertTriangle, HardDrive, FileX, RefreshCw, Wrench } from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { formatBytes } from '@/lib/api';

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
      for (const r of result.results) {
        if (r.success) newFixed.add(r.key);
      }
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

      if (result.fixed > 0) {
        onNotify('success', `Fixed ${result.fixed} orphaned file(s) — added to database`);
      }
      if (result.failed > 0) {
        onNotify('error', `Failed to fix ${result.failed} file(s)`);
      }
    } catch (e: any) {
      onNotify('error', `Fix failed: ${e.message}`);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h2 className="font-semibold flex items-center gap-2">
          <Scan className="w-4 h-4" style={{ color: colors.primary }} />
          <span className="text-gradient">System Scan</span>
        </h2>
        <p className="text-sm mt-1 font-mono" style={{ color: colors.textDim }}>Verify storage buckets and database integrity</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card rounded-2xl p-6 animate-fade-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl border flex items-center justify-center" style={{ background: `${colors.primary}10`, borderColor: `${colors.primary}25`, color: colors.primary }}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Storage Scan</h3>
              <p className="text-xs" style={{ color: colors.textDim }}>Scan all S3 buckets for files</p>
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: colors.textDim }}>
            Lists every object in all configured buckets and compares against database records. Identifies orphaned files (in S3 but not in DB).
          </p>
          <button
            onClick={handleStorageScan}
            disabled={scanningStorage}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm btn btn-primary"
            style={{ background: colors.gradient, color: colors.bg }}
          >
            {scanningStorage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
            {scanningStorage ? 'Scanning storage...' : 'Scan Storage Buckets'}
          </button>
        </div>

        <div className="card rounded-2xl p-6 animate-fade-up" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl border flex items-center justify-center" style={{ background: `${colors.secondary}10`, borderColor: `${colors.secondary}25`, color: colors.secondary }}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Database Scan</h3>
              <p className="text-xs" style={{ color: colors.textDim }}>Verify all DB records</p>
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: colors.textDim }}>
            Checks every database record to ensure its corresponding S3 object still exists. Identifies missing files (in DB but not in S3).
          </p>
          <button
            onClick={handleDbScan}
            disabled={scanningDb}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm btn btn-secondary"
            style={{ background: `${colors.text}08`, color: colors.text, border: `1px solid ${colors.text}15` }}
          >
            {scanningDb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            {scanningDb ? 'Scanning database...' : 'Scan Database Records'}
          </button>
        </div>
      </div>

      {storageResult && (
        <div className="card rounded-2xl p-5 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Cloud className="w-4 h-4" style={{ color: colors.primary }} />
              Storage Scan Results
            </h3>
            <button onClick={handleStorageScan} className="p-2 rounded-lg" style={{ color: colors.textDim }}>
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <StatBox label="Buckets" value={String(storageResult.summary.totalBuckets)} icon={<Cloud className="w-3.5 h-3.5" />} color={colors.primary} colors={colors} />
            <StatBox label="S3 Files" value={String(storageResult.summary.totalS3Objects)} icon={<HardDrive className="w-3.5 h-3.5" />} color={colors.secondary} colors={colors} />
            <StatBox label="DB Records" value={String(storageResult.summary.totalDbRecords)} icon={<Database className="w-3.5 h-3.5" />} color={colors.primary} colors={colors} />
            <StatBox
              label="Orphaned"
              value={String(storageResult.summary.orphanedFiles)}
              icon={<FileX className="w-3.5 h-3.5" />}
              color={storageResult.summary.orphanedFiles > 0 ? colors.danger : colors.success}
              colors={colors}
            />
          </div>

          {storageResult.summary.totalStorageBytes > 0 && (
            <p className="text-xs font-mono mb-3" style={{ color: colors.textDim }}>
              Total storage: {formatBytes(storageResult.summary.totalStorageBytes)}
            </p>
          )}

          {storageResult.buckets.map((b, i) => (
            <div key={i} className="mb-3 p-3 rounded-xl" style={{ background: `${colors.text}03`, border: `1px solid ${colors.text}08` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold">{b.provider} <span className="font-mono" style={{ color: colors.textDim }}>({b.bucket})</span></span>
                {b.error ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${colors.danger}15`, color: colors.danger }}>{b.error}</span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${colors.primary}10`, color: colors.primary }}>{b.files.length} files</span>
                )}
              </div>
              {!b.error && b.files.length > 0 && (
                <div className="space-y-1">
                  {b.files.slice(0, 5).map((f, j) => (
                    <div key={j} className="flex items-center justify-between text-[10px] font-mono" style={{ color: colors.textDim }}>
                      <span className="truncate max-w-[200px]">{f.key}</span>
                      <span>{formatBytes(f.size)}</span>
                    </div>
                  ))}
                  {b.files.length > 5 && (
                    <p className="text-[10px] font-mono" style={{ color: `${colors.text}40` }}>...and {b.files.length - 5} more</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {storageResult.summary.orphanedItems.length > 0 && (
            <div className="p-3 rounded-xl" style={{ background: `${colors.danger}08`, border: `1px solid ${colors.danger}20` }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: colors.danger }}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Orphaned Files ({storageResult.summary.orphanedItems.length})
                </p>
                <button
                  onClick={() => handleFixOrphaned(storageResult.summary.orphanedItems.map((item) => ({ key: item.key, provider_id: item.provider_id, size: item.size })))}
                  disabled={fixing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                  style={{ background: `${colors.success}15`, color: colors.success, border: `1px solid ${colors.success}25` }}
                >
                  {fixing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wrench className="w-3 h-3" />}
                  Fix All
                </button>
              </div>
              <div className="space-y-2 mt-2">
                {storageResult.summary.orphanedItems.map((item, i) => {
                  const isFixed = fixedKeys.has(item.key);
                  const fileName = item.key.split('/').slice(1).join('/') || item.key;
                  return (
                    <div key={i} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg" style={{ background: isFixed ? `${colors.success}08` : `${colors.text}04` }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono truncate" style={{ color: isFixed ? colors.success : colors.text }}>{fileName}</p>
                        <p className="text-[9px] font-mono" style={{ color: colors.textDim }}>
                          {item.provider_name} ({item.bucket_name}) · {formatBytes(item.size)}
                        </p>
                      </div>
                      {isFixed ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${colors.success}15`, color: colors.success }}>
                          <Check className="w-3 h-3 inline" /> Fixed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleFixOrphaned([{ key: item.key, provider_id: item.provider_id, size: item.size }])}
                          disabled={fixing}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all flex-shrink-0"
                          style={{ background: `${colors.success}15`, color: colors.success, border: `1px solid ${colors.success}25` }}
                        >
                          <Wrench className="w-3 h-3" />
                          Fix
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {storageResult.summary.orphanedFiles === 0 && storageResult.buckets.some((b) => !b.error) && (
            <div className="p-3 rounded-xl text-center" style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}20` }}>
              <Check className="w-5 h-5 mx-auto mb-1" style={{ color: colors.success }} />
              <p className="text-xs font-semibold" style={{ color: colors.success }}>All storage files are accounted for in the database</p>
            </div>
          )}
        </div>
      )}

      {dbResult && (
        <div className="card rounded-2xl p-5 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Database className="w-4 h-4" style={{ color: colors.secondary }} />
              Database Scan Results
            </h3>
            <button onClick={handleDbScan} className="p-2 rounded-lg" style={{ color: colors.textDim }}>
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatBox label="Total Records" value={String(dbResult.summary.totalDbRecords)} icon={<Database className="w-3.5 h-3.5" />} color={colors.secondary} colors={colors} />
            <StatBox label="Verified" value={String(dbResult.summary.verified)} icon={<Check className="w-3.5 h-3.5" />} color={colors.success} colors={colors} />
            <StatBox
              label="Missing"
              value={String(dbResult.summary.missing)}
              icon={<FileX className="w-3.5 h-3.5" />}
              color={dbResult.summary.missing > 0 ? colors.danger : colors.success}
              colors={colors}
            />
          </div>

          {dbResult.summary.missing > 0 && (
            <div className="p-3 rounded-xl" style={{ background: `${colors.danger}08`, border: `1px solid ${colors.danger}20` }}>
              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: colors.danger }}>
                <AlertTriangle className="w-3.5 h-3.5" />
                Missing Files (in DB, not in S3)
              </p>
              <div className="space-y-1">
                {dbResult.summary.missingFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] font-mono" style={{ color: colors.textDim }}>
                    <span className="truncate max-w-[200px]">{f.name}</span>
                    <span style={{ color: colors.danger }}>{f.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dbResult.summary.missing === 0 && (
            <div className="p-3 rounded-xl text-center" style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}20` }}>
              <Check className="w-5 h-5 mx-auto mb-1" style={{ color: colors.success }} />
              <p className="text-xs font-semibold" style={{ color: colors.success }}>All database records verified - files exist in S3</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, icon, color, colors }: { label: string; value: string; icon: React.ReactNode; color: string; colors: any }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: `${color}08`, border: `1px solid ${color}15` }}>
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
        {icon}
        <span className="text-[10px] font-mono uppercase">{label}</span>
      </div>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
    </div>
  );
}
