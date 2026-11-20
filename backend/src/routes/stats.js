const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { optionalAuth } = require('../middlewares/auth');

/**
 * @route   GET /api/stats
 * @desc    Get overall platform and user-specific statistics
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    // 1. Total approved materials
    const { count: totalMaterials } = await supabase
      .from('materials')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    // 2. Total downloads across all materials
    const { data: downloadData } = await supabase
      .from('materials')
      .select('download_count');

    const totalDownloads = (downloadData || []).reduce((acc, curr) => acc + (curr.download_count || 0), 0);

    // 3. User-specific counts (if authenticated)
    let myUploads = 0;
    let pendingApproval = 0;

    if (req.user) {
      const { count: userUploadsCount } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })
        .eq('uploaded_by', req.user.id);

      const { count: userPendingCount } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })
        .eq('uploaded_by', req.user.id)
        .eq('status', 'pending');

      myUploads = userUploadsCount || 0;
      pendingApproval = userPendingCount || 0;
    }

    // 4. Total Courses & Subjects
    const { count: totalCourses } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    const { count: totalSubjects } = await supabase
      .from('subjects')
      .select('*', { count: 'exact', head: true });

    return res.status(200).json({
      totalMaterials: totalMaterials || 0,
      totalDownloads,
      myUploads,
      pendingApproval,
      totalCourses: totalCourses || 0,
      totalSubjects: totalSubjects || 0
    });
  } catch (err) {
    console.error('Error fetching statistics:', err);
    return res.status(500).json({ error: 'Failed to retrieve stats', details: err.message });
  }
});

module.exports = router;
