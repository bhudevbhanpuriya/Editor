import { useContext } from 'react';
import { PlaygroundContext } from '../../../provider/playground-provider';
import './index.scss'
import { ModelConstant, ModelContext } from '../../../provider/ModelProvider';
import { useNavigate } from 'react-router-dom';
import { useConfirm } from '../../../provider/ConfirmProvider';

const FileCard = ({ file, folderId }) => {
    const { deleteFile } = useContext(PlaygroundContext);
    const { openModel } = useContext(ModelContext);
    const navigate = useNavigate();
    const confirm = useConfirm();

    const openPlaygroundScreen = () => {
        navigate(`/playground/${file.id}/${folderId}`);
    }

    // Without stopPropagation these bubble to the card and navigate into the
    // playground of the file that was just deleted/renamed.
    const openRenameFileModel = (e) => {
        e.stopPropagation();
        openModel(ModelConstant.RENAME_FILE, { fileId: file.id, folderId });
    }

    const onDeleteFile = async (e) => {
        e.stopPropagation();
        const ok = await confirm({
            title: 'Delete file',
            message: `Delete "${file.title}"? This cannot be undone.`,
            confirmLabel: 'Delete',
            destructive: true
        });
        if (ok) deleteFile(folderId, file.id);
    }

    return (
        <div
            className='card'
            role='button'
            tabIndex={0}
            onClick={openPlaygroundScreen}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openPlaygroundScreen();
                }
            }}
        >
            <img src={'./logo.png'} alt='' />

            <div className='title-language'>
                <span> {file.title}</span>
                <span> Language: {file.language}</span>
            </div>

            <div className='icons'>
                <button type='button' aria-label={`Delete ${file.title}`} onClick={onDeleteFile}>
                    <span className='material-icons'>delete</span>
                </button>
                <button type='button' aria-label={`Rename ${file.title}`} onClick={openRenameFileModel}>
                    <span className='material-icons'>edit</span>
                </button>
            </div>
        </div>
    );
};

const Folder = ({ folderTitle, cards, folderId }) => {
    const { deleteFolder } = useContext(PlaygroundContext);
    const { openModel } = useContext(ModelContext);
    const confirm = useConfirm();

    const onDeleteFolder = async () => {
        const ok = await confirm({
            title: 'Delete folder',
            message: `Delete the folder "${folderTitle}" and everything in it? This cannot be undone.`,
            confirmLabel: 'Delete',
            destructive: true
        });
        if (ok) deleteFolder(folderId);
    }

    const openRenameFolderModel = () => {
        openModel(ModelConstant.RENAME_FOLDER, { folderId });
    }

    const openCreateNewFile = () => {
        openModel(ModelConstant.CREATE_FILE, { folderId });
    }

    return <div className='folder-container'>
        <div className='header'>
            <div className='folder'>
                <span className='material-icons'>folder</span>
                <span>{folderTitle}</span>
            </div>
            <div className='icons'>
                <button type='button' aria-label={`Delete folder ${folderTitle}`} onClick={onDeleteFolder}>
                    <span className='material-icons'>delete</span>
                </button>
                <button type='button' aria-label={`Rename folder ${folderTitle}`} onClick={openRenameFolderModel}>
                    <span className='material-icons'>edit</span>
                </button>
                <button className='button' onClick={openCreateNewFile}>
                    <span className='material-icons'>add</span>
                    <span>New Playground</span>
                </button>
            </div>
        </div>
        <div className='cards-container'>
            {cards?.length
                ? cards.map(file => (
                    <FileCard key={file.id} file={file} folderId={folderId} />
                ))
                : <p className='empty-state'>No files yet — create one to get started.</p>
            }
        </div>
    </div>
}

export const RightComponent = () => {
    const { folders } = useContext(PlaygroundContext);
    const { openModel } = useContext(ModelContext);

    const openCreateNewFolderModel = () => {
        openModel(ModelConstant.CREATE_FOLDER);
    }

    return (
        <div className='right-container'>
            <div className='header'>
                <h1>My PlayGround</h1>
                <button className='add-folder-container' onClick={openCreateNewFolderModel}>
                    <span className='material-icons'>add</span>
                    <span>New Folder</span>
                </button>
            </div>
            {folders?.map(folder => (
                <Folder
                    key={folder.id}
                    folderTitle={folder.title}
                    cards={folder.files}
                    folderId={folder.id}
                />
            ))}
        </div>
    );
}
