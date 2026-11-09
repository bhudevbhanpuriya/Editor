import * as Y from 'yjs';
import { bindMonacoText, offsetToRelative, relativeToOffset } from './monaco-binding';

/**
 * Monaco cannot run under jsdom, but the binding only touches a small, well
 * defined slice of ITextModel. Faking that slice over a plain string lets the
 * merge logic — the part that actually breaks — be tested properly.
 */
class FakeModel {
    constructor(text = '', eol = '\n') {
        this.text = text;
        this.eol = eol;
        this.listeners = [];
    }

    getValue() { return this.text; }

    setEOL(sequence) {
        // 0 === LF in Monaco's EndOfLineSequence enum.
        if (sequence === 0 && this.eol === '\r\n') {
            this.text = this.text.replace(/\r\n/g, '\n');
            this.eol = '\n';
        }
    }

    setValue(next) {
        const previous = this.text;
        this.text = next;
        this.emit([{ rangeOffset: 0, rangeLength: previous.length, text: next }]);
    }

    // Offsets are 1:1 with string indices; line/column are derived so the
    // binding's Range arithmetic is exercised for real.
    getPositionAt(offset) {
        const clamped = Math.max(0, Math.min(offset, this.text.length));
        const before = this.text.slice(0, clamped);
        const lines = before.split('\n');
        return { lineNumber: lines.length, column: lines[lines.length - 1].length + 1 };
    }

    getOffsetAt({ lineNumber, column }) {
        const lines = this.text.split('\n');
        let offset = 0;
        for (let i = 0; i < lineNumber - 1; i++) offset += lines[i].length + 1;
        return offset + column - 1;
    }

    pushEditOperations(_selections, edits, _cursor) {
        // Monaco applies a batch against the pre-edit document, so convert to
        // offsets first and splice from the end.
        const resolved = edits.map(({ range, text }) => ({
            start: this.getOffsetAt({ lineNumber: range.startLineNumber, column: range.startColumn }),
            end: this.getOffsetAt({ lineNumber: range.endLineNumber, column: range.endColumn }),
            text
        })).sort((a, b) => b.start - a.start);

        const changes = [];
        resolved.forEach(({ start, end, text }) => {
            changes.push({ rangeOffset: start, rangeLength: end - start, text });
            this.text = this.text.slice(0, start) + text + this.text.slice(end);
        });
        this.emit(changes);
    }

    /** Simulates a user edit (typing / paste / multi-cursor). */
    userEdit(changes) {
        [...changes].sort((a, b) => b.rangeOffset - a.rangeOffset).forEach(c => {
            this.text = this.text.slice(0, c.rangeOffset)
                + c.text
                + this.text.slice(c.rangeOffset + c.rangeLength);
        });
        this.emit(changes);
    }

    onDidChangeContent(fn) {
        this.listeners.push(fn);
        return { dispose: () => { this.listeners = this.listeners.filter(l => l !== fn); } };
    }

    emit(changes) {
        this.listeners.slice().forEach(fn => fn({ changes }));
    }
}

const fakeMonaco = {
    Range: class {
        constructor(startLineNumber, startColumn, endLineNumber, endColumn) {
            Object.assign(this, { startLineNumber, startColumn, endLineNumber, endColumn });
        }
    },
    editor: { EndOfLineSequence: { LF: 0, CRLF: 1 } }
};

const makeEditor = (model) => ({ getModel: () => model, pushUndoStop: jest.fn() });

/** A pair of peers wired to each other, as a server would wire them. */
const makePeer = (initial = '') => {
    const doc = new Y.Doc();
    const ytext = doc.getText('code');
    if (initial) ytext.insert(0, initial);
    const model = new FakeModel();
    const editor = makeEditor(model);
    const binding = bindMonacoText({ ytext, editor, monaco: fakeMonaco });
    return { doc, ytext, model, editor, binding };
};

const connect = (a, b) => {
    a.doc.on('update', (update, origin) => {
        if (origin !== 'remote') Y.applyUpdate(b.doc, update, 'remote');
    });
    b.doc.on('update', (update, origin) => {
        if (origin !== 'remote') Y.applyUpdate(a.doc, update, 'remote');
    });
};

describe('initial adoption', () => {
    it('loads the shared document into the model', () => {
        const { model } = makePeer('shared text');
        expect(model.getValue()).toBe('shared text');
    });
});

describe('local edits propagate to Yjs', () => {
    it('sends an insert', () => {
        const peer = makePeer();
        peer.model.userEdit([{ rangeOffset: 0, rangeLength: 0, text: 'hello' }]);
        expect(peer.ytext.toString()).toBe('hello');
    });

    it('sends a delete', () => {
        const peer = makePeer('hello world');
        peer.model.userEdit([{ rangeOffset: 5, rangeLength: 6, text: '' }]);
        expect(peer.ytext.toString()).toBe('hello');
    });

    it('sends a replace', () => {
        const peer = makePeer('hello world');
        peer.model.userEdit([{ rangeOffset: 6, rangeLength: 5, text: 'there' }]);
        expect(peer.ytext.toString()).toBe('hello there');
    });

    // Applying an earlier splice first would shift every later offset in the
    // same event.
    it('applies a multi-cursor edit in descending offset order', () => {
        const peer = makePeer('aaa bbb ccc');
        peer.model.userEdit([
            { rangeOffset: 0, rangeLength: 3, text: 'X' },
            { rangeOffset: 4, rangeLength: 3, text: 'Y' },
            { rangeOffset: 8, rangeLength: 3, text: 'Z' }
        ]);
        expect(peer.ytext.toString()).toBe('X Y Z');
        expect(peer.model.getValue()).toBe('X Y Z');
    });
});

describe('remote edits propagate to Monaco', () => {
    it('applies a remote insert', () => {
        const a = makePeer('hello');
        const b = makePeer();
        connect(a, b);
        Y.applyUpdate(b.doc, Y.encodeStateAsUpdate(a.doc), 'remote');

        a.ytext.insert(5, ' world');
        expect(b.model.getValue()).toBe('hello world');
    });

    it('applies a remote delete', () => {
        const a = makePeer('hello world');
        const b = makePeer();
        connect(a, b);
        Y.applyUpdate(b.doc, Y.encodeStateAsUpdate(a.doc), 'remote');

        a.ytext.delete(5, 6);
        expect(b.model.getValue()).toBe('hello');
    });

    it('does not echo a remote edit back into Yjs as a new change', () => {
        const a = makePeer('abc');
        const b = makePeer();
        connect(a, b);
        Y.applyUpdate(b.doc, Y.encodeStateAsUpdate(a.doc), 'remote');

        a.ytext.insert(3, 'd');
        expect(b.ytext.toString()).toBe('abcd');
        expect(a.ytext.toString()).toBe('abcd');
    });
});

describe('convergence', () => {
    // The case a naive last-write-wins broadcast corrupts.
    it('converges when both peers insert at the same offset', () => {
        const a = makePeer();
        const b = makePeer();
        connect(a, b);

        a.model.userEdit([{ rangeOffset: 0, rangeLength: 0, text: 'aaa' }]);
        b.model.userEdit([{ rangeOffset: 0, rangeLength: 0, text: 'bbb' }]);

        expect(a.ytext.toString()).toBe(b.ytext.toString());
        expect(a.ytext.toString()).toHaveLength(6);
        expect(a.model.getValue()).toBe(b.model.getValue());
    });

    it('converges over interleaved edits at different offsets', () => {
        const a = makePeer('0123456789');
        const b = makePeer();
        connect(a, b);
        Y.applyUpdate(b.doc, Y.encodeStateAsUpdate(a.doc), 'remote');

        a.model.userEdit([{ rangeOffset: 0, rangeLength: 0, text: 'A' }]);
        b.model.userEdit([{ rangeOffset: 11, rangeLength: 0, text: 'B' }]);
        a.model.userEdit([{ rangeOffset: 5, rangeLength: 0, text: 'C' }]);

        expect(a.ytext.toString()).toBe(b.ytext.toString());
        expect(a.model.getValue()).toBe(b.model.getValue());
        expect(a.model.getValue()).toBe(a.ytext.toString());
    });

    it('keeps model and document identical after many random edits', () => {
        const a = makePeer('seed');
        const b = makePeer();
        connect(a, b);
        Y.applyUpdate(b.doc, Y.encodeStateAsUpdate(a.doc), 'remote');

        for (let i = 0; i < 40; i++) {
            const peer = i % 2 === 0 ? a : b;
            const offset = peer.model.getValue().length === 0
                ? 0
                : i % (peer.model.getValue().length + 1);
            peer.model.userEdit([{ rangeOffset: offset, rangeLength: 0, text: String(i % 10) }]);
        }

        expect(a.ytext.toString()).toBe(b.ytext.toString());
        expect(a.model.getValue()).toBe(a.ytext.toString());
        expect(b.model.getValue()).toBe(b.ytext.toString());
    });
});

// Offsets counting "\r\n" as two characters against a Y.Text counting "\n" as
// one is the classic way these bindings drift apart, and it never reproduces on
// a Linux dev machine.
describe('line endings', () => {
    it('normalises a CRLF model to LF so offsets stay aligned', () => {
        const doc = new Y.Doc();
        const ytext = doc.getText('code');
        const model = new FakeModel('a\r\nb\r\nc', '\r\n');

        bindMonacoText({ ytext, editor: makeEditor(model), monaco: fakeMonaco });

        expect(model.getValue()).toBe('');
        model.userEdit([{ rangeOffset: 0, rangeLength: 0, text: 'a\nb\nc' }]);
        expect(ytext.toString()).toBe('a\nb\nc');
        expect(ytext.length).toBe(model.getValue().length);
    });
});

describe('replaceAll', () => {
    it('swaps the shared buffer on both peers in one transaction', () => {
        const a = makePeer('old code');
        const b = makePeer();
        connect(a, b);
        Y.applyUpdate(b.doc, Y.encodeStateAsUpdate(a.doc), 'remote');

        a.binding.replaceAll('brand new');

        expect(a.ytext.toString()).toBe('brand new');
        expect(b.ytext.toString()).toBe('brand new');
        expect(b.model.getValue()).toBe('brand new');
    });
});

describe('destroy', () => {
    it('detaches both directions', () => {
        const peer = makePeer('start');
        peer.binding.destroy();

        peer.model.userEdit([{ rangeOffset: 0, rangeLength: 0, text: 'X' }]);
        expect(peer.ytext.toString()).toBe('start');

        peer.ytext.insert(0, 'Y');
        expect(peer.model.getValue()).toBe('Xstart');
    });

    it('is safe when the editor has no model', () => {
        const doc = new Y.Doc();
        const binding = bindMonacoText({
            ytext: doc.getText('code'),
            editor: { getModel: () => null, pushUndoStop: jest.fn() },
            monaco: fakeMonaco
        });
        expect(() => binding.destroy()).not.toThrow();
    });
});

describe('relative positions', () => {
    it('round-trips an offset', () => {
        const doc = new Y.Doc();
        const ytext = doc.getText('code');
        ytext.insert(0, 'hello world');

        const relative = offsetToRelative(ytext, 6);
        expect(relativeToOffset(relative, doc)).toBe(6);
    });

    // An absolute offset would skew here; a relative position tracks the text.
    it('survives an insert above the position', () => {
        const doc = new Y.Doc();
        const ytext = doc.getText('code');
        ytext.insert(0, 'hello world');

        const relative = offsetToRelative(ytext, 6);
        ytext.insert(0, '>>> ');

        expect(relativeToOffset(relative, doc)).toBe(10);
    });

    it('returns null rather than throwing for missing or malformed input', () => {
        const doc = new Y.Doc();
        expect(relativeToOffset(null, doc)).toBeNull();
        expect(relativeToOffset({ nonsense: true }, doc)).toBeNull();
    });
});
