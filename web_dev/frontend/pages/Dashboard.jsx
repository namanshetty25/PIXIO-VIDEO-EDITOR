import { useState, useRef } from "react";
import styles from "./Dashboard.module.css";
import Sidebar from "../components/Sidebar";
import { Upload, Sparkles, Wand2 } from "lucide-react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { ScaleLoader } from "react-spinners";
import toast, { Toaster } from "react-hot-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const override = {
    display: "block",
    margin: "0 auto",
    borderColor: "red",
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    console.log("DATA TRANSFER WALA E", e.dataTransfer);
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    setIsLoading(true);
    console.log("RECIEVED", files);
    const videoFiles = files.filter((file) => file.type.startsWith("video/"));
    if (videoFiles.length === 0) return;

    console.log("Processing video files:", videoFiles);

    const token = localStorage.getItem("token");
    console.log("Processing tokens:", token);
    const project_name = `Project ${Date.now()}`;

    try {
      console.log("IN NEW PROJECT");
      let uploadData;
      const projectRes = await fetch(
        "http://localhost:3000/video/new-project",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ project_name }),
        }
      );
      localStorage.setItem("Video", JSON.stringify([]));
      const projectData = await projectRes.json();
      localStorage.setItem("projectData", JSON.stringify(projectData));
      if (!projectRes.ok) throw new Error(projectData.error);

      const project_id = projectData.project.id;
      console.log("Created project:", project_id);
      localStorage.setItem("project_id", project_id);

      for (const file of videoFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch(
          `http://localhost:3000/video/upload?project_id=${project_id}`,
          {
            method: "POST",
            body: formData,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        uploadData = await uploadRes.json();
        localStorage.setItem("Video", JSON.stringify([uploadData.video]));
        if (!uploadRes.ok) throw new Error(uploadData.error);

        console.log("Uploaded:", uploadData.video);
      }

      navigate("/video", {
        state: {
          project_id,
          video: uploadData.video.video_url,
          video_id: uploadData.video.id,
          video_name: uploadData.video.video_name,
        },
      });
    } catch (err) {
      setIsLoading(false);
      console.error("Error handling files:", err);
      toast.error(`Upload failed: ${err.message}`, {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#b882f7",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
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
        <section className={styles.container}>
          <div className={styles.container}>
            {/* Create New Video Section */}
            <section className={styles.createSection}>
              <h2 className={styles.sectionTitle}>Start Your Next Project</h2>

              <div
                className={`${styles.dropZone} ${
                  isDragOver ? styles.dragOver : ""
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleFileSelect}
                  className={styles.fileInput}
                />

                <div className={styles.dropContent}>
                  <div className={styles.dropIcon}>
                    <Upload size={48} />
                  </div>
                  <h3 className={styles.dropTitle}>Drop your videos here</h3>
                  <p className={styles.dropSubtitle}>
                    Or click to browse and select video files from your device
                  </p>
                  <div className={styles.supportedFormats}>
                    <span>Supports: MP4, MOV, AVI, MKV up to 2GB</span>
                  </div>
                </div>
              </div>

              <div className={styles.quickActions}>
                <button
                  className={styles.actionButton}
                  onClick={() => {
                    navigate("/generate");
                  }}
                >
                  <Sparkles size={20} />
                  <span>GIF Generator</span>
                </button>
                <button className={styles.actionButton}>
                  <Wand2 size={20} />
                  <span>Start Editing</span>
                </button>
              </div>
            </section>
          </div>
        </section>
      </div>
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "#000d11",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <Toaster position="bottom-right" reverseOrder={false} />
          <ScaleLoader
            color={"#b882f7"}
            loading={isLoading}
            size={25}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        </div>
      )}
    </>
  );
};

export default Dashboard;
