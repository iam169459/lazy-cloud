import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, FileText, Calendar, HardDrive, FileType, ArrowLeft, Loader2, AlertCircle, Zap, Package } from 'lucide-react';
import { api, formatBytes, formatDate, FileInfo } from '@/lib/api';

export default function DownloadPage() {
  const { fileId } = useParams<{ fileId: string }>();
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
    try {
      const { url } = await api.getDownloadUrl(fileId);
      window.location.href = url;
    } catch (e: any) {
      setError(e.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060c] text-white flex items-center justify-center grid-bg">
        <div className="scanline-overlay" />
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="relative w-14 h-14">
            <Loader2 className="w-14 h-14 text-emerald-400 animate-spin" />
            <div className="absolute inset-0 rounded-full border border-emerald-400/20 animate-ping" />
          </div>
          <p className="text-sm text-gray-500 font-mono animate-pulse-glow">LOCATING_FILE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#06060c] text-white flex flex-col items-center justify-center px-6 grid-bg">
        <div className="scanline-overlay" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] rounded-full bg-red-500/5 blur-[120px]" />
        </div>
        <div className="relative z-10 flex flex-col items-center animate-scale-in">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">File not found</h1>
          <p className="text-gray-400 mb-8 text-center max-w-md font-mono text-sm">{error}</p>
          <Link to="/" className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:border-emerald-400/20 hover:bg-emerald-400/5 transition-all text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!file) return null;

  return (
    <div className="min-h-screen bg-[#06060c] text-white relative overflow-hidden grid-bg">
      <div className="scanline-overlay" />

      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-emerald-500/8 blur-[150px] animate-float-slow" />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full bg-cyan-500/8 blur-[150px] animate-float-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[120px] animate-float" style={{ animationDelay: '3s' }} />
      </div>

      {/* Rotating ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none opacity-[0.02]">
        <div className="w-full h-full rounded-full border border-emerald-400 animate-rotate-slow" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="w-full max-w-lg">
          <div className="card-sci corner-accent rounded-3xl p-8 animate-scale-in">
            {/* Holographic top line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent animate-hologram" />

            <div className="flex justify-center mb-6">
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400/10 to-cyan-500/10 border border-emerald-400/20 flex items-center justify-center animate-float">
                <FileText className="w-10 h-10 text-emerald-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-pulse-glow" />
              </div>
            </div>

            <h1 className="text-xl font-bold text-center mb-1 break-all leading-snug animate-fade-in-up">
              {file.original_name}
            </h1>
            <p className="text-sm text-gray-500 text-center mb-8 font-mono animate-fade-in-up delay-100">READY_TO_DOWNLOAD</p>

            <div className="space-y-3 mb-8">
              <DetailRow icon={<HardDrive className="w-4 h-4" />} label="Size" value={formatBytes(file.file_size)} delay="200" />
              <DetailRow icon={<FileType className="w-4 h-4" />} label="Type" value={file.mime_type || 'Unknown'} delay="300" />
              <DetailRow icon={<Calendar className="w-4 h-4" />} label="Uploaded" value={formatDate(file.created_at)} delay="400" />
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-[#06060c] font-bold text-sm btn-sci disabled:opacity-60 disabled:cursor-not-allowed animate-fade-in-up delay-500"
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

            <div className="flex items-center justify-center gap-2 mt-5 text-xs text-gray-600 font-mono">
              <Package className="w-3 h-3" />
              Downloaded {file.download_count} time{file.download_count !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="text-center mt-8 animate-fade-in-up delay-600">
            <Link to="/" className="text-sm text-gray-500 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2">
              <Zap className="w-3 h-3" />
              Powered by LazyDrop
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value, delay }: { icon: React.ReactNode; label: string; value: string; delay: string }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-400/10 transition-all animate-fade-in-left" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2.5 text-gray-400 text-sm">
        <div className="w-7 h-7 rounded-lg bg-emerald-400/5 border border-emerald-400/10 flex items-center justify-center">
          {icon}
        </div>
        {label}
      </div>
      <span className="text-sm font-medium text-gray-200 max-w-[60%] text-right truncate font-mono">
        {value}
      </span>
    </div>
  );
}
