import { CheckCircle2, Clock, AlertCircle, Shield } from 'lucide-react';

/**
 * StatusBadge Component
 * Displays document verification status with standard semantic styling
 */
export const StatusBadge = ({ status, reason }) => {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        Approved
      </span>
    );
  }

  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        Under Review
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span
        title={reason || 'Did not meet requirements'}
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
      {status || 'Unknown'}
    </span>
  );
};

/**
 * MaterialTypeBadge Component
 * Differentiates material categories (Notes, PYQ, Lab Manual, etc.)
 */
export const MaterialTypeBadge = ({ type }) => {
  const normalized = (type || '').toLowerCase();

  let colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
  if (normalized.includes('pyq') || normalized.includes('paper') || normalized.includes('question')) {
    colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (normalized.includes('lab') || normalized.includes('manual') || normalized.includes('practical')) {
    colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
  } else if (normalized.includes('assignment')) {
    colorClasses = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (normalized.includes('book')) {
    colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border uppercase tracking-wider ${colorClasses}`}>
      {type || 'Notes'}
    </span>
  );
};

/**
 * RoleBadge Component
 * Displays user role (Admin vs Student)
 */
export const RoleBadge = ({ role }) => {
  const isAdmin = role === 'admin';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
      isAdmin
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-blue-50 text-blue-700 border-blue-200'
    }`}>
      {isAdmin && <Shield className="w-3 h-3 text-amber-600" />}
      {isAdmin ? 'Admin' : 'Student'}
    </span>
  );
};
