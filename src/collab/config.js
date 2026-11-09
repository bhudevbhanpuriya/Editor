// Deliberately free of yjs imports so anything can read config without
// dragging the CRDT chain into its module graph.

const CONFIGURED_WS_URL = process.env.REACT_APP_COLLAB_WS_URL;

export const COLLAB_WS_URL = CONFIGURED_WS_URL || 'ws://localhost:1234';

// When false the Share button is hidden and no socket is ever opened.
//
// The localhost fallback is only useful in development. A production build
// with no URL configured (e.g. a Vercel deploy, where the server cannot run)
// would otherwise ship a Share button that dials ws://localhost from an HTTPS
// page — blocked as mixed content, and reported as a generic network error.
// So production stays off unless a server URL is explicitly provided, and
// REACT_APP_COLLAB_ENABLED=false still opts out everywhere.
export const COLLAB_ENABLED =
    process.env.REACT_APP_COLLAB_ENABLED !== 'false' &&
    (Boolean(CONFIGURED_WS_URL) || process.env.NODE_ENV !== 'production');

// The query param that marks an active session. Its absence is the private
// default — the app never connects unless the URL says so.
export const ROOM_PARAM = 'room';

// All joined sessions land in one folder so they never scatter through the
// user's own workspace.
export const SHARED_FOLDER_ID = 'collab-shared-folder';
export const SHARED_FOLDER_TITLE = 'Shared sessions';
