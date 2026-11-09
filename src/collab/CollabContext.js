import { createContext, useContext } from 'react';

/**
 * Holds the active collaboration session, or null when there is none.
 *
 * This file must never import yjs. Consumers (EditorContainer, PlaygroundScreen)
 * import only from here, so their tests do not pull the whole CRDT dependency
 * chain into Jest's module graph. `CollabProvider` is the only module that
 * touches yjs, and it is reached only from App.js.
 */
export const CollabContext = createContext(null);

/**
 * Returns the session, or null when not collaborating.
 *
 * Mirrors `useOptionalNotify` — null is the single unambiguous "not in a
 * session" signal every consumer branches on, rather than a stub object that
 * would make the two modes hard to tell apart.
 */
export const useOptionalCollab = () => useContext(CollabContext);
