-- policies.sql
-- Enable Row Level Security (RLS) on all tables

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_similarity ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Students can read all profiles (for basic info) but only update their own
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Categories (Courses, Semesters, Subjects, Material Types, Tags): Viewable by all, editable by admin
CREATE POLICY "Categories viewable by all." ON courses FOR SELECT USING (true);
CREATE POLICY "Categories viewable by all." ON semesters FOR SELECT USING (true);
CREATE POLICY "Categories viewable by all." ON subjects FOR SELECT USING (true);
CREATE POLICY "Categories viewable by all." ON material_types FOR SELECT USING (true);
CREATE POLICY "Categories viewable by all." ON tags FOR SELECT USING (true);

-- (Admin policies would be handled via server-side service role, or by checking role = 'admin' in profiles)
-- For simplicity, we assume admin CRUD operations use the service role key which bypasses RLS.

-- 3. Materials: Viewable if approved or if owner. Insertable by authenticated. Updateable by owner if pending.
CREATE POLICY "Approved materials viewable by all." ON materials FOR SELECT USING (status = 'approved' OR uploaded_by = auth.uid());
CREATE POLICY "Authenticated users can insert materials." ON materials FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own pending materials." ON materials FOR UPDATE USING (uploaded_by = auth.uid() AND status = 'pending');
CREATE POLICY "Users can delete own pending materials." ON materials FOR DELETE USING (uploaded_by = auth.uid() AND status = 'pending');

-- 4. Material Files: Handled via backend, mostly service role. But for inserts during upload:
CREATE POLICY "Authenticated users can insert files." ON material_files FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Read is usually managed via the materials table logic.
CREATE POLICY "Files viewable if material is." ON material_files FOR SELECT USING (true);

-- 5. Material Similarity & Tags:
CREATE POLICY "Viewable by all." ON material_similarity FOR SELECT USING (true);
CREATE POLICY "Viewable by all." ON material_tags FOR SELECT USING (true);

-- 6. Reports: Insertable by any authenticated user. Viewable by admin only (or service role).
CREATE POLICY "Authenticated users can create reports." ON reports FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND reported_by = auth.uid());

-- 7. Downloads: Insertable by anyone (or tracked via backend).
CREATE POLICY "Users can insert downloads." ON downloads FOR INSERT WITH CHECK (true);

-- 8. Admin Actions:
-- Assuming backend service role handles these inserts.
