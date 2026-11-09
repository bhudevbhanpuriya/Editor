import "./index.scss"
import { RightComponent } from "./right-component";
import { Model } from "../../provider/models/model";
import { useContext } from "react";
import { ModelConstant, ModelContext } from "../../provider/ModelProvider";

export const HomeScreen = () => {
    const { openModel } = useContext(ModelContext);

    const openCreatePlaygroundModel = () => {
        openModel(ModelConstant.CREATE_PLAYGROUND);
    }

    return (
        <div className="home-container">

            <div className="left-container">
                <div className="item-container">
                    <img src='logo.png' alt='CODEIN.it logo' />
                    <h2 className="bitcount">CODEIN.it</h2>
                    <h3>Code | Debug | Run </h3>

                    <button onClick={openCreatePlaygroundModel}>
                        <span className="material-icons">add</span>
                        <span> Create Playground</span>
                    </button>
                </div>
            </div>

            {/* RightComponent renders its own .right-container; wrapping it in a
                second one nested two full-height scroll areas. */}
            <RightComponent />
            <Model />

        </div>
    );
}
