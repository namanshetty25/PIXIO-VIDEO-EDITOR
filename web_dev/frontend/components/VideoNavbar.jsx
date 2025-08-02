import styles from "./VideoNavbar.module.css";
import { User } from "lucide-react";

const VideoNavbar = () => {
  return (
    <section className={styles.container}>
      <div className={styles.companyName}>
        <img src="/icon.svg" width={50} />
        PIXIO
      </div>

      <div className={styles.options}>
        <button className={styles.userButton}>
          <User className={styles.icon} />
        </button>
      </div>
    </section>
  );
};

export default VideoNavbar;
