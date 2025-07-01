import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import LogIn from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import { Router, Routes, Route, BrowserRouter } from "react-router-dom";
import SettingsPage from "../pages/SettingsPage";
import VideoEditor from "../pages/VideoEditor";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LogIn />} />
        <Route path="/video" element={<VideoEditor />} />
        <Route path="/home" element={<Dashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
