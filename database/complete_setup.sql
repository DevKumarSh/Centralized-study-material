-- ==============================================================================
-- College Study Material Sharing Platform - Master Database Setup Script
-- Run this complete script inside your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Linked with Supabase Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  course_id UUID,
  semester_id UUID,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Automatic Profile Creation Trigger on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'student'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Semesters Table
CREATE TABLE IF NOT EXISTS public.semesters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  semester_id UUID REFERENCES public.semesters(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (name, course_id, semester_id)
);

-- 7. Material Types Table
CREATE TABLE IF NOT EXISTS public.material_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- 8. Material Files Table
CREATE TABLE IF NOT EXISTS public.material_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  page_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Materials Table
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES public.courses(id),
  semester_id UUID REFERENCES public.semesters(id),
  subject_id UUID REFERENCES public.subjects(id),
  material_type_id UUID REFERENCES public.material_types(id),
  academic_year TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_id UUID REFERENCES public.material_files(id) ON DELETE CASCADE,
  file_hash TEXT,
  extracted_text TEXT,
  extraction_status TEXT DEFAULT 'ok' CHECK (extraction_status IN ('ok', 'ocr', 'failed')),
  similarity_score NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'removed')),
  rejection_reason TEXT,
  download_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- 11. Material Tags Table
CREATE TABLE IF NOT EXISTS public.material_tags (
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (material_id, tag_id)
);

-- 12. Material Similarity Table
CREATE TABLE IF NOT EXISTS public.material_similarity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  new_material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  existing_material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  similarity_score NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 14. Downloads Table
CREATE TABLE IF NOT EXISTS public.downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Admin Actions Table
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_materials_file_hash ON public.materials(file_hash);
CREATE INDEX IF NOT EXISTS idx_materials_subject_id ON public.materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_semester_id ON public.materials(semester_id);
CREATE INDEX IF NOT EXISTS idx_materials_course_id ON public.materials(course_id);
CREATE INDEX IF NOT EXISTS idx_materials_type_id ON public.materials(material_type_id);
CREATE INDEX IF NOT EXISTS idx_materials_status ON public.materials(status);
CREATE INDEX IF NOT EXISTS idx_materials_created_at ON public.materials(created_at);
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by ON public.materials(uploaded_by);

-- ==============================================================================
-- Seed Initial Category Data
-- ==============================================================================
INSERT INTO public.courses (name, code) VALUES
('Master of Computer Applications', 'MCA'),
('Bachelor of Computer Applications', 'BCA'),
('Bachelor of Technology in Computer Science', 'BTech-CS'),
('Master of Science in Information Technology', 'MSc-IT')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.semesters (number, label) VALUES
(1, 'Semester 1'),
(2, 'Semester 2'),
(3, 'Semester 3'),
(4, 'Semester 4'),
(5, 'Semester 5'),
(6, 'Semester 6'),
(7, 'Semester 7'),
(8, 'Semester 8')
ON CONFLICT DO NOTHING;

INSERT INTO public.material_types (name, slug) VALUES
('Notes', 'notes'),
('Assignment', 'assignment'),
('Previous Year Question Paper', 'pyq-paper'),
('Lab Manual', 'lab-manual'),
('Question Bank', 'question-bank'),
('E-Book', 'e-book'),
('Practical File', 'practical-file'),
('Other', 'other')
ON CONFLICT (name) DO NOTHING;

-- Populate MCA Semester 1 & 2 Subjects
DO $$
DECLARE
  mca_id UUID;
  sem1_id UUID;
  sem2_id UUID;
  sem3_id UUID;
BEGIN
  SELECT id INTO mca_id FROM public.courses WHERE code = 'MCA' LIMIT 1;
  SELECT id INTO sem1_id FROM public.semesters WHERE number = 1 LIMIT 1;
  SELECT id INTO sem2_id FROM public.semesters WHERE number = 2 LIMIT 1;
  SELECT id INTO sem3_id FROM public.semesters WHERE number = 3 LIMIT 1;

  IF mca_id IS NOT NULL AND sem1_id IS NOT NULL THEN
    INSERT INTO public.subjects (name, course_id, semester_id, code) VALUES
    ('Database Management Systems', mca_id, sem1_id, 'MCA101'),
    ('Data Structures and Algorithms', mca_id, sem1_id, 'MCA102'),
    ('Operating Systems', mca_id, sem1_id, 'MCA103'),
    ('Mathematical Foundations of CS', mca_id, sem1_id, 'MCA104')
    ON CONFLICT (name, course_id, semester_id) DO NOTHING;
  END IF;

  IF mca_id IS NOT NULL AND sem2_id IS NOT NULL THEN
    INSERT INTO public.subjects (name, course_id, semester_id, code) VALUES
    ('Web Technologies & Frameworks', mca_id, sem2_id, 'MCA201'),
    ('Computer Networks & Security', mca_id, sem2_id, 'MCA202'),
    ('Software Engineering & Agile', mca_id, sem2_id, 'MCA203'),
    ('Cloud Computing & DevOps', mca_id, sem2_id, 'MCA204')
    ON CONFLICT (name, course_id, semester_id) DO NOTHING;
  END IF;

  IF mca_id IS NOT NULL AND sem3_id IS NOT NULL THEN
    INSERT INTO public.subjects (name, course_id, semester_id, code) VALUES
    ('Machine Learning & AI', mca_id, sem3_id, 'MCA301'),
    ('Mobile Application Development', mca_id, sem3_id, 'MCA302'),
    ('Information Security & Cryptography', mca_id, sem3_id, 'MCA303')
    ON CONFLICT (name, course_id, semester_id) DO NOTHING;
  END IF;
END $$;

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_similarity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories Policies
DROP POLICY IF EXISTS "Categories viewable by all." ON public.courses;
CREATE POLICY "Categories viewable by all." ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Semesters viewable by all." ON public.semesters;
CREATE POLICY "Semesters viewable by all." ON public.semesters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Subjects viewable by all." ON public.subjects;
CREATE POLICY "Subjects viewable by all." ON public.subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Material types viewable by all." ON public.material_types;
CREATE POLICY "Material types viewable by all." ON public.material_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tags viewable by all." ON public.tags;
CREATE POLICY "Tags viewable by all." ON public.tags FOR SELECT USING (true);

-- Materials Policies
DROP POLICY IF EXISTS "Approved materials viewable by all." ON public.materials;
CREATE POLICY "Approved materials viewable by all." ON public.materials FOR SELECT USING (status = 'approved' OR uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert materials." ON public.materials;
CREATE POLICY "Authenticated users can insert materials." ON public.materials FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own pending materials." ON public.materials;
CREATE POLICY "Users can update own pending materials." ON public.materials FOR UPDATE USING (uploaded_by = auth.uid() AND status = 'pending');

-- Material Files Policies
DROP POLICY IF EXISTS "Files viewable if material is." ON public.material_files;
CREATE POLICY "Files viewable if material is." ON public.material_files FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert files." ON public.material_files;
CREATE POLICY "Authenticated users can insert files." ON public.material_files FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Material Tags and Similarity
DROP POLICY IF EXISTS "Viewable tags by all." ON public.material_tags;
CREATE POLICY "Viewable tags by all." ON public.material_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Viewable similarity by all." ON public.material_similarity;
CREATE POLICY "Viewable similarity by all." ON public.material_similarity FOR SELECT USING (true);

-- Reports & Downloads
DROP POLICY IF EXISTS "Users can create reports." ON public.reports;
CREATE POLICY "Users can create reports." ON public.reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert downloads." ON public.downloads;
CREATE POLICY "Users can insert downloads." ON public.downloads FOR INSERT WITH CHECK (true);
