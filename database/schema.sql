-- schema.sql
-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  course_id UUID,
  semester_id UUID,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semesters table
CREATE TABLE IF NOT EXISTS semesters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (name, course_id, semester_id)
);

-- Material Types table
CREATE TABLE IF NOT EXISTS material_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- Material Files table
CREATE TABLE IF NOT EXISTS material_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  page_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES courses(id),
  semester_id UUID REFERENCES semesters(id),
  subject_id UUID REFERENCES subjects(id),
  material_type_id UUID REFERENCES material_types(id),
  academic_year TEXT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  file_id UUID REFERENCES material_files(id) ON DELETE CASCADE,
  file_hash TEXT,
  extracted_text TEXT,
  extraction_status TEXT CHECK (extraction_status IN ('ok', 'ocr', 'failed')),
  similarity_score NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'removed')),
  rejection_reason TEXT,
  download_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- Material Tags table
CREATE TABLE IF NOT EXISTS material_tags (
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (material_id, tag_id)
);

-- Material Similarity table
CREATE TABLE IF NOT EXISTS material_similarity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  new_material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  existing_material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  similarity_score NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Downloads table
CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Actions table
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_materials_file_hash ON materials(file_hash);
CREATE INDEX IF NOT EXISTS idx_materials_subject_id ON materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_semester_id ON materials(semester_id);
CREATE INDEX IF NOT EXISTS idx_materials_course_id ON materials(course_id);
CREATE INDEX IF NOT EXISTS idx_materials_type_id ON materials(material_type_id);
CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);
CREATE INDEX IF NOT EXISTS idx_materials_created_at ON materials(created_at);
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by ON materials(uploaded_by);

-- Create a GIN index on to_tsvector for materials title & description
ALTER TABLE materials ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))) STORED;
CREATE INDEX IF NOT EXISTS idx_materials_search ON materials USING GIN(search_vector);
