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
        // Open download link in new tab or trigger download
        const a = document.createElement('a');
        a.href = res.downloadUrl;
        a.download = fileName || 'study-material.pdf';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Update local download count
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

  // Filtered subjects based on course and semester selection
  const availableSubjects = categories.subjects.filter(s => {
    if (selectedCourse && s.course_id !== selectedCourse) return false;
    if (selectedSemester && s.semester_id !== selectedSemester) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Main Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, subject, keywords (e.g. 'DBMS Unit 1', 'Algorithms')..."
              className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {(selectedCourse || selectedSemester || selectedSubject || selectedType || searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Course Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedSubject('');
              }}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Courses</option>
              {categories.courses.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setSelectedSubject('');
              }}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Semesters</option>
              {categories.semesters.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Subjects</option>
              {availableSubjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          {/* Material Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Material Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Types</option>
              {categories.materialTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Materials List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Found <strong className="text-white">{materials.length}</strong> study materials</span>
          <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Admin-verified only</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : materials.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">No materials found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms or clearing some filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {materials.map(item => (
              <div
                key={item.id}
                className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all p-5 flex flex-col justify-between group shadow-lg"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                      {item.material_types?.name || 'Notes'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      {item.download_count || 0}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Course & Semester info */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-medium text-slate-300">{item.courses?.code || 'MCA'}</span>
                      <span>•</span>
                      <span>{item.semesters?.label || 'Semester'}</span>
                    </div>
                    {item.subjects?.name && (
                      <div className="text-slate-300 font-medium truncate">
                        {item.subjects.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action / Download */}
                <div className="pt-4 mt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500 truncate">
                    Uploaded by {item.profiles?.full_name || 'Student'}
                  </div>
                  <button
                    onClick={() => handleDownload(item.id, item.material_files?.file_name)}
                    disabled={downloadingId === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {downloadingId === item.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
