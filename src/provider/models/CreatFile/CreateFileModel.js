import { useContext, useState } from 'react'
import { ModelContext } from '../../ModelProvider'
import { PlaygroundContext } from '../../playground-provider';
import { LanguageSelect, ModelShell } from '../ModelShell';

export const CreateFileModel = () => {
    const { closeModel, modelPayload } = useContext(ModelContext);
    const { createNewFile } = useContext(PlaygroundContext);
    const [error, setError] = useState("");

    const onSubmitModel = ({ fileName, language }) => {
        if (!fileName) {
            setError("File name cannot be empty.");
            return;
        }

        const fileId = createNewFile(fileName, language, modelPayload?.folderId);
        closeModel();
        // Lets the playground's file tree open the new file immediately.
        modelPayload?.onCreated?.(fileId, modelPayload.folderId);
    }

    return (
        <ModelShell
            title="Create New File"
            submitLabel="Create File"
            onSubmit={onSubmitModel}
            error={error}
        >
            <div className="input">
                <div className="input-box">
                    <input name="fileName" placeholder="File name" required />
                    <LanguageSelect />
                </div>
            </div>
        </ModelShell>
    );
}
