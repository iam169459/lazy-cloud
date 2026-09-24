import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Download, FileText, Calendar, HardDrive, FileType, ArrowLeft, Loader2, AlertCircle, Zap, Package, Eye, Maximize2, Coins, ShoppingBag } from 'lucide-react';
import { api, formatBytes, formatDate, FileInfo } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { useUserAuth } from '@/lib/userAuth';

export default function DownloadPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const { colors } = useTheme();
  const { token } = useUserAuth();
  const nav = useNavigate();
  const [file, setFile] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) return;
    api.getFileInfo(fileId, token || undefined)
      .then(setFile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [fileId, token]);

  async function handleDownload() {
    if (!fileId) return;
    setDownloading(true); sounds.download();
    try { const { url } = await api.getDownloadUrl(fileId, token || undefined); window.location.href = url; }
    catch (e: any) { sounds.error(); setError(e.message || 'Download failed'); }
    finally { setDownloading(false); }
  }

  async function handleBuy() {
    if (!fileId || buying) return;
    if (!token) { nav('/login'); return; }
    setBuying(true);
    setBuyError(null);
    try {
      await api.purchaseFile(token, fileId);
      sounds.success();
      setBought(true);
      const fresh = await api.getFileInfo(fileId, token);
      setFile(fresh);
    } catch (e: any) {
      sounds.error();
      setBuyError(e.message || 'Purchase failed');
    } finally {
      setBuying(false);
    }
  }

  const canPreview = (mimeType: string | null | undefined) => {
    const m = (mimeType || '').toLowerCase();
    if (!m) return false;
    return m.startsWith('image/') || m.startsWith('video/') || m.startsWith('audio/') || m === 'application/pdf'
      || m.startsWith('text/') || m === 'application/json' || m.includes('markdown') || m.includes('csv')
      || m.includes('xml') || m.includes('yaml') || m.includes('javascript') || m.includes('typescript');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg" style={{ color: colors.text }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
          <p className="text-xs font-mono" style={{ color: colors.textDim }}>LOCATING_FILE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 grid-bg" style={{ color: colors.text }}>
        <div className="flex flex-col items-center animate-scale-up">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ background: `${colors.danger}15`, color: colors.danger }}>
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold mb-2">File not found</h1>
          <p className="mb-6 text-center max-w-sm text-sm" style={{ color: colors.textMuted }}>{error}</p>
          <Link to="/" className="btn btn-secondary" onClick={() => sounds.click()}>
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!file) return null;

  const price = file.price_coins || 0;
  const needsPurchase = price > 0 && !file.purchased && !bought;

  return (
    <div className="min-h-screen grid-bg" style={{ color: colors.text }}>
      <div className="flex flex-col items-center justify-center min-h-screen px-5 py-10">
        <div className="w-full max-w-md">
          <div className="card p-6 sm:p-8 animate-scale-up">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: colors.primaryGlow, color: colors.primary }}>
                <FileText className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-lg font-bold text-center mb-1 break-all">{file.original_name}</h1>
            <p className="text-xs text-center mb-6 font-mono" style={{ color: colors.textDim }}>READY_TO_DOWNLOAD</p>
            <div className="space-y-2 mb-6">
              <Row icon={<HardDrive className="w-3.5 h-3.5" />} label="Size" value={formatBytes(file.file_size)} />
              <Row icon={<FileType className="w-3.5 h-3.5" />} label="Type" value={file.mime_type || 'Unknown'} />
              <Row icon={<Calendar className="w-3.5 h-3.5" />} label="Uploaded" value={formatDate(file.created_at)} />
              {price > 0 && (
                <Row icon={<Coins className="w-3.5 h-3.5" />} label="Price" value={needsPurchase ? `${price} coins` : 'Owned'} />
              )}
            </div>
            {needsPurchase ? (
              <div className="space-y-2">
                {token ? (
                  <button onClick={handleBuy} disabled={buying} className="btn btn-primary w-full">
                    {buying ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><ShoppingBag className="w-4 h-4" /> Buy for {price} coins</>}
                  </button>
                ) : (
                  <button onClick={() => nav('/login')} className="btn btn-primary w-full">
                    <ShoppingBag className="w-4 h-4" /> Sign in to buy
                  </button>
                )}
                <p className="text-xs text-center" style={{ color: colors.textDim }}>
                  No coins? <Link to="/coins" style={{ color: colors.primary }}>Earn them free →</Link>
                </p>
                {buyError && <p className="text-xs text-center" style={{ color: colors.danger }}>{buyError}</p>}
              </div>
            ) : (
              <button onClick={handleDownload} disabled={downloading} className="btn btn-primary w-full">
                {downloading ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing...</> : <><Download className="w-4 h-4" /> Download file</>}
              </button>
            )}
            {file && canPreview(file.mime_type) && (
              <Link
                to={`/preview/${file.id}`}
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
                onClick={() => sounds.click()}
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>
            )}
            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs" style={{ color: colors.textDim }}>
              <Package className="w-3 h-3" />
              Downloaded {file.download_count} time{file.download_count !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="text-center mt-6">
            <Link to="/" className="text-xs flex items-center justify-center gap-1.5" style={{ color: colors.textDim }} onClick={() => sounds.click()}>
              <Zap className="w-3 h-3" style={{ color: colors.primary }} /> LazyDrop
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
      <div className="flex items-center gap-2 text-xs" style={{ color: colors.textMuted }}>{icon}{label}</div>
      <span className="text-xs font-medium font-mono truncate max-w-[60%] text-right">{value}</span>
    </div>
  );
}
