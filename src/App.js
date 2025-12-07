import { BrowserRouter , Route, Routes } from "react-router-dom"
import { HomeScreen } from "./screens/homescreen";
import { PlayGroundScreen } from "./screens/PlaygroundScreen";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomeScreen/>} />
        <Route path='/playground' element={<PlayGroundScreen/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
