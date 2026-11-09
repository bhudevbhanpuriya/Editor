import { useNavigate, useParams } from "react-router-dom"
import './index.scss'
import { EditorContainer } from "./EditorContainer";
import { Model } from "../../provider/models/model";
import { useCallback, useContext, useEffect, useState } from "react";
import { makeSubmission } from "./service";
import { downloadTextFile, readPickedFile } from "../../utils/file";
import { useNotify } from "../../provider/NotificationProvider";
import { PlaygroundContext } from "../../provider/playground-provider";
import { FileExplorer } from "./FileExplorer";

const EXPLORER_PREF_KEY = 'explorer-open';
const NARROW_QUERY = '(max-width: 900px)';

const isNarrow = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia(NARROW_QUERY).matches
        : false;

// On a phone the tree is a drawer over the editor, so it starts closed. On a
// desktop it is a column, open unless the user hid it last time.
const initialExplorerOpen = () => {
    if (isNarrow()) return false;
    try {
        return localStorage.getItem(EXPLORER_PREF_KEY) !== 'false';
    } catch (e) {
        return true;
    }
};

export const PlayGroundScreen = () => {
    const { fileId, folderId } = useParams();
    const [input, setInput] = useState("");
    const [showLoader, setShowLoader] = useState(false);
    const [output, setOutput] = useState("");
    const navigate = useNavigate();
    const notify = useNotify();
    const { markOpened } = useContext(PlaygroundContext);
    const [explorerOpen, setExplorerOpen] = useState(initialExplorerOpen);

    const setExplorer = useCallback((next) => {
        setExplorerOpen(next);
        // Only the desktop column remembers its state; the drawer always
        // starts closed.
        if (!isNarrow()) {
            try {
                localStorage.setItem(EXPLORER_PREF_KEY, String(next));
            } catch (e) { /* non-essential */ }
        }
    }, []);

    // Drives the Recent view. No-op for a file that does not exist.
    useEffect(() => {
        markOpened(folderId, fileId);
        // The drawer has done its job once a file is picked.
        if (isNarrow()) setExplorerOpen(false);
    }, [fileId, folderId, markOpened]);

    const importInput = (e) => {
        readPickedFile(e)
            .then(setInput)
            .catch(error => {
                if (error.message !== 'No file selected.') notify(error.message, 'error');
            });
    }

    const exportOutput = () => {
        if (!output.trim()) {
            notify("There is no output to export yet.", 'error');
            return;
        }
        downloadTextFile(output, 'output.txt');
    }

    const callback = useCallback(({ apiStatus, output: result, message }) => {
        if (apiStatus === 'loading') {
            setShowLoader(true);
            return;
        }

        setShowLoader(false);
        setOutput(apiStatus === 'success' ? result : (message || "Something went wrong"));
    }, []);

    const runCode = useCallback(({ code, language }) => {
        makeSubmission(code, input, language, callback);
    }, [input, callback])

    const backToHomePage = () => {
        navigate(`/`);
    }

    return <div className="playground-container">

        <div className="header-container">
            <button
                type="button"
                className="explorer-toggle"
                aria-label={explorerOpen ? 'Hide files' : 'Show files'}
                aria-expanded={explorerOpen}
                aria-controls="file-explorer"
                title={explorerOpen ? 'Hide files' : 'Show files'}
                onClick={() => setExplorer(!explorerOpen)}
            >
                <span className="material-icons" aria-hidden="true">{explorerOpen ? 'menu_open' : 'menu'}</span>
                <span className="explorer-toggle__label">Files</span>
            </button>

            <button type="button" onClick={backToHomePage} className="logo">
                <img src="/logo2.png" alt="" />
                <h1 className="bitcount">CODEIN.it</h1>
            </button>
        </div>

        <div className="playground-body">
            <FileExplorer
                currentFileId={fileId}
                currentFolderId={folderId}
                open={explorerOpen}
                onClose={() => setExplorer(false)}
            />

            {explorerOpen && (
                <div
                    className="explorer-backdrop"
                    aria-hidden="true"
                    onClick={() => setExplorer(false)}
                />
            )}

            <div className="content-container">
                <EditorContainer fileId={fileId} folderId={folderId} runCode={runCode} />

                <Model />

                <div className="input-container">
                    <div className="header">
                        <h4>Input :</h4>

                        <label className="upload-btn">
                            <input
                                type="file"
                                onChange={importInput}
                            />

                            <span className="material-icons">download</span>
                            <h4>Import Input</h4>
                        </label>
                    </div>

                    <div className="text-area">
                        <textarea
                            placeholder="Enter input here..."
                            aria-label="Program input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>
                </div>

                <div className="output-container">
                    <div className="header">
                        <h4>Output :</h4>

                        <button className="export-btn" onClick={exportOutput}>
                            <span className="material-icons">upload</span>
                            <h4>Export Output</h4>
                        </button>
                    </div>

                    <div className="text-area">
                        <textarea
                            readOnly
                            placeholder="Output Displays Here..."
                            aria-label="Program output"
                            value={output}
                        />
                    </div>
                </div>
            </div>
        </div>

        {showLoader && <div className="fullPage-loader" role="status" aria-label="Running code">
            <div className="loader" />
        </div>}

    </div>
}
