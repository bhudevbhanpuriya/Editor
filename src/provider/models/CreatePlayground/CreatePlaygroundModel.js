import { useContext } from "react"
import "./createPlaygroundModel.scss"
import { ModelContext } from "../../ModelProvider"
import { PlaygroundContext, PlayGroundProvider } from "../../playground-provider"

export const CreatePLaygroundModel = () => {
    const modelFeature = useContext(ModelContext)
    const playgroundFeatures = useContext(PlaygroundContext)
    const closeModel = () =>{
        modelFeature.closeModel()
    }

    const onSubmitModel = (e) => {
        e.preventDefault();
        const folderName = e.target.folderName.value;
        const filename = e.target.fileName.value;
        const language = e.target.language.value;
        
        playgroundFeatures.createNewPlayground({
            folderName,
            filename,
            language
        })
        closeModel()
    }


    return <div className="model-container">
        <form className="modelBody" onSubmit={onSubmitModel}>
            <div className="header">
                <h1 className="bitcount">Create New Playground</h1>
                <span onClick={closeModel} className="material-icons">close</span>
            </div>
            <div className="input">
                <p>Enter Folder Name</p>
                <input name='folderName' required/>
            </div>
            <div className="input">
                <p>Enter Card Name</p>
                <input name='fileName' required/>
            </div>
            <div className="input">
                <select name="language" required>
                    <option value='cpp'>Cpp</option>
                    <option value='java'>Java</option>
                    <option value='javascript'>JavaScript</option>
                    <option value='python'>Python</option>
                </select>
                <button type='submit'>
                    Create Playground
                </button>
            </div>
        </form>
    </div>
}