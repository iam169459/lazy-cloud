import { useState, useEffect, useRef } from 'react';
import {
  Terminal, Loader2, Check, AlertCircle, RefreshCw, GitBranch,
  Zap, ArrowUpCircle
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

interface Props {
  token: string;
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

interface UpdateStatus {
  branch: string;
  localCommit: string;
  remoteCommit: string;
  upToDate: boolean;
  updatesAvailable: boolean;
  commitsAhead: number;
}

interface LogEntry {
  time: string;
  text: string;
  type: 'info' | 'success' | 'error' | 'warn';
}

export default function AdminSystem({ token, onNotify }: Props) {
  const { colors } = useTheme();
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  function addLog(text: string, type: LogEntry['type'] = 'info') {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [...prev, { time, text, type }]);
  }

  async function checkUpdate() {
    setChecking(true); setLogs([]);
    addLog('Checking for updates...');
    try {
      const res = await fetch('/api/admin/system/check-update', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(data);
      if (data.upToDate) {
        addLog('Already up to date!', 'success');
      } else {
        addLog(`${data.commitsAhead} update(s) available`, 'warn');
        addLog(`Remote: ${data.remoteCommit}`, 'info');
      }
    } catch (e: any) {
      addLog(`Check failed: ${e.message}`, 'error');
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => { checkUpdate(); }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  async function handleUpdate() {
    setUpdating(true); setLogs([]);
    addLog('Starting update...');
    addLog('Pulling latest changes from GitHub...');

    try {
      const res = await fetch('/api/admin/system/update', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        addLog(`Failed: ${data.error || 'Unknown error'}`, 'error');
        sounds.error();
        setUpdating(false);
        return;
      }

      addLog(data.pull || 'Changes pulled', 'success');
      addLog('Installing dependencies & rebuilding...', 'info');
      addLog('Killing old process & restarting server...', 'info');
      addLog('Server will be back in a few seconds', 'success');

      // Try to reload after a delay — server will be down briefly
      setTimeout(() => {
        addLog('Attempting to reconnect...', 'info');
        window.location.reload();
      }, 8000);

      sounds.success();
      onNotify('success', 'Update started — server restarting');
    } catch (e: any) {
      // Connection lost is expected — server is restarting
      addLog('Server is restarting...', 'success');
      addLog('Page will reload in 5 seconds', 'info');
      setTimeout(() => { window.location.reload(); }, 5000);
    } finally {
      setUpdating(false);
    }
  }

  function handleCopyScript() {
    const script = `curl -sSL https://raw.githubusercontent.com/iam169459/lazy-cloud/dev/install.sh | bash`;
    navigator.clipboard.writeText(script).then(() => {
      setCopied(true); sounds.copy();
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div className="animate-fade-up">
        <h2 className="font-semibold flex items-center gap-2" style={{ fontFamily: "'Fira Code', monospace" }}>
          <Terminal className="w-4 h-4" style={{ color: colors.success }} />
          System
        </h2>
        <p className="text-xs sm:text-sm mt-1 font-mono" style={{ color: colors.textDim }}>
          System info, update, and maintenance
        </p>
      </div>

      {/* Update Status Card */}
      <div className="glass-card p-5 animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5" style={{ color: status?.upToDate ? colors.success : colors.warning }} />
            <h3 className="text-sm font-semibold">Update Status</h3>
          </div>
          <button onClick={checkUpdate} disabled={checking || updating} className="btn btn-secondary text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            Check
          </button>
        </div>

        {checking && !status ? (
          <div className="flex items-center gap-3 py-6">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.primary }} />
            <span className="text-sm" style={{ color: colors.textMuted }}>Checking for updates...</span>
          </div>
        ) : status ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: colors.textDim }}>Branch</p>
                <p className="text-sm font-mono font-semibold" style={{ color: colors.primary }}>{status.branch}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: colors.textDim }}>Status</p>
                <p className="text-sm font-mono font-semibold" style={{ color: status.upToDate ? colors.success : colors.warning }}>
                  {status.upToDate ? 'Up to date' : `${status.commitsAhead} behind`}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: colors.textDim }}>Current</p>
              <p className="text-xs font-mono" style={{ color: colors.textMuted }}>{status.localCommit}</p>
            </div>

            {!status.upToDate && (
              <div className="p-3 rounded-xl" style={{ background: `${colors.warning}0d`, border: `1px solid ${colors.warning}26` }}>
                <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: colors.warning }}>Available</p>
                <p className="text-xs font-mono" style={{ color: colors.text }}>{status.remoteCommit}</p>
              </div>
            )}

            <button
              onClick={handleUpdate}
              disabled={updating || status.upToDate}
              className="btn btn-primary w-full text-sm"
            >
              {updating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
              ) : status.upToDate ? (
                <><Check className="w-4 h-4" /> Up to date</>
              ) : (
                <><Zap className="w-4 h-4" /> Update & Restart</>
              )}
            </button>
          </div>
        ) : null}
      </div>

      {/* Terminal Log */}
      {logs.length > 0 && (
        <div className="glass-card overflow-hidden animate-fade-up">
          <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${colors.border}`, background: colors.cardBg }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e' }} />
            </div>
            <span className="text-[10px] font-mono ml-2" style={{ color: colors.textDim }}>terminal</span>
            {updating && <Loader2 className="w-3 h-3 ml-auto animate-spin" style={{ color: colors.primary }} />}
          </div>
          <div ref={logRef} className="p-4 max-h-64 overflow-y-auto font-mono text-xs leading-relaxed" style={{ background: 'rgba(0,0,0,0.3)' }}>
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3">
                <span style={{ color: colors.textDim }}>{log.time}</span>
                <span style={{
                  color: log.type === 'success' ? colors.success
                    : log.type === 'error' ? colors.danger
                    : log.type === 'warn' ? colors.warning
                    : colors.textMuted
                }}>
                  {log.type === 'success' ? '✓' : log.type === 'error' ? '✗' : log.type === 'warn' ? '!' : '›'} {log.text}
                </span>
              </div>
            ))}
            {updating && (
              <div className="flex gap-3 animate-pulse">
                <span style={{ color: colors.textDim }}>...</span>
                <span style={{ color: colors.primary }}>Working</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Links */}
      <div className="glass-card p-4 flex flex-wrap gap-3 animate-fade-up delay-300">
        <a href="https://github.com/iam169459/lazy-cloud/issues" target="_blank" rel="noopener" className="btn btn-secondary text-xs">
          <AlertCircle className="w-3.5 h-3.5" /> Report Issue
        </a>
      </div>
    </div>
  );
}
