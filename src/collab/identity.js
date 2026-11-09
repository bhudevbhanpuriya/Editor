import { createId } from '../utils/id';

/**
 * A local display identity for collaboration. There are no accounts, so this
 * is just a name remembered in this browser.
 */

const STORAGE_KEY = 'collab-identity';

// Kept in sync with the .remote-caret--N / .remote-selection--N classes in
// collaboration.scss. An index rather than a hex string so colours live in CSS
// and no per-client <style> tag has to be injected or cleaned up.
export const PALETTE_SIZE = 8;

/**
 * Deterministic so every peer renders the same person in the same colour.
 * Collisions above 8 peers are cosmetic; the server caps rooms at 12.
 */
export const colorIndexFor = (key) => {
    const text = String(key ?? '');
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash * 31 + text.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % PALETTE_SIZE;
};

const randomName = () => `Guest ${Math.floor(1000 + Math.random() * 9000)}`;

export const loadIdentity = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.id && parsed?.name) return parsed;
        }
    } catch (e) {
        // fall through and mint a new one
    }

    const identity = { id: createId(), name: randomName() };
    saveIdentity(identity);
    return identity;
};

export const saveIdentity = (identity) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
        return true;
    } catch (e) {
        return false;
    }
};

export const setDisplayName = (name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return loadIdentity();
    const identity = { ...loadIdentity(), name: trimmed.slice(0, 32) };
    saveIdentity(identity);
    return identity;
};

export const initialsOf = (name) => String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('') || '?';
