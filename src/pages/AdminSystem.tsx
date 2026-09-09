import { useState } from 'react';
import {
  Terminal, Loader2, Check, AlertCircle, RefreshCw, GitBranch, Clock, Server,
  Database, HardDrive, Cpu, Zap, ExternalLink, Download, Copy
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { FormSection, FormActions, SaveButton, DangerButton } from '@/components/Form';

interface Props {
  token: string;
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong';
}

export default function AdminSystem({ token, onNotify }: Props) {
  const { colors } = useTheme();
  const [pulling, setPulling] = useState(false);
  const [building, setBuilding] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const systemInfo = [
    { label: 'App', value: 'LazyDrop', icon: <Zap className="w-4 h-4" /> },
    { label: 'Runtime', value: `Node ${typeof process !== 'undefined' ? process.version || '—' : '—'}`, icon: <Server className="w-4 h-4" /> },
    { label: 'Branch', value: 'dev', icon: <GitBranch className="w-4 h-4" /> },
    { label: 'Deploy', value: 'Render', icon: <ExternalLink className="w-4 h-4" /> },
  ];

  async function handlePull() {
    sounds.click();
    setPulling(true);
    try {
      const res = await fetch('/api/admin/system/pull', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Pull failed');
      sounds.success();
      onNotify('success', data.message || 'Pulled latest changes');
    } catch (e: any) {
      sounds.error();
      onNotify('error', errMsg(e));
    } finally {
      setPulling(false);
    }
  }

  async function handleRebuild() {
    sounds.click();
    setBuilding(true);
    try {
      const res = await fetch('/api/admin/system/rebuild', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Build failed');
      sounds.success();
      onNotify('success', data.message || 'Rebuild complete');
    } catch (e: any) {
      sounds.error();
      onNotify('error', errMsg(e));
    } finally {
      setBuilding(false);
    }
  }

  async function handleUpdate() {
    sounds.click();
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/system/update', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      sounds.success();
      const msg = data.restarted
        ? `${data.message} — server restarted`
        : `${data.message} — restart server to apply`;
      onNotify('success', msg);
    } catch (e: any) {
      sounds.error();
      onNotify('error', errMsg(e));
    } finally {
      setUpdating(false);
    }
  }

  function handleCopyScript() {
    const script = `curl -sSL https://raw.githubusercontent.com/iam169459/lazy-cloud/dev/install.sh | bash`;
    navigator.clipboard.writeText(script).then(() => {
      setCopied(true);
      sounds.copy();
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const installScript = `# Quick install
curl -sSL https://raw.githubusercontent.com/iam169459/lazy-cloud/dev/install.sh | bash

# Or manual
git clone -b dev --depth 1 https://github.com/iam169459/lazy-cloud.git
cd lazydrop
npm install
cp .env.example .env   # edit with your DATABASE_URL
npm run dev`;

  const updateScript = `# From the project root
./update.sh

# Or manual
git pull origin dev
npm install
npm run build`;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div className="animate-fade-up">
        <h2 className="font-semibold flex items-center gap-2" style={{ fontFamily: "'Fira Code', monospace" }}>
          <Terminal className="w-4 h-4" style={{ color: '#22c55e' }} />
          System
        </h2>
        <p className="text-xs sm:text-sm mt-1 font-mono" style={{ color: colors.textDim }}>
          System information, update, and maintenance
        </p>
      </div>

      {/* System Info */}
      <div className="glass-card p-4 animate-fade-up">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {systemInfo.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                {item.icon}
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>{item.label}</p>
                <p className="text-sm font-semibold">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Update Actions */}
      <FormSection title="Update & Deploy" icon={<RefreshCw className="w-4 h-4" />}>
        {/* One-click Update */}
        <div className="glass-card p-4 flex flex-col gap-3 mb-4" style={{ border: '1px solid rgba(34,197,94,0.2)' }}>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: '#22c55e' }} />
            <h4 className="text-sm font-semibold">Quick Update</h4>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>Recommended</span>
          </div>
          <p className="text-xs font-mono" style={{ color: colors.textDim }}>
            Pull latest code, install deps, rebuild, and restart — all in one click
          </p>
          <SaveButton loading={updating} onClick={handleUpdate}>
            <Zap className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
            {updating ? 'Updating...' : 'Update & Restart'}
          </SaveButton>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass-card p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" style={{ color: '#22c55e' }} />
              <h4 className="text-sm font-semibold">Pull Only</h4>
            </div>
            <p className="text-xs font-mono" style={{ color: colors.textDim }}>
              Pull the latest code from GitHub (dev branch)
            </p>
            <SaveButton loading={pulling} onClick={handlePull}>
              <RefreshCw className={`w-3.5 h-3.5 ${pulling ? 'animate-spin' : ''}`} />
              Pull
            </SaveButton>
          </div>

          <div className="glass-card p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" style={{ color: '#f59e0b' }} />
              <h4 className="text-sm font-semibold">Rebuild Only</h4>
            </div>
            <p className="text-xs font-mono" style={{ color: colors.textDim }}>
              Reinstall deps and rebuild production bundle
            </p>
            <SaveButton loading={building} onClick={handleRebuild}>
              <Loader2 className={`w-3.5 h-3.5 ${building ? 'animate-spin' : ''}`} />
              Rebuild
            </SaveButton>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl mt-2" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} />
          <p className="text-xs font-mono" style={{ color: colors.textDim }}>
            Quick Update does everything: pull + install + build + restart. Use Pull or Rebuild for individual steps.
          </p>
        </div>
      </FormSection>

      {/* Install Script */}
      <FormSection title="Installation Script" icon={<Download className="w-4 h-4" />}>
        <p className="text-xs font-mono mb-3" style={{ color: colors.textDim }}>
          One-command setup for a fresh server
        </p>

        <div className="relative">
          <pre className="p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', color: colors.text }}>
            <code>{installScript}</code>
          </pre>
          <button
            onClick={handleCopyScript}
            className="absolute top-2 right-2 p-2 rounded-lg transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: copied ? '#22c55e' : colors.textDim }}
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </FormSection>

      {/* Update Script */}
      <FormSection title="Update Script" icon={<RefreshCw className="w-4 h-4" />}>
        <p className="text-xs font-mono mb-3" style={{ color: colors.textDim }}>
          Pull latest, install deps, and rebuild
        </p>

        <div className="relative">
          <pre className="p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', color: colors.text }}>
            <code>{updateScript}</code>
          </pre>
          <button
            onClick={() => { navigator.clipboard.writeText(updateScript); sounds.copy(); }}
            className="absolute top-2 right-2 p-2 rounded-lg transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: colors.textDim }}
            title="Copy to clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </FormSection>

      {/* Links */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-up delay-100">
        <div className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4" style={{ color: '#22c55e' }} />
          <span className="text-sm font-semibold">Useful Links</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="https://github.com/iam169459/lazy-cloud" target="_blank" rel="noopener" className="btn btn-secondary text-xs">
            GitHub Repo
          </a>
          <a href="https://github.com/iam169459/lazy-cloud/issues" target="_blank" rel="noopener" className="btn btn-secondary text-xs">
            Report Issue
          </a>
        </div>
      </div>
    </div>
  );
}
