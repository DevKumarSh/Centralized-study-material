const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

/**
 * @route   GET /api/admin/stats
 * @desc    Get comprehensive moderation and platform statistics
 */
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [
      { count: totalApproved },
      { count: totalPending },
      { count: totalRejected },
      { count: totalUsers },
      { count: totalReports },
      { count: totalCourses },
      { count: totalSubjects }
    ] = await Promise.all([
      supabase.from('materials').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('materials').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('materials').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('subjects').select('*', { count: 'exact', head: true })
    ]);

    // Total download sum
    const { data: dlData } = await supabase.from('materials').select('download_count');
    const totalDownloads = (dlData || []).reduce((acc, curr) => acc + (curr.download_count || 0), 0);

    return res.status(200).json({
      totalApproved: totalApproved || 0,
      totalPending: totalPending || 0,
      totalRejected: totalRejected || 0,
      totalUsers: totalUsers || 0,
      pendingReports: totalReports || 0,
      totalCourses: totalCourses || 0,
      totalSubjects: totalSubjects || 0,
      totalDownloads
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ error: 'Failed to retrieve admin stats' });
  }
});

/**
 * @route   GET /api/admin/materials
 * @desc    Get materials for moderation (pending, approved, rejected, all)
 */
router.get('/materials', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status = 'pending', search } = req.query;

    let query = supabase
      .from('materials')
      .select(`
        id,
        title,
        description,
        academic_year,
        status,
        rejection_reason,
        download_count,
        file_hash,
        created_at,
        courses (id, name, code),
        semesters (id, number, label),
        subjects (id, name, code),
        material_types (id, name, slug),
        profiles:uploaded_by (id, full_name, email),
        material_files:file_id (id, file_name, file_size, storage_path)
      `)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return res.status(200).json(data || []);
  } catch (err) {
    console.error('Admin fetch materials error:', err);
    return res.status(500).json({ error: 'Failed to fetch materials for moderation' });
  }
});

/**
 * @route   PATCH /api/admin/materials/:id/status
 * @desc    Update material status (approve, reject, remove)
 */
router.patch('/materials/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!['approved', 'rejected', 'removed', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const { data, error } = await supabase
      .from('materials')
      .update({
        status,
        rejection_reason: status === 'rejected' ? (rejection_reason || 'Does not meet academic quality guidelines') : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log admin action
    try {
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: req.user.id,
          material_id: id,
          action: `status_change_to_${status}`,
          notes: rejection_reason || null
        });
    } catch (logErr) {
      console.warn('Admin log warning:', logErr.message);
    }

    return res.status(200).json({ message: `Material marked as ${status}`, material: data });
  } catch (err) {
    console.error('Admin status update error:', err);
    return res.status(500).json({ error: 'Failed to update material status' });
  }
});

/**
 * @route   DELETE /api/admin/materials/:id
 * @desc    Permanently delete a material and its associated file
 */
router.delete('/materials/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get file storage path first
    const { data: material } = await supabase
      .from('materials')
      .select('file_id, material_files:file_id(storage_path)')
      .eq('id', id)
      .single();

    if (material?.material_files?.storage_path) {
      await supabase.storage
        .from('study-materials')
        .remove([material.material_files.storage_path]);
    }

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ message: 'Material permanently deleted' });
  } catch (err) {
    console.error('Admin delete error:', err);
    return res.status(500).json({ error: 'Failed to delete material' });
  }
});

/**
 * @route   GET /api/admin/reports
 * @desc    Get all submitted user reports
 */
router.get('/reports', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        id,
        reason,
        description,
        status,
        created_at,
        materials (id, title, status),
        profiles:reported_by (id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json(data || []);
  } catch (err) {
    console.error('Admin reports fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * @route   PATCH /api/admin/reports/:id
 * @desc    Resolve or dismiss a report
 */
router.patch('/reports/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'resolved', 'rejected', 'under_review'

    const { data, error } = await supabase
      .from('reports')
      .update({
        status,
        resolved_at: status === 'resolved' || status === 'rejected' ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ message: `Report marked as ${status}`, report: data });
  } catch (err) {
    console.error('Admin report update error:', err);
    return res.status(500).json({ error: 'Failed to update report' });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get list of all users and their roles
 */
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json(data || []);
  } catch (err) {
    console.error('Admin users fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Update user role (student <-> admin)
 */
router.patch('/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be student or admin' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ message: `User role updated to ${role}`, profile: data });
  } catch (err) {
    console.error('Admin role update error:', err);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
});

/**
 * @route   POST /api/admin/categories/courses
 * @desc    Create new course
 */
router.post('/categories/courses', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Course name and code are required' });
    }

    const { data, error } = await supabase
      .from('courses')
      .insert({ name: name.trim(), code: code.trim().toUpperCase() })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create course' });
  }
});

/**
 * @route   POST /api/admin/categories/subjects
 * @desc    Create new subject
 */
router.post('/categories/subjects', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, code, course_id, semester_id } = req.body;
    if (!name || !code || !course_id || !semester_id) {
      return res.status(400).json({ error: 'Subject name, code, course, and semester are required' });
    }

    const { data, error } = await supabase
      .from('subjects')
      .insert({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        course_id,
        semester_id
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create subject' });
  }
});

module.exports = router;
