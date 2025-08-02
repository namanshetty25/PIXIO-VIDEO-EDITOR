import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar.jsx";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Trash2,
  LibraryBig as Library,
  Image,
  Mail,
  Video,
  AlertTriangle,
  X,
} from "lucide-react";

import Modal from "../components/Modal";
import styles from "./SettingsPage.module.css";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [modals, setModals] = useState({
    deleteAccount: false,
    clearObjectLibrary: false,
    clearVideoLibrary: false,
  });
  const [email, setEmail] = useState("user@example.com");
  const [newEmail, setNewEmail] = useState("");

  const openModal = (modalName) => {
    setModals((prev) => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName) => {
    setModals((prev) => ({ ...prev, [modalName]: false }));
  };

  const handleDeleteAccount = () => {
    // Handle account deletion logic here
    console.log("Account deleted");
    closeModal("deleteAccount");
  };

  const handleClearObjectLibrary = () => {
    // Handle clearing object library logic here
    console.log("Object library cleared");
    closeModal("clearObjectLibrary");
  };

  const handleClearVideoLibrary = () => {
    // Handle clearing video library logic here
    console.log("Video library cleared");
    closeModal("clearVideoLibrary");
  };

  const handleEmailChange = (e) => {
    e.preventDefault();
    if (newEmail) {
      setEmail(newEmail);
      setNewEmail("");
    }
  };
  const onCreateVideo = () => {
    console.log("navigating");
    navigate("/home");
  };

  return (
    <>
      <Navbar onCreateVideo={onCreateVideo} />
      <div className={styles.main}>
        <Sidebar />
        <div className={styles.container}>
          <p className={styles.subtitle}>Manage your account and preferences</p>

          <div className={styles.settingsGrid}>
            {/* Email Settings */}
            <div className={styles.settingSection}>
              <div className={styles.sectionHeader}>
                <Mail className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Email Address</h2>
              </div>
              <div className={styles.emailContainer}>
                <p className={styles.currentEmail}>Current: {email}</p>
                <form onSubmit={handleEmailChange} className={styles.emailForm}>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email address"
                    className={styles.emailInput}
                    required
                  />
                  <button type="submit" className={styles.primaryButton}>
                    Update Email
                  </button>
                </form>
              </div>
            </div>

            {/* Library Management */}
            <div className={styles.settingSection}>
              <div className={styles.sectionHeader}>
                <Library className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Library Management</h2>
              </div>
              <div className={styles.buttonGroup}>
                <button
                  onClick={() => openModal("clearObjectLibrary")}
                  className={styles.warningButton}
                >
                  <Image size={18} />
                  Clear Object Library
                </button>
                <button
                  onClick={() => openModal("clearVideoLibrary")}
                  className={styles.warningButton}
                >
                  <Video size={18} />
                  Clear Video Library
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className={styles.settingSection}>
              <div className={styles.dangerZone}>
                <div className={styles.sectionHeader}>
                  <AlertTriangle className={styles.sectionIcon} />
                  <h2 className={styles.sectionTitle}>Danger Zone</h2>
                </div>
                <p className={styles.dangerDescription}>
                  These actions cannot be undone. Please proceed with caution.
                </p>
                <button
                  onClick={() => openModal("deleteAccount")}
                  className={styles.dangerButton}
                >
                  <Trash2 size={18} />
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* Delete Account Modal */}
          <Modal
            isOpen={modals.deleteAccount}
            onClose={() => closeModal("deleteAccount")}
            title="Delete Account"
            type="danger"
          >
            <section className={styles.modalContent}>
              <AlertTriangle className={styles.modalIcon} />
              <p className={styles.modalText}>
                Are you sure you want to delete your account? This action cannot
                be undone and will permanently remove all your data, including
                your object library, video library, and account information.
              </p>
              <div className={styles.modalActions}>
                <button
                  onClick={() => closeModal("deleteAccount")}
                  className={styles.secondaryButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className={styles.dangerButton}
                >
                  Yes, Delete Account
                </button>
              </div>
            </section>
          </Modal>

          {/* Clear Object Library Modal */}
          <Modal
            isOpen={modals.clearObjectLibrary}
            onClose={() => closeModal("clearObjectLibrary")}
            title="Clear Object Library"
            type="warning"
          >
            <div className={styles.modalContent}>
              <Library className={styles.modalIcon} />
              <p className={styles.modalText}>
                Are you sure you want to clear your object library? This will
                permanently delete all objects and cannot be undone.
              </p>
              <div className={styles.modalActions}>
                <button
                  onClick={() => closeModal("clearObjectLibrary")}
                  className={styles.secondaryButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearObjectLibrary}
                  className={styles.warningButton}
                >
                  Clear Library
                </button>
              </div>
            </div>
          </Modal>

          {/* Clear Video Library Modal */}
          <Modal
            isOpen={modals.clearVideoLibrary}
            onClose={() => closeModal("clearVideoLibrary")}
            title="Clear Video Library"
            type="warning"
          >
            <div className={styles.modalContent}>
              <Video className={styles.modalIcon} />
              <p className={styles.modalText}>
                Are you sure you want to clear your video library? This will
                permanently delete all videos and cannot be undone.
              </p>
              <div className={styles.modalActions}>
                <button
                  onClick={() => closeModal("clearVideoLibrary")}
                  className={styles.secondaryButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearVideoLibrary}
                  className={styles.warningButton}
                >
                  Clear Library
                </button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
