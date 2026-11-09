// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// The jsdom version bundled with react-scripts 5 predates TextEncoder /
// TextDecoder being global, which react-router v7 requires on import.
import { TextDecoder, TextEncoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}

// jsdom 16 exposes no global `crypto`, which lib0 (via yjs) reads at import
// time. Node's webcrypto provides the getRandomValues/randomUUID surface that
// both lib0 and src/utils/id.js expect.
if (typeof global.crypto === 'undefined' || !global.crypto.getRandomValues) {
    // eslint-disable-next-line global-require
    global.crypto = require('crypto').webcrypto;
}

// jsdom 16 has no BroadcastChannel, and lib0/broadcastchannel sits on
// y-websocket's import path. A no-op is enough — cross-tab sync is not
// something the tests exercise.
if (typeof global.BroadcastChannel === 'undefined') {
    global.BroadcastChannel = class {
        constructor(name) { this.name = name; }
        postMessage() { }
        addEventListener() { }
        removeEventListener() { }
        close() { }
    };
}
