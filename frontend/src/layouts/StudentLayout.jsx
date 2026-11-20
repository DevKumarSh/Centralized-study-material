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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col w-full selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="p-2 bg-indigo-600 rounded-xl group-hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/30">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-indigo-400 transition-colors">
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
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        link.adminOnly
                          ? isActive
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'
                          : isActive
                          ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <link.icon className="w-3.5 h-3.5" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Search and User Profile */}
            <div className="flex items-center gap-3">
              {/* Navbar Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-48 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Search materials..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </form>

              {/* Auth Controls */}
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={isAdmin ? '/admin' : '/dashboard'}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/60 text-xs transition-colors"
                  >
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px]">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <span className="text-slate-200 hidden lg:inline max-w-[120px] truncate">
                      {profile?.full_name || user.email?.split('@')[0]}
                    </span>
                    {isAdmin && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Admin
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => signOut()}
                    title="Sign Out"
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/30"
                >
                  Sign In
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Nav Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-slate-800 space-y-2 animate-fadeIn">
              <form onSubmit={handleSearchSubmit} className="relative pb-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Search materials..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </form>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <link.icon className="w-4 h-4 text-indigo-400" />
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
      <footer className="w-full bg-slate-900 border-t border-slate-800 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="text-white font-semibold">College Study Material Sharing Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin" className="hover:text-slate-300 transition-colors">Admin Portal</Link>
            <span>•</span>
            <p>&copy; {new Date().getFullYear()} MCA Academic Repository.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudentLayout;
