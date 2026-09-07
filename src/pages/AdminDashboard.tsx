import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Trash2, Check, Loader2, Link2 } from 'lucide-react';
import { api, formatBytes, formatDate, FileWithProvider } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (fileList: FileList) => {
    if (!fileList.length || uploading) return;
    const file = fileList[0];
    setUploading(true);
    setProgress(0);
    sounds.upload();
    try {
      await api.uploadFile(file, token, (p) => setProgress(p));
      sounds.store();
      onNotify('success', `${file.name} uploaded`);
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
    navigator.clipboard.writeText(`${window.location.origin}/file/${id}`);
    sounds.copy();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function deleteFile(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
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
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className="rounded-xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all"
        style={{ borderColor: dragOver ? colors.primary : colors.border, background: dragOver ? `${colors.primary}06` : colors.cardBg }}
      >
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: colors.primary }} />
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-xs mb-1 font-mono" style={{ color: colors.textMuted }}>
                <span style={{ color: colors.primary }}>UPLOADING</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${colors.text}08` }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: colors.gradient }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-7 h-7" style={{ color: colors.primary }} />
            <div>
              <p className="text-sm font-medium" style={{ color: colors.text }}>Drop a file or click to upload</p>
              <p className="text-xs mt-0.5 font-mono" style={{ color: colors.textDim }}>Auto-routed to next available bucket</p>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      <div className="rounded-xl card-sci overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: `${colors.text}08` }}>
          <h2 className="text-sm font-semibold" style={{ color: colors.text }}>Files ({files.length})</h2>
        </div>

        {files.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-10 h-10 mx-auto mb-2" style={{ color: `${colors.text}12` }} />
            <p className="text-sm" style={{ color: colors.textMuted }}>No files yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="text-left text-[10px] border-b font-mono uppercase" style={{ color: colors.textDim, borderColor: `${colors.text}06` }}>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Size</th>
                  <th className="px-4 py-2.5 hidden md:table-cell">Bucket</th>
                  <th className="px-4 py-2.5 hidden lg:table-cell">Date</th>
                  <th className="px-4 py-2.5 hidden sm:table-cell">Downloads</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className="border-b transition-colors" style={{ borderColor: `${colors.text}04` }}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.primary }} />
                        <span className="text-xs font-medium truncate max-w-[180px]">{file.original_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono whitespace-nowrap" style={{ color: colors.textMuted }}>{formatBytes(file.file_size)}</td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: `${colors.text}05` }}>{file.provider_name || '—'}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs hidden lg:table-cell whitespace-nowrap" style={{ color: colors.textMuted }}>{formatDate(file.created_at)}</td>
                    <td className="px-4 py-2.5 text-xs hidden sm:table-cell font-mono" style={{ color: colors.textMuted }}>{file.download_count}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => copyLink(file.id)} title="Copy link" className="p-1.5 rounded-md" style={{ color: copiedId === file.id ? colors.success : colors.textDim }}>
                          {copiedId === file.id ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => deleteFile(file.id, file.original_name)} title="Delete" disabled={deletingId === file.id} className="p-1.5 rounded-md disabled:opacity-50" style={{ color: colors.textDim }}>
                          {deletingId === file.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
