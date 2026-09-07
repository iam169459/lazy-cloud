import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, FileText, Calendar, HardDrive, FileType, ArrowLeft, Loader2, AlertCircle, Zap, Package } from 'lucide-react';
import { api, formatBytes, formatDate, FileInfo } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

export default function DownloadPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const { colors } = useTheme();
  const [file, setFile] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!fileId) return;
    api.getFileInfo(fileId).then(setFile).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [fileId]);

  async function handleDownload() {
    if (!fileId) return;
    setDownloading(true);
    sounds.download();
    try {
      const { url } = await api.getDownloadUrl(fileId);
      window.location.href = url;
    } catch (e: any) {
      sounds.error();
      setError(e.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg" style={{ color: colors.text }}>
        <div className="flex flex-col items-center gap-3 animate-fade-in-up">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: colors.primary }} />
          <p className="text-xs font-mono" style={{ color: colors.textMuted }}>LOCATING_FILE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 grid-bg" style={{ color: colors.text }}>
        <div className="flex flex-col items-center animate-scale-in">
          <div className="w-16 h-16 rounded-xl border flex items-center justify-center mb-4" style={{ background: `${colors.danger}10`, borderColor: `${colors.danger}20` }}>
            <AlertCircle className="w-8 h-8" style={{ color: colors.danger }} />
          </div>
          <h1 className="text-xl font-bold mb-2">File not found</h1>
          <p className="mb-6 text-center max-w-sm font-mono text-sm" style={{ color: colors.textMuted }}>{error}</p>
          <Link to="/" className="flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm" style={{ borderColor: colors.border, color: colors.text }} onClick={() => sounds.click()}>
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!file) return null;

  return (
    <div className="min-h-screen relative grid-bg" style={{ color: colors.text }}>
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-10">
        <div className="w-full max-w-md">
          <div className="card-sci rounded-2xl p-6 sm:p-8 animate-scale-in">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-xl border flex items-center justify-center" style={{ background: `${colors.primary}10`, borderColor: `${colors.primary}15` }}>
                <FileText className="w-8 h-8" style={{ color: colors.primary }} />
              </div>
            </div>

            <h1 className="text-lg font-bold text-center mb-1 break-all" style={{ color: colors.text }}>{file.original_name}</h1>
            <p className="text-xs text-center mb-6 font-mono" style={{ color: colors.textDim }}>READY_TO_DOWNLOAD</p>

            <div className="space-y-2 mb-6">
              <DetailRow icon={<HardDrive className="w-3.5 h-3.5" />} label="Size" value={formatBytes(file.file_size)} />
              <DetailRow icon={<FileType className="w-3.5 h-3.5" />} label="Type" value={file.mime_type || 'Unknown'} />
              <DetailRow icon={<Calendar className="w-3.5 h-3.5" />} label="Uploaded" value={formatDate(file.created_at)} />
            </div>

            <button onClick={handleDownload} disabled={downloading} className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm btn-sci disabled:opacity-60" style={{ background: colors.gradient, color: colors.bg }}>
              {downloading ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing...</> : <><Download className="w-4 h-4" /> Download file</>}
            </button>

            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs font-mono" style={{ color: colors.textDim }}>
              <Package className="w-3 h-3" />
              Downloaded {file.download_count} time{file.download_count !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="text-center mt-6 animate-fade-in-up delay-200">
            <Link to="/" className="text-xs flex items-center justify-center gap-1.5" style={{ color: colors.textDim }} onClick={() => sounds.click()}>
              <Zap className="w-3 h-3" style={{ color: colors.primary }} />
              LazyDrop
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg" style={{ background: `${colors.text}03`, border: `1px solid ${colors.text}05` }}>
      <div className="flex items-center gap-2 text-xs" style={{ color: colors.textMuted }}>
        {icon}
        {label}
      </div>
      <span className="text-xs font-medium font-mono truncate max-w-[60%] text-right" style={{ color: colors.text }}>{value}</span>
    </div>
  );
}
