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
    api.getFileInfo(fileId)
      .then(setFile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
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
        <div className="scanline-overlay" />
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="relative w-14 h-14">
            <Loader2 className="w-14 h-14 animate-spin" style={{ color: colors.primary }} />
            <div className="absolute inset-0 rounded-full border animate-ping" style={{ borderColor: `${colors.primary}20` }} />
          </div>
          <p className="text-sm font-mono animate-pulse-glow" style={{ color: colors.textMuted }}>LOCATING_FILE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 grid-bg" style={{ color: colors.text }}>
        <div className="scanline-overlay" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] rounded-full blur-[120px]" style={{ background: `${colors.danger}08` }} />
        </div>
        <div className="relative z-10 flex flex-col items-center animate-scale-in">
          <div className="w-20 h-20 rounded-2xl border flex items-center justify-center mb-6" style={{ background: `${colors.danger}10`, borderColor: `${colors.danger}20` }}>
            <AlertCircle className="w-10 h-10" style={{ color: colors.danger }} />
          </div>
          <h1 className="text-2xl font-bold mb-2">File not found</h1>
          <p className="mb-8 text-center max-w-md font-mono text-sm" style={{ color: colors.textMuted }}>{error}</p>
          <Link to="/" className="flex items-center gap-2 px-6 py-3 rounded-xl border transition-all text-sm ripple-effect" style={{ borderColor: colors.border, color: colors.text }} onClick={() => sounds.click()}>
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!file) return null;

  return (
    <div className="min-h-screen relative overflow-hidden grid-bg" style={{ color: colors.text }}>
      <div className="scanline-overlay" />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full blur-[150px] animate-float-slow" style={{ background: colors.orb1 }} />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full blur-[150px] animate-float-slow" style={{ background: colors.orb2, animationDelay: '2s' }} />
        <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full blur-[120px] animate-float" style={{ background: colors.orb3, animationDelay: '3s' }} />
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none opacity-[0.02]">
        <div className="w-full h-full rounded-full border animate-rotate-slow" style={{ borderColor: colors.primary }} />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="w-full max-w-lg">
          <div className="card-sci corner-accent rounded-3xl p-8 animate-scale-in">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent animate-hologram" />

            <div className="flex justify-center mb-6">
              <div className="relative w-20 h-20 rounded-2xl border flex items-center justify-center animate-float" style={{ background: `${colors.primary}10`, borderColor: `${colors.primary}20` }}>
                <FileText className="w-10 h-10" style={{ color: colors.primary }} />
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse-glow" style={{ background: colors.primary }} />
              </div>
            </div>

            <h1 className="text-xl font-bold text-center mb-1 break-all leading-snug animate-fade-in-up">{file.original_name}</h1>
            <p className="text-sm text-center mb-8 font-mono animate-fade-in-up delay-100" style={{ color: colors.textDim }}>READY_TO_DOWNLOAD</p>

            <div className="space-y-3 mb-8">
              <DetailRow icon={<HardDrive className="w-4 h-4" />} label="Size" value={formatBytes(file.file_size)} delay="200" />
              <DetailRow icon={<FileType className="w-4 h-4" />} label="Type" value={file.mime_type || 'Unknown'} delay="300" />
              <DetailRow icon={<Calendar className="w-4 h-4" />} label="Uploaded" value={formatDate(file.created_at)} delay="400" />
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-sm btn-sci disabled:opacity-60 animate-fade-in-up delay-500"
              style={{ background: colors.gradient, color: colors.bg }}
            >
              {downloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Preparing download...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download file
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 mt-5 text-xs font-mono" style={{ color: colors.textDim }}>
              <Package className="w-3 h-3" />
              Downloaded {file.download_count} time{file.download_count !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="text-center mt-8 animate-fade-in-up delay-600">
            <Link to="/" className="text-sm flex items-center justify-center gap-2 transition-colors" style={{ color: colors.textDim }} onClick={() => sounds.click()}>
              <Zap className="w-3 h-3" style={{ color: colors.primary }} />
              Powered by LazyDrop
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value, delay }: { icon: React.ReactNode; label: string; value: string; delay: string }) {
  const { colors } = useTheme();
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl border transition-all animate-fade-in-left" style={{ background: `${colors.text}02`, borderColor: `${colors.text}05`, animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2.5 text-sm" style={{ color: colors.textMuted }}>
        <div className="w-7 h-7 rounded-lg border flex items-center justify-center" style={{ background: `${colors.primary}08`, borderColor: `${colors.primary}12` }}>
          {icon}
        </div>
        {label}
      </div>
      <span className="text-sm font-medium max-w-[60%] text-right truncate font-mono" style={{ color: colors.text }}>{value}</span>
    </div>
  );
}
