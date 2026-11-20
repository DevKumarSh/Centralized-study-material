import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Download, FileText, Calendar, BookOpen, User, Eye, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState({ courses: [], semesters: [], materialTypes: [], subjects: [] });
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

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
      alert('Failed to download material. Please try again.');
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

  return (
    <div className="space-y-6">
      {/* Search and Filters Card */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          {/* Main Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, subject, topics (e.g. 'DBMS Unit 1', 'Algorithms')..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {(selectedCourse || selectedSemester || selectedSubject || selectedType || searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap border border-gray-200"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-gray-100">
          {/* Course */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedSubject('');
              }}
              className="w-full py-2 px-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">All Courses</option>
              {categories.courses.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setSelectedSubject('');
              }}
              className="w-full py-2 px-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">All Semesters</option>
              {categories.semesters.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-2 px-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">All Subjects</option>
              {availableSubjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          {/* Material Type */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">Material Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-2 px-3 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">All Types</option>
              {categories.materialTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Materials Results Area */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Showing <strong className="text-gray-900">{materials.length}</strong> verified study materials</span>
          <span className="flex items-center gap-1 text-emerald-700 font-medium"><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Admin-verified</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-44 bg-white rounded-xl border border-gray-200 animate-pulse"></div>
            ))}
          </div>
        ) : materials.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No materials found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms or clearing selected category filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all p-5 flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">
                      {item.material_types?.name || 'Notes'}
                    </span>
                    <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                      <Download className="w-3.5 h-3.5 text-gray-400" />
                      {item.download_count || 0}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Course & Semester info */}
                  <div className="pt-2 border-t border-gray-100 space-y-0.5 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium text-gray-700">{item.courses?.code || 'Course'}</span>
                      <span>•</span>
                      <span>{item.semesters?.label || 'Semester'}</span>
                    </div>
                    {item.subjects?.name && (
                      <div className="text-gray-700 font-medium truncate">
                        {item.subjects.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action / Download */}
                <div className="pt-3.5 mt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-gray-400 truncate">
                    Uploaded by {item.profiles?.full_name || 'Student'}
                  </div>
                  <button
                    onClick={() => handleDownload(item.id, item.material_files?.file_name)}
                    disabled={downloadingId === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
                  >
                    {downloadingId === item.id ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;
