import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { findFile, PlaygroundContext } from '../../provider/playground-provider';
import { ModelConstant, ModelContext } from '../../provider/ModelProvider';
import { useOptionalNotify } from '../../provider/NotificationProvider';
import { LanguageBadge } from '../../components/LanguageBadge';
import { quickOpenShortcutLabel, useOptionalQuickOpen } from '../../components/QuickOpen';
import { startFileDrag, useFileDropTarget } from '../../utils/drag';
import { playgroundPath } from '../../utils/workspace';

const COLLAPSED_KEY = 'explorer-collapsed';

// Which folders are collapsed is a per-browser convenience, so failures to
// read or write it are ignored rather than surfaced.
const readCollapsed = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? '[]');
        return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
        return new Set();
    }
};

const writeCollapsed = (set) => {
    try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...set]));
    } catch (e) { /* non-essential */ }
};

const FileRow = ({ file, folder, active }) => {
    const [isDragging, setIsDragging] = useState(false);

    return (
        <li>
            <Link
                to={playgroundPath(file.id, folder.id)}
                className={`tree-row tree-row--file${active ? ' is-active' : ''}${isDragging ? ' is-dragging' : ''}`}
                aria-current={active ? 'page' : undefined}
                draggable
                onDragStart={(e) => {
                    startFileDrag(e, { fileId: file.id, folderId: folder.id, title: file.title });
                    setIsDragging(true);
                }}
                onDragEnd={() => setIsDragging(false)}
            >
                <LanguageBadge language={file.language} size="sm" />
                <span className="tree-label">{file.title}</span>
                {file.starred && (
                    <span className="material-icons tree-star" role="img" aria-label="Starred">star</span>
                )}
            </Link>
        </li>
    );
};

const FolderNode = ({ folder, expanded, onToggle, currentFileId, onNewFile, onDropFile }) => {
    const { isOver, dropProps } = useFileDropTarget(folder.id, onDropFile);

    return (
        <li className="tree-folder">
            <div className={`tree-row tree-row--folder${isOver ? ' is-drop-target' : ''}`} {...dropProps}>
                <button
                    type="button"
                    className="tree-toggle"
                    aria-expanded={expanded}
                    onClick={onToggle}
                >
                    <span className="material-icons tree-chevron" aria-hidden="true">
                        {expanded ? 'expand_more' : 'chevron_right'}
                    </span>
                    <span className="material-icons tree-folder-icon" aria-hidden="true">
                        {expanded || isOver ? 'folder_open' : 'folder'}
                    </span>
                    <span className="tree-label">{folder.title}</span>
                    <span className="tree-count" aria-label={`${folder.files.length} files`}>
                        {folder.files.length}
                    </span>
                </button>
                <button
                    type="button"
                    className="tree-add"
                    aria-label={`New file in ${folder.title}`}
                    title="New file"
                    onClick={onNewFile}
                >
                    <span className="material-icons" aria-hidden="true">add</span>
                </button>
            </div>

            {expanded && (
                <ul className="tree-children">
                    {folder.files.map(file => (
                        <FileRow
                            key={file.id}
                            file={file}
                            folder={folder}
                            active={file.id === currentFileId}
                        />
                    ))}
                    {folder.files.length === 0 && <li className="tree-empty">No files yet</li>}
                </ul>
            )}
        </li>
    );
};

/**
 * The file tree beside the editor, so switching files does not mean going
 * back to the home screen. On narrow screens the same panel is a drawer.
 */
export const FileExplorer = ({ currentFileId, currentFolderId, open, onClose }) => {
    const { folders, moveFile } = useContext(PlaygroundContext);
    const { openModel } = useContext(ModelContext);
    const notify = useOptionalNotify();
    const quickOpen = useOptionalQuickOpen();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(readCollapsed);

    // The folder holding the open file is always expanded, including after
    // the file is moved into a collapsed one.
    const { folder: currentFolder } = findFile(folders, currentFolderId, currentFileId);
    const currentFolderIdResolved = currentFolder?.id;
    useEffect(() => {
        if (!currentFolderIdResolved) return;
        setCollapsed(prev => {
            if (!prev.has(currentFolderIdResolved)) return prev;
            const next = new Set(prev);
            next.delete(currentFolderIdResolved);
            writeCollapsed(next);
            return next;
        });
    }, [currentFolderIdResolved]);

    const toggle = (folderId) => {
        setCollapsed(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) next.delete(folderId);
            else next.add(folderId);
            writeCollapsed(next);
            return next;
        });
    };

    const onDropFile = (fileId, folderId) => {
        moveFile(fileId, folderId);
        const target = folders.find(folder => folder.id === folderId);
        notify(`Moved to ${target?.title ?? 'folder'}`, 'success');
    };

    const newFileIn = (folderId) => {
        openModel(ModelConstant.CREATE_FILE, {
            folderId,
            onCreated: (fileId, inFolderId) => navigate(playgroundPath(fileId, inFolderId))
        });
    };

    return (
        <aside
            id="file-explorer"
            className={`file-explorer${open ? ' is-open' : ''}`}
            aria-label="Files"
            hidden={!open}
        >
            <div className="explorer-head">
                <span className="explorer-title">Files</span>
                <div className="explorer-actions">
                    <button
                        type="button"
                        aria-label="New folder"
                        title="New folder"
                        onClick={() => openModel(ModelConstant.CREATE_FOLDER)}
                    >
                        <span className="material-icons" aria-hidden="true">create_new_folder</span>
                    </button>
                    <button type="button" aria-label="Collapse files panel" title="Hide files" onClick={onClose}>
                        <span className="material-icons" aria-hidden="true">first_page</span>
                    </button>
                </div>
            </div>

            {quickOpen && (
                <button type="button" className="explorer-find" onClick={quickOpen.open}>
                    <span className="material-icons" aria-hidden="true">search</span>
                    <span>Go to file…</span>
                    <kbd>{quickOpenShortcutLabel()}</kbd>
                </button>
            )}

            <ul className="explorer-tree">
                {folders.map(folder => (
                    <FolderNode
                        key={folder.id}
                        folder={folder}
                        expanded={!collapsed.has(folder.id)}
                        onToggle={() => toggle(folder.id)}
                        currentFileId={currentFileId}
                        onNewFile={() => newFileIn(folder.id)}
                        onDropFile={onDropFile}
                    />
                ))}
            </ul>

            <Link to="/" className="explorer-home">
                <span className="material-icons" aria-hidden="true">dashboard</span>
                <span>All files</span>
            </Link>
        </aside>
    );
};
