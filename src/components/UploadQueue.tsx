import { useState, useCallback, useRef } from 'react';
import { X, CheckCircle, Loader2, AlertCircle, FileText, Image, Video, Music, Archive } from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { sounds } from '@/lib/sounds';
import { formatBytes } from '@/lib/api';

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  result?: { id: string; name: string; size: number };
}

function FileIcon({ mimeType, className = 'w-5 h-5' }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith('image/')) return <Image className={className} style={{ color: 'var(--primary)' }} />;
  if (mimeType.startsWith('video/')) return <Video className={className} style={{ color: 'var(--accent)' }} />;
  if (mimeType.startsWith('audio/')) return <Music className={className} style={{ color: 'var(--warning)' }} />;
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gzip') || mimeType.includes('rar') || mimeType.includes('7z')) return <Archive className={className} style={{ color: 'var(--muted)' }} />;
  return <FileText className={className} style={{ color: 'var(--muted)' }} />;
}

interface UploadQueueProps {
  token: string;
  onComplete?: (files: UploadItem[]) => void;
  onClose?: () => void;
  encrypted?: boolean;
  maxConcurrent?: number;
}

export default function UploadQueue({ token, onComplete, onClose, encrypted = false, maxConcurrent = 3 }: UploadQueueProps) {
  const { colors } = useTheme();
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const processingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList) => {
    const newItems: UploadItem[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'pending' as const,
    }));
    setQueue((prev) => [...prev, ...newItems]);
    processQueue();
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    while (true) {
      const pendingItems = queue.filter((item) => item.status === 'pending');
      const currentActive = queue.filter((item) => item.status === 'uploading').length;

      if (pendingItems.length === 0 || currentActive >= maxConcurrent) break;

      const item = pendingItems[0];
      setQueue((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' as const } : i)));
      setActiveCount((c) => c + 1);

      try {
        let result: { id: string; name: string; size: number };
        if (encrypted) {
          result = await api.encryptFile(item.file, token, (p) => {
            setQueue((prev) => prev.map((i) => (i.id === item.id ? { ...i, progress: p } : i)));
          });
        } else {
          result = await api.uploadFile(item.file, token, (p) => {
            setQueue((prev) => prev.map((i) => (i.id === item.id ? { ...i, progress: p } : i)));
          });
        }
        setQueue((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'completed', progress: 100, result } : i)));
        sounds.store();
      } catch (e: any) {
        setQueue((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'error', error: e.message } : i)));
        sounds.error();
      } finally {
        setActiveCount((c) => c - 1);
      }
    }

    processingRef.current = false;
  }, [queue, token, encrypted, maxConcurrent]);

  const removeItem = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const retryItem = useCallback((id: string) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'pending', progress: 0, error: undefined } : item)));
    processQueue();
  }, [processQueue]);

  const clearCompleted = useCallback(() => {
    setQueue((prev) => prev.filter((item) => item.status !== 'completed'));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const completedFiles = queue.filter((item) => item.status === 'completed');
  const hasErrors = queue.some((item) => item.status === 'error');
  const isUploading = activeCount > 0;

  if (onComplete && completedFiles.length > 0 && queue.every((item) => item.status !== 'uploading' && item.status !== 'pending')) {
    onComplete(completedFiles);
  }

  return (
    <div className="glass-card">
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
            <Loader2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Upload Queue</h3>
            <p className="text-[10px] font-mono" style={{ color: colors.textDim }}>
              {queue.length} file(s) • {queue.filter(i => i.status === 'completed').length} done • {activeCount} active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button onClick={clearCompleted} className="text-xs px-2 py-1 rounded" style={{ color: colors.textMuted, background: 'transparent', border: '1px solid var(--border)' }}>
              Clear completed
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded" style={{ color: colors.textMuted }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`p-4 text-center cursor-pointer transition-colors ${queue.length === 0 ? 'border-2 border-dashed' : ''}`}
        style={{
          borderColor: queue.length === 0 ? 'var(--border)' : 'transparent',
          background: queue.length === 0 ? 'var(--input)' : 'transparent',
        }}
      >
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
        {queue.length === 0 ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6" style={{ color: 'var(--primary)' }} />
            <p className="text-sm font-medium">Drop files or click to upload</p>
            <p className="text-xs font-mono" style={{ color: colors.textDim }}>{encrypted ? 'Encrypted upload' : 'Auto-routed to next available bucket'}</p>
          </div>
        ) : (
          <div className="text-xs" style={{ color: colors.textDim }}>
            {isUploading ? `Uploading ${activeCount} file(s)...` : 'Drop more files or click to add'}
          </div>
        )}
      </div>

      {queue.length > 0 && (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {queue.map((item) => (
            <div key={item.id} className="px-4 py-3 flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
              <FileIcon mimeType={item.file.type} className="w-8 h-8 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium truncate max-w-[200px]">{item.file.name}</span>
                  <span className="text-[10px] font-mono" style={{ color: colors.textDim }}>{formatBytes(item.file.size)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.progress}%`,
                      background: item.status === 'error' ? 'linear-gradient(90deg, #ef4444, #f59e0b)' : 'linear-gradient(90deg, #22c55e, #3b82f6)',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-mono" style={{ color: colors.textDim }}>
                    {item.status === 'pending' ? 'Waiting...' : item.status === 'uploading' ? `${item.progress}%` : item.status === 'completed' ? 'Done' : 'Error'}
                  </span>
                  {item.status === 'error' && (
                    <span className="text-[10px]" style={{ color: '#ef4444' }}>{item.error}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {item.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--primary)' }} />}
                {item.status === 'completed' && <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />}
                {item.status === 'error' && <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />}
                {item.status === 'error' && (
                  <button onClick={() => retryItem(item.id)} className="p-1 rounded" style={{ color: colors.textMuted }} title="Retry">
                    <Loader2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {(item.status === 'completed' || item.status === 'error') && (
                  <button onClick={() => removeItem(item.id)} className="p-1 rounded" style={{ color: colors.textMuted }} title="Remove">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}