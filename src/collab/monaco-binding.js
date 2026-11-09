import * as Y from 'yjs';

/**
 * Binds a Y.Text to a Monaco text model.
 *
 * This exists instead of `y-monaco` because y-monaco statically imports
 * `monaco-editor/esm/vs/editor/editor.api.js`. `monaco-editor` is physically
 * present in node_modules as an auto-installed peer of `@monaco-editor/react`,
 * so that import resolves silently and webpack bundles a whole second copy of
 * Monaco alongside the one `@monaco-editor/loader` fetches from the CDN — with
 * two incompatible `Range` classes, and roughly a megabyte of extra payload.
 *
 * So: `monaco` is passed in, obtained from `onMount(editor, monaco)`. Nothing
 * in this file may import it.
 */

/** Tags transactions this binding originates, so its own echo can be ignored. */
export const BINDING_ORIGIN = Symbol('monaco-binding');

export const bindMonacoText = ({ ytext, editor, monaco, onLocalChange }) => {
    const model = editor.getModel();
    if (!model) return { destroy() { } };

    const doc = ytext.doc;

    // Y.Text counts "\n" as one character; a model with CRLF line endings
    // reports offsets counting "\r\n" as two. Every subsequent edit would land
    // at the wrong index and the documents would diverge permanently. This does
    // not reproduce on Linux, which is what makes it dangerous.
    model.setEOL(monaco.editor.EndOfLineSequence.LF);

    // Guards Monaco's synchronous, re-entrant onDidChangeContent while we are
    // the ones writing into the model.
    let applyingRemote = false;

    const setModelText = (text) => {
        applyingRemote = true;
        try {
            model.setValue(text);
        } finally {
            applyingRemote = false;
        }
    };

    // Adopt the shared document as the starting point. This wipes Monaco's undo
    // stack, which is intentional: pre-session history is meaningless once the
    // buffer is shared.
    setModelText(ytext.toString());
    editor.pushUndoStop();

    // ---- Y -> Monaco -------------------------------------------------------
    const onYChange = (event, transaction) => {
        if (transaction.origin === BINDING_ORIGIN) return;

        let index = 0;
        const edits = [];

        for (const op of event.delta) {
            if (op.retain != null) {
                index += op.retain;
            } else if (op.insert != null) {
                const text = typeof op.insert === 'string' ? op.insert : '';
                const pos = model.getPositionAt(index);
                edits.push({
                    range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
                    text,
                    forceMoveMarkers: true
                });
                index += text.length;
            } else if (op.delete != null) {
                const from = model.getPositionAt(index);
                const to = model.getPositionAt(index + op.delete);
                edits.push({
                    range: new monaco.Range(from.lineNumber, from.column, to.lineNumber, to.column),
                    text: ''
                });
            }
        }

        if (edits.length === 0) return;

        applyingRemote = true;
        try {
            // pushEditOperations (rather than applyEdits) routes through
            // Monaco's edit stack, so decorations and the local caret are
            // adjusted around the incoming change instead of being clobbered.
            model.pushEditOperations([], edits, () => null);
        } finally {
            applyingRemote = false;
        }
    };

    ytext.observe(onYChange);

    // ---- Monaco -> Y -------------------------------------------------------
    const subscription = model.onDidChangeContent((event) => {
        if (applyingRemote) return;

        doc.transact(() => {
            // Descending by offset: applying an earlier splice first would
            // shift every later offset in the same event (multi-cursor edits).
            [...event.changes]
                .sort((a, b) => b.rangeOffset - a.rangeOffset)
                .forEach((change) => {
                    if (change.rangeLength > 0) {
                        ytext.delete(change.rangeOffset, change.rangeLength);
                    }
                    if (change.text) {
                        ytext.insert(change.rangeOffset, change.text);
                    }
                });
        }, BINDING_ORIGIN);

        onLocalChange?.();
    });

    return {
        /** Replaces the shared buffer wholesale (language switch, file import). */
        replaceAll(text) {
            doc.transact(() => {
                ytext.delete(0, ytext.length);
                if (text) ytext.insert(0, text);
            }, BINDING_ORIGIN);
            setModelText(text ?? '');
        },

        destroy() {
            subscription.dispose();
            ytext.unobserve(onYChange);
        }
    };
};

/**
 * Converts a model offset to a Yjs relative position, serialised as JSON.
 *
 * Awareness states are JSON-stringified over the wire, so the Uint8Array from
 * `Y.encodeRelativePosition` would not survive. Absolute integer offsets would
 * skew every time a peer edits above the cursor.
 */
export const offsetToRelative = (ytext, offset) =>
    Y.relativePositionToJSON(Y.createRelativePositionFromTypeIndex(ytext, offset));

/** Inverse of `offsetToRelative`; null when the anchoring item was deleted. */
export const relativeToOffset = (json, doc) => {
    if (!json) return null;
    try {
        const absolute = Y.createAbsolutePositionFromRelativePosition(
            Y.createRelativePositionFromJSON(json),
            doc
        );
        return absolute ? absolute.index : null;
    } catch (e) {
        return null;
    }
};
