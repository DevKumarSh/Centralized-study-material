import { Link } from 'react-router-dom';
import { BookOpen, Upload, Search, ShieldCheck } from 'lucide-react';

const Landing = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-16 py-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl space-y-6">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          The Central Hub for <span className="text-indigo-600 dark:text-indigo-400">College Study Materials</span>
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400">
          Find, share, and organize verified notes, previous year papers, and lab manuals. Say goodbye to scattered WhatsApp groups.
        </p>
        <div className="flex justify-center space-x-4 pt-4">
          <Link to="/browse" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 transition-colors shadow-sm">
            Browse Materials
          </Link>
          <Link to="/upload" className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 md:py-4 md:text-lg md:px-10 transition-colors shadow-sm">
            Upload Notes
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Easy to Find</h3>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
            Organized by Course, Semester, and Subject. Instantly search and filter what you need.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Admin Verified</h3>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
            Every upload is checked by admins to ensure high quality and zero spam.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Duplicates</h3>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
            Smart hash and similarity detection prevents multiple uploads of the same notes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
