const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

/**
 * POST /api/auth/register
 * Creates a student user with email confirmation pre-verified (bypassing SMTP deliverability issues)
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, full_name, fullName, course_id, semester_id } = req.body;
    const name = (full_name || fullName || '').trim();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Create user in Supabase Auth Admin API (automatically confirmed)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: trimmedEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: name || trimmedEmail.split('@')[0],
        role: 'student'
      }
    });

    if (authError) {
      // Check if user already exists
      if (authError.message.toLowerCase().includes('already registered') || authError.status === 422) {
        return res.status(409).json({ error: 'An account with this email already exists. Please Sign In.' });
      }
      return res.status(400).json({ error: authError.message });
    }

    const newUser = authData.user;

    // 2. Upsert profile in public.profiles
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: newUser.id,
      email: newUser.email,
      full_name: name || trimmedEmail.split('@')[0],
      role: 'student',
      course_id: course_id || null,
      semester_id: semester_id || null
    });

    if (profileError) {
      console.warn('Profile creation warning during register:', profileError.message);
    }

    return res.status(201).json({
      success: true,
      message: 'User registered and confirmed successfully.',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: 'student',
        full_name: name || trimmedEmail.split('@')[0]
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

