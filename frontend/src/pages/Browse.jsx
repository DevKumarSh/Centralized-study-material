import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Download, BookOpen, Eye, X, CheckCircle } from 'lucide-react';
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

  // Filters State
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get('course_id') || '');
  const [selectedSemester, setSelectedSemester] = useState(searchParams.get('semester_id') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject_id') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('material_type_id') || '');

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
      {/* Header and Filter Card */}
      <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Main Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by topic, unit, subject name (e.g. 'Normalization', 'MCA102')..."
              className="w-full pl-9.5 pr-8 py-2.5 bg-gray-50/60 hover:bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-gray-200"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filters ({activeFilterCount})
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
          {/* Course */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedSubject('');
              }}
              className="w-full py-1.5 px-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">All Courses</option>
              {categories.courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setSelectedSubject('');
              }}
              className="w-full py-1.5 px-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">All Semesters</option>
              {categories.semesters.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">All Subjects</option>
              {availableSubjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          {/* Material Type */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Category</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">All Types</option>
              {categories.materialTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
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
