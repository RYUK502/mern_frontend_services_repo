export function resolveAvatarUrl(avatar) {
  if (!avatar) return undefined;
  if (avatar.startsWith('http')) return avatar;
  // Adjust as needed for your gateway or backend port
  const base = process.env.REACT_APP_GATEWAY_BASE_URL || 'http://localhost:5000/api';
  if (avatar.startsWith('/uploads/')) {
    return `${base}/media${avatar}`;
  }
  return avatar;
}

// Format time helper
export function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
  if (diff < 604800000) return Math.floor(diff / 86400000) + 'd';
  return date.toLocaleDateString();
}

// Get status tag
export function getStatusTag(status) {
  switch (status) {
    case 'approved':
      return '✓ Approved';
    case 'pending':
      return '⏳ Pending';
    case 'rejected':
      return '❌ Rejected';
    default:
      return status;
  }
}
