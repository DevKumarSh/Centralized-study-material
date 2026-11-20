-- seed.sql
-- Insert initial categories
INSERT INTO courses (name, code) VALUES
('Master of Computer Applications', 'MCA'),
('Bachelor of Computer Applications', 'BCA'),
('Bachelor of Technology in Computer Science', 'BTech-CS')
ON CONFLICT (name) DO NOTHING;

INSERT INTO semesters (number, label) VALUES
(1, 'Semester 1'),
(2, 'Semester 2'),
(3, 'Semester 3'),
(4, 'Semester 4'),
(5, 'Semester 5'),
(6, 'Semester 6'),
(7, 'Semester 7'),
(8, 'Semester 8');

INSERT INTO material_types (name, slug) VALUES
('Notes', 'notes'),
('Assignment', 'assignment'),
('Previous Year Question Paper', 'pyq-paper'),
('Lab Manual', 'lab-manual'),
('Question Bank', 'question-bank'),
('E-Book', 'e-book'),
('Practical File', 'practical-file'),
('Other', 'other')
ON CONFLICT (name) DO NOTHING;

-- Example Subjects for MCA Semester 1
WITH course AS (SELECT id FROM courses WHERE code = 'MCA'),
     sem AS (SELECT id FROM semesters WHERE number = 1)
INSERT INTO subjects (name, course_id, semester_id, code) VALUES
('Database Management Systems', (SELECT id FROM course), (SELECT id FROM sem), 'MCA101'),
('Data Structures and Algorithms', (SELECT id FROM course), (SELECT id FROM sem), 'MCA102'),
('Operating Systems', (SELECT id FROM course), (SELECT id FROM sem), 'MCA103');
