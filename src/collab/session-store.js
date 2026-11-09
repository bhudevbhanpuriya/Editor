/**
 * Maps a room id to the local file that mirrors it.
 *
 * Kept under its own localStorage key rather than inside the workspace `data`
 * blob: the workspace schema stays at version 2, and a corrupt session index
 * can never take down someone's files.
 */

const STORAGE_KEY = 'collab-sessions';

const readAll = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (e) {
        // A corrupt index is not worth surfacing — joining again just remakes it.
        return {};
    }
};

const writeAll = (sessions) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        return true;
    } catch (e) {
        console.warn('Could not persist collaboration sessions', e);
        return false;
    }
};

/** Records which local file mirrors `roomId`. Re-linking overwrites. */
export const linkSession = (roomId, { folderId, fileId, isHost = false }) => {
    if (!roomId || !folderId || !fileId) return false;
    const sessions = readAll();
    sessions[roomId] = { folderId, fileId, isHost, joinedAt: Date.now() };
    return writeAll(sessions);
};

/** The local file mirroring `roomId`, or null if this browser has not joined it. */
export const resolveSession = (roomId) => {
    if (!roomId) return null;
    const entry = readAll()[roomId];
    if (!entry || !entry.folderId || !entry.fileId) return null;
    return entry;
};

export const unlinkSession = (roomId) => {
    const sessions = readAll();
    if (!(roomId in sessions)) return false;
    delete sessions[roomId];
    return writeAll(sessions);
};

export const isHostOf = (roomId) => Boolean(resolveSession(roomId)?.isHost);

export const clearSessions = () => writeAll({});
