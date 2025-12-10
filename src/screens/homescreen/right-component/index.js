import { useContext } from 'react';
import { PlaygroundContext, PlayGroundProvider } from '../../../provider/playground-provider';
import './index.scss'
import { ModelConstant, ModelContext } from '../../../provider/ModelProvider';
import { useNavigate } from 'react-router-dom';


const Folder = ({ folderTitle, cards, folderId }) => {
    const playgroundFeatures = useContext(PlaygroundContext);
    const { setModelPayload, openModel } = useContext(ModelContext);
    const navigate = useNavigate();

    const deleteFolder = () => {
        playgroundFeatures.deleteFolder(folderId);
    }

    const openRenameFolderModel = () => {
        // playgroundFeatures.renameFolder(id);
        // console.log(id);
        setModelPayload({folderId : folderId});
        openModel(ModelConstant.RENAME_FOLDER);
    }

    const openCreateNewFile = () => {
        setModelPayload(folderId);
        openModel(ModelConstant.CREATE_FILE);
    }


    return <div className='folder-container'>
        <div className='header'>
            <div className='folder'>
                <span className='material-icons'>folder</span>
                <span>{folderTitle}</span>
            </div>
            <div className='icons'>
                <span className='material-icons' onClick={deleteFolder}>delete</span>
                <span className='material-icons' onClick={openRenameFolderModel}>edit</span>
                <button className='button' onClick={openCreateNewFile}>
                    <span className='material-icons'>add</span>
                    <span>New Playground</span>

                </button>

            </div>
        </div>
        <div className='cards-container'>
            {

                cards?.map((file, index) => {

                    const openPlaygroundScreen = () => {
                        // console.log(`file id is `,file.id);
                        // console.log(`folder id is`,folderId);
                        navigate(`/playground/${file.id}/${folderId}`);
                    }

                    const openRenameFileModel = () => {
                        setModelPayload({fileId : file.id ,folderId: folderId})
                        openModel(ModelConstant.RENAME_FILE);
                    }

                    const deleteFile = () => {
                        // setModelPayload({file: file.id});
                        playgroundFeatures.deleteFile(file.id);
                    }

                    return (
                        <div className='card' key={index} onClick={openPlaygroundScreen}>
                            <img src={'./logo.png'} alt='logo' />

                            <div className='title-language'>
                                <span> {file?.title}</span>
                                <span> Language: {file?.language}</span>
                            </div>

                            <div className='icons'>
                                <span className='material-icons' onClick={deleteFile}>delete</span>
                                <span className='material-icons' onClick={openRenameFileModel}>edit</span>
                            </div>
                        </div>
                    );

                })}

        </div>
    </div>
}


export const RightComponent = () => {
    const { folders } = useContext(PlaygroundContext);
    const modelFeatures = useContext(ModelContext);

    const openCreateNewFolderModel = () => {
        modelFeatures.openModel(ModelConstant.CREATE_FOLDER)
    }

    return (
        <div className='right-container'>
            <div className='header'>
                <h1 >My PlayGround</h1>
                <button className='add-folder-container' onClick={openCreateNewFolderModel}>
                    <span className='material-icons'>add</span>
                    <span>New Folder</span>
                </button>
            </div>
            {
                folders?.map((folder, index) => {
                    if (!folder) return null;
                    return <Folder folderTitle={folder?.title} cards={folder?.files} folderId={folder.id} key={folder.id} />
                })
            }
        </div>

    );
}