import LogIn from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import VideoEditor from "../pages/VideoEditor";
import Generate from "../pages/Generate";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LogIn />} />
        <Route path="/video" element={<VideoEditor />} />
        <Route path="/home" element={<Dashboard />} />
        <Route path="/generate" element={<Generate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
