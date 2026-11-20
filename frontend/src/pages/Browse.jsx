import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Download,
  BookOpen,
  Eye,
  X,
  CheckCircle,
  GraduationCap,
  Calendar,
  Tag,
  ChevronDown,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { MaterialTypeBadge } from '../components/common/Badge';
import { PdfPreviewModal } from '../components/common/PdfPreviewModal';

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState({ courses: [], semesters: [], materialTypes: [], subjects: [] });
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, url: '', title: '', fileName: '', materialId: null });
  const searchInputRef = useRef(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get('course_id') || '');
  const [selectedSemester, setSelectedSemester] = useState(searchParams.get('semester_id') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject_id') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('material_type_id') || '');

  // Keyboard shortcut Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load Categories on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const catData = await api.getCategories();
        setCategories(catData);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadMeta();
  }, []);

  // Fetch materials whenever filters change
  useEffect(() => {
    async function fetchMaterials() {
      setLoading(true);
      try {
        const res = await api.getMaterials({
          search: searchTerm,
          course_id: selectedCourse,
          semester_id: selectedSemester,
          subject_id: selectedSubject,
          material_type_id: selectedType
        });
        setMaterials(res.materials || []);
      } catch (err) {
        console.error('Failed to fetch materials:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchMaterials();
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCourse, selectedSemester, selectedSubject, selectedType]);

  const handleDownload = async (materialId, fileName) => {
    try {
      setDownloadingId(materialId);
      const res = await api.getDownloadUrl(materialId);
      if (res.downloadUrl) {
        const a = document.createElement('a');
        a.href = res.downloadUrl;
        a.download = fileName || 'study-material.pdf';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setMaterials(prev => prev.map(m => m.id === materialId ? { ...m, download_count: (m.download_count || 0) + 1 } : m));
      }
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to retrieve download link. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (item) => {
    try {
      setDownloadingId(item.id);
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
      console.error('Preview error:', err);
      alert('Could not open preview. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCourse('');
    setSelectedSemester('');
    setSelectedSubject('');
    setSelectedType('');
    setSearchParams({});
  };

  const availableSubjects = categories.subjects.filter(s => {
    if (selectedCourse && s.course_id !== selectedCourse) return false;
    if (selectedSemester && s.semester_id !== selectedSemester) return false;
    return true;
  });

  const activeFilterCount = [selectedCourse, selectedSemester, selectedSubject, selectedType, searchTerm].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Study Materials Directory
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Search and filter syllabus-verified lecture notes, question banks, and references.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Verified Materials
          </span>
        </div>
      </div>

      {/* Unified Search & Filter Card */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
        {/* Primary Search Input */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/40">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by topic, unit, subject name, or course code (e.g. 'Normalization', 'MCA102')..."
              className="w-full pl-10 pr-24 py-2.5 bg-white border border-gray-200 hover:border-gray-300 focus:border-blue-500 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-2xs"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-md select-none">
                Ctrl+K
              </span>
            </div>
          </div>
        </div>

        {/* Dropdown Filters Strip */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Refine By Category</span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {activeFilterCount}
                </span>
              )}
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset all
              </button>
            )}
          </div>

          {/* 4 Clean Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Course */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                Course
              </label>
              <div className="relative">
                <select
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    setSelectedSubject('');
                  }}
                  className={`w-full appearance-none pl-3 pr-8 py-2 bg-white border rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                    selectedCourse ? 'border-blue-300 text-blue-900 bg-blue-50/20 font-semibold' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <option value="">All Courses</option>
                  {categories.courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Semester
              </label>
              <div className="relative">
                <select
                  value={selectedSemester}
                  onChange={(e) => {
                    setSelectedSemester(e.target.value);
                    setSelectedSubject('');
                  }}
                  className={`w-full appearance-none pl-3 pr-8 py-2 bg-white border rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                    selectedSemester ? 'border-blue-300 text-blue-900 bg-blue-50/20 font-semibold' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <option value="">All Semesters</option>
                  {categories.semesters.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                Subject
              </label>
              <div className="relative">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className={`w-full appearance-none pl-3 pr-8 py-2 bg-white border rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                    selectedSubject ? 'border-blue-300 text-blue-900 bg-blue-50/20 font-semibold' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <option value="">All Subjects</option>
                  {availableSubjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Material Type */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                Category
              </label>
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className={`w-full appearance-none pl-3 pr-8 py-2 bg-white border rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                    selectedType ? 'border-blue-300 text-blue-900 bg-blue-50/20 font-semibold' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <option value="">All Types</option>
                  {categories.materialTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Active Filter Pills Strip */}
          {activeFilterCount > 0 && (
            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-gray-400 font-medium mr-1">Active filters:</span>

              {searchTerm && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200">
                  Search: <span className="font-semibold text-gray-900">"{searchTerm}"</span>
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="hover:text-red-600 p-0.5 rounded transition-colors"
                    title="Remove search filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCourse && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-800 rounded-md text-xs font-medium border border-blue-200">
                  Course: <span className="font-semibold">{categories.courses.find(c => c.id === selectedCourse)?.code || 'Selected'}</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedCourse(''); setSelectedSubject(''); }}
                    className="hover:text-red-600 p-0.5 rounded transition-colors"
                    title="Remove course filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedSemester && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-800 rounded-md text-xs font-medium border border-blue-200">
                  Semester: <span className="font-semibold">{categories.semesters.find(s => s.id === selectedSemester)?.label || 'Selected'}</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedSemester(''); setSelectedSubject(''); }}
                    className="hover:text-red-600 p-0.5 rounded transition-colors"
                    title="Remove semester filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedSubject && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-800 rounded-md text-xs font-medium border border-blue-200">
                  Subject: <span className="font-semibold truncate max-w-[150px]">{categories.subjects.find(s => s.id === selectedSubject)?.name || 'Selected'}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSubject('')}
                    className="hover:text-red-600 p-0.5 rounded transition-colors"
                    title="Remove subject filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedType && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-800 rounded-md text-xs font-medium border border-blue-200">
                  Category: <span className="font-semibold">{categories.materialTypes.find(t => t.id === selectedType)?.name || 'Selected'}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedType('')}
                    className="hover:text-red-600 p-0.5 rounded transition-colors"
                    title="Remove category filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>Showing <strong className="text-gray-900 font-semibold">{materials.length}</strong> verified materials</span>
        <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          All materials verified for academic syllabus
        </span>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-52 bg-white rounded-xl border border-gray-200 animate-pulse"></div>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No matching materials found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Try broadening your search term or clearing filters to view available resources.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-xs transition-all p-5 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2">
                  <MaterialTypeBadge type={item.material_types?.name} />
                  <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                    <Download className="w-3 h-3 text-gray-400" />
                    {item.download_count || 0} downloads
                  </span>
                </div>

                {/* Title and description */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Academic Metadata */}
                <div className="pt-2.5 border-t border-gray-100 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <span className="font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200 text-[10px]">
                      {item.courses?.code || 'Course'}
                    </span>
                    <span>{item.semesters?.label || 'Semester'}</span>
                    {item.academic_year && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-400">{item.academic_year}</span>
                      </>
                    )}
                  </div>
                  {item.subjects?.name && (
                    <div className="text-gray-800 font-medium truncate">
                      {item.subjects.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3.5 mt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="text-[11px] text-gray-400 truncate flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-[9px]">
                    {item.profiles?.full_name?.[0] || 'S'}
                  </div>
                  <span className="truncate">{item.profiles?.full_name || 'Student'}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handlePreview(item)}
                    disabled={downloadingId === item.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium transition-colors"
                    title="Preview PDF"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleDownload(item.id, item.material_files?.file_name)}
                    disabled={downloadingId === item.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                    title="Download PDF"
                  >
                    {downloadingId === item.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        Get PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF In-App Preview Modal */}
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

export default Browse;
