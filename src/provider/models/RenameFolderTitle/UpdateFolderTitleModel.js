import { useContext, useState } from 'react'
import { ModelContext } from '../../ModelProvider';
import { PlaygroundContext } from '../../playground-provider';
import { ModelShell } from '../ModelShell';

export const UpdateFolderTitleModel = () => {
    const { closeModel, modelPayload } = useContext(ModelContext);
    const { folders, renameFolder } = useContext(PlaygroundContext);
    const [error, setError] = useState("");

    const folder = folders?.find(item => item.id === modelPayload?.folderId);

    const onSubmitModel = ({ newFolderName }) => {
        if (!newFolderName) {
            setError("Folder name cannot be empty.");
            return;
        }

        renameFolder(newFolderName, modelPayload.folderId);
        closeModel();
    }

    return (
        <ModelShell
            title="Edit Folder Title"
            submitLabel="Rename Folder"
            onSubmit={onSubmitModel}
            error={error}
        >
            <div className="input">
                <input required name="newFolderName" aria-label="New folder name" defaultValue={folder?.title ?? ""} />
            </div>
        </ModelShell>
    );
}
