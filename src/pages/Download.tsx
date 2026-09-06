import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, FileText, Calendar, HardDrive, FileType, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
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
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">File not found</h1>
        <p className="text-gray-400 mb-8 text-center max-w-md">{error}</p>
        <Link to="/" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    );
  }

  if (!file) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="w-full max-w-lg">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center">
                <FileText className="w-10 h-10 text-emerald-400" />
              </div>
            </div>

            <h1 className="text-xl font-bold text-center mb-1 break-all leading-snug">
              {file.original_name}
            </h1>
            <p className="text-sm text-gray-500 text-center mb-8">Ready to download</p>

            <div className="space-y-3 mb-8">
              <DetailRow icon={<HardDrive className="w-4 h-4" />} label="Size" value={formatBytes(file.file_size)} />
              <DetailRow icon={<FileType className="w-4 h-4" />} label="Type" value={file.mime_type || 'Unknown'} />
              <DetailRow icon={<Calendar className="w-4 h-4" />} label="Uploaded" value={formatDate(file.created_at)} />
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-[#0a0a0f] font-bold text-sm hover:shadow-[0_0_30px_rgba(52,211,153,0.3)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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

            <p className="text-xs text-gray-600 text-center mt-4">
              Downloaded {file.download_count} time{file.download_count !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="text-center mt-6">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Powered by LazyDrop
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-white/[0.02] border border-white/5">
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        {icon}
        {label}
      </div>
      <span className="text-sm font-medium text-gray-200 max-w-[60%] text-right truncate">
        {value}
      </span>
    </div>
  );
}
