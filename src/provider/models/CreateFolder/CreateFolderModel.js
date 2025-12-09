import './CreateFolderModel.scss'
import { useContext } from 'react'
import { ModelContext } from '../../ModelProvider'
import { PlaygroundContext } from '../../playground-provider';



export const CreateFolderModel = () => {

    // const modelFeature = useContext(ModelContext);
    const modelFeature = useContext(ModelContext)
    const playgroundFeatures = useContext(PlaygroundContext)

    const onSubmitModel = (e) => {
        e.preventDefault();
        const folderName = e.target.folderName.value;
        playgroundFeatures.createNewPlayground({
            folderName
        })
        closeModel();
    }

    const closeModel = () => {
        modelFeature.closeModel();
    }

    return <div className='model-container'>
        <form className='modelBody' onSubmit={onSubmitModel}>
            <div className='header'>
                <h1 className="bitcount">Create New Folder</h1>
                <span onClick={closeModel} className="material-icons">close</span>
            </div>
            
            <div className='input' required>
                <input name="folderName"></input>
                <button type='submit'>
                    Create Folder
                </button>
            </div>
        </form>
    </div>
}