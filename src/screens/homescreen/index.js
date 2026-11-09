import "./index.scss"
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { RightComponent } from "./right-component";
import { HomeSidebar } from "./HomeSidebar";
import { Model } from "../../provider/models/model";

// The view lives in the URL (?view=recent, ?folder=<id>) so a refresh or the
// Back button returns to the same place.
const parseView = (params) => {
    const folderId = params.get('folder');
    if (folderId) return { type: 'folder', folderId };
    const view = params.get('view');
    return { type: view === 'recent' || view === 'starred' ? view : 'all' };
};

const viewToParams = (view) => {
    if (view.type === 'folder') return { folder: view.folderId };
    if (view.type === 'recent' || view.type === 'starred') return { view: view.type };
    return {};
};

export const HomeScreen = () => {
    const [params, setParams] = useSearchParams();
    const view = parseView(params);
    const setView = useCallback((next) => setParams(viewToParams(next)), [setParams]);

    return (
        <div className="home-container">
            <HomeSidebar view={view} setView={setView} />
            <RightComponent view={view} setView={setView} />
            <Model />
        </div>
    );
}
