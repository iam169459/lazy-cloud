import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, ShoppingBag, Loader2, Check, Download, FileText, ArrowUpRight, RefreshCw, Search } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useUserAuth } from '@/lib/userAuth';
import { api, CoinsInfo, ShopFile, formatBytes, formatDate } from '@/lib/api';
import { sounds } from '@/lib/sounds';
import { errMsg } from '@/lib/errors';

function fileIcon(mime: string) {
  if (mime.startsWith('image/')) return <FileText className="w-4 h-4" />;
  if (mime.startsWith('video/')) return <FileText className="w-4 h-4" />;
  if (mime.startsWith('audio/')) return <FileText className="w-4 h-4" />;
  return <Download className="w-4 h-4" />;
}

export default function ShopPage() {
  const { colors } = useTheme();
  const { token, user } = useUserAuth();
  const nav = useNavigate();
  const [files, setFiles] = useState<ShopFile[]>([]);
  const [coins, setCoins] = useState<CoinsInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [buying, setBuying] = useState<string | null>(null);
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const notify = useCallback((type: 'success' | 'error', msg: string) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 3000);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [shop, c] = await Promise.all([
        api.getShop(token),
        api.getCoins(token),
      ]);
      setFiles(shop.files);
      setCoins(c);
    } catch (e) {
      notify('error', errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [token, notify]);

  useEffect(() => {
    if (!token) { nav('/login'); return; }
    load();
  }, [token, nav, load]);

  async function handleBuy(f: ShopFile) {
    if (!token || buying || f.purchased || f.own) return;
    setBuying(f.id);
    try {
      const res = await api.purchaseFile(token, f.id);
      sounds.success();
      notify('success', res.free ? 'Added to your files' : `Purchased for ${f.price_coins} coins`);
      await load();
    } catch (e) {
      sounds.error();
      notify('error', errMsg(e));
    } finally {
      setBuying(null);
    }
  }

  const visible = query.trim()
    ? files.filter((f) => f.original_name.toLowerCase().includes(query.trim().toLowerCase()))
    : files;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: colors.bg }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.text }}>
      {notif && (
        <div className="fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-lg text-sm font-medium animate-slide-up" style={{ background: notif.type === 'success' ? `${colors.success}18` : `${colors.danger}18`, color: notif.type === 'success' ? colors.success : colors.danger, border: `1px solid ${notif.type === 'success' ? colors.success : colors.danger}33` }}>
          {notif.msg}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{ background: `${colors.bg}cc`, borderBottom: `1px solid ${colors.border}`, backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-1.5 rounded-lg" style={{ color: colors.textDim }} aria-label="Back to dashboard">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-sm font-bold" style={{ color: colors.text }}>Shop</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/coins" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: `${colors.accent}15`, border: `1px solid ${colors.accent}30`, color: colors.accent }} onClick={() => sounds.click()}>
            Earn coins
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: `${colors.primary}15`, border: `1px solid ${colors.primary}30` }}>
            <Coins className="w-4 h-4" style={{ color: colors.primary }} />
            <span className="text-sm font-bold font-mono" style={{ color: colors.primary }}>{coins?.coins ?? 0}</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="glass-card p-6 text-center" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${colors.accent}15` }}>
            <ShoppingBag className="w-7 h-7" style={{ color: colors.accent }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: colors.text }}>Buy files with coins</p>
          <p className="text-xs mt-1" style={{ color: colors.textDim }}>
            Signed in as <span style={{ color: colors.primary }}>{user?.username}</span> — you have <span style={{ color: colors.primary }}>{coins?.coins ?? 0}</span> coins
          </p>
          <p className="text-xs mt-3" style={{ color: `${colors.text}50` }}>
            Everything here is listed by the admin. Earning is limited to bonuses and link visits.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: colors.textDim }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files..."
            className="input w-full pl-9 text-xs"
            style={{ background: colors.inputBg, borderColor: colors.border, color: colors.text }}
          />
        </div>

        {/* File list */}
        {visible.length === 0 ? (
          <div className="text-center py-10 glass-card" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <ShoppingBag className="w-10 h-10 mx-auto mb-2" style={{ color: `${colors.text}30` }} />
            <p className="text-sm" style={{ color: colors.textDim }}>{query ? 'No files match your search' : 'Nothing for sale right now'}</p>
            <p className="text-xs mt-1" style={{ color: `${colors.text}40` }}>Check back soon, or earn coins while you wait</p>
            <Link to="/coins" className="btn btn-secondary text-xs mt-4 inline-flex" onClick={() => sounds.click()}>
              Earn coins
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((f) => {
              const affordable = (coins?.coins ?? 0) >= f.price_coins;
              return (
                <div key={f.id} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${colors.primary}15`, color: colors.primary }}>
                    {fileIcon(f.mime_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: colors.text }}>{f.original_name}</p>
                    <p className="text-xs font-mono" style={{ color: colors.textDim }}>
                      {formatBytes(f.file_size)}
                      {f.owner && <> · by {f.owner}</>}
                      {' · '}{f.download_count} downloads
                    </p>
                    <p className="text-[10px] font-mono" style={{ color: `${colors.text}40` }}>{formatDate(f.created_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="flex items-center gap-1 text-xs font-bold font-mono" style={{ color: affordable ? colors.primary : colors.danger }}>
                      <Coins className="w-3.5 h-3.5" />{f.price_coins}
                    </span>
                    {f.own ? (
                      <span className="text-[10px] px-2 py-1 rounded-lg" style={{ background: `${colors.text}10`, color: colors.textDim }}>Yours</span>
                    ) : f.purchased ? (
                      <a href={`/file/${f.id}`} className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg font-medium" style={{ background: `${colors.success}15`, color: colors.success }} onClick={() => sounds.click()}>
                        <Check className="w-3 h-3" /> Owned
                      </a>
                    ) : (
                      <button
                        onClick={() => handleBuy(f)}
                        disabled={buying === f.id || !affordable}
                        className="btn btn-primary text-[10px] px-3 py-1.5"
                        style={{ background: affordable ? colors.gradient : `${colors.text}15`, color: affordable ? colors.bg : colors.textDim, opacity: buying === f.id ? 0.7 : 1 }}
                        title={affordable ? 'Buy with coins' : 'Not enough coins'}
                      >
                        {buying === f.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Buy'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs" style={{ color: `${colors.text}40` }}>{visible.length} file(s) for sale</p>
          <button onClick={load} className="flex items-center gap-1.5 text-xs" style={{ color: colors.textDim }} title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="glass-card p-4 flex items-center gap-3" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${colors.primary}15` }}>
            <ArrowUpRight className="w-4 h-4" style={{ color: colors.primary }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: colors.text }}>Need more coins?</p>
            <p className="text-xs" style={{ color: colors.textDim }}>Claim the daily bonus and share links to earn</p>
          </div>
          <Link to="/coins" className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: colors.border, color: colors.textDim }} onClick={() => sounds.click()}>
            Earn
          </Link>
        </div>
      </div>
    </div>
  );
}
