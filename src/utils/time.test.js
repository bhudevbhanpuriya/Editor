import { formatRelative } from './time';

const NOW = new Date(2026, 5, 15, 12, 0, 0).getTime();
const ago = (ms) => NOW - ms;

it.each([
    [10 * 1000, 'just now'],
    [5 * 60 * 1000, '5m ago'],
    [59 * 60 * 1000, '59m ago'],
    [3 * 60 * 60 * 1000, '3h ago'],
    [2 * 24 * 60 * 60 * 1000, '2d ago']
])('%i ms ago reads as %s', (ms, expected) => {
    expect(formatRelative(ago(ms), NOW)).toBe(expected);
});

it('falls back to a date after a week', () => {
    const text = formatRelative(ago(10 * 24 * 60 * 60 * 1000), NOW);
    expect(text).toMatch(/5/);
    expect(text).not.toMatch(/2026/);
});

it('includes the year for an older year', () => {
    expect(formatRelative(new Date(2024, 0, 3).getTime(), NOW)).toMatch(/2024/);
});

it('returns an empty string for a missing timestamp', () => {
    expect(formatRelative(null, NOW)).toBe('');
    expect(formatRelative(undefined, NOW)).toBe('');
});

it('treats a timestamp in the future (clock skew) as just now', () => {
    expect(formatRelative(NOW + 5000, NOW)).toBe('just now');
});
