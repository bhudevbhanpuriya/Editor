import { createContext, useCallback, useMemo, useState } from "react";

export const ModelContext = createContext();

export const ModelConstant = {
    CREATE_PLAYGROUND: 'CREATE_PLAYGROUND',
    CREATE_FOLDER: 'CREATE_FOLDER',
    CREATE_FILE: 'CREATE_FILE',
    RENAME_FOLDER: 'RENAME_FOLDER',
    RENAME_FILE: 'RENAME_FILE',
    SHARE_SESSION: 'SHARE_SESSION'
}

export const ModelProvider = ({ children }) => {
    const [modelType, setModelType] = useState(null);
    const [modelPayload, setModelPayload] = useState(null);

    // Type and payload are set together so a model can never render against
    // the payload of the previously opened one.
    const openModel = useCallback((type, payload = null) => {
        setModelType(type);
        setModelPayload(payload);
    }, []);

    const closeModel = useCallback(() => {
        setModelType(null);
        setModelPayload(null);
    }, []);

    const modelFeature = useMemo(() => ({
        openModel,
        closeModel,
        activeModel: modelType,
        modelPayload
    }), [openModel, closeModel, modelType, modelPayload]);

    return (
        <ModelContext.Provider value={modelFeature}>
            {children}
        </ModelContext.Provider>
    );
}
