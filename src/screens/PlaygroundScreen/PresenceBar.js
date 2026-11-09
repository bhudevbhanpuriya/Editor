import { useOptionalCollab } from '../../collab/CollabContext';
import { initialsOf } from '../../collab/identity';

const STATUS_LABEL = {
    connecting: 'Connecting…',
    connected: 'Live',
    disconnected: 'Reconnecting…',
    error: 'Offline'
};

/**
 * Who is in the room, and whether the socket is actually up.
 *
 * The status pill matters as much as the avatars: without it a dropped
 * connection is indistinguishable from nobody else typing.
 */
export const PresenceBar = () => {
    const collab = useOptionalCollab();
    if (!collab) return null;

    const { peers, status } = collab;
    const others = peers.filter(peer => !peer.isSelf);

    return (
        <div className="presence-bar">
            <span className={`presence-status presence-status--${status}`} role="status">
                {STATUS_LABEL[status] ?? status}
            </span>

            <ul className="presence-avatars" aria-label="People in this session">
                {peers.map(peer => (
                    <li
                        key={peer.clientId}
                        className={`presence-avatar presence-avatar--${peer.colorIndex}`}
                        title={peer.isSelf ? `${peer.name} (you)` : peer.name}
                    >
                        <span aria-hidden="true">{initialsOf(peer.name)}</span>
                        <span className="sr-only">
                            {peer.isSelf ? `${peer.name}, you` : peer.name}
                        </span>
                    </li>
                ))}
            </ul>

            {others.length === 0 && (
                <span className="presence-hint">Waiting for others…</span>
            )}

            <button type="button" className="presence-leave" onClick={collab.leave}>
                Leave
            </button>
        </div>
    );
};
