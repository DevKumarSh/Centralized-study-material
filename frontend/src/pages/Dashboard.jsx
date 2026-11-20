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
    <div className="space-y-8 animate-fadeIn">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-900/40 p-6 rounded-2xl border border-indigo-500/20 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {user ? `Welcome back, ${user.user_metadata?.full_name || user.email?.split('@')[0]}!` : 'Student Dashboard'}
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">
            Access, track, and manage all your academic study materials in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </Link>
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm transition-all border border-slate-700 hover:border-slate-600"
          >
            <BookOpen className="w-4 h-4" />
            Browse Library
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Materials */}
        <div className="bg-slate-900/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Materials</p>
              <h3 className="text-3xl font-bold text-white mt-1 group-hover:text-indigo-400 transition-colors">
                {loading ? '...' : stats.totalMaterials}
              </h3>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">Verified</span> study resources available
          </p>
        </div>

        {/* My Uploads */}
        <div className="bg-slate-900/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">My Uploads</p>
              <h3 className="text-3xl font-bold text-white mt-1 group-hover:text-emerald-400 transition-colors">
                {loading ? '...' : stats.myUploads}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Upload className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Documents contributed to the platform
          </p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-slate-900/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Under Review</p>
              <h3 className="text-3xl font-bold text-white mt-1 group-hover:text-amber-400 transition-colors">
                {loading ? '...' : stats.pendingApproval}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Pending admin verification
          </p>
        </div>

        {/* Total Platform Downloads */}
        <div className="bg-slate-900/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Downloads</p>
              <h3 className="text-3xl font-bold text-white mt-1 group-hover:text-cyan-400 transition-colors">
                {loading ? '...' : stats.totalDownloads}
              </h3>
            </div>
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Download className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Total document downloads tracked
          </p>
        </div>
      </div>

      {/* User's Recent Uploads Table */}
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Your Upload Activity</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time status of your submitted academic notes and files</p>
          </div>
          {myUploads.length > 0 && (
            <Link to="/upload" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
              Upload more <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Fetching your activity from database...</p>
          </div>
        ) : !user ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-800 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">Login to track your uploads</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Sign in to upload notes, check verification status, and view download metrics.
            </p>
            <Link
              to="/auth"
              className="inline-block mt-4 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
            >
              Sign In / Register
            </Link>
          </div>
        ) : myUploads.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">No materials uploaded yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Help your classmates by uploading lecture notes, question papers, or lab manuals!
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/30"
            >
              <Upload className="w-3.5 h-3.5" /> Upload First Note
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Document</th>
                  <th className="px-5 py-3.5">Course / Subject</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Downloads</th>
                  <th className="px-5 py-3.5">Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {myUploads.map((item) => {
                  const isApproved = item.status === 'approved';
                  const isPending = item.status === 'pending';
                  const isRejected = item.status === 'rejected';

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-medium text-white max-w-xs truncate">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 mr-2">
                          {item.courses?.code || 'Course'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {item.subjects?.name || `Sem ${item.semesters?.number || ''}`}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {item.material_types?.name || 'Notes'}
                      </td>
                      <td className="px-5 py-4">
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" /> Under Review
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20" title={item.rejection_reason}>
                            <AlertCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs font-mono">
                        {item.download_count || 0}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">
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
