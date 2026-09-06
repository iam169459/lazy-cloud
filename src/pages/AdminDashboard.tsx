import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Trash2, Check, Loader2, Link2, Terminal } from 'lucide-react';
import { api, formatBytes, formatDate, FileWithProvider } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import RocketAnimation from '@/components/RocketAnimation';

interface Props {
  files: FileWithProvider[];
  token: string;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

export default function AdminDashboard({ files, token, onRefresh, onNotify }: Props) {
  const { colors } = useTheme();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rocketActive, setRocketActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (fileList: FileList) => {
    if (!fileList.length || uploading) return;
    const file = fileList[0];
    setUploading(true);
    setProgress(0);
    sounds.upload();
    try {
      await api.uploadFile(file, token, (p) => {
        setProgress(p);
        if (p % 10 === 0) sounds.uploadProgress(p);
      });
      sounds.store();
      setRocketActive(true);
      onNotify('success', `${file.name} uploaded successfully`);
      onRefresh();
    } catch (e: any) {
      sounds.error();
      onNotify('error', e.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [uploading, token, onNotify, onRefresh]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function copyLink(id: string) {
    const url = `${window.location.origin}/file/${id}`;
    navigator.clipboard.writeText(url);
    sounds.copy();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function deleteFile(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    sounds.click();
    setDeletingId(id);
    try {
      await api.deleteFile(id, token);
      sounds.delete();
      onNotify('success', 'File deleted');
      onRefresh();
    } catch (e: any) {
      sounds.error();
      onNotify('error', e.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <RocketAnimation active={rocketActive} onComplete={() => setRocketActive(false)} />

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className="relative rounded-2xl border-2 border-dashed p-6 sm:p-10 text-center cursor-pointer transition-all duration-500 animate-fade-in-up"
        style={{
          borderColor: dragOver ? colors.primary : colors.border,
          background: dragOver ? `${colors.primary}08` : colors.cardBg,
        }}
      >
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3 sm:gap-4 animate-scale-in">
            <div className="relative">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin" style={{ color: colors.primary }} />
              <div className="absolute inset-0 rounded-full border-2 animate-ping" style={{ borderColor: `${colors.primary}30` }} />
            </div>
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-sm mb-2 font-mono" style={{ color: colors.textMuted }}>
                <span style={{ color: colors.primary }}>UPLOADING</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: `${colors.text}08` }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: colors.gradient }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 animate-fade-in-up">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center" style={{ background: `${colors.primary}10`, borderColor: `${colors.primary}15` }}>
              <Upload className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: colors.primary }} />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse-glow" style={{ background: colors.primary }} />
            </div>
            <div>
              <p className="text-sm sm:text-base font-medium" style={{ color: colors.text }}>Drop a file here or click to browse</p>
              <p className="text-xs sm:text-sm mt-1 font-mono" style={{ color: colors.textDim }}>Files are routed to the next available bucket</p>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      <div className="rounded-2xl card-sci overflow-hidden animate-fade-in-up delay-200">
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b flex items-center justify-between" style={{ borderColor: `${colors.text}08` }}>
          <h2 className="font-semibold flex items-center gap-2">
            <Terminal className="w-4 h-4" style={{ color: colors.primary }} />
            <span className="text-gradient-sci text-sm sm:text-base">Uploaded Files</span>
          </h2>
          <span className="text-[10px] sm:text-xs font-mono px-2 sm:px-3 py-0.5 sm:py-1 rounded-full" style={{ color: colors.textDim, background: `${colors.text}05`, border: `1px solid ${colors.text}08` }}>
            {files.length} file{files.length !== 1 ? 's' : ''}
          </span>
        </div>

        {files.length === 0 ? (
          <div className="py-16 sm:py-20 text-center px-4">
            <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4" style={{ color: `${colors.text}15` }} />
            <p className="text-sm" style={{ color: colors.textMuted }}>No files yet. Upload one above to get started.</p>
            <p className="text-xs mt-1 font-mono" style={{ color: colors.textDim }}>AWAITING_FIRST_UPLOAD</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="text-left text-[10px] border-b font-mono uppercase tracking-wider" style={{ color: colors.textDim, borderColor: `${colors.text}08` }}>
                  <th className="px-4 sm:px-5 py-3">Name</th>
                  <th className="px-4 sm:px-5 py-3">Size</th>
                  <th className="px-4 sm:px-5 py-3 hidden md:table-cell">Bucket</th>
                  <th className="px-4 sm:px-5 py-3 hidden lg:table-cell">Uploaded</th>
                  <th className="px-4 sm:px-5 py-3 hidden sm:table-cell">Downloads</th>
                  <th className="px-4 sm:px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, i) => (
                  <tr
                    key={file.id}
                    className="border-b transition-all duration-300 animate-fade-in-up"
                    style={{ borderColor: `${colors.text}05`, animationDelay: `${i * 50}ms` }}
                  >
                    <td className="px-4 sm:px-5 py-3 sm:py-3.5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center flex-shrink-0" style={{ background: `${colors.primary}08`, borderColor: `${colors.primary}15`, color: colors.primary }}>
                          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[200px]">{file.original_name}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm whitespace-nowrap font-mono" style={{ color: colors.textMuted }}>{formatBytes(file.file_size)}</td>
                    <td className="px-4 sm:px-5 py-3 sm:py-3.5 text-sm hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: `${colors.text}05`, border: `1px solid ${colors.text}08` }}>{file.provider_name || '—'}</span>
                    </td>
                    <td className="px-4 sm:px-5 py-3 sm:py-3.5 text-sm hidden lg:table-cell whitespace-nowrap" style={{ color: colors.textMuted }}>{formatDate(file.created_at)}</td>
                    <td className="px-4 sm:px-5 py-3 sm:py-3.5 text-sm hidden sm:table-cell font-mono" style={{ color: colors.textMuted }}>{file.download_count}</td>
                    <td className="px-4 sm:px-5 py-3 sm:py-3.5">
                      <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                        <button
                          onClick={() => copyLink(file.id)}
                          title="Copy link"
                          className="p-2 sm:p-2.5 rounded-lg transition-all duration-300"
                          style={{ color: copiedId === file.id ? colors.success : colors.textDim }}
                        >
                          {copiedId === file.id ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteFile(file.id, file.original_name)}
                          title="Delete file"
                          disabled={deletingId === file.id}
                          className="p-2 sm:p-2.5 rounded-lg transition-all duration-300 disabled:opacity-50"
                          style={{ color: colors.textDim }}
                        >
                          {deletingId === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
