import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, CheckCircle2, XCircle, Clock, FileText, AlertTriangle, Users, BookOpen,
  Download, Search, Filter, Trash2, Plus, Eye, RefreshCw, Layers, Check, X, ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user, profile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'materials' | 'reports' | 'categories' | 'users'

  // Stats state
  const [stats, setStats] = useState({
    totalApproved: 0,
    totalPending: 0,
    totalRejected: 0,
    totalUsers: 0,
    pendingReports: 0,
    totalDownloads: 0
  });

  // Data states
  const [pendingMaterials, setPendingMaterials] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState({ courses: [], semesters: [], materialTypes: [], subjects: [] });

  // Filters / Search
  const [materialsFilterStatus, setMaterialsFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // UI / Action states
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, materialId: null, reason: '' });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Add Category Forms
  const [newCourse, setNewCourse] = useState({ name: '', code: '' });
  const [newSubject, setNewSubject] = useState({ name: '', code: '', course_id: '', semester_id: '' });
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, pendingData, catData] = await Promise.all([
        api.getAdminStats().catch(() => ({})),
        api.getAdminMaterials('pending').catch(() => []),
        api.getCategories().catch(() => ({ courses: [], semesters: [], materialTypes: [], subjects: [] }))
      ]);

      setStats(statsData || {});
      setPendingMaterials(pendingData || []);
      setCategories(catData || { courses: [], semesters: [], materialTypes: [], subjects: [] });

      if (activeTab === 'materials') {
        const matData = await api.getAdminMaterials(materialsFilterStatus, searchTerm).catch(() => []);
        setAllMaterials(matData || []);
      } else if (activeTab === 'reports') {
        const repData = await api.getAdminReports().catch(() => []);
        setReports(repData || []);
      } else if (activeTab === 'users') {
        const usrData = await api.getAdminUsers().catch(() => []);
        setUsers(usrData || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      showToast('Error loading administrative data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, materialsFilterStatus]);

  // Status Change Handlers
  const handleApprove = async (materialId) => {
    try {
      setActionLoadingId(materialId);
      await api.updateMaterialStatus(materialId, 'approved');
      showToast('Material approved and published to the public repository!');
      setPendingMaterials(prev => prev.filter(m => m.id !== materialId));
      setStats(prev => ({
        ...prev,
        totalPending: Math.max(0, (prev.totalPending || 1) - 1),
        totalApproved: (prev.totalApproved || 0) + 1
      }));
    } catch (err) {
      console.error('Approval failed:', err);
      showToast(err.message || 'Failed to approve material', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectionModal.materialId) return;
    try {
      setActionLoadingId(rejectionModal.materialId);
      await api.updateMaterialStatus(
        rejectionModal.materialId,
        'rejected',
        rejectionModal.reason || 'Does not meet academic quality guidelines'
      );
      showToast('Material has been marked as rejected.');
      setPendingMaterials(prev => prev.filter(m => m.id !== rejectionModal.materialId));
      setStats(prev => ({
        ...prev,
        totalPending: Math.max(0, (prev.totalPending || 1) - 1),
        totalRejected: (prev.totalRejected || 0) + 1
      }));
      setRejectionModal({ isOpen: false, materialId: null, reason: '' });
    } catch (err) {
      console.error('Rejection failed:', err);
      showToast(err.message || 'Failed to reject material', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to permanently delete this material and its file?')) return;
    try {
      setActionLoadingId(materialId);
      await api.deleteMaterial(materialId);
      showToast('Material permanently deleted.');
      setAllMaterials(prev => prev.filter(m => m.id !== materialId));
      setPendingMaterials(prev => prev.filter(m => m.id !== materialId));
    } catch (err) {
      showToast(err.message || 'Failed to delete material', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    try {
      setActionLoadingId(userId);
      await api.updateUserRole(userId, newRole);
      showToast(`User role updated to ${newRole}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      showToast(err.message || 'Failed to update user role', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.name || !newCourse.code) return;
    setCategorySubmitting(true);
    try {
      const created = await api.createCourse(newCourse);
      showToast(`Course "${created.code}" created successfully!`);
      setNewCourse({ name: '', code: '' });
      const catData = await api.getCategories();
      setCategories(catData);
    } catch (err) {
      showToast(err.message || 'Failed to create course', 'error');
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.name || !newSubject.code || !newSubject.course_id || !newSubject.semester_id) {
      showToast('Please fill all subject fields', 'error');
      return;
    }
    setCategorySubmitting(true);
    try {
      const created = await api.createSubject(newSubject);
      showToast(`Subject "${created.name}" created successfully!`);
      setNewSubject({ name: '', code: '', course_id: '', semester_id: '' });
      const catData = await api.getCategories();
      setCategories(catData);
    } catch (err) {
      showToast(err.message || 'Failed to create subject', 'error');
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleDownload = async (materialId, fileName) => {
    try {
      const res = await api.getDownloadUrl(materialId);
      if (res.downloadUrl) {
        window.open(res.downloadUrl, '_blank');
      }
    } catch (err) {
      showToast('Failed to retrieve file preview link', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {notification.show && (
        <div
          className={`fixed top-20 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 border text-sm transition-all animate-bounce ${
            notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {notification.type === 'error' ? <AlertTriangle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">Administrator Portal</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                SYSTEM MODERATOR
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Review document uploads, manage academic categories, and ensure platform quality.
            </p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <p className="text-[11px] font-semibold uppercase text-amber-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending
          </p>
          <h3 className="text-2xl font-bold text-white mt-1">{stats.totalPending || 0}</h3>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <p className="text-[11px] font-semibold uppercase text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </p>
          <h3 className="text-2xl font-bold text-white mt-1">{stats.totalApproved || 0}</h3>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <p className="text-[11px] font-semibold uppercase text-rose-400 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </p>
          <h3 className="text-2xl font-bold text-white mt-1">{stats.totalRejected || 0}</h3>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <p className="text-[11px] font-semibold uppercase text-indigo-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Students
          </p>
          <h3 className="text-2xl font-bold text-white mt-1">{stats.totalUsers || 0}</h3>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <p className="text-[11px] font-semibold uppercase text-cyan-400 flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> Downloads
          </p>
          <h3 className="text-2xl font-bold text-white mt-1">{stats.totalDownloads || 0}</h3>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <p className="text-[11px] font-semibold uppercase text-orange-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Reports
          </p>
          <h3 className="text-2xl font-bold text-white mt-1">{stats.pendingReports || 0}</h3>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'pending'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          Verification Queue ({pendingMaterials.length})
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'materials'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          All Documents
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'categories'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Courses & Subjects
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          User Roles
        </button>
      </div>

      {/* TAB 1: PENDING VERIFICATION QUEUE */}
      {activeTab === 'pending' && (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Pending Moderation Queue</h2>
              <p className="text-xs text-slate-400">Review submitted academic notes before publishing to students</p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading pending submissions...
            </div>
          ) : pendingMaterials.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
              <h3 className="text-sm font-semibold text-white">Queue is clear!</h3>
              <p className="text-xs mt-1">All uploaded materials have been verified and processed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] uppercase font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Document</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Uploader</th>
                    <th className="px-5 py-3.5">File Details</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pendingMaterials.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-bold text-white text-sm truncate">{item.title}</div>
                        {item.description && <div className="text-slate-400 text-xs truncate mt-0.5">{item.description}</div>}
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-indigo-300 font-mono">
                          {item.material_types?.name || 'Notes'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-200">{item.courses?.code || 'MCA'} · {item.semesters?.label || 'Sem 1'}</div>
                        <div className="text-slate-400">{item.subjects?.name || 'Subject'}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        <div className="text-slate-200 font-medium">{item.profiles?.full_name || 'Student'}</div>
                        <div className="text-[11px]">{item.profiles?.email}</div>
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-slate-400">
                        <div>{(item.material_files?.file_size ? (item.material_files.file_size / (1024 * 1024)).toFixed(2) : '1.2')} MB (PDF)</div>
                        <button
                          onClick={() => handleDownload(item.id, item.material_files?.file_name)}
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1 font-sans font-medium"
                        >
                          <Eye className="w-3 h-3" /> Preview Document
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={actionLoadingId === item.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => setRejectionModal({ isOpen: true, materialId: item.id, reason: '' })}
                            disabled={actionLoadingId === item.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
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
      )}

      {/* TAB 2: ALL MATERIALS MANAGEMENT */}
      {activeTab === 'materials' && (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden shadow-xl space-y-4 p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search repository..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={materialsFilterStatus}
                onChange={(e) => setMaterialsFilterStatus(e.target.value)}
                className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Document Title</th>
                  <th className="px-4 py-3">Course / Subject</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Downloads</th>
                  <th className="px-4 py-3 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allMaterials.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium text-white max-w-xs truncate">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {item.courses?.code} • {item.subjects?.name || 'General'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : item.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{item.download_count || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteMaterial(item.id)}
                        disabled={actionLoadingId === item.id}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES & CURRICULUM MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Course Form */}
          <div className="bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Add Academic Course / Program
            </h3>
            <form onSubmit={handleCreateCourse} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Course Full Name</label>
                <input
                  type="text"
                  required
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  placeholder="e.g. Master of Science in Data Science"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Course Code / Short Name</label>
                <input
                  type="text"
                  required
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  placeholder="e.g. MSc-DS"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={categorySubmitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition-all disabled:opacity-50"
              >
                Create Course
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800">
              <p className="text-[11px] font-semibold uppercase text-slate-400 mb-2">Active Courses</p>
              <div className="flex flex-wrap gap-2">
                {categories.courses.map(c => (
                  <span key={c.id} className="px-2.5 py-1 rounded-lg text-xs bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                    {c.code} ({c.name})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Create Subject Form */}
          <div className="bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Add Subject to Curriculum
            </h3>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Course</label>
                  <select
                    required
                    value={newSubject.course_id}
                    onChange={(e) => setNewSubject({ ...newSubject, course_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="">Select Course</option>
                    {categories.courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Semester</label>
                  <select
                    required
                    value={newSubject.semester_id}
                    onChange={(e) => setNewSubject({ ...newSubject, semester_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="">Select Semester</option>
                    {categories.semesters.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="e.g. Distributed Operating Systems"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                  placeholder="e.g. MCA401"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={categorySubmitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition-all disabled:opacity-50"
              >
                Add Subject
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: USER ROLES MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800">
            <h2 className="text-base font-bold text-white">Registered Users & Role Management</h2>
            <p className="text-xs text-slate-400">Promote student accounts to administrators or vice versa</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Current Role</th>
                  <th className="px-5 py-3.5 text-right">Role Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="px-5 py-4 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs">
                        {u.full_name?.[0] || u.email?.[0]?.toUpperCase()}
                      </div>
                      <span>{u.full_name || 'Student'}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{u.email}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                      }`}>
                        {u.role ? u.role.toUpperCase() : 'STUDENT'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleRoleToggle(u.id, u.role)}
                        disabled={actionLoadingId === u.id || u.id === user?.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
                          u.role === 'admin'
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        {u.role === 'admin' ? 'Demote to Student' : 'Promote to Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" /> Specify Rejection Reason
            </h3>
            <p className="text-xs text-slate-400">
              Provide feedback for the student regarding why this study material was not approved.
            </p>
            <div className="space-y-2">
              <textarea
                rows="3"
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                placeholder="e.g. Unclear or blurry scan; Missing required syllabus units..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              />
              <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-400">
                <span className="text-slate-500">Quick presets:</span>
                <button
                  type="button"
                  onClick={() => setRejectionModal({ ...rejectionModal, reason: 'Low quality / unreadable scan' })}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[10px]"
                >
                  Low scan quality
                </button>
                <button
                  type="button"
                  onClick={() => setRejectionModal({ ...rejectionModal, reason: 'Incorrect subject or semester tagged' })}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[10px]"
                >
                  Wrong subject
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModal({ isOpen: false, materialId: null, reason: '' })}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
