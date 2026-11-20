import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Generic fetch wrapper that attaches the Supabase session token if available
 */
async function fetchWithAuth(endpoint, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = {
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.error || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Categories
  getCategories: () => fetchWithAuth('/categories'),
  getCourses: () => fetchWithAuth('/categories/courses'),
  getSemesters: () => fetchWithAuth('/categories/semesters'),
  getSubjects: (courseId, semesterId) => {
    const params = new URLSearchParams();
    if (courseId) params.append('course_id', courseId);
    if (semesterId) params.append('semester_id', semesterId);
    return fetchWithAuth(`/categories/subjects?${params.toString()}`);
  },
  getMaterialTypes: () => fetchWithAuth('/categories/material-types'),

  // Materials
  getMaterials: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return fetchWithAuth(`/materials?${params.toString()}`);
  },
  getMaterialById: (id) => fetchWithAuth(`/materials/${id}`),
  getMyUploads: () => fetchWithAuth('/materials/user/my-uploads'),
  uploadMaterial: (formData) => fetchWithAuth('/materials/upload', {
    method: 'POST',
    body: formData
  }),
  getDownloadUrl: (id) => fetchWithAuth(`/materials/${id}/download`),
  getPreviewUrl: (id) => fetchWithAuth(`/materials/${id}/download?inline=true`),

  // Stats
  getStats: () => fetchWithAuth('/stats'),

  // Reports
  submitReport: (reportData) => fetchWithAuth('/reports', {
    method: 'POST',
    body: JSON.stringify(reportData)
  }),

  // Admin APIs
  getAdminStats: () => fetchWithAuth('/admin/stats'),
  getAdminMaterials: (status = 'pending', search = '') => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    return fetchWithAuth(`/admin/materials?${params.toString()}`);
  },
  updateMaterialStatus: (id, status, reason = '') => fetchWithAuth(`/admin/materials/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, rejection_reason: reason })
  }),
  deleteMaterial: (id) => fetchWithAuth(`/admin/materials/${id}`, {
    method: 'DELETE'
  }),
  getAdminReports: () => fetchWithAuth('/admin/reports'),
  updateReportStatus: (id, status) => fetchWithAuth(`/admin/reports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  getAdminUsers: () => fetchWithAuth('/admin/users'),
  updateUserRole: (id, role) => fetchWithAuth(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  }),
  createCourse: (courseData) => fetchWithAuth('/admin/categories/courses', {
    method: 'POST',
    body: JSON.stringify(courseData)
  }),
  updateCourse: (id, courseData) => fetchWithAuth(`/admin/categories/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(courseData)
  }),
  deleteCourse: (id) => fetchWithAuth(`/admin/categories/courses/${id}`, {
    method: 'DELETE'
  }),
  createSubject: (subjectData) => fetchWithAuth('/admin/categories/subjects', {
    method: 'POST',
    body: JSON.stringify(subjectData)
  }),
  updateSubject: (id, subjectData) => fetchWithAuth(`/admin/categories/subjects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(subjectData)
  }),
  deleteSubject: (id) => fetchWithAuth(`/admin/categories/subjects/${id}`, {
    method: 'DELETE'
  })
};
