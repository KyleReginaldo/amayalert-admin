export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'resolved':
      return 'bg-gray-100 text-gray-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
export function getAlertLevelColor(status: string | null) {
  switch (status?.toLowerCase()) {
    case 'low':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'high':
      return 'bg-orange-100 text-orange-700 border border-orange-200';
    case 'critical':
      return 'bg-red-100 text-red-700 border border-red-200';
    case 'total':
      return 'bg-sky-100 text-sky-700 border border-sky-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}

export function getAlertLevelTextColor(status: string | null) {
  switch (status?.toLowerCase()) {
    case 'low':
      return 'text-emerald-700';
    case 'medium':
      return 'text-amber-700';
    case 'high':
      return 'text-orange-700';
    case 'critical':
      return 'text-red-700';
    case 'total':
      return 'text-sky-700';
    default:
      return 'text-slate-600';
  }
}

export function getEvacTopColor(type: string) {
  switch (type.toLowerCase()) {
    case 'total':
      return 'bg-sky-100 text-sky-700 border border-sky-200';
    case 'open':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'capacity':
      return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
    case 'current':
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}

export function getRequestStatColor(type: string) {
  switch (type.toLowerCase()) {
    case 'total':
      return 'bg-sky-100 text-sky-700 border border-sky-200 rounded-lg';
    case 'awaiting':
      return 'bg-amber-100 text-amber-700 border border-amber-200  rounded-lg';
    case 'active':
      return 'bg-blue-100 text-blue-700 border border-blue-200  rounded-lg';
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200  rounded-lg';
    case 'critical':
      return 'bg-red-100 text-red-700 border border-red-200  rounded-lg';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200  rounded-lg';
  }
}

export function getUserStatColor(type: string) {
  switch (type.toLowerCase()) {
    case 'total':
      return 'bg-sky-100 text-sky-700 border border-sky-200';
    case 'with-phone':
      return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
    case 'admins':
      return 'bg-purple-100 text-purple-700 border border-purple-200';
    case 'users':
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'male':
      return 'bg-cyan-100 text-cyan-700 border border-cyan-200';
    case 'female':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}
export function getAdminStatColor(type: string) {
  switch (type.toLowerCase()) {
    case 'total':
      return 'bg-purple-100 text-purple-700 border border-purple-200';
    case 'with-phone':
      return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
    case 'male':
      return 'bg-cyan-100 text-cyan-700 border border-cyan-200';
    case 'female':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}
export function getActivityStatColor(type: string) {
  switch (type.toLowerCase()) {
    case 'total':
      return 'bg-sky-100 text-sky-700 border border-sky-200';
    case 'create':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'update':
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'delete':
      return 'bg-red-100 text-red-700 border border-red-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}
