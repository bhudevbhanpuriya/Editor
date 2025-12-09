import "./index.scss"
import { RightComponent } from "./right-component";
import { Model } from "../../provider/models/model";
import { useContext } from "react";
import { ModelConstant, ModelContext } from "../../provider/ModelProvider";

export const HomeScreen = () => {
    const modelFeature = useContext(ModelContext);

    const openCreatePlaygroundModel = () => {
        modelFeature.openModel(ModelConstant.CREATE_PLAYGROUND);
    }
    return (
        <div className="home-container">

            <div className="left-container">
                <div className="item-container">

                    <img src='logo.png' />
                    <h2>Codein.it</h2>
                    <h3>Code | Debug | Run </h3>

                    <button onClick={openCreatePlaygroundModel}>
                        <span className="material-icons">add</span>
                        <span> Create Playground</span>
                    </button>
                </div>
            </div>
            <div className="right-container">
                <RightComponent />
                <Model />
            </div>

        </div>
    );
}