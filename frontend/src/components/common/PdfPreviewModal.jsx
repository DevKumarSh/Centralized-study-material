import { useState, useEffect } from 'react';
import { X, Download, ExternalLink, FileText, Loader2, AlertCircle } from 'lucide-react';

/**
 * PdfPreviewModal Component
 * Provides an in-app viewer for studying / inspecting PDFs before downloading
 */
export const PdfPreviewModal = ({ isOpen, onClose, url, title, fileName, onDownload }) => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setLoadError(false);
    }
  }, [isOpen, url]);

  if (!isOpen || !url) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col w-full max-w-5xl h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between gap-4 bg-gray-50/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100 flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate" title={title}>
                {title || 'Document Preview'}
              </h3>
              <p className="text-[11px] text-gray-500 truncate">{fileName || 'PDF Document'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
              title="Open in new window"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">New Tab</span>
            </a>

            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-1"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Frame */}
        <div className="flex-1 bg-gray-100 relative overflow-hidden flex flex-col">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/90 text-gray-500 gap-2">
              <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
              <p className="text-xs font-medium text-gray-600">Loading document preview...</p>
            </div>
          )}

          {loadError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
              <div className="p-3 bg-red-50 text-red-600 rounded-full mb-3">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Preview could not be loaded</h4>
              <p className="text-xs text-gray-500 max-w-sm mb-4">
                Your browser may block embedded PDFs or the file format might not support inline viewing.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in New Tab
                </a>
                {onDownload && (
                  <button
                    type="button"
                    onClick={onDownload}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File
                  </button>
                )}
              </div>
            </div>
          ) : (
            <iframe
              src={url}
              title={title || 'PDF Preview'}
              className="w-full h-full border-0"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setLoadError(true);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
