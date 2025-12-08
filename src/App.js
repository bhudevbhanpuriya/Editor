import { BrowserRouter, Route, Routes } from "react-router-dom"
import { HomeScreen } from "./screens/homescreen";
import { PlayGroundScreen } from "./screens/PlaygroundScreen";
import { PlayGroundProvider } from "./provider/playground-provider";
import { ModelProvider } from "./provider/ModelProvider";

function App() {
  return (
    <PlayGroundProvider>
      <ModelProvider>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<HomeScreen />} />
            <Route path='/playground' element={<PlayGroundScreen />} />
          </Routes>
        </BrowserRouter>
      </ModelProvider>

    </PlayGroundProvider>

  );
}

export default App;
