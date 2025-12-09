import { useContext } from 'react'
import './UpdateFolderTitleModel.scss'
import { ModelContext } from '../../ModelProvider';
import { PlaygroundContext } from '../../playground-provider';


export const UpdateFolderTitleModel = () => {

    const {closeModel , modelPayload} = useContext(ModelContext);
    const playgroundFeatures = useContext(PlaygroundContext);


    const onSubmitModel = (e) => {
        e.preventDefault();
        // console.log(e.target.id.value);
        const newFolderName = e.target.newFolderName.value;
        playgroundFeatures.renameFolder(newFolderName,modelPayload.folderId);
        closeModel();
    }

    return <div className='model-container'>
        <form className='modelBody' onSubmit={onSubmitModel}>
            <div className='header'>
                <h1 className="bitcount">Edit Folder Title</h1>
                <span onClick={closeModel} className="material-icons">close</span>
            </div>
            
            <div className='input' >
                <input required name="newFolderName" ></input>
                <button type='submit'>
                    Rename Folder
                </button>
            </div>
        </form>
    </div>
}