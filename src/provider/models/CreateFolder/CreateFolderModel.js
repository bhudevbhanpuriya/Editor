import { useContext, useState } from 'react'
import { ModelContext } from '../../ModelProvider'
import { PlaygroundContext } from '../../playground-provider';
import { ModelShell } from '../ModelShell';

export const CreateFolderModel = () => {
    const { closeModel } = useContext(ModelContext);
    const { createNewFolder } = useContext(PlaygroundContext);
    const [error, setError] = useState("");

    const onSubmitModel = ({ folderName }) => {
        if (!folderName) {
            setError("Folder name cannot be empty.");
            return;
        }

        createNewFolder({ folderName });
        closeModel();
    }

    return (
        <ModelShell
            title="Create New Folder"
            submitLabel="Create Folder"
            onSubmit={onSubmitModel}
            error={error}
        >
            <div className="input">
                <input name="folderName" placeholder="Folder name" required />
            </div>
        </ModelShell>
    );
}
