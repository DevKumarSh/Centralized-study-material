const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const supabase = require('../supabase');
const { requireAuth, optionalAuth } = require('../middlewares/auth');

// Multer in-memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB max limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMimeTypes = ['application/pdf', 'application/x-pdf'];
    if (ext === '.pdf' || allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents are allowed for upload.'));
    }
  }
});

const STORAGE_BUCKET = 'study-materials';

/**
 * Helper to ensure storage bucket exists in Supabase
 */
async function ensureBucketExists() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets && buckets.some(b => b.name === STORAGE_BUCKET);
    if (!exists) {
      await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: 52428800
      });
    }
  } catch (err) {
    console.warn('Bucket verification warning:', err.message);
  }
}
ensureBucketExists();

/**
 * @route   GET /api/materials
 * @desc    Fetch approved materials with search and filters
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      course_id,
      semester_id,
      subject_id,
      material_type_id,
      academic_year,
      page = 1,
      limit = 12
    } = req.query;

    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    let query = supabase
      .from('materials')
      .select(`
        id,
        title,
        description,
        academic_year,
        status,
        download_count,
        created_at,
        courses (id, name, code),
        semesters (id, number, label),
        subjects (id, name, code),
        material_types (id, name, slug),
        profiles:uploaded_by (id, full_name, email),
        material_files:file_id (id, file_name, file_size, storage_path)
      `, { count: 'exact' })
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (course_id) query = query.eq('course_id', course_id);
    if (semester_id) query = query.eq('semester_id', semester_id);
    if (subject_id) query = query.eq('subject_id', subject_id);
    if (material_type_id) query = query.eq('material_type_id', material_type_id);
    if (academic_year) query = query.eq('academic_year', academic_year);

    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
    }

    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      materials: data || [],
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil((count || 0) / parseInt(limit))
    });
  } catch (err) {
    console.error('Error fetching materials:', err);
    return res.status(500).json({ error: 'Failed to retrieve materials', details: err.message });
  }
});

/**
 * @route   GET /api/materials/user/my-uploads
 * @desc    Fetch materials uploaded by currently authenticated user
 */
router.get('/user/my-uploads', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select(`
        id,
        title,
        description,
        academic_year,
        status,
        rejection_reason,
        download_count,
        created_at,
        courses (id, name, code),
        semesters (id, number, label),
        subjects (id, name, code),
        material_types (id, name, slug),
        material_files:file_id (id, file_name, file_size, storage_path)
      `)
      .eq('uploaded_by', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (err) {
    console.error('Error fetching user uploads:', err);
    return res.status(500).json({ error: 'Failed to retrieve your uploads', details: err.message });
  }
});

/**
 * @route   GET /api/materials/:id
 * @desc    Get single material by ID
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('materials')
      .select(`
        id,
        title,
        description,
        academic_year,
        status,
        download_count,
        file_hash,
        created_at,
        courses (id, name, code),
        semesters (id, number, label),
        subjects (id, name, code),
        material_types (id, name, slug),
        profiles:uploaded_by (id, full_name, email, avatar_url),
        material_files:file_id (id, file_name, file_size, mime_type, storage_path)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // If material is not approved, only the uploader or admin can view it
    if (data.status !== 'approved') {
      const isOwner = req.user && req.user.id === data.profiles?.id;
      const isAdmin = req.profile && req.profile.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'This material is pending approval or has been archived' });
      }
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching material details:', err);
    return res.status(500).json({ error: 'Failed to retrieve material details' });
  }
});

/**
 * @route   POST /api/materials/upload
 * @desc    Upload new study material with SHA-256 duplicate detection
 */
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'A PDF file is required for upload.' });
    }

    const {
      title,
      description,
      course_id,
      semester_id,
      subject_id,
      material_type_id,
      academic_year,
      tags
    } = req.body;

    if (!title || !course_id || !semester_id || !subject_id || !material_type_id) {
      return res.status(400).json({ error: 'Please provide all required fields (title, course, semester, subject, material type).' });
    }

    // 1. Calculate SHA-256 Hash of the file buffer
    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // 2. Check for exact duplicate in database
    const { data: duplicateMaterial } = await supabase
      .from('materials')
      .select('id, title, status, created_at')
      .eq('file_hash', fileHash)
      .in('status', ['approved', 'pending'])
      .maybeSingle();

    if (duplicateMaterial) {
      return res.status(409).json({
        error: 'Duplicate Document Detected',
        message: `An identical document ("${duplicateMaterial.title}") already exists on the platform. Duplicate uploads are prohibited to preserve repository quality.`,
        existingMaterialId: duplicateMaterial.id
      });
    }

    // 3. Upload file to Supabase Storage
    const timestamp = Date.now();
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `uploads/${req.user.id}/${timestamp}_${cleanFileName}`;

    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (storageError) {
      console.error('Storage upload error:', storageError);
      return res.status(500).json({ error: 'Failed to store file in Supabase Storage', details: storageError.message });
    }

    // 4. Create material_files record
    const { data: fileRecord, error: fileInsertError } = await supabase
      .from('material_files')
      .insert({
        storage_path: storagePath,
        file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype
      })
      .select()
      .single();

    if (fileInsertError) {
      throw fileInsertError;
    }

    // 5. Ensure profile exists in profiles table
    try {
      await supabase
        .from('profiles')
        .upsert({
          id: req.user.id,
          email: req.user.email,
          full_name: req.profile?.full_name || req.user.user_metadata?.full_name || req.user.email.split('@')[0],
          role: req.profile?.role || 'student'
        }, { onConflict: 'id' });
    } catch (e) {
      console.warn('Profile upsert warning:', e.message);
    }

    // 6. Create materials record (status: 'pending' by default for admin review)
    const { data: newMaterial, error: materialInsertError } = await supabase
      .from('materials')
      .insert({
        title: title.trim(),
        description: description ? description.trim() : null,
        course_id,
        semester_id,
        subject_id,
        material_type_id,
        academic_year: academic_year ? academic_year.trim() : null,
        uploaded_by: req.user.id,
        file_id: fileRecord.id,
        file_hash: fileHash,
        status: 'pending',
        download_count: 0
      })
      .select(`
        *,
        courses (name, code),
        semesters (number, label),
        subjects (name, code),
        material_types (name, slug),
        material_files:file_id (file_name, file_size, storage_path)
      `)
      .single();

    if (materialInsertError) {
      throw materialInsertError;
    }

    // 7. Handle optional tags
    if (tags) {
      const tagList = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
      for (const tag of tagList) {
        try {
          const slug = tag.toLowerCase().replace(/[^a-z0-9]/g, '-');
          const { data: tagRow } = await supabase
            .from('tags')
            .upsert({ name: tag, slug }, { onConflict: 'name' })
            .select()
            .single();

          if (tagRow) {
            await supabase
              .from('material_tags')
              .insert({ material_id: newMaterial.id, tag_id: tagRow.id });
          }
        } catch (tagErr) {
          console.warn('Tag insert warning:', tagErr.message);
        }
      }
    }

    return res.status(201).json({
      message: 'Material uploaded successfully and submitted for admin verification.',
      material: newMaterial
    });
  } catch (err) {
    console.error('Error during upload:', err);
    return res.status(500).json({ error: 'Failed to upload study material', details: err.message });
  }
});

/**
 * @route   GET /api/materials/:id/download
 * @desc    Generate download / preview URL and increment download counter (unless preview)
 */
router.get('/:id/download', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const isInline = req.query.inline === 'true';

    // Fetch material and file info
    const { data: material, error } = await supabase
      .from('materials')
      .select('id, download_count, material_files:file_id(storage_path, file_name)')
      .eq('id', id)
      .single();

    if (error || !material || !material.material_files) {
      return res.status(404).json({ error: 'Material file not found' });
    }

    // Only increment download count and log if it's an actual download (not inline preview)
    if (!isInline) {
      // Increment download count
      await supabase
        .from('materials')
        .update({ download_count: (material.download_count || 0) + 1 })
        .eq('id', id);

      // Record download log
      if (req.user) {
        try {
          await supabase
            .from('downloads')
            .insert({ material_id: id, user_id: req.user.id });
        } catch (logErr) {
          console.warn('Download log warning:', logErr.message);
        }
      }
    }

    // Generate signed download URL (valid for 1 hour)
    // For inline previews, omit download option so Supabase does not force Content-Disposition: attachment
    const signOptions = isInline ? {} : { download: material.material_files.file_name };
    const { data: signedData, error: signError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(material.material_files.storage_path, 3600, signOptions);

    if (signError || !signedData?.signedUrl) {
      // Fallback to public URL
      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(material.material_files.storage_path);

      return res.status(200).json({ downloadUrl: publicUrlData.publicUrl });
    }

    return res.status(200).json({ downloadUrl: signedData.signedUrl });
  } catch (err) {
    console.error('Download error:', err);
    return res.status(500).json({ error: 'Failed to generate download link' });
  }
});

module.exports = router;
