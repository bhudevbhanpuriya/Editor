import { useContext, useEffect, useRef, useState } from "react";
import { ModelConstant, ModelContext } from "../../provider/ModelProvider";
import Editor from "@monaco-editor/react"
import { defaultCode, PlaygroundContext } from "../../provider/playground-provider";
import { languages } from "monaco-editor";
import { useParams } from "react-router-dom";


export const EditorContainer = ({ fileId, folderId }) => {

    const { setModelPayload, openModel } = useContext(ModelContext);

    const [theme, setTheme] = useState('vs-dark');

    const [code, setCode] = useState("");

    const [language, setLanguage] = useState("");

    const [title, setTitle] = useState("");

    const {renameTrigger , setRenameTrigger} = useContext(ModelContext);

    const {updateFileCode} = useContext(PlaygroundContext);

    const [isFullScreen ,setIsFullScreen] = useState(false);

    const codeRef = useRef();

    
    useEffect(() => {
        const data = JSON.parse(localStorage.getItem("data"));
        const folder = data.find(folder => folder.id === folderId);
        if (!folder) return;
        const file = folder.files.find(file => file.id === fileId);
        if (!file) return;

        setCode(file.code);
        setLanguage(file.language);
        setTitle(file.title)

    }, [fileId, folderId, renameTrigger])



    const openRenameFileModel = () => {
        setModelPayload({ fileId, folderId })
        openModel(ModelConstant.RENAME_FILE);
    }

    const editorOptions = {
        fontSize: 16,
        wordWrap: 'on'
    }

    const changeTheme = (newtheme) => {
        setTheme(newtheme)
    }

    const changeLanguage = (e) => {
        const lang = e.target.value;
        setCode(defaultCode[lang]);
        setLanguage(lang);
    }

    const importCode = (e) => {
        const file = e.target.files[0];
        const fileType = file.type.includes('text');

        if(fileType){
            const fileReader = new FileReader();
            fileReader.readAsText(file);
            fileReader.onload = function(value){
                const importedCode = value.target.result;
                setCode(importedCode);
                updateFileCode(folderId, fileId, importedCode);
            }
        }
        else{
            alert("Please choose a program file")
        }
        // console.log(fileType);
        
    }

    const onChangeCode = (newCode) => {
        codeRef.current = newCode;
    }

    const exportCode = () => {
        const codeVal = codeRef.current?.trim();
        const exeLang = {
            cpp:"cpp",
            java:"java",
            javascript:"js",
            python:"py"
        }

        if(!codeVal){
            alert("Please input before exporting");
        }

        const codeBlob = new Blob([codeVal] , {type:"text/plain"});

        const downloadUrl = URL.createObjectURL(codeBlob);

        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${title}.${exeLang[language]}`;
        link.click();
    }

    const saveCode = () => {
        const currCode = codeRef.current;
        setCode(currCode);
        updateFileCode(folderId,fileId,currCode);
        alert('Code saved success')
    }

    const fullScreen = () => {
        setIsFullScreen(!isFullScreen);
    }


    return (
        <div className="editor-container" style={isFullScreen ? styles.fullScreen : {}}>
            <div className="editor-header">
                <div className="title-section">
                    {title}
                    <div className="edit-icon" onClick={openRenameFileModel}>
                        <span className="material-icons">edit</span>
                    </div>
                </div>

                <div className="editor-controls">
                    {language && (
                        <select
                            name="language"
                            value={language}
                            onChange={changeLanguage}
                        >
                            <option value='cpp'>Cpp</option>
                            <option value='java'>Java</option>
                            <option value='javascript'>JavaScript</option>
                            <option value='python'>Python</option>
                        </select>
                    )}
                    
                    <select
                        name="theme"
                        value={theme}
                        onChange={(e) => changeTheme(e.target.value)}
                    >
                        <option value='vs-dark'>vscode-dark</option>
                        <option value='vs-light'>vscode-light</option>
                    </select>

                    <button onClick={saveCode}>
                        Save Code
                    </button>


                </div>

            </div>

            <div className="code-editor">
                {/* <div className="text-area">
                    <textarea placeholder="Enter input here..." />
                </div> */}

                <Editor
                    width={"100%"}
                    height={"100%"}
                    language={language}
                    options={editorOptions}
                    theme={theme}
                    value={code}
                    onChange={(code) => {onChangeCode(code)}}
                />

            </div>

            <div className="footer">
                <button className="btn" onClick={fullScreen}>
                    <span className="material-icons">crop_free</span>
                    <span>{isFullScreen ? "Minimize" : "Full Screen"}</span>
                </button>

                <label className="import-btn">
                    <input
                        type="file"
                        // onChange={handleFileUpload}
                        id='import-code'
                        onChange={importCode}
                    />

                    <div className="btn">
                        <span className="material-icons">download</span>
                        <span>Import Code</span>
                    </div>

                </label>




                <div className="btn" onClick={exportCode}>
                    <span className="material-icons">upload</span>
                    <span>Export Code</span>
                </div>


                <button>
                    <span className="material-icons">play_arrow</span>
                    Run Code
                </button>


            </div>

        </div>
    )
}


const styles = {    
    fullScreen : {
        position : 'absolute',
        top : 0,
        left : 0,
        right :0,
        bottom: 0,
        zIndex:10
    }
}