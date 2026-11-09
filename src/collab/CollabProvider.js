import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

import { CollabContext } from './CollabContext';
import { COLLAB_ENABLED, COLLAB_WS_URL, ROOM_PARAM } from './config';
import { isHostOf } from './session-store';
import { colorIndexFor, loadIdentity } from './identity';
import { findFile, PlaygroundContext } from '../provider/playground-provider';
import { useOptionalNotify } from '../provider/NotificationProvider';

/**
 * Owns the Y.Doc and WebSocket for an active session.
 *
 * Mounted as a route element so it sits inside BrowserRouter (it needs
 * useSearchParams) while still being inside every app provider. Renders a null
 * context when there is no `?room=` — the private default.
 *
 * The one rule that keeps this correct under React 19 StrictMode: nothing
 * socket- or doc-shaped is constructed outside the effect that destroys it.
 */
export const CollabProvider = ({ children }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    // With collaboration disabled a `?room=` link opens as a plain private
    // playground rather than dialing a server that is not there.
    const roomId = COLLAB_ENABLED ? searchParams.get(ROOM_PARAM) : null;

    const { fileId, folderId } = useParams();
    const { folders } = useContext(PlaygroundContext);
    const notify = useOptionalNotify();

    const [session, setSession] = useState(null);
    const [status, setStatus] = useState('connecting');
    const [peers, setPeers] = useState([]);
    const [language, setLanguageState] = useState(null);

    // Read at seed time rather than captured in the connect effect's closure,
    // so the effect can depend on roomId alone and never reconnect mid-session.
    const seedRef = useRef(null);
    useEffect(() => {
        const { file } = findFile(folders, folderId, fileId);
        if (file) {
            seedRef.current = { code: file.code ?? '', language: file.language, title: file.title };
        }
    });

    useEffect(() => {
        if (!roomId) {
            setSession(null);
            setStatus('connecting');
            setPeers([]);
            setLanguageState(null);
            return undefined;
        }

        const ydoc = new Y.Doc();
        const provider = new WebsocketProvider(COLLAB_WS_URL, roomId, ydoc, { connect: true });

        const ycode = ydoc.getText('code');
        const yinput = ydoc.getText('input');
        const ymeta = ydoc.getMap('meta');
        const yrun = ydoc.getMap('run');
        const awareness = provider.awareness;

        const identity = loadIdentity();
        awareness.setLocalStateField('user', {
            id: identity.id,
            name: identity.name,
            colorIndex: colorIndexFor(identity.id)
        });

        const onStatus = ({ status: next }) => setStatus(next);
        const onConnectionError = () => setStatus('error');
        provider.on('status', onStatus);
        provider.on('connection-error', onConnectionError);

        const readPeers = () => {
            const states = [];
            awareness.getStates().forEach((state, clientId) => {
                if (!state?.user) return;
                states.push({
                    clientId,
                    name: state.user.name,
                    colorIndex: state.user.colorIndex ?? 0,
                    isSelf: clientId === awareness.clientID
                });
            });
            states.sort((a, b) => a.clientId - b.clientId);
            setPeers(states);
        };
        awareness.on('change', readPeers);
        readPeers();

        const onMeta = () => setLanguageState(ymeta.get('language') ?? null);
        ymeta.observe(onMeta);

        const onSync = (isSynced) => {
            if (!isSynced) return;
            setStatus('connected');
            onMeta();

            // Seeding is guarded three ways because getting it wrong produces
            // the signature Yjs bug where two peers each insert their own copy
            // and the room ends up holding the file twice, concatenated.
            if (!isHostOf(roomId)) return;          // joiners never seed
            if (ymeta.get('seeded')) return;        // survives remount + reconnect
            const seed = seedRef.current;
            if (!seed) return;

            ydoc.transact(() => {
                ymeta.set('seeded', true);
                ymeta.set('language', seed.language);
                ymeta.set('title', seed.title);
                if (ycode.length === 0 && seed.code) ycode.insert(0, seed.code);
            });
        };
        provider.on('sync', onSync);

        setSession({ ydoc, provider, awareness, ycode, yinput, ymeta, yrun, roomId });

        return () => {
            provider.off('status', onStatus);
            provider.off('connection-error', onConnectionError);
            provider.off('sync', onSync);
            awareness.off('change', readPeers);
            ymeta.unobserve(onMeta);
            provider.destroy();   // closes the socket and unregisters awareness
            ydoc.destroy();
            setSession(null);
        };
    }, [roomId]);

    const value = useMemo(() => {
        if (!roomId || !session) return null;

        return {
            roomId,
            status,
            peers,
            isHost: isHostOf(roomId),

            // Stable for the document's lifetime — consumers key their effects
            // on these rather than on the context object, whose identity
            // changes whenever status or peers do.
            ydoc: session.ydoc,
            awareness: session.awareness,
            ycode: session.ycode,
            yinput: session.yinput,
            ymeta: session.ymeta,
            yrun: session.yrun,

            language: language ?? undefined,
            setLanguage: (next) => session.ymeta.set('language', next),

            leave: () => {
                const params = new URLSearchParams(searchParams);
                params.delete(ROOM_PARAM);
                setSearchParams(params, { replace: true });
                notify('Left the session. Your copy stays on this device.', 'info');
            }
        };
    }, [roomId, session, status, peers, language, searchParams, setSearchParams, notify]);

    return (
        <CollabContext.Provider value={value}>
            {children}
        </CollabContext.Provider>
    );
};
