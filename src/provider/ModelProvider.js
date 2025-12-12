import { createContext, useState } from "react";

export const ModelContext = createContext();

export const ModelConstant = {
    CREATE_PLAYGROUND : 'CREATE_PLAYGROUND',
    CREATE_FOLDER : 'CREATE_FOLDER',
    RENAME_FOLDER : 'RENAME_FOLDER',
    RENAME_FILE : 'RENAME_FILE' 
}

export const ModelProvider = ({children}) => {

    const [modelType , setModelType] = useState(null);
    const [modelPayload , setModelPayload] = useState(null);

    const [renameTrigger , setRenameTrigger ] = useState(0);


    const closeModel = () => {
        setModelType(null);
        setModelPayload(null);
    }


    const modelFeature = {
        openModel:setModelType,
        closeModel,
        activeModel:modelType,
        modelPayload,
        setModelPayload,
        renameTrigger,
        setRenameTrigger
    }


    return (
        <ModelContext.Provider value={modelFeature}>
            {children}
        </ModelContext.Provider>
    );
}