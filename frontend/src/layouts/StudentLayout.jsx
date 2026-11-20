import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Search, Upload, User, LogOut, LayoutDashboard, Shield, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StudentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut, isAdmin } = useAuth();
  const [navSearch, setNavSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/browse?search=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch('');
    }
  };

  const navLinks = [
    { label: 'Browse', path: '/browse', icon: BookOpen },
    { label: 'Upload', path: '/upload', icon: Upload },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ label: 'Admin Panel', path: '/admin', icon: Shield, adminOnly: true }] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col w-full">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Navigation */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="p-2 bg-blue-600 rounded-lg text-white group-hover:bg-blue-700 transition-colors shadow-sm">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="font-bold text-lg tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">
                  StudyMaterial
                </span>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        link.adminOnly
                          ? isActive
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'text-amber-700 hover:bg-amber-50'
                          : isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Search and User Controls */}
            <div className="flex items-center gap-3">
              {/* Navbar Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-48 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Search materials..."
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-50 hover:bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </form>

              {/* Auth Controls */}
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={isAdmin ? '/admin' : '/dashboard'}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200/80 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <span className="hidden lg:inline max-w-[120px] truncate">
                      {profile?.full_name || user.email?.split('@')[0]}
                    </span>
                    {isAdmin && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        Admin
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => signOut()}
                    title="Sign Out"
                    className="p-2 text-gray-500 hover:text-rose-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  Sign In
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Nav Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-gray-200 space-y-2">
              <form onSubmit={handleSearchSubmit} className="relative pb-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Search materials..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </form>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <link.icon className="w-4 h-4 text-blue-600" />
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-gray-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span className="text-gray-900 font-medium">College Study Material Sharing Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin" className="hover:text-gray-700 transition-colors">Admin Portal</Link>
            <span>•</span>
            <p>&copy; {new Date().getFullYear()} Academic Repository.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudentLayout;
