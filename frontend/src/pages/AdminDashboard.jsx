import { useState, useEffect } from 'react';
import {
  Shield, CheckCircle2, XCircle, Clock, Users,
  Download, Search, Trash2, Plus, Eye, RefreshCw, Layers, Check, X, ShieldAlert, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, MaterialTypeBadge, RoleBadge } from '../components/common/Badge';
import { PdfPreviewModal } from '../components/common/PdfPreviewModal';
import { ConfirmModal } from '../components/common/ConfirmModal';

const AdminDashboard = () => {
  const { user, profile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'materials' | 'categories' | 'users'

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
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState({ courses: [], semesters: [], materialTypes: [], subjects: [] });

  // Filters / Search
  const [materialsFilterStatus, setMaterialsFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // UI / Action states
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, materialId: null, reason: '' });
  const [confirmDeleteModal, setConfirmDeleteModal] = useState({ isOpen: false, materialId: null, title: '' });
  const [previewModal, setPreviewModal] = useState({ isOpen: false, url: '', title: '', fileName: '', materialId: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Add Category Forms
  const [newCourse, setNewCourse] = useState({ name: '', code: '' });
  const [newSubject, setNewSubject] = useState({ name: '', code: '', course_id: '', semester_id: '' });
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
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

  const triggerDelete = (item) => {
    setConfirmDeleteModal({
      isOpen: true,
      materialId: item.id,
      title: item.title
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteModal.materialId) return;
    try {
      setActionLoadingId(confirmDeleteModal.materialId);
      await api.deleteMaterial(confirmDeleteModal.materialId);
      showToast('Material permanently deleted.');
      setAllMaterials(prev => prev.filter(m => m.id !== confirmDeleteModal.materialId));
      setPendingMaterials(prev => prev.filter(m => m.id !== confirmDeleteModal.materialId));
      setConfirmDeleteModal({ isOpen: false, materialId: null, title: '' });
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
      showToast('Failed to retrieve file preview link', 'error');
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
      showToast('Download failed', 'error');
    }
  };

  const filteredUsers = users.filter(u => {
    if (!userSearchTerm) return true;
    const term = userSearchTerm.toLowerCase();
    return (u.email || '').toLowerCase().includes(term) || (u.full_name || '').toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-md flex items-center gap-2.5 border text-xs font-medium transition-all ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Administrator Console</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                PORTAL MODERATOR
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Review pending submissions, manage courses, and supervise platform permissions.
            </p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-colors border border-gray-200 shadow-xs self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-amber-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending
          </p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPending || 0}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved
          </p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalApproved || 0}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-rose-700 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
          </p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalRejected || 0}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-blue-700 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-blue-600" /> Students
          </p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers || 0}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-gray-600 flex items-center gap-1">
            <Download className="w-3.5 h-3.5 text-gray-500" /> Downloads
          </p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalDownloads || 0}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-purple-700 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" /> Reports
          </p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingReports || 0}</h3>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 space-x-1 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'pending'
              ? 'bg-white text-gray-900 shadow-xs font-semibold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Verification Queue ({pendingMaterials.length})
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-3.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'materials'
              ? 'bg-white text-gray-900 shadow-xs font-semibold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          All Documents
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'categories'
              ? 'bg-white text-gray-900 shadow-xs font-semibold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          Courses & Subjects
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-white text-gray-900 shadow-xs font-semibold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          User Roles
        </button>
      </div>

      {/* TAB 1: PENDING VERIFICATION QUEUE */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-xl border border-gray-200/90 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Pending Moderation Queue</h2>
              <p className="text-xs text-gray-500">Inspect uploaded notes for scan clarity and syllabus relevance before publishing</p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading submissions...
            </div>
          ) : pendingMaterials.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
              <h3 className="text-sm font-semibold text-gray-900">Verification queue is clear</h3>
              <p className="text-xs text-gray-400 mt-0.5">All student uploads have been verified.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 text-[11px] uppercase font-semibold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Document</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Uploader</th>
                    <th className="px-4 py-3">File Specs</th>
                    <th className="px-4 py-3 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingMaterials.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-semibold text-gray-900 text-sm truncate">{item.title}</div>
                        {item.description && <div className="text-gray-500 text-xs truncate mt-0.5">{item.description}</div>}
                        <div className="mt-1">
                          <MaterialTypeBadge type={item.material_types?.name} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-gray-800">{item.courses?.code || 'Course'} · {item.semesters?.label || 'Sem'}</div>
                        <div className="text-gray-500">{item.subjects?.name || 'Subject'}</div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">
                        <div className="font-medium text-gray-900">{item.profiles?.full_name || 'Student'}</div>
                        <div className="text-[11px] text-gray-400">{item.profiles?.email}</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-gray-500">
                        <div>{(item.material_files?.file_size ? (item.material_files.file_size / (1024 * 1024)).toFixed(2) : '1.2')} MB (PDF)</div>
                        <button
                          onClick={() => handlePreview(item)}
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1 font-sans font-medium"
                        >
                          <Eye className="w-3 h-3" /> Preview PDF
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={actionLoadingId === item.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => setRejectionModal({ isOpen: true, materialId: item.id, reason: '' })}
                            disabled={actionLoadingId === item.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
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

      {/* TAB 2: ALL DOCUMENTS */}
      {activeTab === 'materials' && (
        <div className="bg-white rounded-xl border border-gray-200/90 overflow-hidden shadow-xs space-y-3.5 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search repository..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={materialsFilterStatus}
                onChange={(e) => setMaterialsFilterStatus(e.target.value)}
                className="py-1.5 px-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-600"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-[11px] uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Document Title</th>
                  <th className="px-4 py-3">Course / Subject</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Downloads</th>
                  <th className="px-4 py-3 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allMaterials.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {item.courses?.code} • {item.subjects?.name || 'General'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} reason={item.rejection_reason} />
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-500">{item.download_count || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => triggerDelete(item)}
                        disabled={actionLoadingId === item.id}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Document"
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

      {/* TAB 3: CURRICULUM MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Create Course Form */}
          <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" /> Add Academic Course / Program
            </h3>
            <form onSubmit={handleCreateCourse} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-600 mb-1">Course Full Name</label>
                <input
                  type="text"
                  required
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  placeholder="e.g. Master of Science in Data Science"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-600 mb-1">Course Code / Short Form</label>
                <input
                  type="text"
                  required
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  placeholder="e.g. MSc-DS"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
              <button
                type="submit"
                disabled={categorySubmitting}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
              >
                Create Course
              </button>
            </form>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-[11px] font-semibold uppercase text-gray-500 mb-2">Active Courses</p>
              <div className="flex flex-wrap gap-1.5">
                {categories.courses.map(c => (
                  <span key={c.id} className="px-2 py-0.5 rounded text-xs bg-gray-100 border border-gray-200 text-gray-700 font-mono">
                    {c.code}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Create Subject Form */}
          <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" /> Add Subject to Curriculum
            </h3>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-gray-600 mb-1">Course</label>
                  <select
                    required
                    value={newSubject.course_id}
                    onChange={(e) => setNewSubject({ ...newSubject, course_id: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Select Course</option>
                    {categories.courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-gray-600 mb-1">Semester</label>
                  <select
                    required
                    value={newSubject.semester_id}
                    onChange={(e) => setNewSubject({ ...newSubject, semester_id: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Select Semester</option>
                    {categories.semesters.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-600 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="e.g. Distributed Operating Systems"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-gray-600 mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                  placeholder="e.g. MCA401"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={categorySubmitting}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
              >
                Add Subject
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: USER ROLES MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-200/90 overflow-hidden shadow-xs space-y-3 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">User Role Administration</h2>
              <p className="text-xs text-gray-500">Manage user access levels across student and administrator tiers</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search user email or name..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-[11px] uppercase font-semibold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Active Role</th>
                  <th className="px-4 py-3 text-right">Role Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                        {u.full_name?.[0] || u.email?.[0]?.toUpperCase()}
                      </div>
                      <span>{u.full_name || 'Student'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRoleToggle(u.id, u.role)}
                        disabled={actionLoadingId === u.id || u.id === user?.id}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border shadow-xs disabled:opacity-50 ${
                          u.role === 'admin'
                            ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                            : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
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

      {/* PDF PREVIEW MODAL */}
      <PdfPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, url: '', title: '', fileName: '', materialId: null })}
        url={previewModal.url}
        title={previewModal.title}
        fileName={previewModal.fileName}
        onDownload={() => handleDownload(previewModal.materialId, previewModal.fileName)}
      />

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={() => setConfirmDeleteModal({ isOpen: false, materialId: null, title: '' })}
        onConfirm={handleConfirmDelete}
        title="Permanently Delete Material?"
        message={`Are you sure you want to delete "${confirmDeleteModal.title}"? This will remove the file from storage and database permanently.`}
        confirmText="Delete Document"
        isDestructive={true}
        isLoading={actionLoadingId === confirmDeleteModal.materialId}
      />

      {/* REJECTION REASON MODAL */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 p-6 rounded-xl max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" /> Specify Rejection Reason
            </h3>
            <p className="text-xs text-gray-500">
              Provide constructive feedback for the student regarding why this study material was rejected.
            </p>
            <div className="space-y-2">
              <textarea
                rows="3"
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                placeholder="e.g. Unclear or blurry scan; Missing required syllabus units..."
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
              <div className="flex flex-wrap gap-1.5 text-[11px] text-gray-500">
                <span>Presets:</span>
                <button
                  type="button"
                  onClick={() => setRejectionModal({ ...rejectionModal, reason: 'Low quality / unreadable scan' })}
                  className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 text-[10px] border border-gray-200"
                >
                  Low scan quality
                </button>
                <button
                  type="button"
                  onClick={() => setRejectionModal({ ...rejectionModal, reason: 'Incorrect subject or semester tagged' })}
                  className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 text-[10px] border border-gray-200"
                >
                  Wrong subject
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModal({ isOpen: false, materialId: null, reason: '' })}
                className="px-3.5 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium shadow-xs"
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
