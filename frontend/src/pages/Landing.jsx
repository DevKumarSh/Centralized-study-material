import { Link } from 'react-router-dom';
import { BookOpen, Upload, Search, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

const Landing = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-16 py-10 max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center max-w-3xl space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Centralized Academic Repository
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
          The Central Hub for <span className="text-blue-600">College Study Materials</span>
        </h1>

        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Find, share, and organize verified lecture notes, previous-year question papers, and lab manuals. Simple, structured, and organized by course.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
          <Link
            to="/browse"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse Materials
          </Link>
          <Link
            to="/upload"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Notes
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-left space-y-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Search className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Easy to Discover</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Organized strictly by Course, Semester, and Subject. Search by keyword or apply filters to find notes in seconds.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-left space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Admin Verified</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Every submission is reviewed by administrators before being published, ensuring syllabus alignment and high quality.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-left space-y-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <BookOpen className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Duplicate Free</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            SHA-256 file hashing and document similarity detection prevent identical documents from cluttering your repository.
          </p>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="w-full bg-white rounded-xl border border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h4 className="text-base font-semibold text-gray-900">Ready to share your notes?</h4>
          <p className="text-sm text-gray-500 mt-0.5">Help your classmates prepare for exams and assignments.</p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default Landing;
