import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Search, Upload, User, LogOut, LayoutDashboard, Shield, Menu, X, GraduationCap } from 'lucide-react';
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
    { label: 'Browse Materials', path: '/browse', icon: BookOpen },
    { label: 'Upload Notes', path: '/upload', icon: Upload },
    { label: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ label: 'Admin Portal', path: '/admin', icon: Shield, adminOnly: true }] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col w-full font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Desktop Nav */}
            <div className="flex items-center gap-3 lg:gap-6 shrink-0">
              <Link to="/" className="flex items-center gap-2.5 group shrink-0">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors shrink-0">
                  <GraduationCap className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="font-bold text-[15px] tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors block leading-tight">
                    StudyMaterial
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium tracking-wider block uppercase">
                    Academic Hub
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1 shrink-0">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 border ${
                        link.adminOnly
                          ? isActive
                            ? 'bg-amber-50 text-amber-800 border-amber-200/80 font-semibold'
                            : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50/60 border-transparent'
                          : isActive
                          ? 'bg-blue-50/80 text-blue-600 border-blue-100 font-semibold'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 border-transparent'
                      }`}
                    >
                      <link.icon className={`w-4 h-4 shrink-0 ${
                        link.adminOnly
                          ? (isActive ? 'text-amber-700' : 'text-amber-600')
                          : (isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')
                      }`} />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Search and User Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Quick Search */}
              <form onSubmit={handleSearchSubmit} className="relative hidden lg:block w-36 xl:w-52 focus-within:w-60 transition-all duration-200">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Quick search..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </form>

              {/* Auth Controls */}
              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 border-l border-gray-200 shrink-0">
                  <Link
                    to={isAdmin ? '/admin' : '/dashboard'}
                    className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100/80 rounded-lg border border-gray-200/80 text-sm font-medium transition-colors shrink-0"
                  >
                    <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-2xs">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <span className="text-gray-800 font-medium hidden md:inline max-w-[100px] lg:max-w-[130px] truncate">
                      {profile?.full_name || user.email?.split('@')[0]}
                    </span>
                    {isAdmin && (
                      <span className="px-1.5 py-0.25 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 shrink-0 leading-tight">
                        Admin
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => signOut()}
                    title="Sign Out"
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-2xs whitespace-nowrap shrink-0"
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
            <div className="md:hidden py-3 border-t border-gray-100 space-y-1">
              <form onSubmit={handleSearchSubmit} className="relative pb-2">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Quick search..."
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </form>
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      link.adminOnly
                        ? isActive
                          ? 'bg-amber-50 text-amber-800 font-semibold'
                          : 'text-amber-700 hover:bg-amber-50'
                        : isActive
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <link.icon className={`w-4 h-4 ${link.adminOnly ? 'text-amber-600' : isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span>{link.label}</span>
                    </div>
                    {link.adminOnly && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                        Admin
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-gray-200/80 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span className="text-gray-900 font-medium">College Study Material Sharing Platform</span>
            <span className="text-gray-300">•</span>
            <span>MCA Academic Repository</span>
          </div>
          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <Link to="/browse" className="hover:text-gray-900 transition-colors">Library</Link>
            <Link to="/upload" className="hover:text-gray-900 transition-colors">Upload</Link>
            <Link to="/admin" className="hover:text-gray-900 transition-colors">Admin Portal</Link>
            <span className="text-gray-300">•</span>
            <p>&copy; {new Date().getFullYear()} StudyMaterial. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudentLayout;
