import './CreateFileModel.scss'

import { useContext } from 'react'
import { ModelContext } from '../../ModelProvider'
import { PlaygroundContext } from '../../playground-provider';



export const CreateFileModel = () => {

    const modelFeature = useContext(ModelContext)
    const playgroundFeatures = useContext(PlaygroundContext)

    const onSubmitModel = (e) => {
        e.preventDefault();
        const fileName = e.target.fileName.value;
        const language = e.target.language.value;
        playgroundFeatures.createNewFile(fileName,language, modelFeature.modelPayload)
        closeModel();
    }

    const closeModel = () => {
        modelFeature.closeModel();
    }

    return <div className='model-container'>
        <form className='modelBody' onSubmit={onSubmitModel}>
            <div className='header'>
                <h1 className="bitcount">Create New File</h1>
                <span onClick={closeModel} className="material-icons">close</span>
            </div>

            <div className='input' required>
                <div className='input-box'>
                    <input name="fileName"></input>
                    
                    <select name="language" required>
                        <option value='cpp'>Cpp</option>
                        <option value='java'>Java</option>
                        <option value='javascript'>JavaScript</option>
                        <option value='python'>Python</option>
                    </select>

                </div>
            </div>
            <button type='submit'>
                    Create Folder
            </button>
        </form >
    </div >
}