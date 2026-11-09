import { useContext, useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { PlaygroundContext } from '../../provider/playground-provider';
import { linkSession, resolveSession } from '../../collab/session-store';
import { COLLAB_ENABLED, ROOM_PARAM, SHARED_FOLDER_ID, SHARED_FOLDER_TITLE } from '../../collab/config';
import { DEFAULT_LANGUAGE } from '../../config/languages';
import { createId } from '../../utils/id';
import './index.scss';

const playgroundUrl = ({ fileId, folderId, roomId }) =>
    `/playground/${fileId}/${folderId}?${ROOM_PARAM}=${roomId}`;

/**
 * Landing point for a share link (`/session/:roomId`).
 *
 * A share link cannot be a playground URL: the person following it has no
 * `fileId`/`folderId` in their own storage, so `findFile` would return null and
 * they would land on "This file no longer exists." Instead this screen makes a
 * local file to mirror the room, then redirects into the playground.
 */
export const SessionScreen = () => {
    const { roomId } = useParams();
    const { createFileWithIds } = useContext(PlaygroundContext);
    const [target, setTarget] = useState(() => {
        const existing = resolveSession(roomId);
        return existing ? { ...existing, roomId } : null;
    });

    // Joining is a one-shot side effect; StrictMode runs this effect twice.
    const joinedRef = useRef(false);

    useEffect(() => {
        if (!COLLAB_ENABLED || !roomId || target || joinedRef.current) return;
        joinedRef.current = true;

        const fileId = createId();

        // The local copy starts EMPTY on purpose. Only the host seeds content;
        // if a joiner seeded too, the room would end up holding the document
        // twice, concatenated.
        createFileWithIds({
            folderId: SHARED_FOLDER_ID,
            fileId,
            folderTitle: SHARED_FOLDER_TITLE,
            fileTitle: 'shared',
            language: DEFAULT_LANGUAGE,
            code: ''
        });

        linkSession(roomId, { folderId: SHARED_FOLDER_ID, fileId, isHost: false });
        setTarget({ folderId: SHARED_FOLDER_ID, fileId, roomId });
    }, [roomId, target, createFileWithIds]);

    // Without a server there is no session to join; don't leave an empty
    // "shared" file behind in the user's workspace.
    if (!COLLAB_ENABLED || !roomId) return <Navigate to="/" replace />;
    if (target) return <Navigate to={playgroundUrl(target)} replace />;

    return (
        <div className="session-screen" role="status">
            <div className="session-screen__panel">
                <div className="session-screen__spinner" />
                <h1>Joining session…</h1>
                <p>Setting up a local copy of the shared file.</p>
            </div>
        </div>
    );
};
