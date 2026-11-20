# Centralized College Study Material Sharing Platform

A full-stack academic repository web application that allows college students to upload, discover, preview, download, and share verified study materials (notes, previous-year question papers, lab manuals, assignments, and e-books).

## 🚀 Key Features
- **Student & Admin Authentication:** Powered by Supabase Auth with custom role-based access control.
- **Categorized Academic Structure:** Organizes materials by Course, Semester, Subject, Material Type, and Academic Year.
- **Duplicate & Similarity Detection:** Exact duplicate detection using SHA-256 and similar document detection.
- **Admin Verification Workflow:** Moderation pipeline where submitted materials are reviewed, approved, or rejected with reasons.
- **In-Browser PDF Preview & Download:** Fast previews and tracked downloads.
- **Material Reporting System:** Enables community flagging of inappropriate or inaccurate files.

## 🛠️ Tech Stack
- **Frontend:** React.js, Vite, Tailwind CSS, Lucide React, Axios
- **Backend:** Node.js, Express.js, Supabase Admin API
- **Database & Storage:** Supabase PostgreSQL, Supabase Auth, Supabase Storage
- **Security:** PostgreSQL Row Level Security (RLS) policies

## 📂 Project Structure
```
├── backend/
│   ├── src/
│   │   ├── routes/       # API endpoints (auth, materials, categories, admin, reports, stats)
│   │   ├── middlewares/  # Authentication & authorization middlewares
│   │   ├── server.js     # Express server entry point
│   │   └── supabase.js   # Supabase client initialization
│   └── scripts/          # Helper scripts (set_admin, reset_password)
├── frontend/
│   ├── src/
│   │   ├── pages/        # React pages (Auth, Dashboard, Browse, Upload, AdminDashboard)
│   │   ├── layouts/      # Student layout with navigation
│   │   ├── context/      # AuthContext for authentication state
│   │   └── services/     # Axios / fetch API client
└── database/
    ├── complete_setup.sql # Complete master database schema, tables, triggers, and RLS
    ├── policies.sql       # Row Level Security policies
    └── seed.sql           # Initial category data
```

## ⚙️ Setup & Installation

### 1. Database Setup
1. Create a project at [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Run the script found in `database/complete_setup.sql`.

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase URL, Secret Key, and Port
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Supabase URL and Anon Key
npm run dev
```

## 📜 License
Academic MCA Project.
