import { useState, useEffect } from 'react';
import { Users, Loader2, UserPlus, Trash2, Shield, Search } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

interface Props {
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

interface UserEntry {
  id: string;
  username: string;
  role: 'admin' | 'user' | 'viewer';
  uploads: number;
  downloads: number;
  lastActive: string;
  createdAt: string;
}

const defaultUsers: UserEntry[] = [
  { id: '1', username: 'admin', role: 'admin', uploads: 0, downloads: 0, lastActive: new Date().toISOString(), createdAt: new Date().toISOString() },
];

export default function AdminUsers({ onNotify }: Props) {
  const { colors } = useTheme();
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user' | 'viewer'>('user');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  function loadUsers() {
    const saved = localStorage.getItem('lazydrop-users');
    if (saved) {
      try { setUsers(JSON.parse(saved)); } catch { setUsers(defaultUsers); }
    } else {
      setUsers(defaultUsers);
    }
    setLoading(false);
  }

  function saveUsers(u: UserEntry[]) {
    setUsers(u);
    localStorage.setItem('lazydrop-users', JSON.stringify(u));
  }

  function handleAddUser() {
    if (!newUsername.trim()) {
      sounds.error();
      onNotify('error', 'Username is required');
      return;
    }
    if (users.find(u => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      sounds.error();
      onNotify('error', 'Username already exists');
      return;
    }
    sounds.click();
    setSaving(true);
    setTimeout(() => {
      const newUser: UserEntry = {
        id: Date.now().toString(),
        username: newUsername.trim(),
        role: newRole,
        uploads: 0,
        downloads: 0,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      saveUsers([...users, newUser]);
      setNewUsername('');
      setNewRole('user');
      setShowAddForm(false);
      sounds.store();
      onNotify('success', `User "${newUser.username}" created`);
      setSaving(false);
    }, 300);
  }

  function handleDeleteUser(id: string, name: string) {
    if (name === 'admin') {
      sounds.error();
      onNotify('error', 'Cannot delete the admin user');
      return;
    }
    if (!confirm(`Delete user "${name}"?`)) return;
    sounds.click();
    saveUsers(users.filter(u => u.id !== id));
    sounds.delete();
    onNotify('success', 'User deleted');
  }

  function handleRoleChange(id: string, role: 'admin' | 'user' | 'viewer') {
    sounds.toggle();
    saveUsers(users.map(u => u.id === id ? { ...u, role } : u));
  }

  const filtered = users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()));

  const roleColors: Record<string, string> = {
    admin: colors.danger,
    user: colors.primary,
    viewer: colors.secondary,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in-up">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: colors.primary }} />
            <span className="text-gradient-sci">User Management</span>
          </h2>
          <p className="text-sm mt-1 font-mono" style={{ color: colors.textDim }}>{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textDim }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="form-input pl-9 text-xs w-full sm:w-48"
            />
          </div>
          <button
            onClick={() => { setShowAddForm(!showAddForm); sounds.click(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm btn-sci flex-shrink-0"
            style={{ background: colors.gradient, color: colors.bg }}
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add User</span>
          </button>
        </div>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="card-sci corner-accent rounded-2xl p-5 animate-slide-down">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: colors.text }}>
            <UserPlus className="w-4 h-4" style={{ color: colors.primary }} />
            New User
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] mb-1.5 font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Username</label>
              <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Enter username" className="form-input" autoFocus />
            </div>
            <div>
              <label className="block text-[10px] mb-1.5 font-mono uppercase tracking-wider" style={{ color: colors.textDim }}>Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} className="form-input">
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleAddUser} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm btn-sci disabled:opacity-60" style={{ background: colors.gradient, color: colors.bg }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Create
              </button>
              <button onClick={() => { setShowAddForm(false); sounds.click(); }} className="px-4 py-2.5 rounded-xl border text-sm" style={{ borderColor: colors.border, color: colors.textMuted }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Legend */}
      <div className="flex flex-wrap gap-3 text-xs" style={{ color: colors.textDim }}>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: colors.danger }} /> Admin — full access</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: colors.primary }} /> User — upload & manage own files</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: colors.secondary }} /> Viewer — download only</span>
      </div>

      {/* Users Table */}
      <div className="card-sci rounded-2xl overflow-hidden animate-fade-in-up delay-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] border-b font-mono uppercase tracking-wider" style={{ color: colors.textDim, borderColor: `${colors.text}08` }}>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3 hidden md:table-cell">Uploads</th>
                <th className="px-5 py-3 hidden md:table-cell">Downloads</th>
                <th className="px-5 py-3 hidden lg:table-cell">Last Active</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <tr
                  key={user.id}
                  className="border-b transition-all duration-300 animate-fade-in-up"
                  style={{ borderColor: `${colors.text}05`, animationDelay: `${i * 50}ms` }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = colors.cardHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0" style={{ background: `${roleColors[user.role]}10`, borderColor: `${roleColors[user.role]}20`, color: roleColors[user.role] }}>
                        <Shield className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                      className="text-xs px-2 py-1 rounded-lg border font-mono"
                      style={{ background: `${roleColors[user.role]}10`, borderColor: `${roleColors[user.role]}20`, color: roleColors[user.role] }}
                    >
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-mono hidden md:table-cell" style={{ color: colors.textMuted }}>{user.uploads}</td>
                  <td className="px-5 py-3.5 text-sm font-mono hidden md:table-cell" style={{ color: colors.textMuted }}>{user.downloads}</td>
                  <td className="px-5 py-3.5 text-xs font-mono hidden lg:table-cell" style={{ color: colors.textDim }}>{new Date(user.lastActive).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      disabled={user.username === 'admin'}
                      className="p-2 rounded-lg transition-all disabled:opacity-30"
                      style={{ color: colors.textDim }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${colors.danger}15`; (e.currentTarget as HTMLElement).style.color = colors.danger; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = colors.textDim; }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Users className="w-10 h-10 mx-auto mb-3" style={{ color: `${colors.text}15` }} />
                    <p style={{ color: colors.textDim }}>{searchQuery ? 'No users match your search' : 'No users yet'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
