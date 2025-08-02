import styles from "./Navbar.module.css";
import { User, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  return (
    <section className={styles.container}>
      <div className={styles.companyName}>
        <img src="/icon.svg" width={50} />
        PIXIO
      </div>

      <div className={styles.options}>
        <button
          className={styles.createButton}
          onClick={() => {
            navigate("/home");
          }}
        >
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
