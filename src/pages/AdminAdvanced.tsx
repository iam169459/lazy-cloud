import { useState, useEffect } from 'react';
import { Settings, Loader2, Save, Globe, Lock, Palette, Volume2, VolumeX, Eye, EyeOff, Trash2, RefreshCw, Download, Upload, Shield } from 'lucide-react';
import { useTheme, ThemeId, themes } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { api } from '@/lib/api';

interface Props {
  token: string;
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

interface AppSettings {
  siteName: string;
  maxFileSize: string;
  allowedTypes: string;
  autoDelete: boolean;
  autoDeleteDays: string;
  enableDownloadCounter: boolean;
  enablePublicUpload: boolean;
  requireAuth: boolean;
  maxStoragePerBucket: string;
}

export default function AdminAdvanced({ token, onNotify }: Props) {
  const { theme, setTheme, colors } = useTheme();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    siteName: 'LazyDrop',
    maxFileSize: '10737418240',
    allowedTypes: '*',
    autoDelete: false,
    autoDeleteDays: '30',
    enableDownloadCounter: true,
    enablePublicUpload: false,
    requireAuth: true,
    maxStoragePerBucket: '10188208025',
  });

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('lazydrop-settings');
    if (saved) {
      try { setSettings({ ...settings, ...JSON.parse(saved) }); } catch {}
    }
    setLoading(false);
  }, []);

  function handleSave() {
    sounds.click();
    setSaving(true);
    try {
      localStorage.setItem('lazydrop-settings', JSON.stringify(settings));
      sounds.success();
      onNotify('success', 'Settings saved successfully');
    } catch (e: any) {
      sounds.error();
      onNotify('error', e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleClearData() {
    if (!confirm('Clear all local settings? This will not affect your database.')) return;
    sounds.delete();
    localStorage.removeItem('lazydrop-settings');
    onNotify('success', 'Local settings cleared');
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h2 className="font-semibold flex items-center gap-2">
          <Settings className="w-4 h-4" style={{ color: colors.primary }} />
          <span className="text-gradient-sci">Advanced Settings</span>
        </h2>
        <p className="text-sm mt-1 font-mono" style={{ color: colors.textDim }}>Configure app behavior and preferences</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Appearance */}
        <SettingsCard title="Appearance" icon={<Palette className="w-4 h-4" />}>
          <SettingsRow label="Theme" desc="Choose your visual style">
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(themes) as ThemeId[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTheme(t); sounds.click(); }}
                  className="px-3 py-2 rounded-lg text-xs font-medium border transition-all"
                  style={{
                    background: theme === t ? `${colors.primary}15` : 'transparent',
                    borderColor: theme === t ? `${colors.primary}40` : colors.border,
                    color: theme === t ? colors.primary : colors.textDim,
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </SettingsRow>
        </SettingsCard>

        {/* Sound */}
        <SettingsCard title="Sound Effects" icon={<Volume2 className="w-4 h-4" />}>
          <SettingsRow label="Enable sounds" desc="Play sounds on interactions">
            <Toggle
              checked={settings.requireAuth}
              onChange={(v) => setSettings({ ...settings, requireAuth: v })}
            />
          </SettingsRow>
        </SettingsCard>

        {/* File Settings */}
        <SettingsCard title="File Management" icon={<Download className="w-4 h-4" />}>
          <SettingsRow label="Max file size" desc="Maximum upload size in bytes">
            <input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => setSettings({ ...settings, maxFileSize: e.target.value })}
              className="form-input text-xs w-32"
            />
          </SettingsRow>
          <SettingsRow label="Allowed file types" desc="Comma-separated MIME types or * for all">
            <input
              type="text"
              value={settings.allowedTypes}
              onChange={(e) => setSettings({ ...settings, allowedTypes: e.target.value })}
              className="form-input text-xs w-full"
              placeholder="*"
            />
          </SettingsRow>
          <SettingsRow label="Download counter" desc="Track download counts">
            <Toggle
              checked={settings.enableDownloadCounter}
              onChange={(v) => setSettings({ ...settings, enableDownloadCounter: v })}
            />
          </SettingsRow>
        </SettingsCard>

        {/* Auto Cleanup */}
        <SettingsCard title="Auto Cleanup" icon={<Trash2 className="w-4 h-4" />}>
          <SettingsRow label="Auto-delete old files" desc="Remove files after X days">
            <Toggle
              checked={settings.autoDelete}
              onChange={(v) => setSettings({ ...settings, autoDelete: v })}
            />
          </SettingsRow>
          {settings.autoDelete && (
            <SettingsRow label="Days before deletion" desc="Files older than this are deleted">
              <input
                type="number"
                value={settings.autoDeleteDays}
                onChange={(e) => setSettings({ ...settings, autoDeleteDays: e.target.value })}
                className="form-input text-xs w-20"
              />
            </SettingsRow>
          )}
        </SettingsCard>

        {/* Storage Limits */}
        <SettingsCard title="Storage Limits" icon={<Upload className="w-4 h-4" />}>
          <SettingsRow label="Max bytes per bucket" desc="Default storage limit">
            <input
              type="number"
              value={settings.maxStoragePerBucket}
              onChange={(e) => setSettings({ ...settings, maxStoragePerBucket: e.target.value })}
              className="form-input text-xs w-32"
            />
          </SettingsRow>
        </SettingsCard>

        {/* Security */}
        <SettingsCard title="Security" icon={<Shield className="w-4 h-4" />}>
          <SettingsRow label="Public upload" desc="Allow uploads without authentication">
            <Toggle
              checked={settings.enablePublicUpload}
              onChange={(v) => setSettings({ ...settings, enablePublicUpload: v })}
            />
          </SettingsRow>
        </SettingsCard>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 animate-fade-in-up delay-300">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm btn-sci disabled:opacity-60" style={{ background: colors.gradient, color: colors.bg }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
        <button onClick={handleClearData} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm transition-all" style={{ borderColor: `${colors.danger}30`, color: colors.danger }}>
          <Trash2 className="w-4 h-4" />
          Clear Local Data
        </button>
      </div>
    </div>
  );
}

function SettingsCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <div className="card-sci corner-accent rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${colors.primary}10`, color: colors.primary }}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold" style={{ color: colors.text }}>{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingsRow({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: colors.text }}>{label}</p>
        <p className="text-[11px] font-mono" style={{ color: colors.textDim }}>{desc}</p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <button
      onClick={() => { onChange(!checked); sounds.toggle(); }}
      className="relative w-10 h-5 rounded-full transition-all duration-300"
      style={{ background: checked ? colors.gradient : `${colors.text}15` }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-300"
        style={{ background: colors.bg, transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  );
}
