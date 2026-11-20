import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, User, AlertCircle, CheckCircle, RefreshCw, Info, KeyRound, ArrowLeft, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    signIn,
    signUp,
    resendVerificationEmail,
    resetPasswordForEmail,
    updatePassword,
    isRecoveryMode,
    setIsRecoveryMode
  } = useAuth();

  // Modes: 'login' | 'register' | 'forgot' | 'update-password'
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [verificationPendingEmail, setVerificationPendingEmail] = useState('');

  // Detect recovery mode from URL hash or context
  useEffect(() => {
    const isRecoveryHash = window.location.hash.includes('type=recovery') || location.search.includes('type=recovery');
    if (isRecoveryMode || isRecoveryHash) {
      setMode('update-password');
      setSuccessMsg('Password recovery link verified! Please enter your new password below.');
    }
  }, [isRecoveryMode, location]);

  // Auto redirect if already logged in (ONLY if not in update-password mode)
  useEffect(() => {
    if (user && mode !== 'update-password') {
      setSuccessMsg('Logged in successfully!');
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, mode, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setShowResend(false);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        setSuccessMsg('Logged in successfully! Redirecting...');
        setTimeout(() => navigate('/dashboard'), 800);
      } else if (mode === 'register') {
        const res = await signUp(email, password, fullName);
        if (res.user && !res.session) {
          setVerificationPendingEmail(email);
          setShowResend(true);
          setSuccessMsg(
            `Account created! A confirmation email has been sent to "${email}". Please check your inbox and click the link to activate your account.`
          );
        } else {
          setSuccessMsg('Account registered and logged in!');
          setTimeout(() => navigate('/dashboard'), 1000);
        }
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          throw new Error('Please enter your registered email address.');
        }
        await resetPasswordForEmail(email);
        setSuccessMsg(`Password reset link sent to "${email}". Please check your inbox.`);
      } else if (mode === 'update-password') {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please re-enter.');
        }
        await updatePassword(password);
        if (setIsRecoveryMode) setIsRecoveryMode(false);
        setSuccessMsg('Password updated successfully! Redirecting to dashboard...');
        setTimeout(() => navigate('/dashboard'), 1200);
      }
    } catch (err) {
      console.error('Authentication Error:', err);
      const msg = err.message || '';

      if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('not confirmed')) {
        setErrorMsg('Your email is not confirmed yet. Please verify your email via the link sent to your inbox, or request a new link below.');
        setShowResend(true);
        setVerificationPendingEmail(email);
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        setErrorMsg('Invalid email or password. Please verify your credentials or click "Forgot Password?" below to reset it.');
        setShowResend(true);
        setVerificationPendingEmail(email);
      } else if (msg.toLowerCase().includes('user already registered')) {
        setErrorMsg('An account with this email already exists. Please switch to Sign In.');
        setMode('login');
      } else {
        setErrorMsg(msg || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = verificationPendingEmail || email;
    if (!targetEmail) {
      setErrorMsg('Please enter your email address to resend confirmation.');
      return;
    }

    setResending(true);
    setErrorMsg('');
    try {
      await resendVerificationEmail(targetEmail);
      setSuccessMsg(`Verification link resent to ${targetEmail}! Please check your inbox.`);
    } catch (err) {
      console.error('Resend error:', err);
      setErrorMsg(err.message || 'Failed to resend confirmation email. Please wait a minute and try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 sm:py-10 space-y-5">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs mx-auto mb-2">
          {mode === 'forgot' || mode === 'update-password' ? (
            <KeyRound className="w-5 h-5" />
          ) : (
            <GraduationCap className="w-5 h-5" />
          )}
        </div>
        <h1 className="text-xl font-bold text-gray-900">
          {mode === 'login' && 'Sign in to StudyMaterial'}
          {mode === 'register' && 'Create Student Account'}
          {mode === 'forgot' && 'Reset Your Password'}
          {mode === 'update-password' && 'Set New Password'}
        </h1>
        <p className="text-xs text-gray-500">
          {mode === 'login' && 'Enter your credentials to access study materials and your dashboard'}
          {mode === 'register' && 'Join your college community to share and access verified materials'}
          {mode === 'forgot' && 'Enter your registered college email to receive a recovery link'}
          {mode === 'update-password' && 'Enter your new password below to regain account access'}
        </p>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>

          <div className="pt-2 border-t border-rose-200 flex items-center justify-between gap-2 flex-wrap">
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-xs text-blue-600 hover:text-blue-700 underline font-medium"
              >
                Forgot your password?
              </button>
            )}

            {showResend && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 rounded text-xs font-medium transition-colors disabled:opacity-50 ml-auto"
              >
                {resending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                Resend Confirmation
              </button>
            )}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>

          {showResend && (
            <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
              <span className="text-gray-600">Still waiting for link?</span>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-xs font-medium transition-colors disabled:opacity-50"
              >
                {resending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                Resend Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200/90 shadow-xs space-y-4">
        {/* Toggle tabs for Login / Register */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === 'login' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                mode === 'register' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Back button if in forgot or update-password mode */}
        {(mode === 'forgot' || mode === 'update-password') && (
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </button>
            <span className="text-xs text-blue-600 font-medium">
              {mode === 'forgot' ? 'Password Help' : 'Account Recovery'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dev Kumar"
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>
          )}

          {/* Email */}
          {mode !== 'update-password' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                College Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>
          )}

          {/* Password with Eye Toggle */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                  {mode === 'update-password' ? 'New Password *' : 'Password *'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength="6"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password */}
          {mode === 'update-password' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength="6"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs disabled:opacity-50 mt-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Please wait...
              </>
            ) : mode === 'login' ? (
              'Sign In'
            ) : mode === 'register' ? (
              'Create Account'
            ) : mode === 'forgot' ? (
              'Send Reset Link'
            ) : (
              'Save New Password'
            )}
          </button>
        </form>

        {/* Notice Box */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-500 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            {mode === 'forgot' ? (
              <span>Check your email inbox and spam folder for the secure recovery link.</span>
            ) : mode === 'update-password' ? (
              <span>Choose a strong password with at least 6 characters.</span>
            ) : (
              <span>Academic access is authenticated securely via Supabase Auth.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
