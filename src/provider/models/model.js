import { useContext } from "react"
import { ModelContext } from "../ModelProvider"
import { CreatePLaygroundModel } from "./CreatePlaygroundModel";

export const Model = () => {
    const modelFeature = useContext(ModelContext);
    
    return <>
        {modelFeature.activeModel === "CREATE_PLAYGROUND" && <CreatePLaygroundModel/>}
    </>
}