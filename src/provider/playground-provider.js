import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createId } from '../utils/id';
import { useOptionalNotify } from "./NotificationProvider";
import { starterCode, supportedLanguages } from "../config/languages";

export const PlaygroundContext = createContext();

const STORAGE_KEY = 'data';

// Bump when the stored shape changes or old data needs repairing; `migrate`
// below runs for anything saved at a lower version.
//   1 - a bare array of folders, written by the pre-fix app
//   2 - { version, folders }, with damaged v1 entries repaired
const STORAGE_VERSION = 2;

// Language metadata lives in src/config/languages.js.

const initialData = [
    {
        id: createId(),
        title: 'DSA',
        files: [
            {
                id: createId(),
                title: 'index',
                code: starterCode('cpp'),
                language: 'cpp'
            }
        ]
    },
    {
        id: createId(),
        title: 'Web-dev',
        files: [
            {
                id: createId(),
                title: 'homepage',
                code: starterCode('javascript'),
                language: 'javascript'
            }
        ]
    }
];

// Typos that shipped in older builds. Anything still unrecognised falls back
// to a supported language so the file can at least be opened and run.
const LANGUAGE_FIXES = { jabascript: 'javascript' };

const normalizeLanguage = (language) => {
    const fixed = LANGUAGE_FIXES[language] ?? language;
    return supportedLanguages.includes(fixed) ? fixed : 'javascript';
};

/**
 * Repairs workspaces saved by the pre-fix app:
 *  - the old "Create Folder" button added a file with no name, code or
 *    language; those are removed
 *  - "Create Playground" dropped the file name; those get a placeholder
 *  - the seeded sample used the language 'jabascript'
 */
const migrate = (folders) => folders.map(folder => ({
    ...folder,
    files: folder.files
        .filter(file => file.title !== undefined || file.language !== undefined)
        .map(file => ({
            ...file,
            title: file.title ?? 'untitled',
            code: typeof file.code === 'string' ? file.code : '',
            language: normalizeLanguage(file.language)
        }))
}));

// Drops anything that does not look like a folder/file, so a corrupted or
// half-written localStorage entry can never crash a render.
const sanitize = (parsed) => {
    if (!Array.isArray(parsed)) return null;
    return parsed
        .filter(folder => folder && typeof folder === 'object' && folder.id)
        .map(folder => ({
            ...folder,
            title: folder.title ?? 'Untitled folder',
            files: Array.isArray(folder.files)
                ? folder.files.filter(file => file && file.id)
                : []
        }));
};

const readStoredFolders = () => {
    let raw;
    try {
        raw = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
        // Private mode / storage disabled: fall back to in-memory data.
        return initialData;
    }
    if (!raw) return initialData;

    try {
        const parsed = JSON.parse(raw);
        // v1 wrote a bare array; v2 wraps it so the shape carries its version.
        const isLegacy = Array.isArray(parsed);
        const version = isLegacy ? 1 : (parsed?.version ?? 1);

        const folders = sanitize(isLegacy ? parsed : parsed?.folders);
        if (!folders) return initialData;

        return version < STORAGE_VERSION ? migrate(folders) : folders;
    } catch (e) {
        console.warn('Invalid localStorage data → resetting');
    }
    return initialData;
};

// Returns false when the write failed, so callers can tell the user rather
// than letting work quietly vanish (localStorage caps out around 5 MB).
const writeStoredFolders = (folders) => {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ version: STORAGE_VERSION, folders })
        );
        return true;
    } catch (e) {
        console.warn('Could not persist playground data', e);
        return false;
    }
};

export const findFile = (folders, folderId, fileId) => {
    const folder = folders?.find(item => item.id === folderId);
    if (!folder) return { folder: null, file: null };
    return { folder, file: folder.files?.find(item => item.id === fileId) ?? null };
};

export const PlayGroundProvider = ({ children }) => {
    const [folders, setFolders] = useState(readStoredFolders);
    const notify = useOptionalNotify();
    const reportedWriteFailure = useRef(false);

    // Single write path: every mutation goes through here, so state and
    // localStorage can never drift apart.
    const commit = useCallback((updater) => setFolders(updater), []);

    // Persisting in an effect keeps the write out of the state updater, which
    // React may run more than once for a single update.
    useEffect(() => {
        const ok = writeStoredFolders(folders);

        if (!ok && !reportedWriteFailure.current) {
            reportedWriteFailure.current = true;
            notify(
                'Could not save to browser storage — it may be full or disabled. Export anything you need to keep.',
                'error'
            );
        } else if (ok) {
            reportedWriteFailure.current = false;
        }
    }, [folders, notify]);

    const createNewFolder = useCallback(({ folderName }) => {
        commit(prev => [...prev, { id: createId(), title: folderName, files: [] }]);
    }, [commit]);

    const createNewFile = useCallback((newFileName, language, folderId) => {
        const newFile = {
            id: createId(),
            title: newFileName,
            code: starterCode(language),
            language
        };
        commit(prev => prev.map(folder =>
            folder.id === folderId
                ? { ...folder, files: [...folder.files, newFile] }
                : folder
        ));
    }, [commit]);

    const createNewPlayground = useCallback(({ folderName, fileName, language }) => {
        commit(prev => [...prev, {
            id: createId(),
            title: folderName,
            files: [{
                id: createId(),
                title: fileName,
                code: starterCode(language),
                language
            }]
        }]);
    }, [commit]);

    /**
     * Creates a folder and file at caller-supplied ids, upserting both.
     *
     * Joining a collaboration session needs the ids up front so it can navigate
     * immediately, which `createNewFile` cannot provide — it mints ids
     * internally and returns nothing. Upserting (rather than appending) keeps a
     * re-join, or a StrictMode double-invoke, from stacking up duplicates.
     */
    const createFileWithIds = useCallback(({
        folderId,
        fileId,
        folderTitle = 'Untitled folder',
        fileTitle = 'untitled',
        language = 'javascript',
        code = ''
    }) => {
        commit(prev => {
            const exists = prev.some(folder => folder.id === folderId);
            const folders = exists
                ? prev
                : [...prev, { id: folderId, title: folderTitle, files: [] }];

            return folders.map(folder => {
                if (folder.id !== folderId) return folder;
                if (folder.files.some(file => file.id === fileId)) return folder;
                return {
                    ...folder,
                    files: [...folder.files, { id: fileId, title: fileTitle, code, language }]
                };
            });
        });
    }, [commit]);

    const deleteFolder = useCallback((id) => {
        commit(prev => prev.filter(folder => folder.id !== id));
    }, [commit]);

    const deleteFile = useCallback((folderId, fileId) => {
        commit(prev => prev.map(folder =>
            folder.id === folderId
                ? { ...folder, files: folder.files.filter(file => file.id !== fileId) }
                : folder
        ));
    }, [commit]);

    const renameFolder = useCallback((newFolderName, id) => {
        commit(prev => prev.map(folder =>
            folder.id === id ? { ...folder, title: newFolderName } : folder
        ));
    }, [commit]);

    const renameFile = useCallback((newFileName, folderId, fileId) => {
        commit(prev => prev.map(folder =>
            folder.id === folderId
                ? {
                    ...folder,
                    files: folder.files.map(file =>
                        file.id === fileId ? { ...file, title: newFileName } : file
                    )
                }
                : folder
        ));
    }, [commit]);

    // `patch` is a partial file, e.g. { code } or { code, language }.
    const updateFile = useCallback((folderId, fileId, patch) => {
        commit(prev => prev.map(folder =>
            folder.id === folderId
                ? {
                    ...folder,
                    files: folder.files.map(file =>
                        file.id === fileId ? { ...file, ...patch } : file
                    )
                }
                : folder
        ));
    }, [commit]);

    const updateFileCode = useCallback((folderId, fileId, newCode) => {
        updateFile(folderId, fileId, { code: newCode });
    }, [updateFile]);

    const playgroundFeatures = useMemo(() => ({
        folders,
        createNewPlayground,
        createNewFolder,
        deleteFolder,
        renameFolder,
        renameFile,
        deleteFile,
        createNewFile,
        createFileWithIds,
        updateFile,
        updateFileCode
    }), [
        folders, createNewPlayground, createNewFolder, deleteFolder,
        renameFolder, renameFile, deleteFile, createNewFile, createFileWithIds,
        updateFile, updateFileCode
    ]);

    return (
        <PlaygroundContext.Provider value={playgroundFeatures}>
            {children}
        </PlaygroundContext.Provider>
    );
}
