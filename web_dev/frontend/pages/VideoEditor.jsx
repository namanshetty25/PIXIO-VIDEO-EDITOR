import { useState, useRef, useMemo, useEffect } from "react";
import { Player } from "@remotion/player";
import { Sequence, Video } from "remotion";
import { Trash2, Plus, Eye, EyeClosedIcon } from "lucide-react";
import styles from "./VideoEditor.module.css";

import VideoNavbar from "../components/VideoNavbar";
import VideoSidebar from "../components/VideoSidebar";
import toast, { Toaster } from "react-hot-toast";
import { flushSync } from "react-dom";
import { useLocation } from "react-router-dom";
import { ScaleLoader } from "react-spinners";
import { motion } from "framer-motion";
const TimelineMarker = ({ currentFrame, totalDuration }) => {
  const markerPosition = useMemo(() => {
    return `${(currentFrame / totalDuration) * 100}%`;
  }, [currentFrame, totalDuration]);

  return (
    <div
      className={styles.timelineMarker}
      style={{
        left: markerPosition,
      }}
    >
      <div className={styles.markerArrow} />
    </div>
  );
};

TimelineMarker.displayName = "TimelineMarker";

const VideoEditor = () => {
  const location = useLocation();
  useEffect(() => {
    console.log(location);
  }, []);

  const [ready, setReady] = useState(false);
  const [clips, setClips] = useState([]);
  const [totalDuration, setTotalDuration] = useState(1);
  const [currentFrame, setCurrentFrame] = useState(0);
  const inputRef = useRef(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [originalClip, setOriginalClip] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [customFilterSettings, setCustomFilterSettings] = useState(null);
  const playerRef = useRef(null);
  const timelineRef = useRef(null);
  const uneditedRef = useRef(null);

  const getCurrentlyPlayingClip = () => {
    return clips.find(
      (clip) =>
        currentFrame >= clip.start && currentFrame < clip.start + clip.duration
    );
  };

  //console.log("CURRENT CLIP: ", getCurrentlyPlayingClip());
  console.log("clips array: ", clips);

  const addClip = async (e) => {
    e.preventDefault();
    console.log(inputRef.current.files[0]);
    try {
      setIsLoading(true);
      const selected = inputRef.current.files[0];
      const token = localStorage.getItem("token");
      const project_id = localStorage.getItem("project_id");
      if (!selected)
        return toast.error("Please select a video file first.", {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#b882f7",
          },
        });
      const formdata = new FormData();
      formdata.append("file", selected);
      const uploadRes = await fetch(
        `http://localhost:3000/video/upload?project_id=${project_id}`,
        {
          method: "POST",
          body: formdata,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const uploadData = await uploadRes.json();
      localStorage.setItem("Video", JSON.stringify([uploadData.video]));
      if (!uploadRes.ok) throw new Error(uploadData.error);

      console.log("Uploaded:", uploadData.video);
      const videoURL = uploadData.video.video_url;
      const video = document.createElement("video");

      video.src = videoURL;

      video.onloadedmetadata = () => {
        const durationInSeconds = video.duration;
        const fps = 30;
        const durationInFrames = Math.round(durationInSeconds * fps);
        flushSync(() => {
          setClips((prev) => {
            const lastItem = prev.reduce(
              (latest, item) =>
                item.start + item.duration > latest.start + latest.duration
                  ? item
                  : latest,
              { start: 0, duration: 0 }
            );

            const newClip = {
              id: uploadData.video.video_id,
              src: videoURL,
              name: uploadData.video.video_name,
              duration: durationInFrames,
              row: 0,
              start: lastItem.start + lastItem.duration,
            };
            newClip.start = lastItem.start + lastItem.duration;

            const updated = [...prev, newClip];
            updateTotalDuration(updated);
            video.remove();
            toast.success("Clip added", {
              style: {
                borderRadius: "10px",
                background: "#333",
                color: "#b882f7",
              },
            });
            return updated;
          });
        });
      };
    } catch (e) {
      console.log(e);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClip = (e) => {
    e.preventDefault();
    if (clips.length > 1) {
      const newClips = clips.slice(0, -1);
      setClips(newClips);
      updateTotalDuration(newClips);
    } else {
      toast.error("Cannot remove only one clip.", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#b882f7",
        },
      });
    }
  };

  const updateTotalDuration = (updatedClips) => {
    const lastClipEnd = updatedClips.reduce(
      (max, clip) => Math.max(max, clip.start + clip.duration),
      0
    );

    const newTotalDuration = lastClipEnd;
    setTotalDuration(newTotalDuration);
  };

  const exportVideo = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:3000/video/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clips, selectedFilter, customFilterSettings }),
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "exported_video.mp4";
      a.click();
    } catch (e) {
      toast.error("Exporting Failed", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#b882f7",
        },
      });
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoRem = async () => {
    const currentClip = getCurrentlyPlayingClip();
    if (!currentClip) {
      toast.error("No clip is currently playing.", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#b882f7",
        },
      });
      return;
    }

    const video_id = currentClip.id;
    const token = localStorage.getItem("token");

    try {
      setIsLoading(true);

      const response = await fetch("http://localhost:3000/video/auto-removal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ video_id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process video");
      }

      const updated = await response.json();
      console.log("response object recieved by auto removal was: ", updated);
      const newUrl = updated.video.video_url;

      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = newUrl;

      video.onloadedmetadata = () => {
        const durationInSeconds = video.duration;
        const fps = 30;
        const durationInFrames = Math.round(durationInSeconds * fps);

        setClips((prevClips) => {
          const updatedClips = prevClips.map((clip) =>
            clip.id === video_id
              ? { ...clip, src: newUrl, duration: durationInFrames }
              : clip
          );
          updateTotalDuration(updatedClips);
          return updatedClips;
        });

        console.log("UPDATED THE CLIP: ", video);
        console.log("PUT THE NEW URL: ", newUrl);
        video.remove();
        toast("Object removal completed.", {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#b882f7",
          },
        });
      };
    } catch (err) {
      console.error("Processing failed:", err.message);
      toast.error(`Processing failed: ${err.message}`, {
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

  const handleClickRem = async (x, y) => {
    const project_id = localStorage.getItem("project_id");
    if (!project_id) {
      toast.error("No project_id ID found. Please upload a video first.", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#b882f7",
        },
      });
      return;
    }
    const currentFrame = getCurrentlyPlayingClip();
    const frameInClip = playerRef.current.getCurrentFrame();
    const frame = frameInClip - currentFrame.start;
    try {
      console.log({
        project_id: location.state.project_id,
        video_id: currentFrame.id,
        x_coord: x,
        y_coord: y,
        frame: frame,
      });
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:3000/video/click-removal",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            video_id: currentFrame.id,
            x_coord: x,
            y_coord: y,
            frame: frame,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process video");
      }

      const updated = await response.json();
      console.log("response object recieved by auto removal was: ", updated);
      const newUrl = updated.video.video_url;

      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = newUrl;

      video.onloadedmetadata = () => {
        const durationInSeconds = video.duration;
        const fps = 30;
        const durationInFrames = Math.round(durationInSeconds * fps);

        setClips((prevClips) => {
          const updatedClips = prevClips.map((clip) =>
            clip.id === currentFrame.id
              ? { ...clip, src: newUrl, duration: durationInFrames }
              : clip
          );
          updateTotalDuration(updatedClips);
          return updatedClips;
        });

        console.log("UPDATED THE CLIP: ", video);
        console.log("PUT THE NEW URL: ", newUrl);
        video.remove();
        toast.success("Object removal completed.", {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#b882f7",
          },
        });
      };
    } catch (err) {
      console.error("Processing failed:", err.message);
      toast.error(`Processing failed: ${err.message}`, {
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

  const handleDenoise = async (volume, sub) => {
    const currentFrame = getCurrentlyPlayingClip();
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      console.log(volume, sub, "THE THINGS");
      const response = await fetch("http://localhost:3000/video/denoise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          video_id: currentFrame.id,
          volume: volume,
          gen_sub: sub,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process video");
      }

      const updated = await response.json();
      console.log("response object recieved by auto removal was: ", updated);
      const newUrl = updated.video.video_url;

      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = newUrl;

      video.onloadedmetadata = () => {
        const durationInSeconds = video.duration;
        const fps = 30;
        const durationInFrames = Math.round(durationInSeconds * fps);

        setClips((prevClips) => {
          const updatedClips = prevClips.map((clip) =>
            clip.id === currentFrame.id
              ? { ...clip, src: newUrl, duration: durationInFrames }
              : clip
          );
          updateTotalDuration(updatedClips);
          return updatedClips;
        });

        console.log("UPDATED THE CLIP: ", video);
        console.log("PUT THE NEW URL: ", newUrl);
        video.remove();
        toast.success("Denoising completed.", {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#b882f7",
          },
        });
      };
    } catch (err) {
      console.error("Processing failed:", err.message);
      toast.error(`Processing failed: ${err.message}`, {
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

  const handleStyleTransfer = async (styleId) => {
    const currentFrame = getCurrentlyPlayingClip();
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      console.log("sending style id", styleId);
      const response = await fetch("http://localhost:3000/video/stylize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          video_id: currentFrame.id,
          style_id: styleId,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process video");
      }

      const updated = await response.json();
      console.log("response object recieved by auto removal was: ", updated);
      const newUrl = updated.video.video_url;

      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = newUrl;

      video.onloadedmetadata = () => {
        const durationInSeconds = video.duration;
        const fps = 30;
        const durationInFrames = Math.round(durationInSeconds * fps);

        setClips((prevClips) => {
          const updatedClips = prevClips.map((clip) =>
            clip.id === currentFrame.id
              ? { ...clip, src: newUrl, duration: durationInFrames }
              : clip
          );
          updateTotalDuration(updatedClips);
          return updatedClips;
        });

        console.log("UPDATED THE CLIP: ", video);
        console.log("PUT THE NEW URL: ", newUrl);
        video.remove();
        toast.success("Style Transfer completed.", {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#b882f7",
          },
        });
      };
    } catch (err) {
      console.error("Processing failed:", err.message);
      toast.error(`Processing failed: ${err.message}`, {
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

  const handleBgChange = async (bgNum) => {
    const currentFrame = getCurrentlyPlayingClip();
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      console.log("sending bg id", bgNum);
      const response = await fetch("http://localhost:3000/video/bgchange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          video_id: currentFrame.id,
          bg_num: bgNum,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process video");
      }

      const updated = await response.json();
      console.log("response object recieved by auto removal was: ", updated);
      const newUrl = updated.video.video_url;

      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = newUrl;

      video.onloadedmetadata = () => {
        const durationInSeconds = video.duration;
        const fps = 30;
        const durationInFrames = Math.round(durationInSeconds * fps);

        setClips((prevClips) => {
          const updatedClips = prevClips.map((clip) =>
            clip.id === currentFrame.id
              ? { ...clip, src: newUrl, duration: durationInFrames }
              : clip
          );
          updateTotalDuration(updatedClips);
          return updatedClips;
        });

        console.log("UPDATED THE CLIP: ", video);
        console.log("PUT THE NEW URL: ", newUrl);
        video.remove();
        toast.success("Background changed.", {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#b882f7",
          },
        });
      };
    } catch (err) {
      console.error("Processing failed:", err.message);
      toast.error(`Processing failed: ${err.message}`, {
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

  const handleFilterChange = (filterId, customSettings = null) => {
    setSelectedFilter(filterId);
    if (customSettings) {
      setCustomFilterSettings(customSettings);
    } else {
      setCustomFilterSettings(null);
    }
  };

  const getFilterStyle = () => {
    if (selectedFilter === "custom" && customFilterSettings) {
      const { brightness, contrast, saturation, hue, blur, opacity } =
        customFilterSettings;
      return {
        filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg) blur(${blur}px)`,
        opacity: opacity / 100,
      };
    }

    const filterStyles = {
      none: {},
      vintage: {
        filter: "sepia(0.8) contrast(1.2) brightness(1.1) saturate(0.8)",
      },
      cinema: {
        filter: "contrast(1.3) brightness(0.8) saturate(1.1)",
      },
      vivid: {
        filter: "saturate(1.8) contrast(1.1) brightness(1.05)",
      },
      bw: {
        filter: "grayscale(1) contrast(1.1)",
      },
      sepia: {
        filter: "sepia(1) contrast(1.1) brightness(1.1)",
      },
      blur: {
        filter: "blur(4px)",
      },
      warm: {
        filter: "hue-rotate(15deg) saturate(1.2) brightness(1.1)",
      },
      cool: {
        filter: "hue-rotate(-15deg) saturate(1.1) brightness(0.95)",
      },
      dramatic: {
        filter: "contrast(1.5) brightness(0.7) saturate(1.3)",
      },
    };

    return filterStyles[selectedFilter] || {};
  };

  const Original = () => {
    return (
      <Sequence
        key={originalClip.id}
        from={originalClip.start}
        durationInFrames={originalClip.duration}
      >
        <Video src={originalClip.src} />
      </Sequence>
    );
  };

  const Composition = () => {
    return (
      <div style={getFilterStyle()}>
        {clips
          .sort((a, b) => a.start - b.start)
          .map((item) => (
            <Sequence
              key={item.id}
              from={item.start}
              durationInFrames={item.duration || 2}
            >
              <Video src={item.src} />
            </Sequence>
          ))}
      </div>
    );
  };

  const TimelineItem = ({ item, type, index }) => {
    const itemClassName = `${styles.timelineItem} ${styles.clipItem}`;

    return (
      <div
        className={itemClassName}
        style={{
          left: `${(item.start / totalDuration) * 100}%`,
          width: `calc(${(item.duration / totalDuration) * 100}% - 4px)`,
          top: `${item.row * 44}px`,
        }}
      >
        <div className={styles.itemLabel}>
          {type.charAt(0).toUpperCase() + type.slice(1)} {index + 1}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.style.display = "none";
      void timelineRef.current.offsetHeight; // force reflow
      timelineRef.current.style.display = "";
    }
  }, [clips, totalDuration]);

  // Effect to add initial clip and text overlay
  useEffect(() => {
    if (clips.length === 0) {
      const videoURL = location.state.video;

      if (!videoURL)
        return toast.error("Failed to get video URL.", {
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#b882f7",
          },
        });
      const video = document.createElement("video");
      console.log("Video element created:", video);
      video.preload = "metadata";

      video.src = videoURL;

      video.onloadedmetadata = () => {
        const durationInSeconds = video.duration;
        const fps = 30;
        const durationInFrames = Math.round(durationInSeconds * fps);
        const newClip = {
          id: location.state.video_id,
          src: videoURL,
          name: location.state.video_name,
          duration: durationInFrames,
          row: 0,
          start: 0,
        };
        setOriginalClip(newClip);
        setClips([newClip]);
        updateTotalDuration([newClip]);
        setReady(true);
        video.remove();
      };
    }
  }, []);

  return (
    <>
      <VideoNavbar />
      <div className={styles.box}>
        <VideoSidebar
          onClickRem={handleClickRem}
          onFilterChange={handleFilterChange}
          selectedFilter={selectedFilter}
          onAutoRemove={handleAutoRem}
          onDenoise={handleDenoise}
          onStyleTransfer={handleStyleTransfer}
          onExport={exportVideo}
          onBgChange={handleBgChange}
        />
        {ready && totalDuration > 1 && (
          <div className={styles.container}>
            <button
              className={styles.originalBtn}
              onClick={() => {
                setShowOriginal(!showOriginal);
              }}
            >
              {showOriginal ? <EyeClosedIcon /> : <Eye />}
              {showOriginal ? "HIDE ORIGINAL" : "SHOW ORIGINAL"}
            </button>

            {/* Player section */}
            <div className={styles.playerSection}>
              <div className={styles.playerContainer}>
                <div className={styles.playerWrapper}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <p className={styles.videoStatus}>Edited</p>
                    <div className={styles.editedVid}>
                      <Player
                        ref={playerRef}
                        component={Composition}
                        durationInFrames={Math.max(1, totalDuration)}
                        compositionWidth={1920}
                        compositionHeight={1080}
                        controls
                        fps={30}
                        className={styles.player}
                        renderLoading={() => <div>Loading...</div>}
                        inputProps={{}}
                        style={{ height: "320px", width: "560px" }}
                        onFrameChange={(frame) => {
                          setCurrentFrame(frame);
                          console.log("FRAME: ", frame);
                        }}
                      />
                    </div>
                  </motion.div>
                  {showOriginal && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: "easeOut",
                        delay: 0.3,
                      }}
                    >
                      <p className={styles.videoStatus}>Original</p>
                      <div className={styles.originalVid}>
                        <Player
                          ref={uneditedRef}
                          component={Original}
                          durationInFrames={originalClip.duration}
                          compositionWidth={1920}
                          compositionHeight={1080}
                          controls
                          fps={30}
                          className={styles.player}
                          renderLoading={() => <div>Loading...</div>}
                          inputProps={{}}
                          style={{ height: "320px", width: "560px" }}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline section */}
            {
              <div
                className={`${styles.timelineSection} ${
                  showOriginal ? "hide" : "show"
                }`}
              >
                {/* Timeline controls */}
                <div className={styles.timelineControls}>
                  <div className={styles.controlsGroup}>
                    <form className={styles.addClipBox}>
                      <button
                        type="submit"
                        onClick={addClip}
                        className={styles.addButton}
                      >
                        <Plus className={styles.buttonIcon} />
                        <span className={styles.buttonText}>Add Clip</span>
                      </button>
                      <input
                        ref={inputRef}
                        type="file"
                        accept="video/mp4,video/x-m4v,video/*"
                      />
                    </form>
                    <div>
                      <button
                        type="submit"
                        onClick={deleteClip}
                        className={styles.addButton}
                      >
                        <Trash2 className={styles.buttonIcon} />
                        <span className={styles.buttonText}>Remove Clip</span>
                      </button>

                      {/* <button
                        type="button"
                        onClick={handleAutoRem}
                        className={`${styles.addButton} ${
                          isLoading ? styles.processing : ""
                        }`}
                        disabled={isLoading}
                      >
                        <Scissors className={styles.buttonIcon} />
                        <span className={styles.buttonText}>
                          {isLoading ? "Processing..." : "Remove Objects"}
                        </span>
                      </button> */}
                    </div>
                  </div>
                </div>

                {/* Timeline items */}
                <div
                  ref={timelineRef}
                  key={clips.length}
                  className={styles.timelineContent}
                >
                  <div className={styles.timelineInner}>
                    <div className={styles.timelineScrollable}>
                      <div
                        className={styles.timelineGrid}
                        style={{
                          width: `100%`,
                          height: "100%",
                          position: "relative",
                        }}
                      >
                        <div className={styles.timelineRow}>
                          <div className={styles.timelineRowInner}>
                            <div className={styles.timelineTrack1}>
                              {clips.map((clip, index) => (
                                <TimelineItem
                                  key={clip.id}
                                  item={clip}
                                  type="clip"
                                  index={index}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <TimelineMarker
                    currentFrame={currentFrame}
                    totalDuration={totalDuration}
                  />
                </div>
              </div>
            }
          </div>
        )}
      </div>
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(41, 41, 41, 0.73)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <ScaleLoader
            color={"#b882f7"}
            loading={isLoading}
            size={25}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        </div>
      )}
      <Toaster position="bottom-right" reverseOrder={false} />
    </>
  );
};

export default VideoEditor;
