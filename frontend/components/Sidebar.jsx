import { useState } from "react";
import styles from "./Sidebar.module.css";
import {
  LayoutDashboard,
  SlidersHorizontal,
  LibraryBig,
  Sparkles,
  Image,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  console.log("HERE");
  const [homeActive, setHomeActive] = useState(location.pathname === "/home");
  const [libActive, setLibActive] = useState(location.pathname === "/library");
  const [settActive, setSettActive] = useState(
    location.pathname === "/settings"
  );
  const [aiActive, setAiActive] = useState(location.pathname === "/generate");
  const handleHomeClick = () => {
    setLibActive(false);
    setSettActive(false);
    setAiActive(false);
    setHomeActive(true);
    navigate("/home");
  };
  const handleLibClick = () => {
    setSettActive(false);
    setHomeActive(false);
    setAiActive(false);
    setLibActive(true);
  };
  const handleSettClick = () => {
    setLibActive(false);
    setHomeActive(false);
    setAiActive(false);
    setSettActive(true);
    navigate("/settings");
  };
  const handleAiClick = () => {
    setLibActive(false);
    setHomeActive(false);
    setSettActive(false);
    setAiActive(true);
  };

  return (
    <section className={styles.container}>
      <ul>
        <button
          onClick={handleHomeClick}
          className={`${styles.menu} ${homeActive ? styles.active : ""}`}
        >
          <LayoutDashboard
            size={20}
            fill={homeActive ? "#053647" : "#132029ff"}
          />
          Home
        </button>
        <button
          onClick={handleLibClick}
          className={`${styles.menu} ${libActive ? styles.active : ""}`}
        >
          <LibraryBig size={20} fill={libActive ? "#053647" : "#132029ff"} />
          Library
        </button>
        <button
          onClick={handleAiClick}
          className={`${styles.menu} ${aiActive ? styles.active : ""}`}
        >
          <Sparkles size={20} fill={aiActive ? "#053647" : "#132029ff"} />
          Generate
        </button>
        <button
          onClick={handleSettClick}
          className={`${styles.menu} ${settActive ? styles.active : ""}`}
        >
          <SlidersHorizontal
            size={20}
            fill={settActive ? "#053647" : "#132029ff"}
          />
          Settings
        </button>
      </ul>
    </section>
  );
};

export default Sidebar;
