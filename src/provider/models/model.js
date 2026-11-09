import { useContext } from "react"
import { ModelConstant, ModelContext } from "../ModelProvider"
import { CreatePLaygroundModel } from "./CreatePlayground/CreatePlaygroundModel";
import { CreateFolderModel } from "./CreateFolder/CreateFolderModel";
import {UpdateFolderTitleModel} from "./RenameFolderTitle/UpdateFolderTitleModel"
import { RenameFileNameModel } from "./RenameFileName/RenameFileNameModel";
import { CreateFileModel } from "./CreatFile/CreateFileModel";
import { ShareSessionModel } from "./Share/ShareSessionModel";
import { MoveFileModel } from "./MoveFile/MoveFileModel";



export const Model = () => {
    const modelFeature = useContext(ModelContext);
    
    return <>
        {modelFeature.activeModel === ModelConstant.CREATE_PLAYGROUND && <CreatePLaygroundModel/>}
        {modelFeature.activeModel === ModelConstant.CREATE_FOLDER && <CreateFolderModel/>}
        {modelFeature.activeModel === ModelConstant.RENAME_FOLDER && <UpdateFolderTitleModel/>}
        {modelFeature.activeModel === ModelConstant.RENAME_FILE && <RenameFileNameModel/>}
        {modelFeature.activeModel === ModelConstant.CREATE_FILE && <CreateFileModel/>}
        {modelFeature.activeModel === ModelConstant.SHARE_SESSION && <ShareSessionModel/>}
        {modelFeature.activeModel === ModelConstant.MOVE_FILE && <MoveFileModel/>}
    </>
}