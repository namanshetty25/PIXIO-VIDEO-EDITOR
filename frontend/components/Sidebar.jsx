import { useState } from "react";
import styles from "./Sidebar.module.css";
import { LayoutDashboard, Sparkles, Image } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  console.log("HERE");
  const [homeActive, setHomeActive] = useState(location.pathname === "/home");
  const [aiActive, setAiActive] = useState(location.pathname === "/generate");
  const handleHomeClick = () => {
    setAiActive(false);
    setHomeActive(true);
    navigate("/home");
  };
  const handleAiClick = () => {
    setHomeActive(false);
    setAiActive(true);
    navigate("/generate");
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
            //fill={homeActive ? "#b882f7" : "#000000"}
          />
          Home
        </button>

        <button
          onClick={handleAiClick}
          className={`${styles.menu} ${aiActive ? styles.active : ""}`}
        >
          <Sparkles
            size={20}
            //fill={aiActive ? "#b882f7" : "#000"}
          />
          Generate
        </button>
      </ul>
    </section>
  );
};

export default Sidebar;
