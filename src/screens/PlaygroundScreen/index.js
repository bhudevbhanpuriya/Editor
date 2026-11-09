import { useNavigate, useParams } from "react-router-dom"
import './index.scss'
import { EditorContainer } from "./EditorContainer";
import { Model } from "../../provider/models/model";
import { useCallback, useState } from "react";
import { makeSubmission } from "./service";
import { downloadTextFile, readPickedFile } from "../../utils/file";
import { useNotify } from "../../provider/NotificationProvider";

export const PlayGroundScreen = () => {
    const { fileId, folderId } = useParams();
    const [input, setInput] = useState("");
    const [showLoader, setShowLoader] = useState(false);
    const [output, setOutput] = useState("");
    const navigate = useNavigate();
    const notify = useNotify();

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
            <button type="button" onClick={backToHomePage} className="logo">
                <img src="/logo2.png" alt="" />
                <h1 className="bitcount">CODEIN.it</h1>
            </button>
        </div>

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

        {showLoader && <div className="fullPage-loader" role="status" aria-label="Running code">
            <div className="loader" />
        </div>}

    </div>
}
