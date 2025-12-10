export const EditorContainer = () => {
    return (
        <div className="editor-container">
            <div className="editor-header">
                <div className="title-section">
                    <h3>
                        Card title
                    </h3>
                    <div className="edit-icon">
                        <span className="material-icons">edit</span>
                    </div>
                </div>

                <div className="editor-controls">
                    <select name="language" required>
                        <option value='cpp'>Cpp</option>
                        <option value='java'>Java</option>
                        <option value='javascript'>JavaScript</option>
                        <option value='python'>Python</option>
                    </select>

                    <select name="language" required>
                        <option value='cpp'>Github-Dark</option>
                        <option value='java'>Java</option>
                        <option value='javascript'>JavaScript</option>
                        <option value='python'>Python</option>
                    </select>

                    <button>
                        Save Code
                    </button>


                </div>

            </div>

            <div className="code-editor">
                <div className="text-area">
                    <textarea placeholder="Enter input here..." />
                </div>

            </div>

        </div>
    )
}