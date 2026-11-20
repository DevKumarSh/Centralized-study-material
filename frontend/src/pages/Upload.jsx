import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState({ courses: [], semesters: [], materialTypes: [], subjects: [] });
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [materialTypeId, setMaterialTypeId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [tags, setTags] = useState('');

  // Fetch metadata on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const catData = await api.getCategories();
        setCategories(catData);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingMeta(false);
      }
    }
    loadMeta();
  }, []);

  // Filter subjects based on course and semester selection
  const filteredSubjects = categories.subjects.filter(s => {
    if (courseId && s.course_id !== courseId) return false;
    if (semesterId && s.semester_id !== semesterId) return false;
    return true;
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
        setErrorMsg('Only PDF documents are accepted on this platform.');
        setFile(null);
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        setErrorMsg('Document size exceeds the 50MB limit.');
        setFile(null);
        return;
      }
      setErrorMsg('');
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  };

  const removeSelectedFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!user) {
      setErrorMsg('Please log in to submit study materials.');
      return;
    }

    if (!file) {
      setErrorMsg('Please select a PDF document to upload.');
      return;
    }

    if (!title || !courseId || !semesterId || !subjectId || !materialTypeId) {
      setErrorMsg('Please fill in all mandatory fields marked with an asterisk (*).');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('course_id', courseId);
      formData.append('semester_id', semesterId);
      formData.append('subject_id', subjectId);
      formData.append('material_type_id', materialTypeId);
      formData.append('academic_year', academicYear);
      formData.append('tags', tags);

      const res = await api.uploadMaterial(formData);
      setSuccessMsg(res.message || 'Document uploaded successfully! It is now pending verification.');

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Upload failed:', err);
      if (err.status === 409) {
        setErrorMsg('Duplicate Document Detected: An identical file (matching SHA-256 hash) already exists in the repository.');
      } else {
        setErrorMsg(err.message || 'Failed to upload document. Please check your network and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Upload Study Material</h1>
        <p className="text-sm text-gray-500 mt-1">
          Submit lecture notes, question papers, or practical manuals for administrator verification and peer sharing.
        </p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">{successMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-7 rounded-xl border border-gray-200/90 shadow-xs space-y-5">
        {/* Step 1: File Selection Area */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            PDF File *
          </label>
          {file ? (
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-blue-600 text-white rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for cryptographic check</p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeSelectedFile}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50/50 hover:bg-blue-50/20 rounded-xl p-8 text-center cursor-pointer transition-colors relative">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    <span className="text-blue-600 font-semibold">Click to upload</span> or drag and drop PDF
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Standard PDF only • Up to 50MB • Verified with SHA-256
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Document Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Document Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Database Systems Complete Unit 1 & 2 Handwritten Notes"
            className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        {/* Step 3: Course, Semester, Subject Cascading Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Course */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Course *
            </label>
            <select
              required
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setSubjectId('');
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">Select Course</option>
              {categories.courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Semester *
            </label>
            <select
              required
              value={semesterId}
              onChange={(e) => {
                setSemesterId(e.target.value);
                setSubjectId('');
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">Select Semester</option>
              {categories.semesters.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Subject *
            </label>
            <select
              required
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={!courseId || !semesterId}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">
                {!courseId || !semesterId ? 'Select Course & Sem first' : 'Select Subject'}
              </option>
              {filteredSubjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 4: Category and Academic Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Material Category *
            </label>
            <select
              required
              value={materialTypeId}
              onChange={(e) => setMaterialTypeId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="">Select Category</option>
              {categories.materialTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Academic Year
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g. 2025-2026"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>
        </div>

        {/* Step 5: Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Topics Covered / Summary (Optional)
          </label>
          <textarea
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly outline topics covered, syllabus unit numbers, or questions included..."
            className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
          ></textarea>
        </div>

        {/* Step 6: Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Search Tags (Comma-separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. relational-algebra, b-trees, er-diagrams"
            className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        {/* Quality Notice */}
        <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600 flex items-start gap-2.5 leading-relaxed">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-gray-900 font-semibold">Moderation Policy:</strong> Submissions are reviewed to verify scan readability and course alignment. Duplicate documents are automatically flagged.
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verifying & Submitting...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Submit Document
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadPage;
