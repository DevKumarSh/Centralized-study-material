import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Lock, Mail, User, AlertCircle, CheckCircle, RefreshCw, Info, KeyRound, ArrowLeft } from 'lucide-react';
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
        // If Supabase has email confirmation enabled, session will be null
        if (res.user && !res.session) {
          setVerificationPendingEmail(email);
          setShowResend(true);
          setSuccessMsg(
            `Account created! A confirmation email has been sent to "${email}". Please check your inbox (and spam/junk folder) and click the link to activate your account.`
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
        setSuccessMsg(`Password reset link sent to "${email}". Please check your inbox and spam folder.`);
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
        setErrorMsg('Invalid email or password. Please verify your credentials, or click "Forgot Password?" below to reset it.');
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
      setSuccessMsg(`Verification link resent to ${targetEmail}! Please check your inbox and spam folder.`);
    } catch (err) {
      console.error('Resend error:', err);
      setErrorMsg(err.message || 'Failed to resend confirmation email. Please wait a minute and try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 mb-2">
          {mode === 'forgot' || mode === 'update-password' ? (
            <KeyRound className="w-8 h-8" />
          ) : (
            <BookOpen className="w-8 h-8" />
          )}
        </div>
        <h1 className="text-2xl font-extrabold text-white">
          {mode === 'login' && 'Welcome Back'}
          {mode === 'register' && 'Create Student Account'}
          {mode === 'forgot' && 'Reset Your Password'}
          {mode === 'update-password' && 'Set New Password'}
        </h1>
        <p className="text-xs text-slate-400">
          {mode === 'login' && 'Sign in to access your study dashboard and uploaded materials'}
          {mode === 'register' && 'Join the college study material sharing community'}
          {mode === 'forgot' && 'Enter your college email and we will send you a secure password reset link'}
          {mode === 'update-password' && 'Enter your new password below to regain access to your account'}
        </p>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>

          <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between gap-2 flex-wrap">
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-xs text-indigo-300 hover:text-white underline font-semibold"
              >
                Forgot your password?
              </button>
            )}

            {showResend && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ml-auto"
              >
                {resending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                Resend Confirmation
              </button>
            )}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>

          {showResend && (
            <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
              <span className="text-slate-400">Still waiting for link?</span>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {resending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                Resend Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Card */}
      <div className="bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
        {/* Toggle tabs for Login / Register */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Header link if in forgot or update-password mode */}
        {(mode === 'forgot' || mode === 'update-password') && (
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </button>
            <span className="text-xs text-indigo-400 font-semibold">
              {mode === 'forgot' ? 'Password Assistance' : 'Account Recovery'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name (Registration only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dev Kumar"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Email field (for login, register, forgot) */}
          {mode !== 'update-password' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                College Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="devsharmakumar74@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Password field (for login, register, update-password) */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
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
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength="6"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Confirm Password (update-password only) */}
          {mode === 'update-password' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength="6"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Please wait...
              </>
            ) : mode === 'login' ? (
              'Sign In to Account'
            ) : mode === 'register' ? (
              'Create Account'
            ) : mode === 'forgot' ? (
              'Send Password Reset Link'
            ) : (
              'Update & Save Password'
            )}
          </button>
        </form>

        {/* Helpful Tip Box */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            {mode === 'forgot' ? (
              <span>
                <strong>Reset Note:</strong> You will receive an email with a secure link to reset your password. Make sure to check your <em>Spam or Junk</em> folder.
              </span>
            ) : mode === 'update-password' ? (
              <span>
                <strong>Security:</strong> Choose a strong password with at least 6 characters. You can immediately sign in with it afterward.
              </span>
            ) : (
              <span>
                <strong>Email Verification Notice:</strong> Supabase requires clicking the confirmation link sent to your email before you can log in. Check your <em>Spam or Junk</em> folder if you don't see it in your inbox.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;