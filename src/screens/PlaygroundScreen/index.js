import { useParams } from "react-router-dom"
import './index.scss'
import { EditorContainer } from "./EditorContainer";



export const PlayGroundScreen = () => {
    const params = useParams();
    const { fileId, folderId } = params;
    console.log(params);


    return <div className="playground-container">

        <div className="header-container">
            <img src="/logo.png" />
            <h1 className="bitcount">CODEIN.it</h1>
        </div>


        <div className="content-container">
            <EditorContainer />

            <div className="input-container">
                {/* <h1>input</h1> */}

                <div className="header">
                    <h4>Input :</h4>

                    <label className="upload-btn">
                        <input type="file" />

                        <span className="material-icons">download</span>
                        <h4>Import Input</h4>
                    </label>
                </div>


                <div className="text-area">
                    <textarea placeholder="Enter input here..." />
                </div>

            </div>

            <div className="output-container">
                {/* <h1>output</h1> */}

                <div className="header">
                    <h4>Output :</h4>

                    <div className="export-btn">
                        <span className="material-icons">upload</span>
                        <h4>Export Output</h4>
                    </div>
                </div>


                <div className="text-area">
                    <textarea readOnly placeholder="Output Displays Here..." />
                </div>

            </div>
        </div>



    </div>
}