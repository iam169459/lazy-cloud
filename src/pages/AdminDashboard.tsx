import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Trash2, Check, Loader2, Link2 } from 'lucide-react';
import { api, formatBytes, formatDate, FileWithProvider } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';

interface Props { files: FileWithProvider[]; token: string; onRefresh: () => void; onNotify: (type: 'success' | 'error', msg: string) => void; }

export default function AdminDashboard({ files, token, onRefresh, onNotify }: Props) {
  const { colors } = useTheme();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (fl: FileList) => {
    if (!fl.length || uploading) return;
    setUploading(true); setProgress(0); sounds.upload();
    try { await api.uploadFile(fl[0], token, (p) => setProgress(p)); sounds.store(); onNotify('success', `${fl[0].name} uploaded`); onRefresh(); }
    catch (e: any) { sounds.error(); onNotify('error', e.message || 'Failed'); }
    finally { setUploading(false); setProgress(0); if (ref.current) ref.current.value = ''; }
  }, [uploading, token, onNotify, onRefresh]);

  function handleDrop(e: React.DragEvent) { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }
  function copyLink(id: string) { navigator.clipboard.writeText(`${window.location.origin}/file/${id}`); sounds.copy(); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); }
  async function del(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return; sounds.click(); setDeletingId(id);
    try { await api.deleteFile(id, token); sounds.delete(); onNotify('success', 'Deleted'); onRefresh(); }
    catch (e: any) { sounds.error(); onNotify('error', e.message); } finally { setDeletingId(null); }
  }

  return (
    <div className="space-y-4">
      <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => !uploading && ref.current?.click()} className="card p-6 sm:p-8 text-center cursor-pointer transition-all" style={{ borderColor: dragOver ? '#6366f1' : undefined }}>
        <input ref={ref} type="file" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#818cf8' }} />
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-xs mb-1 font-mono" style={{ color: colors.textMuted }}><span style={{ color: '#818cf8' }}>UPLOADING</span><span>{progress}%</span></div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6" style={{ color: '#818cf8' }} />
            <p className="text-sm font-medium">Drop a file or click to upload</p>
            <p className="text-xs font-mono" style={{ color: colors.textDim }}>Auto-routed to next available bucket</p>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <h2 className="text-sm font-semibold">Files ({files.length})</h2>
        </div>
        {files.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-10 h-10 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.08)' }} />
            <p className="text-sm" style={{ color: colors.textMuted }}>No files yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px]">
              <thead>
                <tr className="text-left text-[10px] border-b font-mono uppercase" style={{ color: '#64748b', borderColor: 'rgba(255,255,255,0.04)' }}>
                  <th className="px-4 py-2">Name</th><th className="px-4 py-2">Size</th><th className="px-4 py-2 hidden md:table-cell">Bucket</th><th className="px-4 py-2 hidden lg:table-cell">Date</th><th className="px-4 py-2 hidden sm:table-cell">Downloads</th><th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.id} className="border-b transition-colors" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                    <td className="px-4 py-2.5"><div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#818cf8' }} /><span className="text-xs font-medium truncate max-w-[160px]">{f.original_name}</span></div></td>
                    <td className="px-4 py-2.5 text-xs font-mono whitespace-nowrap" style={{ color: '#94a3b8' }}>{formatBytes(f.file_size)}</td>
                    <td className="px-4 py-2.5 hidden md:table-cell"><span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>{f.provider_name || '—'}</span></td>
                    <td className="px-4 py-2.5 text-xs hidden lg:table-cell whitespace-nowrap" style={{ color: '#94a3b8' }}>{formatDate(f.created_at)}</td>
                    <td className="px-4 py-2.5 text-xs hidden sm:table-cell font-mono" style={{ color: '#94a3b8' }}>{f.download_count}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => copyLink(f.id)} className="p-1.5 rounded-md" style={{ color: copiedId === f.id ? '#22c55e' : '#64748b' }}>{copiedId === f.id ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}</button>
                        <button onClick={() => del(f.id, f.original_name)} disabled={deletingId === f.id} className="p-1.5 rounded-md disabled:opacity-50" style={{ color: '#64748b' }}>{deletingId === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}</button>
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
