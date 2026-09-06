import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Trash2, Copy, Check, Loader2, ArrowUpCircle, Link2, Terminal } from 'lucide-react';
import { api, formatBytes, formatDate, FileWithProvider } from '@/lib/api';

interface Props {
  files: FileWithProvider[];
  token: string;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'error', msg: string) => void;
}

export default function AdminDashboard({ files, token, onRefresh, onNotify }: Props) {
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
    try {
      await api.uploadFile(file, token, setProgress);
      onNotify('success', `${file.name} uploaded successfully`);
      onRefresh();
    } catch (e: any) {
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
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function deleteFile(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await api.deleteFile(id, token);
      onNotify('success', 'File deleted');
      onRefresh();
    } catch (e: any) {
      onNotify('error', e.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-500 corner-accent animate-fade-in-up ${
          dragOver
            ? 'border-emerald-400/50 bg-emerald-400/5 glow-emerald'
            : 'border-white/5 bg-white/[0.01] hover:border-emerald-400/20 hover:bg-emerald-400/[0.02]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-4 animate-scale-in">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400/20 animate-ping" />
            </div>
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-sm text-gray-400 mb-2 font-mono">
                <span className="text-emerald-400">UPLOADING</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.03] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 animate-fade-in-up">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400/10 to-cyan-500/10 border border-emerald-400/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7 text-emerald-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-pulse-glow" />
            </div>
            <div>
              <p className="font-medium text-gray-200">Drop a file here or click to browse</p>
              <p className="text-sm text-gray-500 mt-1 font-mono">Files are routed to the next available bucket</p>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      <div className="rounded-2xl card-sci overflow-hidden animate-fade-in-up delay-200">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-gradient-sci">Uploaded Files</span>
          </h2>
          <span className="text-xs text-gray-500 font-mono bg-white/[0.03] px-3 py-1 rounded-full border border-white/5">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </span>
        </div>

        {files.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-700" />
            <p className="text-gray-500">No files yet. Upload one above to get started.</p>
            <p className="text-xs text-gray-600 mt-1 font-mono">AWAITING_FIRST_UPLOAD</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] text-gray-500 border-b border-white/5 font-mono uppercase tracking-wider">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Size</th>
                  <th className="px-5 py-3 hidden md:table-cell">Bucket</th>
                  <th className="px-5 py-3 hidden md:table-cell">Uploaded</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Downloads</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, i) => (
                  <tr
                    key={file.id}
                    className="border-b border-white/[0.03] hover:bg-emerald-400/[0.02] transition-all duration-300 group animate-fade-in-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400/10 to-cyan-500/10 border border-emerald-400/10 flex items-center justify-center flex-shrink-0 group-hover:glow-emerald transition-all">
                          <FileText className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-sm font-medium truncate max-w-[200px]">{file.original_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400 whitespace-nowrap font-mono">{formatBytes(file.file_size)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-400 hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-xs font-mono">{file.provider_name || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400 hidden md:table-cell whitespace-nowrap">{formatDate(file.created_at)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-400 hidden sm:table-cell font-mono">{file.download_count}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => copyLink(file.id)}
                          title="Copy link"
                          className="p-2 rounded-lg hover:bg-emerald-400/10 text-gray-500 hover:text-emerald-400 transition-all duration-300"
                        >
                          {copiedId === file.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteFile(file.id, file.original_name)}
                          title="Delete file"
                          disabled={deletingId === file.id}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all duration-300 disabled:opacity-50"
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
