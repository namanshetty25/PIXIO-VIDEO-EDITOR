import { useState, useRef } from "react";
import styles from "./Dashboard.module.css";
import Sidebar from "../components/Sidebar";
import {
  Plus,
  Play,
  MoreVertical,
  Calendar,
  Clock,
  Eye,
  Upload,
  FileVideo,
  Sparkles,
  Wand,
  Wand2,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { PacmanLoader } from "react-spinners";

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
  // Mock video data
  const videos = [
    {
      id: 1,
      title: "Product Launch Campaign",
      thumbnail:
        "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400",
      duration: "2:34",
      views: "12.5K",
      createdAt: "2 days ago",
      status: "Published",
    },
    {
      id: 2,
      title: "Brand Story Documentary",
      thumbnail:
        "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=400",
      duration: "5:42",
      views: "8.2K",
      createdAt: "1 week ago",
      status: "Published",
    },
    {
      id: 3,
      title: "Tutorial Series - Episode 1",
      thumbnail:
        "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400",
      duration: "8:15",
      views: "15.7K",
      createdAt: "2 weeks ago",
      status: "Published",
    },
  ];

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

  // const handleFiles = (files) => {
  //   const videoFiles = files.filter((file) => file.type.startsWith("video/"));
  //   if (videoFiles.length > 0) {
  //     console.log("Processing video files:", videoFiles);
  //     navigate("/video", { state: { video: files } });
  //     // Here you would typically upload and process the files
  //   }
  // };

  const handleFiles = async (files) => {
    setIsLoading(true);
    console.log("RECIEED", files);
    const videoFiles = files.filter((file) => file.type.startsWith("video/"));
    if (videoFiles.length === 0) return;

    console.log("Processing video files:", videoFiles);

    const token = localStorage.getItem("token");
    console.log("Processing tokens:", token);
    const project_name = `Project ${Date.now()}`; // Or let user choose

    try {
      console.log("IN NEW PROJECT");
      let uploadData;
      // Step 1: Create new project
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

      // Step 2: Upload videos one by one
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

      // Step 3: Navigate after all uploads succeed

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
      alert(`Upload failed: ${err.message}`);
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
                <button className={styles.actionButton}>
                  <Sparkles size={20} />
                  <span>AI Generator</span>
                </button>
                <button className={styles.actionButton}>
                  <Wand2 size={20} />
                  <span>Start Editing</span>
                </button>
              </div>
            </section>

            {/* Recent Videos Section */}
            <section className={styles.videosSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Your Recent Videos</h2>
                <button className={styles.viewAllButton}>View All</button>
              </div>

              <div className={styles.videoGrid}>
                {videos.map((video) => (
                  <div key={video.id} className={styles.videoCard}>
                    <div className={styles.videoThumbnail}>
                      <img src={video.thumbnail} alt={video.title} />
                      <div className={styles.playOverlay}>
                        <Play size={24} />
                      </div>
                      <div className={styles.videoDuration}>
                        {video.duration}
                      </div>
                      <div className={styles.videoStatus}>
                        <span
                          className={`${styles.statusBadge} ${
                            styles[video.status.toLowerCase()]
                          }`}
                        >
                          {video.status}
                        </span>
                      </div>
                    </div>

                    <div className={styles.videoInfo}>
                      <h3 className={styles.videoTitle}>{video.title}</h3>
                      <div className={styles.videoMeta}>
                        <div className={styles.metaItem}>
                          <Calendar size={14} />
                          <span>{video.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
          <PacmanLoader
            color={"#f7f7f7"}
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
