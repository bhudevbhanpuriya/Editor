import { useContext } from 'react';
import { ModelContext } from '../../ModelProvider';
import { findFile, PlaygroundContext } from '../../playground-provider';
import { useOptionalNotify } from '../../NotificationProvider';
import { ModelShell } from '../ModelShell';

/**
 * The menu alternative to drag-and-drop. Dragging is unusable on touch
 * screens and with a keyboard, so every move must also be possible here.
 */
export const MoveFileModel = () => {
    const { closeModel, modelPayload } = useContext(ModelContext);
    const { folders, moveFile } = useContext(PlaygroundContext);
    const notify = useOptionalNotify();

    const { folder: current, file } = findFile(folders, modelPayload?.folderId, modelPayload?.fileId);
    const destinations = folders.filter(folder => folder.id !== current?.id);

    const onSubmit = ({ targetFolderId }) => {
        const target = folders.find(folder => folder.id === targetFolderId);
        if (!file || !target) return closeModel();

        moveFile(file.id, target.id);
        notify(`Moved "${file.title}" to ${target.title}`, 'success');
        closeModel();
    };

    if (!file) {
        return (
            <ModelShell title="Move File" onSubmit={closeModel} footer={<button type="submit">Close</button>}>
                <p className="confirm-message">This file no longer exists.</p>
            </ModelShell>
        );
    }

    if (!destinations.length) {
        return (
            <ModelShell title="Move File" onSubmit={closeModel} footer={<button type="submit">Close</button>}>
                <p className="confirm-message">
                    "{file.title}" is in your only folder. Create another folder first, then move it there.
                </p>
            </ModelShell>
        );
    }

    return (
        <ModelShell title="Move File" submitLabel="Move" onSubmit={onSubmit}>
            <p className="confirm-message">
                Move "{file.title}" out of <strong>{current.title}</strong> to:
            </p>
            <div className="input">
                <select name="targetFolderId" aria-label="Destination folder" required>
                    {destinations.map(folder => (
                        <option key={folder.id} value={folder.id}>
                            {folder.title} ({folder.files.length})
                        </option>
                    ))}
                </select>
            </div>
        </ModelShell>
    );
};
