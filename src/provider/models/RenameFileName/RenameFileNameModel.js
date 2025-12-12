import { useContext } from "react";
import { ModelContext } from "../../ModelProvider";
import { PlaygroundContext } from "../../playground-provider";


export const RenameFileNameModel = () => {
    const {closeModel , modelPayload , setRenameTrigger} = useContext(ModelContext);
    const playgroundFeatures = useContext(PlaygroundContext);


    const onSubmitModel = (e) => {
        e.preventDefault();
        const newFileName = e.target.newFileName.value;
        playgroundFeatures.renameFile(newFileName,modelPayload.folderId, modelPayload.fileId );
        setRenameTrigger(prev => prev+1);
        closeModel();
    }

    return <div className='model-container'>
        <form className='modelBody' onSubmit={onSubmitModel}>
            <div className='header'>
                <h1 className="bitcount">Rename File</h1>
                <span onClick={closeModel} className="material-icons">close</span>
            </div>
            
            <div className='input' >
                <input required name="newFileName"></input>
                <button type='submit'>
                    Rename Folder
                </button>
            </div>
        </form>
    </div>
}

