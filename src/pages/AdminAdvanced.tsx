import { useState, useEffect } from 'react';
import { Settings, Loader2, Save, Palette, Volume2, VolumeX, Trash2, Download, Upload, Shield, RotateCcw } from 'lucide-react';
import { useTheme, ThemeId, themes } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { api, AppSettings } from '@/lib/api';

interface Props {
 token: string;
 onNotify: (type: 'success' | 'error', msg: string) => void;
}

function errMsg(e: unknown): string {
 return e instanceof Error ? e.message : 'Something went wrong';
}

const DEFAULT_SETTINGS: AppSettings = {
 siteName: 'LazyDrop',
 maxFileSize: '10737418240',
 allowedTypes: '*',
 autoDelete: false,
 autoDeleteDays: '30',
 enableDownloadCounter: true,
 enablePublicUpload: false,
 maxStoragePerBucket: '10188208025',
};

export default function AdminAdvanced({ token, onNotify }: Props) {
 const { theme, setTheme, colors } = useTheme();
 const [saving, setSaving] = useState(false);
 const [loading, setLoading] = useState(true);
 const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
 const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

 useEffect(() => {
 (async () => {
 try {
 let loaded = await api.getSettings();

 // One-time migration from the old localStorage-only settings
 const legacy = localStorage.getItem('lazydrop-settings');
 if (legacy) {
 try {
 const parsed = JSON.parse(legacy);
 loaded = { ...loaded, ...parsed };
 await api.updateSettings(loaded, token);
 localStorage.removeItem('lazydrop-settings');
 } catch {
 // ignore broken legacy data
 }
 }

 setSettings(loaded);
 } catch (e: unknown) {
 onNotify('error', errMsg(e));
 } finally {
 setLoading(false);
 }
 })();
 }, [token, onNotify]);

 function handleSave() {
 sounds.click();
 setSaving(true);
 sounds.setEnabled(soundEnabled);
 api.updateSettings(settings, token)
 .then(() => {
 sounds.success();
 onNotify('success', 'Settings saved — new limits are enforced on uploads');
 })
 .catch((e: unknown) => {
 sounds.error();
 onNotify('error', errMsg(e));
 })
 .finally(() => setSaving(false));
 }

 function handleReset() {
 if (!confirm('Reset all settings to defaults?')) return;
 sounds.click();
 setSaving(true);
 api.updateSettings(DEFAULT_SETTINGS, token)
 .then(() => {
 setSettings(DEFAULT_SETTINGS);
 sounds.success();
 onNotify('success', 'Settings reset to defaults');
 })
 .catch((e: unknown) => {
 sounds.error();
 onNotify('error', errMsg(e));
 })
 .finally(() => setSaving(false));
 }

 function handleClearLocal() {
 if (!confirm('Clear local sound preference and theme? Server settings are kept.')) return;
 sounds.delete();
 localStorage.removeItem('lazydrop-sound-enabled');
 localStorage.removeItem('lazydrop-theme');
 setSoundEnabled(true);
 sounds.setEnabled(true);
 onNotify('success', 'Local preferences cleared');
 }

 if (loading) {
 return (
 <div className="flex flex-col items-center justify-center py-20 gap-4">
 <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
 <p className="text-sm font-mono animate-pulse" style={{ color: colors.textMuted }}>LOADING_SETTINGS...</p>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 <div className="animate-fade-up">
 <h2 className="font-semibold flex items-center gap-2">
 <Settings className="w-4 h-4" style={{ color: colors.primary }} />
 <span className="text-gradient">Advanced Settings</span>
 </h2>
 <p className="text-sm mt-1 font-mono" style={{ color: colors.textDim }}>
 Saved to the server and enforced on every upload and download
 </p>
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
 <SettingsRow label="Site name" desc="Shown on the landing page and browser title">
 <input
 type="text"
 value={settings.siteName}
 onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
 className="input w-36"
 />
 </SettingsRow>
 </SettingsCard>

 {/* Sound */}
 <SettingsCard title="Sound Effects" icon={soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}>
 <SettingsRow label="Enable sounds" desc="Play sounds on interactions">
 <Toggle
 checked={soundEnabled}
 onChange={(v) => setSoundEnabled(v)}
 />
 </SettingsRow>
 </SettingsCard>

 {/* File Settings */}
 <SettingsCard title="File Management" icon={<Download className="w-4 h-4" />}>
 <SettingsRow label="Max file size" desc="Maximum upload size in bytes (0 = unlimited)">
 <input
 type="number"
 value={settings.maxFileSize}
 onChange={(e) => setSettings({ ...settings, maxFileSize: e.target.value })}
 className="input w-32"
 />
 </SettingsRow>
 <SettingsRow label="Allowed file types" desc="Comma-separated MIME types or * for all">
 <input
 type="text"
 value={settings.allowedTypes}
 onChange={(e) => setSettings({ ...settings, allowedTypes: e.target.value })}
 className="input w-full"
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
 <SettingsRow label="Days before deletion" desc="Files older than this are deleted (checked hourly)">
 <input
 type="number"
 value={settings.autoDeleteDays}
 onChange={(e) => setSettings({ ...settings, autoDeleteDays: e.target.value })}
 className="input w-20"
 />
 </SettingsRow>
 )}
 </SettingsCard>

 {/* Storage Limits */}
 <SettingsCard title="Storage Limits" icon={<Upload className="w-4 h-4" />}>
 <SettingsRow label="Max bytes per bucket" desc="Default limit used for new buckets">
 <input
 type="number"
 value={settings.maxStoragePerBucket}
 onChange={(e) => setSettings({ ...settings, maxStoragePerBucket: e.target.value })}
 className="input w-32"
 />
 </SettingsRow>
 </SettingsCard>

 {/* Security */}
 <SettingsCard title="Security" icon={<Shield className="w-4 h-4" />}>
 <SettingsRow label="Public upload" desc="Allow anyone to upload from the landing page">
 <Toggle
 checked={settings.enablePublicUpload}
 onChange={(v) => setSettings({ ...settings, enablePublicUpload: v })}
 />
 </SettingsRow>
 </SettingsCard>
 </div>

 {/* Actions */}
 <div className="flex flex-wrap gap-3 animate-fade-up delay-300">
 <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm btn btn-primary disabled:opacity-60" style={{ background: colors.gradient, color: colors.bg }}>
 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
 Save Settings
 </button>
 <button onClick={handleReset} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm transition-all" style={{ borderColor: colors.border, color: colors.textMuted }}>
 <RotateCcw className="w-4 h-4" />
 Reset to Defaults
 </button>
 <button onClick={handleClearLocal} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm transition-all" style={{ borderColor: `${colors.danger}30`, color: colors.danger }}>
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
 <div className="card rounded-2xl p-5">
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
 className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
 style={{ background: checked ? colors.gradient : `${colors.text}15` }}
 >
 <span
 className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-300"
 style={{ background: colors.bg, transform: checked ? 'translateX(24px)' : 'translateX(0)' }}
 />
 </button>
 );
}