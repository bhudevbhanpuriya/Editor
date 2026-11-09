import { useContext, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.scss'
import { PlaygroundContext } from '../../../provider/playground-provider';
import { ModelConstant, ModelContext } from '../../../provider/ModelProvider';
import { useConfirm } from '../../../provider/ConfirmProvider';
import { useOptionalNotify } from '../../../provider/NotificationProvider';
import { LanguageBadge } from '../../../components/LanguageBadge';
import { ActionMenu } from '../../../components/ActionMenu';
import { languageMeta } from '../../../config/languages';
import { formatRelative } from '../../../utils/time';
import { startFileDrag, useFileDropTarget } from '../../../utils/drag';
import {
    countFiles,
    playgroundPath,
    recentEntries,
    searchEntries,
    starredEntries
} from '../../../utils/workspace';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const FileCard = ({ file, folder, showFolder = false, matchedIn = null }) => {
    const { deleteFile, toggleStar } = useContext(PlaygroundContext);
    const { openModel } = useContext(ModelContext);
    const navigate = useNavigate();
    const confirm = useConfirm();
    const [isDragging, setIsDragging] = useState(false);

    const open = () => navigate(playgroundPath(file.id, folder.id));

    // Stops the click bubbling to the card, which would open the file.
    const act = (fn) => (e) => {
        e.stopPropagation();
        fn();
    };

    const onDelete = async () => {
        const ok = await confirm({
            title: 'Delete file',
            message: `Delete "${file.title}"? This cannot be undone.`,
            confirmLabel: 'Delete',
            destructive: true
        });
        if (ok) deleteFile(folder.id, file.id);
    };

    // A code match needs its tag more than the edit time; the line only fits one.
    const edited = matchedIn === 'code' ? '' : formatRelative(file.updatedAt);
    const meta = [
        showFolder ? folder.title : languageMeta(file.language).label,
        edited && `edited ${edited}`
    ].filter(Boolean).join(' · ');

    return (
        <div
            className={`card${isDragging ? ' is-dragging' : ''}${file.starred ? ' is-starred' : ''}`}
            role='button'
            tabIndex={0}
            aria-label={`Open ${file.title}`}
            draggable
            onDragStart={(e) => {
                startFileDrag(e, { fileId: file.id, folderId: folder.id, title: file.title });
                setIsDragging(true);
            }}
            onDragEnd={() => setIsDragging(false)}
            onClick={open}
            onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open();
                }
            }}
        >
            <LanguageBadge language={file.language} size='lg' />

            <div className='title-language'>
                <span className='file-title'>{file.title}</span>
                <span className='file-meta'>
                    {meta}
                    {matchedIn === 'code' && <span className='match-tag'>match in code</span>}
                </span>
            </div>

            <div className='icons'>
                <button
                    type='button'
                    className={`star-btn${file.starred ? ' is-starred' : ''}`}
                    aria-label={file.starred ? `Unstar ${file.title}` : `Star ${file.title}`}
                    aria-pressed={file.starred}
                    title={file.starred ? 'Unstar' : 'Star'}
                    onClick={act(() => toggleStar(folder.id, file.id))}
                >
                    <span className='material-icons' aria-hidden='true'>{file.starred ? 'star' : 'star_border'}</span>
                </button>
                <ActionMenu
                    label={`More actions for ${file.title}`}
                    items={[
                        {
                            icon: 'drive_file_move',
                            label: 'Move to folder…',
                            onSelect: () => openModel(ModelConstant.MOVE_FILE, { fileId: file.id, folderId: folder.id })
                        },
                        {
                            icon: 'edit',
                            label: 'Rename',
                            onSelect: () => openModel(ModelConstant.RENAME_FILE, { fileId: file.id, folderId: folder.id })
                        },
                        { icon: 'delete', label: 'Delete', danger: true, onSelect: onDelete }
                    ]}
                />
            </div>
        </div>
    );
};

const FileGrid = ({ entries, showFolder, emptyText }) => (
    <div className='cards-container'>
        {entries.length
            ? entries.map(({ file, folder, matchedIn }) => (
                <FileCard
                    key={file.id}
                    file={file}
                    folder={folder}
                    showFolder={showFolder}
                    matchedIn={matchedIn}
                />
            ))
            : <p className='empty-state'>{emptyText}</p>
        }
    </div>
);

const useMoveInto = () => {
    const { folders, moveFile } = useContext(PlaygroundContext);
    const notify = useOptionalNotify();
    return (fileId, folderId) => {
        moveFile(fileId, folderId);
        const target = folders.find(folder => folder.id === folderId);
        notify(`Moved to ${target?.title ?? 'folder'}`, 'success');
    };
};

const FolderActions = ({ folder, onDeleted }) => {
    const { deleteFolder } = useContext(PlaygroundContext);
    const { openModel } = useContext(ModelContext);
    const confirm = useConfirm();

    const onDeleteFolder = async () => {
        const ok = await confirm({
            title: 'Delete folder',
            message: `Delete the folder "${folder.title}" and everything in it? This cannot be undone.`,
            confirmLabel: 'Delete',
            destructive: true
        });
        if (ok) {
            deleteFolder(folder.id);
            onDeleted?.();
        }
    };

    return (
        <div className='folder-actions'>
            <button type='button' aria-label={`Delete folder ${folder.title}`} title='Delete folder' onClick={onDeleteFolder}>
                <span className='material-icons' aria-hidden='true'>delete</span>
            </button>
            <button
                type='button'
                aria-label={`Rename folder ${folder.title}`}
                title='Rename folder'
                onClick={() => openModel(ModelConstant.RENAME_FOLDER, { folderId: folder.id })}
            >
                <span className='material-icons' aria-hidden='true'>edit</span>
            </button>
            <button
                type='button'
                className='button'
                onClick={() => openModel(ModelConstant.CREATE_FILE, { folderId: folder.id })}
            >
                <span className='material-icons' aria-hidden='true'>add</span>
                <span>New File</span>
            </button>
        </div>
    );
};

const FolderSection = ({ folder, onOpenFolder }) => {
    const headingId = useId();
    const { isOver, dropProps } = useFileDropTarget(folder.id, useMoveInto());

    return (
        <section
            className={`folder-container${isOver ? ' is-drop-target' : ''}`}
            aria-labelledby={headingId}
            {...dropProps}
        >
            <div className='header'>
                <button type='button' className='folder' onClick={onOpenFolder} title='Open folder'>
                    <span className='material-icons' aria-hidden='true'>{isOver ? 'folder_open' : 'folder'}</span>
                    <h2 id={headingId}>{folder.title}</h2>
                    <span className='folder-count'>{folder.files.length}</span>
                </button>
                <FolderActions folder={folder} />
            </div>
            <FileGrid entries={folder.files.map(file => ({ file, folder }))} emptyText='No files yet — create one to get started.' />
        </section>
    );
};

export const RightComponent = ({ view = { type: 'all' }, setView = () => { } }) => {
    const { folders } = useContext(PlaygroundContext);
    const { openModel } = useContext(ModelContext);
    const moveInto = useMoveInto();
    const [query, setQuery] = useState('');

    const folder = view.type === 'folder' ? folders.find(item => item.id === view.folderId) : null;
    // A folder view whose folder was deleted (or a stale link) shows everything.
    const type = view.type === 'folder' && !folder ? 'all' : view.type;
    const searching = query.trim() !== '';

    // The open folder's whole page is a drop target, not just its cards.
    const { isOver, dropProps } = useFileDropTarget(folder?.id, moveInto);

    let title;
    let subtitle;
    let actions = null;
    let body;

    if (searching) {
        const results = searchEntries(folders, query);
        title = 'Search';
        subtitle = `${plural(results.length, 'result')} for "${query.trim()}"`;
        body = <FileGrid entries={results} showFolder emptyText={`No files, folders or code match "${query.trim()}".`} />;
    } else if (type === 'recent') {
        const entries = recentEntries(folders);
        title = 'Recent';
        subtitle = 'Files you opened or edited lately';
        body = <FileGrid entries={entries} showFolder emptyText='Files you open or edit will show up here.' />;
    } else if (type === 'starred') {
        const entries = starredEntries(folders);
        title = 'Starred';
        subtitle = plural(entries.length, 'starred file');
        body = <FileGrid entries={entries} showFolder emptyText='Star a file (☆ on its card) to keep it here.' />;
    } else if (type === 'folder') {
        title = folder.title;
        subtitle = plural(folder.files.length, 'file');
        actions = <FolderActions folder={folder} onDeleted={() => setView({ type: 'all' })} />;
        body = (
            <div className={`folder-page${isOver ? ' is-drop-target' : ''}`} {...dropProps}>
                <FileGrid
                    entries={folder.files.map(file => ({ file, folder }))}
                    emptyText='No files yet — create one, or drag a file here from the sidebar.'
                />
            </div>
        );
    } else {
        title = 'All files';
        subtitle = `${plural(folders.length, 'folder')} · ${plural(countFiles(folders), 'file')}`;
        actions = (
            <button className='add-folder-container' onClick={() => openModel(ModelConstant.CREATE_FOLDER)}>
                <span className='material-icons' aria-hidden='true'>add</span>
                <span>New Folder</span>
            </button>
        );
        body = folders.length
            ? folders.map(item => (
                <FolderSection
                    key={item.id}
                    folder={item}
                    onOpenFolder={() => setView({ type: 'folder', folderId: item.id })}
                />
            ))
            : <div className='cards-container'><p className='empty-state'>No folders yet — create one to get started.</p></div>;
    }

    return (
        <main className='right-container'>
            <div className='header'>
                <div className='heading'>
                    <h1>{title}</h1>
                    <span className='subtitle'>{subtitle}</span>
                </div>

                <div className='header-actions'>
                    <label className='search'>
                        <span className='material-icons' aria-hidden='true'>search</span>
                        <input
                            type='search'
                            aria-label='Search files'
                            placeholder='Search files, folders and code'
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setQuery('');
                            }}
                        />
                    </label>
                    {!searching && actions}
                </div>
            </div>

            {body}
        </main>
    );
}
