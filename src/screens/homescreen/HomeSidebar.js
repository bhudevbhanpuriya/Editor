import { useContext } from 'react';
import { PlaygroundContext } from '../../provider/playground-provider';
import { ModelConstant, ModelContext } from '../../provider/ModelProvider';
import { useOptionalNotify } from '../../provider/NotificationProvider';
import { useOptionalQuickOpen, quickOpenShortcutLabel } from '../../components/QuickOpen';
import { countFiles, recentEntries, starredEntries } from '../../utils/workspace';
import { useFileDropTarget } from '../../utils/drag';

const NavItem = ({ icon, label, count, active, onClick }) => (
    <button
        type="button"
        className={`nav-item${active ? ' is-active' : ''}`}
        aria-current={active ? 'page' : undefined}
        onClick={onClick}
    >
        <span className="material-icons" aria-hidden="true">{icon}</span>
        <span className="nav-label">{label}</span>
        <span className="nav-count" aria-label={`${count} files`}>{count}</span>
    </button>
);

const FolderNavItem = ({ folder, active, onSelect, onDropFile }) => {
    const { isOver, dropProps } = useFileDropTarget(folder.id, onDropFile);

    return (
        <li>
            <button
                type="button"
                className={`nav-item nav-item--folder${active ? ' is-active' : ''}${isOver ? ' is-drop-target' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={onSelect}
                {...dropProps}
            >
                <span className="material-icons" aria-hidden="true">
                    {active || isOver ? 'folder_open' : 'folder'}
                </span>
                <span className="nav-label">{folder.title}</span>
                <span className="nav-count" aria-label={`${folder.files.length} files`}>
                    {folder.files.length}
                </span>
            </button>
        </li>
    );
};

export const HomeSidebar = ({ view, setView }) => {
    const { folders, moveFile } = useContext(PlaygroundContext);
    const { openModel } = useContext(ModelContext);
    const quickOpen = useOptionalQuickOpen();
    const notify = useOptionalNotify();

    const onDropFile = (fileId, folderId) => {
        moveFile(fileId, folderId);
        const target = folders.find(folder => folder.id === folderId);
        notify(`Moved to ${target?.title ?? 'folder'}`, 'success');
    };

    return (
        <aside className="home-sidebar" aria-label="Workspace">
            <div className="brand">
                <img src="/logo2.png" alt="" />
                <div>
                    <h2 className="bitcount">CODEIN.it</h2>
                    <span className="tagline">Code | Debug | Run</span>
                </div>
            </div>

            <div className="sidebar-actions">
                <button
                    type="button"
                    className="create-btn"
                    onClick={() => openModel(ModelConstant.CREATE_PLAYGROUND)}
                >
                    <span className="material-icons" aria-hidden="true">add</span>
                    <span>Create Playground</span>
                </button>

                {quickOpen && (
                    <button type="button" className="quick-open-btn" onClick={quickOpen.open}>
                        <span className="material-icons" aria-hidden="true">search</span>
                        <span>Go to file…</span>
                        <kbd>{quickOpenShortcutLabel()}</kbd>
                    </button>
                )}
            </div>

            <div className="sidebar-scroll">
                <nav className="sidebar-nav" aria-label="Views">
                    <NavItem
                        icon="history"
                        label="Recent"
                        count={recentEntries(folders).length}
                        active={view.type === 'recent'}
                        onClick={() => setView({ type: 'recent' })}
                    />
                    <NavItem
                        icon="star"
                        label="Starred"
                        count={starredEntries(folders).length}
                        active={view.type === 'starred'}
                        onClick={() => setView({ type: 'starred' })}
                    />
                    <NavItem
                        icon="apps"
                        label="All files"
                        count={countFiles(folders)}
                        active={view.type === 'all'}
                        onClick={() => setView({ type: 'all' })}
                    />
                </nav>

                <div className="sidebar-folders">
                    <div className="section-head">
                        <span>Folders</span>
                        <button
                            type="button"
                            className="icon-btn"
                            aria-label="Add folder"
                            title="New folder"
                            onClick={() => openModel(ModelConstant.CREATE_FOLDER)}
                        >
                            <span className="material-icons" aria-hidden="true">create_new_folder</span>
                        </button>
                    </div>

                    <ul aria-label="Folders">
                        {folders.map(folder => (
                            <FolderNavItem
                                key={folder.id}
                                folder={folder}
                                active={view.type === 'folder' && view.folderId === folder.id}
                                onSelect={() => setView({ type: 'folder', folderId: folder.id })}
                                onDropFile={onDropFile}
                            />
                        ))}
                    </ul>

                    {folders.length > 0 && (
                        <p className="drag-hint">Tip: drag a file onto a folder to move it.</p>
                    )}
                </div>
            </div>
        </aside>
    );
};
