import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Upload, Clock, Download, FileText, CheckCircle2, AlertCircle, ArrowRight, Eye, Calendar, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, MaterialTypeBadge } from '../components/common/Badge';
import { PdfPreviewModal } from '../components/common/PdfPreviewModal';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMaterials: 0,
    myUploads: 0,
    pendingApproval: 0,
    totalDownloads: 0
  });
  const [myUploads, setMyUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'approved' | 'pending' | 'rejected'
  const [previewModal, setPreviewModal] = useState({ isOpen: false, url: '', title: '', fileName: '', materialId: null });

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const statsData = await api.getStats();
        setStats(statsData);

        if (user) {
          const uploadsData = await api.getMyUploads();
          setMyUploads(uploadsData || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  const handlePreview = async (item) => {
    try {
      const res = await api.getPreviewUrl(item.id);
      if (res.downloadUrl) {
        setPreviewModal({
          isOpen: true,
          url: res.downloadUrl,
          title: item.title,
          fileName: item.material_files?.file_name || 'Document.pdf',
          materialId: item.id
        });
      }
    } catch (err) {
      alert('Could not preview file.');
    }
  };

  const handleDownload = async (materialId, fileName) => {
    try {
      const res = await api.getDownloadUrl(materialId);
      if (res.downloadUrl) {
        const a = document.createElement('a');
        a.href = res.downloadUrl;
        a.download = fileName || 'study-material.pdf';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      alert('Download failed.');
    }
  };

  // Filter user uploads based on selected tab
  const filteredUploads = myUploads.filter(item => {
    if (filterTab === 'all') return true;
    return item.status === filterTab;
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {user ? `Hello, ${user.user_metadata?.full_name || user.email?.split('@')[0]}` : 'Student Dashboard'}
            </h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              Active Student
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Track your submissions, monitor peer downloads, and access study materials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow-2xs"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </Link>
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-sm transition-colors border border-gray-200 shadow-2xs"
          >
            <BookOpen className="w-4 h-4" />
            Explore Library
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Materials */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Repository Files</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">{loading ? '...' : stats.totalMaterials}</h3>
            <p className="text-xs text-gray-500 mt-1">Verified academic resources available</p>
          </div>
        </div>

        {/* My Uploads */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">My Uploads</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <Upload className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">{loading ? '...' : stats.myUploads}</h3>
            <p className="text-xs text-gray-500 mt-1">Documents you contributed</p>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Under Review</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">{loading ? '...' : stats.pendingApproval}</h3>
            <p className="text-xs text-gray-500 mt-1">Pending admin approval</p>
          </div>
        </div>

        {/* Total Platform Downloads */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Downloads</span>
            <div className="p-2 bg-gray-100 text-gray-600 rounded-lg border border-gray-200">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">{loading ? '...' : stats.totalDownloads}</h3>
            <p className="text-xs text-gray-500 mt-1">Peer downloads across platform</p>
          </div>
        </div>
      </div>

      {/* User's Uploads Activity */}
      <div className="bg-white rounded-xl border border-gray-200/90 overflow-hidden shadow-xs">
        {/* Table Header with Filter Tabs */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">My Uploaded Documents</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Real-time status and feedback for your uploaded study materials</p>
          </div>

          {/* Status Filter Tabs */}
          {user && myUploads.length > 0 && (
            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs sm:text-sm">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  filterTab === 'all' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({myUploads.length})
              </button>
              <button
                onClick={() => setFilterTab('approved')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  filterTab === 'approved' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Approved ({myUploads.filter(u => u.status === 'approved').length})
              </button>
              <button
                onClick={() => setFilterTab('pending')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  filterTab === 'pending' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending ({myUploads.filter(u => u.status === 'pending').length})
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Loading activity records...</p>
          </div>
        ) : !user ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Sign in to track your submissions</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Log in to view verification updates, review administrator comments, and monitor download statistics.
            </p>
            <Link
              to="/auth"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
            >
              Sign In to Account
            </Link>
          </div>
        ) : filteredUploads.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              {filterTab === 'all' ? 'No materials uploaded yet' : `No ${filterTab} materials found`}
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Help your classmates prepare for exams by uploading lecture notes, question banks, or lab manuals.
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
            >
              <Upload className="w-4 h-4" /> Upload Document
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Document Title</th>
                  <th className="px-5 py-3.5">Course / Subject</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Downloads</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUploads.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900 max-w-xs truncate">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200 text-xs mr-2">
                        {item.courses?.code || 'Course'}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {item.subjects?.name || `Sem ${item.semesters?.number || ''}`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <MaterialTypeBadge type={item.material_types?.name} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={item.status} reason={item.rejection_reason} />
                      {item.status === 'rejected' && item.rejection_reason && (
                        <div className="text-xs text-rose-600 mt-1 truncate max-w-xs" title={item.rejection_reason}>
                          Note: {item.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                      {item.download_count || 0}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handlePreview(item)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Preview PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {item.status === 'approved' && (
                          <button
                            onClick={() => handleDownload(item.id, item.material_files?.file_name)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* In-App Preview Modal */}
      <PdfPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, url: '', title: '', fileName: '', materialId: null })}
        url={previewModal.url}
        title={previewModal.title}
        fileName={previewModal.fileName}
        onDownload={() => handleDownload(previewModal.materialId, previewModal.fileName)}
      />
    </div>
  );
};

export default Dashboard;
