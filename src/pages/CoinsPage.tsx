import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coins, Gift, Share2, ArrowLeft, Loader2, Check, Download, ShoppingBag, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useUserAuth } from '@/lib/userAuth';
import { api, CoinsInfo, PurchasedFile, formatDate, formatBytes } from '@/lib/api';
import { sounds } from '@/lib/sounds';

const reasonLabels: Record<string, string> = {
  signup_bonus: 'Signup bonus',
  daily_bonus: 'Daily bonus',
  link_visit: 'Link visit reward',
  purchase: 'Purchased file',
  sale: 'File sold',
};

export default function CoinsPage() {
  const { colors } = useTheme();
  const { token, user } = useUserAuth();
  const nav = useNavigate();
  const [coins, setCoins] = useState<CoinsInfo | null>(null);
  const [purchases, setPurchases] = useState<PurchasedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (!token) { nav('/login'); return; }
    load();
  }, [token]);

  function notify(type: 'success' | 'error', msg: string) {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 3000);
  }

  async function load() {
    if (!token) return;
    try {
      const [c, p] = await Promise.all([
        api.getCoins(token),
        api.getMyPurchases(token).catch(() => [] as PurchasedFile[]),
      ]);
      setCoins(c);
      setPurchases(p);
    } catch (e: any) {
      notify('error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim() {
    if (!token || claiming || !coins || coins.claimedToday) return;
    setClaiming(true);
    try {
      const res = await api.claimDailyBonus(token);
      sounds.success();
      notify('success', `+${res.earned} coins claimed!`);
      await load();
    } catch (e: any) {
      sounds.error();
      notify('error', e.message);
    } finally {
      setClaiming(false);
    }
  }

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
          <h1 className="text-sm font-bold" style={{ color: colors.text }}>Earn Coins</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: `${colors.primary}15`, border: `1px solid ${colors.primary}30` }}>
          <Coins className="w-4 h-4" style={{ color: colors.primary }} />
          <span className="text-sm font-bold font-mono" style={{ color: colors.primary }}>{coins?.coins ?? 0}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Balance hero */}
        <div className="glass-card p-6 text-center" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
            <Coins className="w-7 h-7" style={{ color: colors.primary }} />
          </div>
          <p className="text-4xl font-bold font-mono" style={{ color: colors.text }}>{coins?.coins ?? 0}</p>
          <p className="text-xs mt-1" style={{ color: colors.textDim }}>Your coin balance</p>
          <p className="text-xs mt-3" style={{ color: colors.textDim }}>
            Signed in as <span style={{ color: colors.primary }}>{user?.username}</span> — use coins to buy files
          </p>
        </div>

        {/* Ways to earn */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: colors.text }}>Ways to earn</h2>

          {/* Daily bonus */}
          <div className="glass-card p-4 flex items-center gap-4" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${colors.success}15` }}>
              <Gift className="w-5 h-5" style={{ color: colors.success }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: colors.text }}>Daily bonus</p>
              <p className="text-xs" style={{ color: colors.textDim }}>+{coins?.dailyBonus ?? 10} coins — come back every day</p>
            </div>
            {coins?.claimedToday ? (
              <span className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: `${colors.success}15`, color: colors.success }}>
                <Check className="w-3.5 h-3.5" /> Claimed
              </span>
            ) : (
              <button onClick={handleClaim} disabled={claiming} className="btn btn-primary text-xs px-4 py-2" style={{ background: colors.gradient, color: colors.bg }}>
                {claiming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Claim'}
              </button>
            )}
          </div>

          {/* Link visits */}
          <div className="glass-card p-4 flex items-center gap-4" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${colors.primary}15` }}>
              <Share2 className="w-5 h-5" style={{ color: colors.primary }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: colors.text }}>Link visits</p>
              <p className="text-xs" style={{ color: colors.textDim }}>+{coins?.visitReward ?? 2} coins per unique visitor to your share links (per day)</p>
            </div>
            <Link to="/dashboard" className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: colors.border, color: colors.textDim }} onClick={() => sounds.click()}>
              Share files
            </Link>
          </div>

          {/* Sell files */}
          <div className="glass-card p-4 flex items-center gap-4" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${colors.accent}15` }}>
              <ShoppingBag className="w-5 h-5" style={{ color: colors.accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: colors.text }}>Sell files</p>
              <p className="text-xs" style={{ color: colors.textDim }}>Set a coin price on your files — buyers pay you directly</p>
            </div>
            <Link to="/dashboard" className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: colors.border, color: colors.textDim }} onClick={() => sounds.click()}>
              My files
            </Link>
          </div>
        </div>

        {/* Purchased files */}
        {purchases.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold" style={{ color: colors.text }}>My purchases</h2>
            <div className="space-y-2">
              {purchases.map((p) => (
                <div key={p.file_id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                  <Download className="w-4 h-4 shrink-0" style={{ color: colors.success }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: colors.text }}>{p.original_name}</p>
                    <p className="text-xs font-mono" style={{ color: colors.textDim }}>{formatBytes(p.file_size)} · {p.price_paid} coins</p>
                  </div>
                  <a href={`/file/${p.file_id}`} className="p-2 rounded-lg" style={{ color: colors.textDim }} title="Open">
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: colors.text }}>Transaction history</h2>
            <button onClick={load} className="p-1.5 rounded-lg" style={{ color: colors.textDim }} title="Refresh">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          {!coins || coins.transactions.length === 0 ? (
            <div className="text-center py-10 glass-card" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
              <Coins className="w-10 h-10 mx-auto mb-2" style={{ color: `${colors.text}30` }} />
              <p className="text-sm" style={{ color: colors.textDim }}>No transactions yet</p>
              <p className="text-xs mt-1" style={{ color: `${colors.text}40` }}>Claim your daily bonus or share a file to start earning</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {coins.transactions.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: t.amount >= 0 ? `${colors.success}15` : `${colors.danger}15` }}>
                    {t.amount >= 0
                      ? <ArrowUpRight className="w-4 h-4" style={{ color: colors.success }} />
                      : <ArrowDownRight className="w-4 h-4" style={{ color: colors.danger }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: colors.text }}>{reasonLabels[t.reason] || t.reason}</p>
                    <p className="text-xs" style={{ color: colors.textDim }}>{formatDate(t.created_at)}</p>
                  </div>
                  <span className="text-sm font-bold font-mono" style={{ color: t.amount >= 0 ? colors.success : colors.danger }}>
                    {t.amount >= 0 ? '+' : ''}{t.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
