import { Link } from 'react-router-dom';
import { Upload, Search, ShieldCheck, ArrowRight, FileText, Check, Sparkles, Layers } from 'lucide-react';

const Landing = () => {
  const popularCourses = [
    { name: 'Master of Computer Applications', code: 'MCA', desc: 'DBMS, OS, Data Structures, Web Tech' },
    { name: 'Bachelor of Computer Applications', code: 'BCA', desc: 'C/C++, Networking, Software Eng' },
    { name: 'B.Tech Computer Science', code: 'BTech-CS', desc: 'Algorithms, AI/ML, Cloud Computing' },
    { name: 'M.Sc. Information Technology', code: 'MSc-IT', desc: 'Info Security, Cryptography, Mobile Dev' }
  ];

  return (
    <div className="space-y-16 py-6 max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Curated Academic Repository • Free & Open for Students</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.18]">
          Your Single Source for <br className="hidden sm:inline" />
          <span className="text-blue-600">Verified Study Materials</span>
        </h1>

        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Say goodbye to lost files in WhatsApp and Telegram groups. Discover, preview, and share organized lecture notes, PYQs, and lab manuals verified for your exact syllabus.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
          <Link
            to="/browse"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all"
          >
            <Search className="w-4 h-4" />
            Browse Materials
          </Link>
          <Link
            to="/upload"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </Link>
        </div>

        {/* Quick Highlights Strip */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs sm:text-sm text-gray-600 font-medium border-t border-gray-200/80 max-w-xl mx-auto">
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> Admin Verified</span>
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> Duplicate Protected</span>
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> Fast PDF Preview</span>
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> 100% Free</span>
        </div>
      </div>

      {/* Featured Academic Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">Academic Programs</h2>
            <p className="text-sm text-gray-500 mt-0.5">Explore materials tailored to your curriculum</p>
          </div>
          <Link to="/browse" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularCourses.map((c) => (
            <Link
              key={c.code}
              to={`/browse?search=${encodeURIComponent(c.code)}`}
              className="bg-white p-5 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-xs transition-all group flex flex-col justify-between"
            >
              <div>
                <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 text-gray-800 border border-gray-200 mb-2">
                  {c.code}
                </span>
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {c.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{c.desc}</p>
              </div>
              <div className="pt-3.5 mt-3 border-t border-gray-100 text-sm font-medium text-blue-600 flex items-center gap-1">
                Explore subjects <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Layers className="h-4.5 w-4.5" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Academic Hierarchy</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Every document is tagged with Course, Semester, Subject, and Academic Year. Filter with one click to locate the exact unit you need for exams.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Quality Verified</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Submissions go through a verification workflow where coordinators inspect syllabus relevance and readability before publishing publicly.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Duplicate Detection</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            SHA-256 byte-level cryptographic hashing blocks identical uploads instantly, saving storage and ensuring students find the canonical notes.
          </p>
        </div>
      </div>

      {/* 3 Step Workflow */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-xs space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">How It Works</h2>
          <p className="text-sm text-gray-500">A streamlined workflow designed specifically for college students</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="flex flex-col items-center text-center space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
              1
            </div>
            <h4 className="text-base font-semibold text-gray-900">Search by Subject</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Filter by your semester and subject code to find relevant notes and previous-year papers.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
              2
            </div>
            <h4 className="text-base font-semibold text-gray-900">In-Browser Preview</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Inspect PDFs directly in your browser without cluttering your downloads folder.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
              3
            </div>
            <h4 className="text-base font-semibold text-gray-900">Contribute & Track</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Upload your own notes and track moderation status and peer download counts in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="bg-blue-600 rounded-xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1.5 text-center sm:text-left">
          <h3 className="text-xl sm:text-2xl font-bold">Have study materials to share?</h3>
          <p className="text-sm text-blue-100 max-w-lg leading-relaxed">
            Upload your handwritten notes, practical files, or lab manuals to help your classmates ace their semester exams.
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-100 text-blue-700 rounded-lg text-sm font-semibold transition-colors shadow-xs whitespace-nowrap"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </Link>
      </div>
    </div>
  );
};

export default Landing;
