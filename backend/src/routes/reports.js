const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { requireAuth } = require('../middlewares/auth');

/**
 * @route   POST /api/reports
 * @desc    Submit a report for an inappropriate or broken material
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { material_id, reason, description } = req.body;

    if (!material_id || !reason) {
      return res.status(400).json({ error: 'Material ID and reason are required' });
    }

    const { data, error } = await supabase
      .from('reports')
      .insert({
        material_id,
        reported_by: req.user.id,
        reason,
        description: description ? description.trim() : null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ message: 'Report submitted successfully for admin review.', report: data });
  } catch (err) {
    console.error('Submit report error:', err);
    return res.status(500).json({ error: 'Failed to submit report' });
  }
});

module.exports = router;
