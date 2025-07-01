import { useState } from "react";
import styles from "./Navbar.module.css";
import { User, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Navbar = ({ onCreateVideo }) => {
  const navigate = useNavigate();
  return (
    <section className={styles.container}>
      <div className={styles.companyName}>Gen-AI Video Editor</div>

      <div className={styles.options}>
        <button className={styles.createButton} onClick={onCreateVideo}>
          <Plus className={styles.icon} />
          <span>Create Video</span>
        </button>
        <button className={styles.userButton}>
          <User className={styles.icon} />
        </button>
      </div>
    </section>
  );
};

export default Navbar;
