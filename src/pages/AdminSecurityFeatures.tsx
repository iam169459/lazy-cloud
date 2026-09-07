import { useState, useEffect } from 'react';
import { Shield, Lock, Clock, Globe, KeyRound, HardDrive, Users, AlertTriangle, Save, Loader2, Check, Eye, EyeOff, Timer, Crown } from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

interface SecurityStatus {
 encryption: { enabled: boolean; usingDefault: boolean };
 fileTTL: { enabled: boolean; defaultDays: number };
 sessionTimeout: number;
 ipWhitelist: string[];
}

export default function AdminSecurityFeatures({ token, onNotify }: { token: string; onNotify: (type: 'success' | 'error', msg: string) => void }) {
 const { colors } = useTheme();
 const [status, setStatus] = useState<SecurityStatus | null>(null);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);

 // Form state
 const [fileTTLEnabled, setFileTTLEnabled] = useState(true);
 const [fileTTLDays, setFileTTLDays] = useState(30);
 const [sessionTimeout, setSessionTimeout] = useState(30);
 const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
 const [newIp, setNewIp] = useState('');
 const [showEncryptionKey, setShowEncryptionKey] = useState(false);

 useEffect(() => {
 loadStatus();
 }, [token]);

 async function loadStatus() {
 try {
 const s = await api.getSecurityStatus(token);
 setStatus(s);
 setFileTTLEnabled(s.fileTTL.enabled);
 setFileTTLDays(s.fileTTL.defaultDays);
 setSessionTimeout(s.sessionTimeout);
 setIpWhitelist(s.ipWhitelist);
 } catch (e: any) {
 onNotify('error', e.message);
 } finally {
 setLoading(false);
 }
 }

 async function handleFileTTLSave() {
 sounds.click();
 setSaving(true);
 try {
 await api.updateFileTTL({ enabled: fileTTLEnabled, defaultDays: fileTTLDays }, token);
 sounds.success();
 onNotify('success', 'File TTL settings updated');
 await loadStatus();
 } catch (e: any) {
 sounds.error();
 onNotify('error', e.message);
 } finally {
 setSaving(false);
 }
 }

 async function handleSessionTimeoutSave() {
 sounds.click();
 setSaving(true);
 try {
 await api.updateSessionTimeout(sessionTimeout, token);
 sounds.success();
 onNotify('success', 'Session timeout updated');
 await loadStatus();
 } catch (e: any) {
 sounds.error();
 onNotify('error', e.message);
 } finally {
 setSaving(false);
 }
 }

 async function handleAddIp() {
 const ip = newIp.trim();
 if (!ip) return;
 if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip) && !/^[\da-fA-F:]+$/.test(ip)) {
 onNotify('error', 'Invalid IP address format');
 return;
 }
 const updated = [...ipWhitelist, ip];
 setIpWhitelist(updated);
 setNewIp('');
 sounds.type();
 }

 async function handleRemoveIp(ip: string) {
 sounds.click();
 const updated = ipWhitelist.filter(i => i !== ip);
 setIpWhitelist(updated);
 try {
 await api.updateIpWhitelist(updated, token);
 sounds.success();
 onNotify('success', 'IP whitelist updated');
 } catch (e: any) {
 sounds.error();
 onNotify('error', e.message);
 }
 }

 async function handleIpListSave() {
 sounds.click();
 setSaving(true);
 try {
 await api.updateIpWhitelist(ipWhitelist, token);
 sounds.success();
 onNotify('success', 'IP whitelist saved');
 await loadStatus();
 } catch (e: any) {
 sounds.error();
 onNotify('error', e.message);
 } finally {
 setSaving(false);
 }
 }

 async function handleToggleEncryption(enabled: boolean) {
 sounds.click();
 setSaving(true);
 try {
 await api.toggleEncryption(enabled, token);
 sounds.success();
 onNotify('success', enabled ? 'Encryption enabled for new uploads' : 'Encryption disabled for new uploads');
 await loadStatus();
 } catch (e: any) {
 sounds.error();
 onNotify('error', e.message);
 } finally {
 setSaving(false);
 }
 }

 if (loading) {
 return (
 <div className="flex flex-col items-center justify-center py-20 gap-4">
 <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
 <p className="text-sm font-mono animate-pulse" style={{ color: colors.textMuted }}>LOADING SECURITY STATUS...</p>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 <div className="animate-fade-up">
 <h2 className="font-semibold flex items-center gap-2">
 <Shield className="w-4 h-4" style={{ color: colors.primary }} />
 <span className="text-gradient">Security & Time Controls</span>
 </h2>
 <p className="text-xs sm:text-sm mt-1 font-mono" style={{ color: colors.textDim }}>Encrypt files, set expiration times, manage access</p>
 </div>

 {/* Encryption Section */}
 <div className="card rounded-2xl p-5 sm:p-6 animate-fade-up delay-100">
 <div className="flex items-center gap-2 mb-4">
 <KeyRound className="w-4 h-4" style={{ color: colors.primary }} />
 <h3 className="font-semibold text-sm" style={{ color: colors.text }}>File Encryption</h3>
 </div>

 <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: `${colors.text}02`, border: `1px solid ${colors.text}08` }}>
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-3">
 {status?.encryption.enabled ? (
 <span className="flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded-full" style={{ background: `${colors.success}10`, color: colors.success, border: `1px solid ${colors.success}20` }}>
 <Check className="w-3 h-3" /> ENCRYPTED
 </span>
 ) : (
 <span className="flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded-full" style={{ background: `${colors.warning}10`, color: colors.warning, border: `1px solid ${colors.warning}20` }}>
 <AlertTriangle className="w-3 h-3" /> UNENCRYPTED
 </span>
 )}
 {status?.encryption.usingDefault && (
 <span className="text-[10px] font-mono" style={{ color: colors.textDim }}>using default key</span>
 )}
 </div>
 <p className="text-xs leading-relaxed" style={{ color: colors.textDim }}>
 Files are encrypted with AES-256-GCM before upload. Each file gets a unique IV.
 {status?.encryption.usingDefault && (
 <span className="block mt-1" style={{ color: colors.warning }}>
 ⚠️ Using default encryption key — set ENCRYPTION_KEY env var for production
 </span>
 )}
 </p>
 </div>
 <button
 onClick={() => handleToggleEncryption(!status?.encryption.enabled)}
 disabled={saving}
 className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold btn btn-primary disabled:opacity-60"
 style={{ background: colors.gradient, color: colors.bg }}
 >
 <Lock className="w-3.5 h-3.5" />
 {status?.encryption.enabled ? 'Disable' : 'Enable'} Encryption
 </button>
 </div>
 </div>

 {/* File TTL Section */}
 <div className="card rounded-2xl p-5 sm:p-6 animate-fade-up delay-200">
 <div className="flex items-center gap-2 mb-4">
 <Clock className="w-4 h-4" style={{ color: colors.primary }} />
 <h3 className="font-semibold text-sm" style={{ color: colors.text }}>File Time-to-Live (TTL)</h3>
 <Timer className="w-3.5 h-3.5 ml-auto" style={{ color: colors.textDim }} />
 </div>

 <div className="space-y-4">
 <div className="flex items-center gap-3">
 <label className="relative flex items-center cursor-pointer">
 <input
 type="checkbox"
 checked={fileTTLEnabled}
 onChange={(e) => setFileTTLEnabled(e.target.checked)}
 className="sr-only"
 />
 <div className="w-9 h-5 rounded-full transition-all duration-300" style={{ background: fileTTLEnabled ? colors.primary : `${colors.text}20` }}>
 <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-300" style={{ background: colors.bg, transform: fileTTLEnabled ? 'translateX(16px)' : 'translateX(0)' }}>
 {fileTTLEnabled && <Check className="w-2.5 h-2.5" style={{ color: colors.primary }} />}
 </span>
 </div>
 <span className="ml-3 text-xs font-medium" style={{ color: colors.text }}>Enable automatic file expiration</span>
 </label>
 </div>

 {fileTTLEnabled && (
 <div className="flex items-center gap-4 animate-fade-up">
 <div className="flex-1">
 <label className="block text-[10px] mb-1.5 font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Expiration period (days)</label>
 <div className="input-icon-wrap">
 <span className="input-icon"><Clock className="w-4 h-4" style={{ color: colors.textDim }} /></span>
 <input
 type="number"
 min={1}
 max={365}
 value={fileTTLDays}
 onChange={(e) => setFileTTLDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 30)))}
 className="input w-24"
 />
 </div>
 </div>
 <button
 onClick={handleFileTTLSave}
 disabled={saving || fileTTLDays < 1 || fileTTLDays > 365}
 className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm btn btn-primary disabled:opacity-60"
 style={{ background: colors.gradient, color: colors.bg }}
 >
 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
 Save TTL
 </button>
 </div>
 )}
 </div>

 {fileTTLEnabled && (
 <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: `${colors.primary}05`, border: `1px solid ${colors.primary}10` }}>
 <div className="flex items-center gap-2 mb-1">
 <Crown className="w-3.5 h-3.5" style={{ color: colors.primary }} />
 <span style={{ color: colors.primary, fontWeight: 600 }}>AUTO-DELETE SCHEDULE</span>
 </div>
 <p className="font-mono" style={{ color: colors.textDim }}>
 Files will be automatically deleted after {fileTTLDays} day{fileTTLDays !== 1 ? 's' : ''} from upload.
 {fileTTLDays <= 7 && <span style={{ color: colors.warning }}> Short TTL — files delete quickly</span>}
 {fileTTLDays >= 30 && <span style={{ color: colors.textDim }}> Standard retention period</span>}
 </p>
 </div>
 )}
 </div>

 {/* Session Timeout Section */}
 <div className="card rounded-2xl p-5 sm:p-6 animate-fade-up delay-300">
 <div className="flex items-center gap-2 mb-4">
 <Timer className="w-4 h-4" style={{ color: colors.primary }} />
 <h3 className="font-semibold text-sm" style={{ color: colors.text }}>Session Timeout</h3>
 </div>

 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="flex-1">
 <label className="block text-[10px] mb-1.5 font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Idle timeout (minutes)</label>
 <div className="flex gap-2">
 {[
 { value: 15, label: '15m' },
 { value: 30, label: '30m' },
 { value: 60, label: '1h' },
 { value: 120, label: '2h' },
 { value: 480, label: '8h' },
 ].map((opt) => (
 <button
 key={opt.value}
 onClick={() => setSessionTimeout(opt.value)}
 className="px-3 py-2 rounded-lg text-xs font-mono border transition-all"
 style={{
 background: sessionTimeout === opt.value ? `${colors.primary}15` : colors.cardBg,
 borderColor: sessionTimeout === opt.value ? `${colors.primary}40` : colors.border,
 color: sessionTimeout === opt.value ? colors.primary : colors.textDim,
 }}
 >
 {opt.label}
 </button>
 ))}
 </div>
 </div>
 <button
 onClick={handleSessionTimeoutSave}
 disabled={saving}
 className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm btn btn-primary disabled:opacity-60"
 style={{ background: colors.gradient, color: colors.bg }}
 >
 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
 Save
 </button>
 </div>

 <div className="p-3 rounded-lg text-xs" style={{ background: `${colors.text}02`, border: `1px solid ${colors.text}08` }}>
 <p className="font-mono" style={{ color: colors.textDim }}>
 Admin sessions will expire after {sessionTimeout} minutes of inactivity.
 Users will be redirected to login when session expires.
 </p>
 </div>
 </div>
 </div>

 {/* IP Whitelist Section */}
 <div className="card rounded-2xl p-5 sm:p-6 animate-fade-up delay-400">
 <div className="flex items-center gap-2 mb-4">
 <Globe className="w-4 h-4" style={{ color: colors.primary }} />
 <h3 className="font-semibold text-sm" style={{ color: colors.text }}>IP Access Control</h3>
 {ipWhitelist.length > 0 && (
 <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${colors.success}10`, color: colors.success, border: `1px solid ${colors.success}20` }}>
 {ipWhitelist.length} IP{ipWhitelist.length !== 1 ? 's' : ''} allowed
 </span>
 )}
 </div>

 <p className="text-xs mb-4 leading-relaxed" style={{ color: colors.textDim }}>
 Restrict admin access to specific IP addresses. When the whitelist is active, only listed IPs can access the admin panel.
 </p>

 <div className="flex gap-2 mb-4">
 <div className="flex-1 input-icon-wrap">
 <span className="input-icon"><Globe className="w-4 h-4" style={{ color: colors.textDim }} /></span>
 <input
 type="text"
 value={newIp}
 onChange={(e) => setNewIp(e.target.value)}
 onKeyDown={(e) => { if (e.key === 'Enter') handleAddIp(); }}
 placeholder="192.168.1.1 or 2001:db8::1"
 className="input"
 />
 </div>
 <button
 onClick={handleAddIp}
 className="px-4 py-2.5 rounded-xl border text-sm transition-all"
 style={{ borderColor: colors.border, color: colors.primary }}
 >
 Add
 </button>
 </div>

 {ipWhitelist.length > 0 ? (
 <div className="space-y-2">
 {ipWhitelist.map((ip, i) => (
 <div key={ip} className="flex items-center gap-3 p-3 rounded-xl animate-fade-up" style={{ background: `${colors.text}02`, border: `1px solid ${colors.text}08` }}>
 <Users className="w-4 h-4" style={{ color: colors.primary }} />
 <span className="flex-1 text-sm font-mono" style={{ color: colors.text }}>{ip}</span>
 <span className="text-[10px] font-mono" style={{ color: colors.textDim }}>#{i + 1}</span>
 <button
 onClick={() => handleRemoveIp(ip)}
 className="p-1.5 rounded-lg transition-all hover:bg-red-500/10"
 style={{ color: colors.danger }}
 >
 <EyeOff className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 ) : (
 <div className="p-4 rounded-xl text-center" style={{ background: `${colors.text}02`, border: `1px dashed ${colors.text}10` }}>
 <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" style={{ color: colors.textDim }} />
 <p className="text-xs font-mono" style={{ color: colors.textDim }}>No IP restrictions configured</p>
 <p className="text-[10px] mt-1" style={{ color: colors.textDim }}>Add IPs above to restrict admin access</p>
 </div>
 )}

 {ipWhitelist.length > 0 && (
 <div className="flex gap-3 mt-4 pt-4 border-t" style={{ borderColor: colors.text }}>
 <button
 onClick={handleIpListSave}
 disabled={saving}
 className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm btn btn-primary disabled:opacity-60"
 style={{ background: colors.gradient, color: colors.bg }}
 >
 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
 Save IP List
 </button>
 <button
 onClick={() => { setIpWhitelist([]); handleIpListSave(); }}
 className="px-4 py-2.5 rounded-xl border text-sm transition-all"
 style={{ borderColor: colors.danger + '40', color: colors.danger }}
 >
 Clear All
 </button>
 </div>
 )}
 </div>

 {/* Security Recommendations */}
 <div className="rounded-2xl p-5 animate-fade-up delay-500" style={{ background: `${colors.primary}05`, border: `1px solid ${colors.primary}15` }}>
 <div className="flex items-start gap-3">
 <Shield className="w-5 h-5 mt-0.5" style={{ color: colors.primary }} />
 <div>
 <h4 className="font-semibold text-sm mb-2" style={{ color: colors.text }}>Security Recommendations</h4>
 <ul className="space-y-2 text-xs font-mono" style={{ color: colors.textDim }}>
 <li className="flex items-start gap-2">
 <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
 {status?.encryption.usingDefault ? (
 <span style={{ color: colors.warning }}>Set a custom ENCRYPTION_KEY environment variable</span>
 ) : (
 <span style={{ color: colors.success }}>Custom encryption key configured</span>
 )}
 </li>
 <li className="flex items-start gap-2">
 <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
 {fileTTLEnabled ? (
 <span style={{ color: colors.success }}>File auto-expiration is active ({fileTTLDays} days)</span>
 ) : (
 <span style={{ color: colors.textDim }}>Consider enabling file TTL to auto-clean old files</span>
 )}
 </li>
 <li className="flex items-start gap-2">
 <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
 {ipWhitelist.length > 0 ? (
 <span style={{ color: colors.success }}>IP whitelist active ({ipWhitelist.length} addresses)</span>
 ) : (
 <span style={{ color: colors.textDim }}>Add trusted IPs to restrict admin panel access</span>
 )}
 </li>
 <li className="flex items-start gap-2">
 <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
 <span>Rate limiting active: 120 req/min, 8 login attempts/5min per IP</span>
 </li>
 <li className="flex items-start gap-2">
 <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: colors.success }} />
 <span>Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy</span>
 </li>
 </ul>
 </div>
 </div>
 </div>
 </div>
 );
}
