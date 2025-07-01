import { useState } from "react";
import styles from "./VideoNavbar.module.css";
import { User, Plus } from "lucide-react";

const VideoNavbar = () => {
  return (
    <section className={styles.container}>
      <div className={styles.companyName}>Gen-AI Video Editor</div>

      <div className={styles.options}>
        <button className={styles.userButton}>
          <User className={styles.icon} />
        </button>
      </div>
    </section>
  );
};

export default VideoNavbar;
