const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

/**
 * @route   GET /api/categories
 * @desc    Get all categories (courses, semesters, material types, subjects) in one bundle
 */
router.get('/', async (req, res) => {
  try {
    const [coursesRes, semestersRes, typesRes, subjectsRes] = await Promise.all([
      supabase.from('courses').select('*').order('name'),
      supabase.from('semesters').select('*').order('number'),
      supabase.from('material_types').select('*').order('name'),
      supabase.from('subjects').select('*').order('name')
    ]);

    if (coursesRes.error) throw coursesRes.error;

    return res.status(200).json({
      courses: coursesRes.data || [],
      semesters: semestersRes.data || [],
      materialTypes: typesRes.data || [],
      subjects: subjectsRes.data || []
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
    return res.status(500).json({ error: 'Failed to retrieve categories', details: err.message });
  }
});

/**
 * @route   GET /api/categories/courses
 * @desc    Get all courses
 */
router.get('/courses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('name');

    if (error) throw error;
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching courses:', err);
    return res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * @route   GET /api/categories/semesters
 * @desc    Get all semesters
 */
router.get('/semesters', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('semesters')
      .select('*')
      .order('number');

    if (error) throw error;
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching semesters:', err);
    return res.status(500).json({ error: 'Failed to fetch semesters' });
  }
});

/**
 * @route   GET /api/categories/material-types
 * @desc    Get all material types
 */
router.get('/material-types', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('material_types')
      .select('*')
      .order('name');

    if (error) throw error;
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching material types:', err);
    return res.status(500).json({ error: 'Failed to fetch material types' });
  }
});

/**
 * @route   GET /api/categories/subjects
 * @desc    Get subjects optionally filtered by course_id and semester_id
 */
router.get('/subjects', async (req, res) => {
  try {
    const { course_id, semester_id } = req.query;
    let query = supabase.from('subjects').select('*').order('name');

    if (course_id) {
      query = query.eq('course_id', course_id);
    }
    if (semester_id) {
      query = query.eq('semester_id', semester_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching subjects:', err);
    return res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

module.exports = router;
