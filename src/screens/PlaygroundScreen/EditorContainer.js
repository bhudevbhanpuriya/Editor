import { useContext, useEffect, useRef, useState } from "react";
import { ModelConstant, ModelContext } from "../../provider/ModelProvider";
import Editor from "@monaco-editor/react";
import { findFile, PlaygroundContext } from "../../provider/playground-provider";
import {
    extensionFor,
    languageOptions,
    monacoIdFor,
    starterCode
} from "../../config/languages";
import { downloadTextFile, readPickedFile } from "../../utils/file";
import { useNotify } from "../../provider/NotificationProvider";
import { useOptionalCollab } from "../../collab/CollabContext";
import { bindMonacoText } from "../../collab/monaco-binding";
import { PresenceBar } from "./PresenceBar";
import { ShareButton } from "./ShareButton";

const editorOptions = {
    fontSize: 15,
    wordWrap: 'on',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    padding: { top: 18, bottom: 18 },
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    renderLineHighlight: 'all',
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 }
};

const DARK_THEME = 'codein-dark';

// Monaco's stock vs-dark paints #1e1e1e, which leaves a visible seam against
// the app's editor surface. Defining our own keeps the two flush and picks up
// the accent for the cursor and active line number.
const defineEditorTheme = (monaco) => {
    monaco.editor.defineTheme(DARK_THEME, {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
            'editor.background': '#16161a',
            'editor.lineHighlightBackground': '#1c1c21',
            'editor.selectionBackground': '#6d4ba866',
            'editorCursor.foreground': '#8d6bc8',
            'editorLineNumber.foreground': '#4a4a55',
            'editorLineNumber.activeForeground': '#8d6bc8',
            'editorIndentGuide.background1': '#26262d',
            'editorWhitespace.foreground': '#26262d',
            'editorGutter.background': '#16161a',
            'scrollbarSlider.background': '#3a3a4599',
            'scrollbarSlider.hoverBackground': '#6d4ba899'
        }
    });
};

// Long enough that it does not fire mid-word, short enough that navigating
// away right after typing does not lose anything.
const AUTOSAVE_DELAY_MS = 800;

// Longer than the autosave: in a session remote updates arrive continuously
// while anyone types, and each flush re-serialises the whole workspace.
const MIRROR_DELAY_MS = 1500;

export const EditorContainer = ({ fileId, folderId, runCode }) => {
    const { openModel } = useContext(ModelContext);
    const { folders, updateFile } = useContext(PlaygroundContext);
    const notify = useNotify();
    const collab = useOptionalCollab();

    const [theme, setTheme] = useState(DARK_THEME);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Captured from onMount. Held in refs rather than state because the editor
    // instance is stable; `editorReady` exists only to retrigger effects.
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const bindingRef = useRef(null);
    const [editorReady, setEditorReady] = useState(false);

    // The saved file is the source of truth; the editor holds the draft.
    const { folder, file } = findFile(folders, folderId, fileId);

    const [code, setCode] = useState(file?.code ?? "");
    const [language, setLanguage] = useState(file?.language ?? "");
    const codeRef = useRef(code);

    // Reload the draft when the route points at a different file. Keyed on the
    // saved code so an external change (e.g. rename + reopen) is picked up,
    // without clobbering keystrokes while the user is typing in this file.
    const loadedIdRef = useRef(null);
    useEffect(() => {
        // In a session the Y.Doc owns the buffer; the local draft is not used.
        if (collab) return;
        const key = `${folderId}/${fileId}`;
        if (loadedIdRef.current === key || !file) return;
        loadedIdRef.current = key;
        setCode(file.code ?? "");
        setLanguage(file.language ?? "");
        codeRef.current = file.code ?? "";
    }, [collab, file, fileId, folderId]);

    // Meaningless while the CRDT owns the buffer — `code` state is not tracking it.
    const isDirty = !collab && Boolean(file) && code !== file.code;

    // Autosave. Previously the only way to persist was the Save button, so
    // navigating back to the home screen silently discarded the edits.
    useEffect(() => {
        if (collab || !isDirty) return;
        const timer = setTimeout(
            () => updateFile(folderId, fileId, { code }),
            AUTOSAVE_DELAY_MS
        );
        return () => clearTimeout(timer);
    }, [collab, isDirty, code, folderId, fileId, updateFile]);

    // Flush on unmount so edits made inside the debounce window survive a
    // route change.
    const flushRef = useRef(null);
    useEffect(() => {
        flushRef.current = () => {
            if (isDirty) updateFile(folderId, fileId, { code });
        };
    });
    useEffect(() => () => flushRef.current?.(), []);

    // Bind Monaco to the shared document.
    //
    // Keyed on ycode/awareness rather than `collab`: the context object's
    // identity changes whenever status or peers do, and rebinding on every one
    // of those would wipe decorations and reset the model.
    const ycode = collab?.ycode;
    const awareness = collab?.awareness;
    useEffect(() => {
        if (!ycode || !editorReady || !editorRef.current || !monacoRef.current) return undefined;

        const binding = bindMonacoText({
            ytext: ycode,
            editor: editorRef.current,
            monaco: monacoRef.current
        });
        bindingRef.current = binding;

        return () => {
            bindingRef.current = null;
            binding.destroy();
        };
    }, [ycode, awareness, editorReady]);

    // In a session the Y.Doc is the source of truth and localStorage is a
    // strictly one-way downstream mirror. Information never flows back, so
    // there is no loop for the autosave above to fight.
    useEffect(() => {
        if (!collab || !ycode || !file) return undefined;

        const doc = ycode.doc;
        let timer = null;
        const flush = () => updateFile(folderId, fileId, { code: ycode.toString() });
        const onUpdate = () => {
            clearTimeout(timer);
            timer = setTimeout(flush, MIRROR_DELAY_MS);
        };

        doc.on('update', onUpdate);
        return () => {
            clearTimeout(timer);
            doc.off('update', onUpdate);
            flush();   // covers unmount, leaving the session, and route changes
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collab, ycode, Boolean(file), folderId, fileId, updateFile]);

    if (!file) {
        return (
            <div className="editor-container">
                <div className="editor-header">
                    <div className="title-section">This file no longer exists.</div>
                </div>
            </div>
        );
    }

    // Fires twice under StrictMode with the same instance, so it must stay
    // free of side effects — all wiring happens in effects with cleanups.
    const handleMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        setEditorReady(true);
    };

    // codeRef only tracks the non-session draft.
    const readCurrentCode = () => (collab ? collab.ycode.toString() : codeRef.current);

    const openRenameFileModel = () => {
        openModel(ModelConstant.RENAME_FILE, { fileId, folderId });
    }

    const changeLanguage = (e) => {
        const lang = e.target.value;
        const starter = starterCode(lang);
        setCode(starter);
        setLanguage(lang);
        codeRef.current = starter;
        // Persist immediately: otherwise the language reverts on reload while
        // the new starter code stays, leaving the file in a mismatched state.
        updateFile(folderId, fileId, { language: lang, code: starter });
    }

    const onChangeCode = (newCode) => {
        const value = newCode ?? "";
        codeRef.current = value;
        setCode(value);
    }

    const importCode = (e) => {
        readPickedFile(e)
            .then(importedCode => {
                setCode(importedCode);
                codeRef.current = importedCode;
                updateFile(folderId, fileId, { code: importedCode });
            })
            .catch(error => {
                if (error.message !== 'No file selected.') notify(error.message, 'error');
            });
    }

    const exportCode = () => {
        const codeVal = readCurrentCode()?.trim();

        if (!codeVal) {
            notify("There is nothing to export yet.", 'error');
            return;
        }

        downloadTextFile(codeVal, `${file.title}.${extensionFor(language)}`);
    }

    const saveCode = () => {
        updateFile(folderId, fileId, { code: readCurrentCode(), language });
        notify('Code saved', 'success');
    }

    const onRunCode = () => {
        runCode({ code: readCurrentCode(), language });
    }

    return (
        <div className="editor-container" style={isFullScreen ? styles.fullScreen : {}}>
            <div className="editor-header">
                <div className="title-section">
                    <span className="crumb-folder" title={`In folder ${folder.title}`}>{folder.title}</span>
                    <span className="crumb-sep" aria-hidden="true">/</span>
                    <span className="crumb-file">{file.title}</span>
                    <button
                        type="button"
                        className="edit-icon"
                        aria-label="Rename file"
                        onClick={openRenameFileModel}
                    >
                        <span className="material-icons">edit</span>
                    </button>
                </div>

                <div className="editor-controls">
                    {collab
                        ? <PresenceBar />
                        : (
                            <span
                                className={`save-status save-status--${isDirty ? 'dirty' : 'saved'}`}
                                role="status"
                            >
                                {isDirty ? 'Unsaved changes' : 'Saved'}
                            </span>
                        )}

                    <ShareButton />

                    {language && (
                        <select
                            name="language"
                            aria-label="Language"
                            value={language}
                            onChange={changeLanguage}
                        >
                            {languageOptions.map(({ value, label }) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    )}

                    <select
                        name="theme"
                        aria-label="Editor theme"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                    >
                        <option value={DARK_THEME}>Dark</option>
                        {/* Monaco's light theme id is 'vs'; 'vs-light' does not exist. */}
                        <option value='vs'>Light</option>
                    </select>

                    <button onClick={saveCode}>
                        Save Code
                    </button>
                </div>
            </div>

            <div className="code-editor">
                <Editor
                    width={"100%"}
                    height={"100%"}
                    language={monacoIdFor(language)}
                    options={editorOptions}
                    beforeMount={defineEditorTheme}
                    onMount={handleMount}
                    theme={theme}
                    // Undefined disables @monaco-editor/react's controlled
                    // write, which replaces the whole model and would destroy
                    // every collaborator's cursor on each remote keystroke.
                    value={collab ? undefined : code}
                    onChange={collab ? undefined : onChangeCode}
                />
            </div>

            <div className="footer">
                <button className="btn subtle" onClick={() => setIsFullScreen(prev => !prev)}>
                    <span className="material-icons">crop_free</span>
                    <span>{isFullScreen ? "Minimize" : "Full Screen"}</span>
                </button>

                <label className="import-btn">
                    <input
                        type="file"
                        onChange={importCode}
                    />

                    <div className="btn">
                        <span className="material-icons">download</span>
                        <span>Import Code</span>
                    </div>
                </label>

                <button className="btn ghost" onClick={exportCode}>
                    <span className="material-icons">upload</span>
                    <span>Export Code</span>
                </button>

                <button onClick={onRunCode}>
                    <span className="material-icons">play_arrow</span>
                    Run Code
                </button>
            </div>
        </div>
    )
}

const styles = {
    fullScreen: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10
    }
}
