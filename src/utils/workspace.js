/**
 * Read-only views over the workspace (an array of folders, each with files).
 * Every helper returns `{ file, folder }` entries so callers can both render
 * the file and build its `/playground/:fileId/:folderId` link.
 */

export const playgroundPath = (fileId, folderId) => `/playground/${fileId}/${folderId}`;

export const allEntries = (folders = []) =>
    folders.flatMap(folder => (folder.files ?? []).map(file => ({ file, folder })));

export const countFiles = (folders = []) =>
    folders.reduce((total, folder) => total + (folder.files?.length ?? 0), 0);

// Opening a file counts as activity, not just editing it: Recent is for
// "get me back to what I was just looking at".
export const lastActivity = (file) => Math.max(file.openedAt ?? 0, file.updatedAt ?? 0);

export const RECENT_LIMIT = 12;

export const recentEntries = (folders, limit = RECENT_LIMIT) =>
    allEntries(folders)
        .filter(({ file }) => lastActivity(file) > 0)
        .sort((a, b) => lastActivity(b.file) - lastActivity(a.file))
        .slice(0, limit);

export const starredEntries = (folders) =>
    allEntries(folders)
        .filter(({ file }) => file.starred)
        .sort((a, b) => lastActivity(b.file) - lastActivity(a.file));

const includes = (haystack, needle) => (haystack ?? '').toLowerCase().includes(needle);

/**
 * Case-insensitive match on file name, folder name and code. Name matches
 * rank above code matches; each entry reports where it matched so the UI can
 * say "match in code" when the name alone would not explain the result.
 */
export const searchEntries = (folders, query) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];

    const rank = { title: 0, folder: 1, code: 2 };

    return allEntries(folders)
        .map(entry => {
            const { file, folder } = entry;
            const matchedIn = includes(file.title, needle) ? 'title'
                : includes(folder.title, needle) ? 'folder'
                    : includes(file.code, needle) ? 'code'
                        : null;
            return matchedIn ? { ...entry, matchedIn } : null;
        })
        .filter(Boolean)
        .sort((a, b) => rank[a.matchedIn] - rank[b.matchedIn]);
};

/**
 * Ranking for the quick switcher, which jumps by name: a file name that
 * starts with the query beats one that merely contains it, which beats a
 * folder-name match. Code is deliberately not searched here.
 */
export const quickOpenEntries = (folders, query, limit = 50) => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
        const recent = recentEntries(folders, limit);
        return recent.length ? recent : allEntries(folders).slice(0, limit);
    }

    const score = ({ file, folder }) => {
        const title = (file.title ?? '').toLowerCase();
        if (title.startsWith(needle)) return 0;
        if (title.includes(needle)) return 1;
        if (includes(folder.title, needle)) return 2;
        return null;
    };

    return allEntries(folders)
        .map(entry => ({ entry, score: score(entry) }))
        .filter(({ score: s }) => s !== null)
        .sort((a, b) => a.score - b.score)
        .slice(0, limit)
        .map(({ entry }) => entry);
};
