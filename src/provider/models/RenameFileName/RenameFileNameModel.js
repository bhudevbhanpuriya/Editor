import { useContext, useState } from "react";
import { ModelContext } from "../../ModelProvider";
import { findFile, PlaygroundContext } from "../../playground-provider";
import { ModelShell } from "../ModelShell";

export const RenameFileNameModel = () => {
    const { closeModel, modelPayload } = useContext(ModelContext);
    const { folders, renameFile } = useContext(PlaygroundContext);
    const [error, setError] = useState("");

    const { file } = findFile(folders, modelPayload?.folderId, modelPayload?.fileId);

    const onSubmitModel = ({ newFileName }) => {
        if (!newFileName) {
            setError("File name cannot be empty.");
            return;
        }

        renameFile(newFileName, modelPayload.folderId, modelPayload.fileId);
        closeModel();
    }

    return (
        <ModelShell
            title="Rename File"
            submitLabel="Rename File"
            onSubmit={onSubmitModel}
            error={error}
        >
            <div className="input">
                <input required name="newFileName" aria-label="New file name" defaultValue={file?.title ?? ""} />
            </div>
        </ModelShell>
    );
}
