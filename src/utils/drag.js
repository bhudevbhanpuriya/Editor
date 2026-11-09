import { useRef, useState } from 'react';

// A private MIME type: only drags that started on one of our file cards or
// tree rows are accepted, never text or files dragged in from the desktop.
export const FILE_DRAG_TYPE = 'application/x-codein-file';

export const startFileDrag = (event, { fileId, folderId, title }) => {
    const { dataTransfer } = event;
    if (!dataTransfer) return;
    dataTransfer.setData(FILE_DRAG_TYPE, JSON.stringify({ fileId, folderId }));
    // Firefox will not start a drag without some data; this also gives a
    // sensible result when the file is dropped into a text field.
    dataTransfer.setData('text/plain', title ?? '');
    dataTransfer.effectAllowed = 'move';
};

// During dragover only the types are readable, not the data itself.
const isFileDrag = (event) => Array.from(event.dataTransfer?.types ?? []).includes(FILE_DRAG_TYPE);

const readFileDrag = (event) => {
    try {
        return JSON.parse(event.dataTransfer.getData(FILE_DRAG_TYPE));
    } catch (e) {
        return null;
    }
};

/**
 * Makes an element a drop target for file drags. Returns the props to spread
 * on it and whether a file is currently held over it.
 *
 * dragenter/dragleave fire for every child crossed, so a depth counter tracks
 * whether the pointer is still inside — a plain boolean flickers.
 */
export const useFileDropTarget = (folderId, onDropFile) => {
    const [isOver, setIsOver] = useState(false);
    const depth = useRef(0);

    const reset = () => {
        depth.current = 0;
        setIsOver(false);
    };

    const dropProps = {
        onDragEnter: (event) => {
            if (!isFileDrag(event)) return;
            depth.current += 1;
            setIsOver(true);
        },
        onDragOver: (event) => {
            if (!isFileDrag(event)) return;
            // Without preventDefault the browser refuses the drop.
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        },
        onDragLeave: (event) => {
            if (!isFileDrag(event)) return;
            depth.current = Math.max(0, depth.current - 1);
            if (depth.current === 0) setIsOver(false);
        },
        onDrop: (event) => {
            if (!isFileDrag(event)) return;
            event.preventDefault();
            reset();
            const payload = readFileDrag(event);
            if (payload?.fileId && payload.folderId !== folderId) {
                onDropFile(payload.fileId, folderId);
            }
        }
    };

    return { isOver, dropProps };
};
