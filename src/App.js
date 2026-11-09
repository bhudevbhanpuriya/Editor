import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { HomeScreen } from "./screens/homescreen";
import { PlayGroundScreen } from "./screens/PlaygroundScreen";
import { PlayGroundProvider } from "./provider/playground-provider";
import { ModelProvider } from "./provider/ModelProvider";
import { NotificationProvider } from "./provider/NotificationProvider";
import { ConfirmProvider } from "./provider/ConfirmProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CollabProvider } from "./collab/CollabProvider";
import { SessionScreen } from "./screens/SessionScreen";

function App() {
  return (
    <ErrorBoundary>
      {/* Notifications sit outermost so the playground provider can report
          storage failures through them. */}
      <NotificationProvider>
        <PlayGroundProvider>
          <ModelProvider>
            <ConfirmProvider>
              <BrowserRouter>
                <Routes>
                  <Route path='/' element={<HomeScreen />} />
                  {/* CollabProvider sits here, not in the stack above: as a
                      route element it is inside BrowserRouter (so it can read
                      ?room=) while still being inside every app provider. */}
                  <Route
                    path='/playground/:fileId/:folderId'
                    element={<CollabProvider><PlayGroundScreen /></CollabProvider>}
                  />
                  <Route path='/session/:roomId' element={<SessionScreen />} />
                  <Route path='*' element={<Navigate to='/' replace />} />
                </Routes>
              </BrowserRouter>
            </ConfirmProvider>
          </ModelProvider>
        </PlayGroundProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
