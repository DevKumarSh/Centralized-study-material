const supabase = require('../supabase');

/**
 * Middleware to require authenticated Supabase user
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session token' });
    }

    req.user = user;

    // Fetch profile details from public.profiles
    let profile = null;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      profile = data;
    } catch (e) {
      console.warn('Profile fetch warning:', e.message);
    }

    // Determine role from profile or user_metadata
    const determinedRole = profile?.role || user.user_metadata?.role || 'student';

    req.profile = profile || {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email.split('@')[0],
      role: determinedRole
    };

    // Ensure req.profile.role reflects user_metadata if profile wasn't updated
    if (user.user_metadata?.role === 'admin') {
      req.profile.role = 'admin';
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal authentication error' });
  }
};

/**
 * Middleware for optional authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        req.user = user;
        let profile = null;
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          profile = data;
        } catch (e) {
          // ignore
        }

        const determinedRole = profile?.role || user.user_metadata?.role || 'student';
        req.profile = profile || {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          role: determinedRole
        };

        if (user.user_metadata?.role === 'admin') {
          req.profile.role = 'admin';
        }
      }
    }
  } catch (err) {
    console.warn('Optional auth check failed:', err.message);
  }
  next();
};

/**
 * Middleware to require admin privileges
 */
const requireAdmin = async (req, res, next) => {
  const isAdmin = req.profile?.role === 'admin' || req.user?.user_metadata?.role === 'admin';
  if (!req.user || !isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin
};
