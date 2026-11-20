import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Upload, Clock, Download, FileText, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const statsData = await api.getStats();
        setStats(statsData);

        if (user) {
          const uploadsData = await api.getMyUploads();
          setMyUploads(uploadsData);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            {user ? `Welcome back, ${user.user_metadata?.full_name || user.email?.split('@')[0]}!` : 'Student Dashboard'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Access, track, and manage all your academic study materials in one place.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/upload"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </Link>
          <Link
            to="/browse"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-sm transition-colors border border-gray-300 shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            Browse Library
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Materials */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Materials</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : stats.totalMaterials}
              </h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
            <span className="text-emerald-600 font-medium">Verified</span> resources available
          </p>
        </div>

        {/* My Uploads */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">My Uploads</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : stats.myUploads}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <Upload className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Documents contributed
          </p>
        </div>

        {/* Under Review */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Under Review</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : stats.pendingApproval}
              </h3>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Pending admin verification
          </p>
        </div>

        {/* Total Platform Downloads */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Downloads</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : stats.totalDownloads}
              </h3>
            </div>
            <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg border border-gray-200">
              <Download className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Total document downloads
          </p>
        </div>
      </div>

      {/* User's Uploads Activity */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Your Upload Activity</h2>
            <p className="text-xs text-gray-500 mt-0.5">Real-time status of your submitted academic notes and files</p>
          </div>
          {myUploads.length > 0 && (
            <Link to="/upload" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Upload more <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">Fetching your activity...</p>
          </div>
        ) : !user ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Login to track your uploads</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Sign in to upload notes, check verification status, and view download metrics.
            </p>
            <Link
              to="/auth"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
            >
              Sign In / Register
            </Link>
          </div>
        ) : myUploads.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No materials uploaded yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Help your classmates by uploading lecture notes, question papers, or lab manuals!
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" /> Upload First Note
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3">Document</th>
                  <th className="px-5 py-3">Course / Subject</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Downloads</th>
                  <th className="px-5 py-3">Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myUploads.map((item) => {
                  const isApproved = item.status === 'approved';
                  const isPending = item.status === 'pending';
                  const isRejected = item.status === 'rejected';

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-900 max-w-xs truncate">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-800 mr-2 border border-gray-200">
                          {item.courses?.code || 'Course'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.subjects?.name || `Sem ${item.semesters?.number || ''}`}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">
                        {item.material_types?.name || 'Notes'}
                      </td>
                      <td className="px-5 py-3.5">
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Under Review
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200" title={item.rejection_reason}>
                            <AlertCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 text-xs font-mono">
                        {item.download_count || 0}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
