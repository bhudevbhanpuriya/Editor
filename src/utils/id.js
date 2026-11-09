/**
 * Generates a unique id.
 *
 * Replaces the `uuid` package: crypto.randomUUID is built into every browser
 * the app targets, and uuid v13 is ESM-only, which breaks Jest under CRA.
 * randomUUID is only exposed in secure contexts, so keep a fallback for
 * plain-http origins.
 */
export const createId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
        const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};
