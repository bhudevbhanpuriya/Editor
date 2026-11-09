import { useContext, useState } from "react"
import { ModelContext } from "../../ModelProvider"
import { PlaygroundContext } from "../../playground-provider"
import { LanguageSelect, ModelShell } from "../ModelShell"

export const CreatePLaygroundModel = () => {
    const { closeModel } = useContext(ModelContext);
    const { createNewPlayground } = useContext(PlaygroundContext);
    const [error, setError] = useState("");

    const onSubmitModel = ({ folderName, fileName, language }) => {
        if (!folderName || !fileName) {
            setError("Folder name and file name cannot be empty.");
            return;
        }

        createNewPlayground({ folderName, fileName, language });
        closeModel();
    }

    return (
        <ModelShell
            title="Create New Playground"
            submitLabel="Create Playground"
            onSubmit={onSubmitModel}
            error={error}
        >
            <div className="input">
                <p>Enter Folder Name</p>
                <input name="folderName" aria-label="Folder name" required />
            </div>
            <div className="input">
                <p>Enter Card Name</p>
                <input name="fileName" aria-label="File name" required />
            </div>
            <div className="input">
                <p>Language</p>
                <LanguageSelect />
            </div>
        </ModelShell>
    );
}
