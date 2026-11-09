import { useContext } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ModelConstant, ModelContext } from '../../provider/ModelProvider';
import { useOptionalCollab } from '../../collab/CollabContext';
import { COLLAB_ENABLED, ROOM_PARAM } from '../../collab/config';
import { linkSession } from '../../collab/session-store';
import { createId } from '../../utils/id';

export const shareUrlFor = (roomId) => `${window.location.origin}/session/${roomId}`;

/**
 * Starts a session, or opens the link for one already running.
 *
 * Starting a session is just adding `?room=` to the URL — CollabProvider reacts
 * to that. Recording the host flag first matters: only the host seeds the
 * shared document with local content.
 */
export const ShareButton = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { fileId, folderId } = useParams();
    const { openModel } = useContext(ModelContext);
    const collab = useOptionalCollab();

    if (!COLLAB_ENABLED) return null;

    const startSession = () => {
        const roomId = createId();
        linkSession(roomId, { folderId, fileId, isHost: true });

        const params = new URLSearchParams(searchParams);
        params.set(ROOM_PARAM, roomId);
        setSearchParams(params, { replace: true });

        openModel(ModelConstant.SHARE_SESSION, { roomId });
    };

    const showLink = () => openModel(ModelConstant.SHARE_SESSION, { roomId: collab.roomId });

    return (
        <button
            type="button"
            className="share-btn"
            onClick={collab ? showLink : startSession}
        >
            <span className="material-icons" aria-hidden="true">group_add</span>
            <span>{collab ? 'Session link' : 'Share'}</span>
        </button>
    );
};
