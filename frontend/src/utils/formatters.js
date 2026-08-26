/**
 * formatters.js - Clinical token and text formatting utilities
 */

/**
 * Resolves the clean daily sequential clinical token number (1, 2, 3...)
 * from queue_number, visit_number (e.g. V-20260826-001 -> 1), or fallback index.
 * Raw database auto-increment IDs (e.g. 78, 79) are never exposed.
 */
export function getDailyTokenNumber(item, fallbackIndex = 0) {
  if (!item) return fallbackIndex + 1;

  if (item.queue_number && Number(item.queue_number) > 0) {
    return Number(item.queue_number);
  }
  if (item.token_number && Number(item.token_number) > 0) {
    return Number(item.token_number);
  }
  if (item.visit_number && typeof item.visit_number === 'string') {
    const parts = item.visit_number.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq) && lastSeq > 0) return lastSeq;
  }
  return fallbackIndex + 1;
}

/**
 * Formats a clean clinical token string (e.g. "Token #1")
 */
export function formatTokenString(item, fallbackIndex = 0) {
  const token = getDailyTokenNumber(item, fallbackIndex);
  return `Token #${token}`;
}

/**
 * Resolves a clean display name for the attending doctor,
 * preventing system usernames like 'admin' or 'administrator' from being shown.
 */
export function formatDoctorDisplayName(consultantAssigned, fallbackUser = null) {
  const c = String(consultantAssigned || '').trim();
  if (c && !c.toLowerCase().includes('admin')) {
    return c.startsWith('Dr.') ? c : `Dr. ${c}`;
  }
  const u = String(fallbackUser?.full_name || fallbackUser || '').trim();
  if (u && !u.toLowerCase().includes('admin')) {
    return u.startsWith('Dr.') ? u : `Dr. ${u}`;
  }
  return 'Dr. T.S.Jeyagowthaman';
}
