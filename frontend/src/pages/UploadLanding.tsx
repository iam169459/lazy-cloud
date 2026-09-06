import React, { useState, useCallback, useRef } from 'react';
import { Upload, File, X, CheckCircle, Loader2, Link, Copy, Check } from 'lucide-react';

interface UploadState {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  downloadToken: string | null;
  error: string | null;
}

export function UploadLanding() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadState[]>([]);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const generateId = () => {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const addFiles = useCallback(async (fileList: FileList) => {
    const newFiles: UploadState[] = [];

    for (const file of Array.from(fileList)) {
      const uploadId = generateId();
      newFiles.push({
        id: uploadId,
        file,
        progress: 0,
        status: 'pending',
        downloadToken: null,
        error: null,
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);

    // Start uploads for each file
    for (const upload of newFiles) {
      await startUpload(upload.id, upload.file);
    }
  }, []);

  const startUpload = async (uploadId: string, file: File) => {
    const stateIndex = files.findIndex((f) => f.id === uploadId);
    if (stateIndex === -1) return;

    // Update state to uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadId ? { ...f, status: 'uploading', progress: 0 } : f
      )
    );

    try {
      // Get presigned upload URL from server
      const initResponse = await fetch('/api/admin/upload/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
        }),
      });

      if (!initResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, downloadToken } = await initResponse.json();

      // Upload file directly to presigned URL
      const xhr = new XMLHttpRequest();

      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadId ? { ...f, progress } : f
              )
            );
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadId
                  ? {
                      ...f,
                      status: 'complete',
                      progress: 100,
                      downloadToken,
                    }
                  : f
              )
            );
            resolve();
          } else {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadId
                  ? { ...f, status: 'error', error: 'Upload failed' }
                  : f
              )
            );
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadId
                ? { ...f, status: 'error', error: 'Upload failed' }
                : f
            )
          );
          reject(new Error('Upload failed'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadId
            ? { ...f, status: 'error', error: 'Upload failed' }
            : f
        )
      );
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
    },
    [addFiles]
  );

  const removeFile = (uploadId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== uploadId));
  };

  const copyLink = (downloadToken: string) => {
    const link = `${window.location.origin}/d/${downloadToken}`;
    navigator.clipboard.writeText(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold gradient-text">LazyDrop</h1>
          </div>
          <div className="text-sm text-gray-400">
            Secure • Private • Fast
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Dropzone */}
        <div
          ref={dropzoneRef}
          className={`dropzone w-full max-w-2xl rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragging ? 'dragover scale-105' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Upload className="w-10 h-10 text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-semibold mb-2">
                Drop files here to upload
              </p>
              <p className="text-gray-400 text-sm">
                or click to browse • Maximum file size: 5 GB
              </p>
            </div>
            <input
              id="file-input"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        </div>

        {/* Upload Progress */}
        {files.length > 0 && (
          <div className="w-full max-w-2xl mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Uploads</h2>
              <span className="text-sm text-gray-400">
                {files.filter((f) => f.status === 'complete').length} of{' '}
                {files.length} complete
              </span>
            </div>

            <div className="space-y-3">
              {files.map((upload) => (
                <div
                  key={upload.id}
                  className="card flex items-center gap-4 animate-fade-in"
                >
                  {/* File Icon */}
                  <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
                    {upload.status === 'complete' ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : upload.status === 'error' ? (
                      <X className="w-6 h-6 text-red-500" />
                    ) : (
                      <File className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{upload.file.name}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span>{formatFileSize(upload.file.size)}</span>
                      {upload.status === 'uploading' && (
                        <span>•</span>
                      )}
                      {upload.status === 'uploading' && (
                        <span>{upload.progress}%</span>
                      )}
                      {upload.status === 'complete' && upload.downloadToken && (
                        <span className="text-green-400">
                          Complete •{' '}
                          <a
                            href={`/d/${upload.downloadToken}`}
                            className="hover:text-blue-400"
                          >
                            View
                          </a>
                        </span>
                      )}
                      {upload.status === 'error' && (
                        <span className="text-red-400">{upload.error}</span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {upload.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="progress-bar">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {upload.status === 'complete' &&
                      upload.downloadToken && (
                        <button
                          onClick={() => copyLink(upload.downloadToken)}
                          className="btn btn-secondary p-2"
                          title="Copy link"
                        >
                          <Link className="w-5 h-5" />
                        </button>
                      )}
                    {(upload.status === 'complete' ||
                      upload.status === 'error') &&
                      upload.id &&
                      upload.file.size < 100 * 1024 * 1024 &&
                      removeFile(upload.id)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Encrypted Storage</h3>
              <p className="text-sm text-gray-400">
                Files stored securely with Backblaze B2
              </p>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Instant Links</h3>
              <p className="text-sm text-gray-400">
                Get shareable links immediately after upload
              </p>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Strictly Private</h3>
              <p className="text-sm text-gray-400">
                No public directory • Link-only access
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>LazyDrop — Secure File Sharing</p>
        </div>
      </footer>
    </div>
  );
}
