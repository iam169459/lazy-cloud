import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Trash2, Copy, Check, Loader2 } from 'lucide-react';
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
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-emerald-400/50 bg-emerald-400/5'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-sm text-gray-400 mb-1.5">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 flex items-center justify-center">
              <Upload className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <p className="font-medium">Drop a file here or click to browse</p>
              <p className="text-sm text-gray-500 mt-1">Files are routed to the next available bucket</p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            Uploaded Files
          </h2>
          <span className="text-sm text-gray-500">{files.length} file{files.length !== 1 ? 's' : ''}</span>
        </div>

        {files.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No files yet. Upload one above to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Size</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Bucket</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Uploaded</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Downloads</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="text-sm font-medium truncate max-w-[200px]">{file.original_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400 whitespace-nowrap">{formatBytes(file.file_size)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-400 hidden md:table-cell">{file.provider_name || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-400 hidden md:table-cell whitespace-nowrap">{formatDate(file.created_at)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-400 hidden sm:table-cell">{file.download_count}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => copyLink(file.id)}
                          title="Copy link"
                          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedId === file.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteFile(file.id, file.original_name)}
                          title="Delete file"
                          disabled={deletingId === file.id}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
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
