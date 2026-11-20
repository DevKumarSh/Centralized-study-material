import { X, Download, ExternalLink, FileText } from 'lucide-react';

/**
 * PdfPreviewModal Component
 * Provides an in-app viewer for studying / inspecting PDFs before downloading
 */
export const PdfPreviewModal = ({ isOpen, onClose, url, title, fileName, onDownload }) => {
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
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Open in new window"
            >
              <ExternalLink className="w-4 h-4" />
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
        <div className="flex-1 bg-gray-100 relative">
          <iframe
            src={`${url}#toolbar=1&navpanes=0`}
            title={title || 'PDF Preview'}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
