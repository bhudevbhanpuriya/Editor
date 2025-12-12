import { useParams } from "react-router-dom"
import './index.scss'
import { EditorContainer } from "./EditorContainer";
import { Model } from "../../provider/models/model";
import { useRef, useState } from "react";


export const PlayGroundScreen = () => {
    const params = useParams();
    const { fileId, folderId } = params;
    const [input ,setInput] = useState('');
    const outputRef = useRef();
    // console.log(params);

    const importInput = (e) => {
       const file = e.target.files[0];
       const fileType = file.type.includes('text');
       if(!fileType){
        alert('input text file');
       }
       else{
        const fileReader = new FileReader();
        fileReader.readAsText(file);
        fileReader.onload = (value) => {
            const importedInput = value.target.result;
            setInput(importedInput);
        }
       }
    }

    const onChangeOutput = (newOutput) =>{
        outputRef.current = newOutput;
    }

    const exportOutput = () => {
        const output = outputRef.current;

        const blob = new Blob([output],{type:'text/plain'})
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a")
        link.href = url
        link.download = `output.txt`;
        link.click();
    }


    return <div className="playground-container">

        <div className="header-container">
            {/* <img src="/logo.png" /> */}
            <h1 className="bitcount">CODEIN.it</h1>
        </div>


        <div className="content-container">
            <EditorContainer fileId={fileId} folderId={folderId} />
             
            <Model />

            <div className="input-container">
                {/* <h1>input</h1> */}

                <div className="header">
                    <h4>Input :</h4>

                    <label className="upload-btn">
                        <input 
                            type="file"
                            id = 'import-code'
                            onChange = {importInput}                        
                        />

                        <span className="material-icons">download</span>
                        <h4>Import Input</h4>
                    </label>
                </div>


                <div className="text-area">
                    <textarea
                        placeholder="Enter input here..." 
                        value = {input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                </div>

            </div>

            <div className="output-container">
                {/* <h1>output</h1> */}

                <div className="header">
                    <h4>Output :</h4>

                    <button className="export-btn" onClick={exportOutput}>
                        <span className="material-icons">upload</span>
                        <h4>Export Output</h4>
                    </button>
                </div>


                <div className="text-area">
                    <textarea 
                        readOnly placeholder="Output Displays Here..." 
                        onChange={onChangeOutput}
                    />
                </div>

            </div>
        </div>



    </div>
}