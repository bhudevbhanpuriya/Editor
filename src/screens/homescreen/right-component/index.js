import { useContext } from 'react';
import { PlaygroundContext, PlayGroundProvider } from '../../../provider/playground-provider';
import './index.scss'

const Folder = ({ folderTitle, cards }) => {
    return <div className='folder-container'>
        <div className='header'>
            <div className='folder'>
                <span className='material-icons'>folder</span>
                <span>{folderTitle}</span>
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

            {cards?.map((file, index) => (
                <div className='card' key={index}>
                    <img src={file.image || './logo.png'} alt='logo' />

                    <div className='title-language'> 
                        <span> { file?.title}</span>
                        <span> Language: { file?.language}</span>
                    </div>

                    <div className='icons'>
                        <span className='material-icons'>delete</span>
                        <span className='material-icons'>edit</span>
                    </div>
                </div>
            ))}



        </div>
    </div>
}

export const RightComponent = () => {
    const {folders} = useContext(PlaygroundContext);
    return (
        <div className='right-container'>
            <div className='header'>
                <h1>My PlayGround</h1>
                <button className='add-folder-container'>
                    <span className='material-icons'>add</span>
                    <span>New Folder</span>
                </button>
            </div>
            {
                folders?.map((folder, index) => {
                    return <Folder folderTitle={folder?.title} cards={folder?.files} key={index}/>
                })
            }


        </div>


    );
}