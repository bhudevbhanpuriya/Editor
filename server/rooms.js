'use strict';

const { docs } = require('y-websocket/bin/utils');

// Room ids are UUIDs minted by the client (`createId()`). Validating the shape
// keeps a client from squatting an empty/guessable room name and, once
// y-leveldb persistence is enabled, stops the room name reaching the
// filesystem as a path.
const ROOM_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_ROOMS = Number(process.env.MAX_ROOMS || 200);
const MAX_CONNS_PER_ROOM = Number(process.env.MAX_CONNS_PER_ROOM || 12);
const ROOM_TTL_MS = Number(process.env.ROOM_TTL_MS || 30 * 60 * 1000);
const SWEEP_INTERVAL_MS = Number(process.env.SWEEP_INTERVAL_MS || 60 * 1000);

const isValidRoom = (name) => typeof name === 'string' && ROOM_ID_PATTERN.test(name);

/** Room name from the upgrade URL, or null when it is missing/malformed. */
const roomFromRequest = (req) => {
    let pathname;
    try {
        pathname = new URL(req.url, 'http://localhost').pathname;
    } catch (e) {
        return null;
    }
    const name = decodeURIComponent(pathname.slice(1));
    return isValidRoom(name) ? name : null;
};

const connectionCount = (room) => docs.get(room)?.conns.size ?? 0;

/**
 * Why a connection should be refused, or null to accept.
 * Checked during `upgrade`, before the handshake completes, so a rejected
 * client gets an HTTP status rather than an opaque socket close.
 */
const rejectionReason = (room) => {
    if (!docs.has(room) && docs.size >= MAX_ROOMS) return 'room limit reached';
    if (connectionCount(room) >= MAX_CONNS_PER_ROOM) return 'room is full';
    return null;
};

const parseOrigins = (raw) =>
    (raw || '').split(',').map(s => s.trim()).filter(Boolean);

const isAllowedOrigin = (origin, allowed) => {
    // Browsers do not apply CORS to WebSockets, so without this any website
    // could open sockets against this server using a visitor's browser.
    if (allowed.length === 0 || allowed.includes('*')) return true;
    if (!origin) return false;
    return allowed.includes(origin);
};

/**
 * y-websocket's utils never free a doc once its last client leaves, which is a
 * slow leak in any long-running deployment. Sweep empty rooms after a grace
 * period so a brief disconnect does not lose the document.
 */
const startIdleSweep = ({ log = () => { } } = {}) => {
    const emptySince = new Map();

    const timer = setInterval(() => {
        const now = Date.now();

        for (const [name, doc] of docs) {
            if (doc.conns.size > 0) {
                emptySince.delete(name);
                continue;
            }

            const since = emptySince.get(name);
            if (since === undefined) {
                emptySince.set(name, now);
            } else if (now - since >= ROOM_TTL_MS) {
                doc.destroy();
                docs.delete(name);
                emptySince.delete(name);
                log(`swept idle room ${name}`);
            }
        }
    }, SWEEP_INTERVAL_MS);

    timer.unref?.();
    return () => clearInterval(timer);
};

const stats = () => {
    let conns = 0;
    for (const doc of docs.values()) conns += doc.conns.size;
    return { rooms: docs.size, conns };
};

module.exports = {
    ROOM_ID_PATTERN,
    MAX_ROOMS,
    MAX_CONNS_PER_ROOM,
    ROOM_TTL_MS,
    isValidRoom,
    roomFromRequest,
    connectionCount,
    rejectionReason,
    parseOrigins,
    isAllowedOrigin,
    startIdleSweep,
    stats
};
