import { useState, useEffect } from 'react';
import { Users, User, Shield, ShieldOff, Trash2, Save, Loader2, Search, HardDrive, Clock } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { api, formatBytes, formatDate } from '@/lib/api';
import { sounds } from '@/lib/sounds';

interface UserRecord {
  id: string; username: string; email: string; role: string;
  storage_used: number; storage_limit: number; is_active: boolean;
  created_at: string; last_login: string;
}

interface Props { token: string; onNotify: (type: 'success' | 'error', msg: string) => void; }

export default function AdminUsers({ token, onNotify }: Props) {
  const { colors } = useTheme();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editLimit, setEditLimit] = useState('');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try {
      const data = await api.adminListUsers(token);
      setUsers(data);
    } catch (e: any) { onNotify('error', e.message); }
    finally { setLoading(false); }
  }

  async function handleUpdate(userId: string) {
    try {
      await api.adminUpdateUser(token, { userId, role: editRole, storage_limit: Number(editLimit) });
      sounds.success();
      onNotify('success', 'User updated');
      setEditing(null);
      await loadUsers();
    } catch (e: any) { onNotify('error', e.message); }
  }

  async function handleToggleActive(userId: string, current: boolean) {
    try {
      await api.adminUpdateUser(token, { userId, is_active: !current });
      sounds.click();
      onNotify('success', current ? 'User disabled' : 'User enabled');
      await loadUsers();
    } catch (e: any) { onNotify('error', e.message); }
  }

  async function handleDelete(userId: string, username: string) {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await api.adminDeleteUser(token, userId);
      sounds.click();
      onNotify('success', `User "${username}" deleted`);
      await loadUsers();
    } catch (e: any) { onNotify('error', e.message); }
  }

  const filtered = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()) || (u.email && u.email.toLowerCase().includes(search.toLowerCase())));

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.primary }} /></div>;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: colors.text }}>
            <Users className="w-5 h-5" style={{ color: colors.primary }} /> User Management
          </h2>
          <p className="text-xs mt-1" style={{ color: colors.textDim }}>{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textDim }} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="input w-full pl-10 text-sm" style={{ background: colors.input, borderColor: colors.border, color: colors.text }} />
      </div>

      {/* User List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 glass-card" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: `${colors.text}20` }} />
            <p className="text-sm" style={{ color: colors.textDim }}>No users found</p>
          </div>
        ) : filtered.map((u) => (
          <div key={u.id} className="p-4 rounded-xl transition-all" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, opacity: u.is_active ? 1 : 0.5 }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: u.role === 'admin' ? `${colors.primary}15` : `${colors.text}08` }}>
                {u.role === 'admin' ? <Shield className="w-5 h-5" style={{ color: colors.primary }} /> : <User className="w-5 h-5" style={{ color: colors.textDim }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: colors.text }}>{u.username}</p>
                  {u.role === 'admin' && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: `${colors.primary}15`, color: colors.primary }}>ADMIN</span>}
                  {!u.is_active && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: `${colors.danger}15`, color: colors.danger }}>DISABLED</span>}
                </div>
                <p className="text-xs font-mono" style={{ color: colors.textDim }}>{u.email || 'No email'}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono" style={{ color: `${colors.text}50` }}>
                  <span><HardDrive className="w-3 h-3 inline" /> {formatBytes(u.storage_used)} / {formatBytes(u.storage_limit)}</span>
                  <span><Clock className="w-3 h-3 inline" /> Joined {formatDate(u.created_at)}</span>
                  {u.last_login && <span>Last login {formatDate(u.last_login)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => { setEditing(editing === u.id ? null : u.id); setEditRole(u.role); setEditLimit(String(u.storage_limit)); }} className="p-1.5 rounded-lg text-xs" style={{ color: colors.textDim }} title="Edit">
                  <Save className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleToggleActive(u.id, u.is_active)} className="p-1.5 rounded-lg text-xs" style={{ color: u.is_active ? colors.warning : colors.success }} title={u.is_active ? 'Disable' : 'Enable'}>
                  {u.is_active ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => handleDelete(u.id, u.username)} className="p-1.5 rounded-lg text-xs" style={{ color: colors.danger }} title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Edit Panel */}
            {editing === u.id && (
              <div className="mt-3 pt-3 flex flex-wrap items-end gap-3" style={{ borderTop: `1px solid ${colors.border}` }}>
                <div>
                  <label className="block text-[10px] font-mono mb-1" style={{ color: colors.textDim }}>Role</label>
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="input text-xs py-1.5" style={{ background: colors.input, borderColor: colors.border, color: colors.text }}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono mb-1" style={{ color: colors.textDim }}>Storage limit (bytes)</label>
                  <input type="number" value={editLimit} onChange={(e) => setEditLimit(e.target.value)} className="input text-xs w-36 py-1.5" style={{ background: colors.input, borderColor: colors.border, color: colors.text }} />
                </div>
                <button onClick={() => handleUpdate(u.id)} className="btn btn-primary text-xs py-1.5" style={{ background: colors.gradient, color: colors.bg }}>
                  Save
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
