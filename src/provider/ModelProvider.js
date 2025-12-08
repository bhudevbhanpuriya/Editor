import { createContext, useState } from "react";

export const ModelContext = createContext();

export const ModelProvider = ({children}) => {

    const [modelType , setModelType] = useState(null);

    const closeModel = () => {
        setModelType(null);
    }

    const modelFeature = {
        openModel:setModelType,
        closeModel,
        activeModel:modelType
    }


    return (
        <ModelContext.Provider value={modelFeature}>
            {children}
        </ModelContext.Provider>
    );
}