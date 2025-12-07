import './index.scss'

export const RightComponent = () => {
    return (
        <div className='right-container'>
            <div className='header'>
                <h1>My PlayGround</h1>
                <button className='add-folder-container'>
                    <span className='material-icons'>add</span>
                    <span>New Folder</span>
                </button>
            </div>

             <div className='folder-container'>
                <div className='header'>
                    <div className='folder'>
                        <span className='material-icons'>folder</span>
                        <span>{"DSA"}</span>
                    </div>
                    <div className='icons'>
                        <span className='material-icons'>delete</span>
                        <span className='material-icons'>edit</span>
                        <button className='button'>
                            <span className='material-icons'>add</span>
                            <span>New Playground</span>
                         
                         </button>

                    </div>
                </div>
                <div className='cards-container'>


                    
                </div>
            </div>
        </div>

       
     
    );
}