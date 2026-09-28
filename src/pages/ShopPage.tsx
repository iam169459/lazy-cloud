import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coins, ShoppingBag, ArrowLeft, Loader2, Check, Download, RefreshCw, ArrowUpRight, FileText, Gift, Search } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useUserAuth } from '@/lib/userAuth';
import { api, ShopItem, formatDate, formatBytes } from '@/lib/api';
import { sounds } from '@/lib/sounds';
import { errMsg } from '@/lib/errors';

export default function ShopPage() {
  const { colors } = useTheme();
  const { token, user } = useUserAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const notify = useCallback((type: 'success' | 'error', msg: string) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 3000);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [shop, balance] = await Promise.all([
        api.getShop(token),
        api.getCoins(token),
      ]);
      setItems(shop.items);
      setCoins(balance.coins);
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

  async function buy(item: ShopItem) {
    if (!token || buying || item.purchased) return;
    if (coins < item.priceCoins) {
      notify('error', 'Not enough coins — claim your daily bonus to earn more');
      return;
    }
    setBuying(item.id);
    try {
      await api.purchaseFile(token, item.id);
      sounds.success();
      notify('success', `Purchased "${item.name}" for ${item.priceCoins} coins`);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, purchased: true } : i)));
      const balance = await api.getCoins(token);
      setCoins(balance.coins);
    } catch (e) {
      sounds.error();
      notify('error', errMsg(e));
    } finally {
      setBuying(null);
    }
  }

  const filtered = query.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

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
          <button onClick={load} className="p-1.5 rounded-lg" style={{ color: colors.textDim }} title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <Link to="/coins" className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: `${colors.primary}15`, border: `1px solid ${colors.primary}30` }}>
            <Coins className="w-4 h-4" style={{ color: colors.primary }} />
            <span className="text-sm font-bold font-mono" style={{ color: colors.primary }}>{coins}</span>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Intro */}
        <div className="glass-card p-6" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${colors.accent}15` }}>
              <ShoppingBag className="w-6 h-6" style={{ color: colors.accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: colors.text }}>Buy files with coins</p>
              <p className="text-xs mt-1" style={{ color: colors.textDim }}>
                Files published by <span style={{ color: colors.primary }}>LazyDrop</span> — sign in as <span style={{ color: colors.primary }}>{user?.username}</span> with <span className="font-mono">{coins}</span> coins
              </p>
            </div>
            <Link to="/coins" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg shrink-0" style={{ border: `1px solid ${colors.border}`, color: colors.textDim }}>
              <Gift className="w-3.5 h-3.5" /> Earn
            </Link>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: colors.text }}>For sale</h2>
            <span className="text-xs font-mono" style={{ color: colors.textDim }}>{items.length} item(s)</span>
          </div>

          {items.length > 0 && (
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
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-12 glass-card" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <FileText className="w-10 h-10 mx-auto mb-2" style={{ color: `${colors.text}30` }} />
              <p className="text-sm" style={{ color: colors.textDim }}>{items.length === 0 ? 'Nothing for sale right now' : 'No files match your search'}</p>
              <p className="text-xs mt-1" style={{ color: `${colors.text}40` }}>{items.length === 0 ? 'New files are added by the admin — check back soon' : 'Try a different keyword'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => {
                const affordable = coins >= item.priceCoins;
                return (
                  <div key={item.id} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.purchased ? `${colors.success}15` : `${colors.primary}15` }}>
                      {item.purchased
                        ? <Check className="w-5 h-5" style={{ color: colors.success }} />
                        : <Download className="w-5 h-5" style={{ color: colors.primary }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: colors.text }}>{item.name}</p>
                      <p className="text-xs font-mono" style={{ color: colors.textDim }}>
                        {formatBytes(item.size)} · {formatDate(item.createdAt)}
                      </p>
                    </div>
                    {item.purchased ? (
                      <a href={`/file/${item.id}`} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium" style={{ background: `${colors.success}15`, color: colors.success }} onClick={() => sounds.click()}>
                        Open <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <button
                        onClick={() => buy(item)}
                        disabled={buying === item.id || !affordable}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium disabled:opacity-50"
                        style={{ background: affordable ? colors.gradient : `${colors.text}10`, color: affordable ? colors.bg : colors.textDim }}
                      >
                        {buying === item.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <><Coins className="w-3.5 h-3.5" /> {item.priceCoins}</>}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
