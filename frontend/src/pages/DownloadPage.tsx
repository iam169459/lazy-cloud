import React, { useState, useEffect } from 'react';
import {
  Download,
  File,
  Calendar,
  X,
  AlertCircle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';

interface FileInfo {
  id: string;
  original_name: string;
  file_size_bytes: number;
  mime_type: string;
  created_at: string;
  download_url: string;
}

interface DownloadPageProps {
  token: string;
}

export function DownloadPage({ token }: DownloadPageProps) {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const response = await fetch(`/api/public/file/${token}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('File not found or link has expired');
          } else {
            setError('Failed to load file');
          }
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setFileInfo(data);
      } catch (err) {
        setError('Failed to load file');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFile();
  }, [token]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleDownload = () => {
    if (fileInfo?.download_url) {
      window.open(fileInfo.download_url, '_blank');
    }
  };

  const copyLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
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
          <div className="text-sm text-gray-400">Secure Download</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {isLoading ? (
            <div className="card text-center">
              <Loader2 className="w-12 h-12 text-blue-400 mx-auto animate-spin mb-4" />
              <p className="text-gray-400">Loading file...</p>
            </div>
          ) : error ? (
            <div className="card text-center border-red-500/30">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">File Not Found</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => (window.location.href = '/')}
                className="btn btn-primary"
              >
                Go to Homepage
              </button>
            </div>
          ) : fileInfo ? (
            <div className="card animate-fade-in">
              {/* File Icon */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 border border-gray-700/50">
                  <File className="w-12 h-12 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-center truncate max-w-full px-4">
                  {fileInfo.original_name}
                </h2>
              </div>

              {/* File Details */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-4 text-gray-400">
                  <File className="w-5 h-5 text-blue-400" />
                  <span>{formatFileSize(fileInfo.file_size_bytes)}</span>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span>{formatDate(fileInfo.created_at)}</span>
                </div>
              </div>

              {/* Download Button */}
              <div className="flex flex-col gap-3 mb-6">
                <button
                  onClick={handleDownload}
                  className="btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                >
                  <Download className="w-5 h-5" />
                  Download File
                </button>

                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={copyLink}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Link copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-blue-300">
                  This download link is private and secure. Only people with this
                  link can access the file.
                </p>
              </div>
            </div>
          ) : null}
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
