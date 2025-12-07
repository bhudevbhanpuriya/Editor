import "./index.scss"
import { RightComponent } from "./right-component";

export const HomeScreen = () => {
    return (
        <div className="home-container">

            <div className="left-container">
                <div className="item-container">

                    <img src = 'logo.png'/>
                    <h2>Codein.it</h2>
                    <h3>Code | Debug | Run </h3>



                    <button>
                        <span className="material-icons">add</span>
                        <span> Create Playground</span>
                    </button>

                </div>
                
            </div>

            <div className="right-container">
                <RightComponent/>
            </div>

        </div>
    );
}