'use strict';

const http = require('http');
const { WebSocketServer } = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');
const {
    MAX_CONNS_PER_ROOM,
    MAX_ROOMS,
    isAllowedOrigin,
    parseOrigins,
    rejectionReason,
    roomFromRequest,
    startIdleSweep,
    stats
} = require('./rooms');

const PORT = Number(process.env.PORT || 1234);
const HOST = process.env.HOST || '0.0.0.0';
const ALLOWED_ORIGINS = parseOrigins(process.env.ALLOWED_ORIGINS || '*');

const log = (...args) => console.log('[collab]', ...args);

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, ...stats() }));
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
});

// `noServer` rather than `{ server }` so a connection can be refused during the
// upgrade, with a real HTTP status, instead of being accepted and then closed.
const wss = new WebSocketServer({ noServer: true, maxPayload: 5 * 1024 * 1024 });

const deny = (socket, status, message) => {
    socket.write(`HTTP/1.1 ${status} ${message}\r\nConnection: close\r\n\r\n`);
    socket.destroy();
};

server.on('upgrade', (req, socket, head) => {
    const origin = req.headers.origin;

    if (!isAllowedOrigin(origin, ALLOWED_ORIGINS)) {
        log(`refused origin ${origin || '(none)'}`);
        return deny(socket, 403, 'Forbidden');
    }

    const room = roomFromRequest(req);
    if (!room) {
        log(`refused malformed room "${req.url}"`);
        return deny(socket, 400, 'Bad Request');
    }

    const reason = rejectionReason(room);
    if (reason) {
        log(`refused ${room}: ${reason}`);
        return deny(socket, 503, 'Service Unavailable');
    }

    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

// setupWSConnection reads the room from req.url itself; the parsing above is
// validation only.
wss.on('connection', (conn, req) => {
    setupWSConnection(conn, req, { gc: true });
});

const stopSweep = startIdleSweep({ log });

server.listen(PORT, HOST, () => {
    log(`listening on ${HOST}:${PORT}`);
    log(`origins: ${ALLOWED_ORIGINS.join(', ')}`);
    log(`limits: ${MAX_ROOMS} rooms, ${MAX_CONNS_PER_ROOM} connections per room`);
});

// Without this a redeploy drops every client with an abrupt 1006 rather than a
// clean 1001, which clients cannot distinguish from a network failure.
const shutdown = (signal) => {
    log(`${signal} received, shutting down`);
    stopSweep();
    for (const client of wss.clients) client.close(1001, 'Server shutting down');
    wss.close(() => server.close(() => process.exit(0)));
    setTimeout(() => process.exit(0), 5000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { server, wss };
