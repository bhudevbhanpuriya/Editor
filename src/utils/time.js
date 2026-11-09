const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "just now", "5m ago", "3h ago", "2d ago", then a short date.
 *
 * Returns '' for a missing timestamp: files saved before timestamps existed
 * have none, and showing "Jan 1 1970" for them would be worse than nothing.
 */
export const formatRelative = (timestamp, now = Date.now()) => {
    if (!timestamp) return '';

    const elapsed = Math.max(0, now - timestamp);
    if (elapsed < MINUTE) return 'just now';
    if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
    if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
    if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d ago`;

    const date = new Date(timestamp);
    const sameYear = date.getFullYear() === new Date(now).getFullYear();
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        ...(sameYear ? {} : { year: 'numeric' })
    });
};
