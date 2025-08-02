import { useState } from "react";
import styles from "./VideoSidebar.module.css";
import {
  SlidersHorizontal,
  Play,
  Paintbrush,
  Brush as BrushCleaning,
  AudioLines,
  ZoomIn,
  Undo2,
  MousePointerClick,
  WandSparkles,
  SendToBack,
  Film,
} from "lucide-react";

import ClickableBox from "./ClickableBox";

const VideoSidebar = ({
  onFilterChange,
  selectedFilter,
  onAutoRemove,
  onDenoise,
  onClickRem,
  onStyleTransfer,
  onBgChange,
  onExport,
  onSuperRes,
}) => {
  const [objectRemovalMode, setObjectRemovalMode] = useState("click");
  const [isClickActive, setIsClickActive] = useState(false);
  const [isAutoActive, setIsAutoActive] = useState(false);
  const [style, setStyle] = useState(0);
  const [background, setBackground] = useState(0);
  const [detectedObjects, setDetectedObjects] = useState(null);

  const filters = [
    { id: "none", name: "None" },
    { id: "vintage", name: "Vintage" },
    { id: "cinema", name: "Cinematic" },
    { id: "vivid", name: "Vivid Colors" },
    { id: "bw", name: "Black & White" },
    { id: "sepia", name: "Sepia" },
    { id: "blur", name: "Motion Blur" },
    { id: "warm", name: "Warm Tone" },
    { id: "cool", name: "Cool Tone" },
    { id: "dramatic", name: "Dramatic" },
  ];

  const [superActive, setSuperActive] = useState(false);
  const [bgActive, setBgActive] = useState(false);
  const [audioActive, setAudioActive] = useState(false);
  const [filterActive, setFilterActive] = useState(false);
  const [styleActive, setStyleActive] = useState(false);
  const [objectRemActive, setObjectRemActive] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(100);
  const [generateSubtitles, setGenerateSubtitles] = useState(false);

  let styleSrc = [];
  for (let i = 0; i < 28; i++) {
    styleSrc[i] = `/Artworks/${i + 1}.jpg`;
  }

  let bgSrc = [];
  for (let i = 0; i < 10; i++) {
    bgSrc[i] = `/Backgrounds/${i + 1}.png`;
  }

  const [filterSettings, setFilterSettings] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    opacity: 100,
  });

  const handleSuperClick = () => {
    setAudioActive(false);
    setFilterActive(false);
    setObjectRemActive(false);
    setStyleActive(false);
    setSuperActive(!superActive);
    setBgActive(false);
  };

  const handleAudioClick = () => {
    setFilterActive(false);
    setSuperActive(false);
    setObjectRemActive(false);
    setStyleActive(false);
    setAudioActive(!audioActive);
    setBgActive(false);
  };

  const handleFilterClick = () => {
    setAudioActive(false);
    setSuperActive(false);
    setObjectRemActive(false);
    setStyleActive(false);
    setFilterActive(!filterActive);
    setBgActive(false);
  };

  const handleObjRemClick = () => {
    setAudioActive(false);
    setSuperActive(false);
    setFilterActive(false);
    setStyleActive(false);
    setObjectRemActive(!objectRemActive);
    setBgActive(false);
  };

  const handleStyleClick = () => {
    setAudioActive(false);
    setSuperActive(false);
    setFilterActive(false);
    setObjectRemActive(false);
    setStyleActive(!styleActive);
    setBgActive(false);
  };

  const handleBgClick = () => {
    setAudioActive(false);
    setSuperActive(false);
    setFilterActive(false);
    setObjectRemActive(false);
    setBgActive(!bgActive);
    setStyleActive(false);
  };

  const handleFilterSelect = (filterId) => {
    if (onFilterChange) {
      onFilterChange(filterId);
    }
  };

  const handleFilterSettingChange = (setting, value) => {
    const newSettings = { ...filterSettings, [setting]: value };
    setFilterSettings(newSettings);

    if (onFilterChange) {
      onFilterChange("custom", newSettings);
    }
  };

  const handleAutoModeToggle = async () => {
    const newAutoState = !isAutoActive;
    setIsAutoActive(newAutoState);

    if (newAutoState) {
      onAutoRemove();
      setIsClickActive(false);
    }
  };

  const handleClickModeToggle = () => {
    const newClickState = !isClickActive;
    setIsClickActive(newClickState);

    if (newClickState) {
      setIsAutoActive(false);
    }
  };

  const handleClickCancel = () => {
    setIsClickActive(false);
  };

  const handleObjectClick = (coordinates) => {
    console.log("Object detected at coordinates:", coordinates);

    setDetectedObjects(coordinates);

    console.log("Auto-detect clicked at:", coordinates);
    console.log("All detected objects:", coordinates);
  };

  const getVideoElement = () => {
    const videoWrapper = document.querySelector(".videoWrapper");
    if (videoWrapper) {
      return videoWrapper.querySelector("video");
    }
    return document.querySelector("video");
  };

  return (
    <>
      <section className={styles.container}>
        <button className={styles.exportBtn} onClick={onExport}>
          <Film />
          EXPORT VIDEO
        </button>
        <ul>
          <button
            onClick={handleSuperClick}
            className={`${styles.menu} ${superActive ? styles.active : ""}`}
          >
            <ZoomIn size={20} fill={superActive ? "#212121" : "#132029ff"} />
            UPSCALING
          </button>
          {superActive && (
            <>
              <p className={styles.modeDescription}>
                Enhances video resolution by 4× using AI-based upscaling.
                Preserves fine details and sharpens frames without introducing
                artifacts.
              </p>
              <button
                className={styles.previewBtn}
                onClick={() => {
                  onSuperRes();
                }}
              >
                <Play size={14} />
                Process
              </button>
            </>
          )}

          <button
            onClick={handleBgClick}
            className={`${styles.menu} ${bgActive ? styles.active : ""}`}
          >
            <SendToBack
              size={20}
              fill={superActive ? "#212121" : "#132029ff"}
            />
            BG CHANGE
          </button>
          {bgActive && (
            <>
              <p className={styles.modeDescription}>
                Replaces the original video background with a chosen preset from
                available options. Tailored for videos with clear human
                subjects.
              </p>
              <button
                className={styles.previewBtn}
                onClick={() => {
                  onBgChange(background);
                }}
              >
                <Play size={14} />
                Process
              </button>

              <div className={styles.styleGrid}>
                <button
                  onClick={() => setBackground(0)}
                  className={`${styles.noStyle} ${
                    style === 0 ? styles.noStyleactive : ""
                  }`}
                >
                  <Undo2 size={16} color="#132029ff" />
                  NONE
                </button>
                {bgSrc.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setBackground(i + 1)}
                    className={`${styles.styleImg} ${
                      background === i + 1 ? styles.styleImgactive : ""
                    }`}
                  >
                    <img src={src} alt={`Art Style ${i + 1}`} />
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            onClick={handleAudioClick}
            className={`${styles.menu} ${audioActive ? styles.active : ""}`}
          >
            <AudioLines
              size={20}
              fill={audioActive ? "#212121" : "#132029ff"}
            />
            DENOISE
          </button>
          {audioActive && (
            <>
              <form className={styles.audioForm}>
                <label className={styles.audioTools}>
                  <div className={styles.settingValue}>
                    Noise <span>{noiseLevel}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className={styles.settingSlider}
                    value={noiseLevel}
                    onChange={(e) => setNoiseLevel(e.target.value)}
                  />
                </label>
                <p className={styles.modeDescription}>
                  Adjust the slider: 0 means no noise reduction, 100 means full
                  background noise removal.
                </p>
                <label className={styles.audioTools}>
                  <span className={styles.settingValue}>Subtitles</span>
                  <input
                    type="checkbox"
                    className={styles.settingsCheck}
                    checked={generateSubtitles}
                    onChange={(e) => setGenerateSubtitles(e.target.checked)}
                  />
                </label>
                <button
                  className={styles.previewBtn}
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    onDenoise(noiseLevel, generateSubtitles);
                  }}
                >
                  <Play size={14} />
                  Process
                </button>
              </form>
            </>
          )}

          <button
            onClick={handleObjRemClick}
            className={`${styles.menu} ${objectRemActive ? styles.active : ""}`}
          >
            <BrushCleaning
              size={20}
              fill={objectRemActive ? "#212121" : "#132029ff"}
            />
            OBJECT REMOVAL
          </button>
          {objectRemActive && (
            <div className={styles.lassoControls}>
              <div className={styles.modeSelector}>
                <div className={styles.modeButtons}>
                  <button
                    className={`${styles.modeBtn} ${
                      objectRemovalMode === "click" ? styles.modeActive : ""
                    }`}
                    onClick={() => setObjectRemovalMode("click")}
                  >
                    <MousePointerClick size={16} />
                    <span>Click to Erase</span>
                  </button>
                  <button
                    className={`${styles.modeBtn} ${
                      objectRemovalMode === "auto" ? styles.modeActive : ""
                    }`}
                    onClick={() => setObjectRemovalMode("auto")}
                  >
                    <WandSparkles size={16} />
                    <span>Auto Detect</span>
                  </button>
                </div>
              </div>

              <div className={styles.modeDescription}>
                {objectRemovalMode === "click" ? (
                  <p>
                    Click on objects in the video to automatically detect and
                    remove them. AI will identify similar objects throughout the
                    timeline.
                  </p>
                ) : (
                  <p>
                    Utilize AI algorithms to automatically identify and remove
                    unwanted elements from your video, saving time and enhancing
                    precision.
                  </p>
                )}
              </div>

              {detectedObjects && (
                <div className={styles.detectedObjects}>
                  <div className={styles.objectsList}>
                    <span>
                      x: {detectedObjects.x}, y: {detectedObjects.y}
                    </span>
                  </div>
                  <button
                    onClick={() => setDetectedObjects(null)}
                    className={styles.clearBtn}
                  >
                    Clear Click
                  </button>
                </div>
              )}
              {objectRemovalMode === "click" && (
                <div className={styles.lassoSettings}>
                  <button
                    className={`${styles.lassoActivateBtn} ${
                      isClickActive ? styles.active : ""
                    }`}
                    onClick={handleClickModeToggle}
                  >
                    <MousePointerClick size={14} />
                    {isClickActive ? "Exit Click Mode" : "Activate Click Mode"}
                  </button>
                </div>
              )}

              <button
                className={styles.previewBtn}
                onClick={() => {
                  if (objectRemovalMode === "auto") {
                    handleAutoModeToggle();
                  } else {
                    setIsClickActive(false);

                    onClickRem(detectedObjects.x, detectedObjects.y);
                    setIsClickActive(false);
                  }
                }}
              >
                <Play size={14} />
                Process
              </button>
            </div>
          )}

          <button
            onClick={handleFilterClick}
            className={`${styles.menu} ${filterActive ? styles.active : ""}`}
          >
            <SlidersHorizontal
              size={20}
              fill={filterActive ? "rgb(0, 111, 148)" : "#132029ff"}
            />
            FILTERS
          </button>
          {filterActive && (
            <div className={styles.filterControls}>
              <div className={styles.filterSection}>
                <div className={styles.filterGrid}>
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      className={`${styles.filterBtn} ${
                        selectedFilter === filter.id ? styles.active : ""
                      }`}
                      onClick={() => handleFilterSelect(filter.id)}
                    >
                      <span className={styles.filterName}>{filter.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterSection}>
                <div className={styles.filterSettings}>
                  <div className={styles.settingGroup}>
                    <label className={styles.settingLabel}>Brightness</label>
                    <div className={styles.settingControl}>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={filterSettings.brightness}
                        onChange={(e) =>
                          handleFilterSettingChange(
                            "brightness",
                            Number(e.target.value)
                          )
                        }
                        className={styles.settingSlider}
                      />
                      <span className={styles.settingValue}>
                        {filterSettings.brightness}%
                      </span>
                    </div>
                  </div>

                  <div className={styles.settingGroup}>
                    <label className={styles.settingLabel}>Contrast</label>
                    <div className={styles.settingControl}>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={filterSettings.contrast}
                        onChange={(e) =>
                          handleFilterSettingChange(
                            "contrast",
                            Number(e.target.value)
                          )
                        }
                        className={styles.settingSlider}
                      />
                      <span className={styles.settingValue}>
                        {filterSettings.contrast}%
                      </span>
                    </div>
                  </div>

                  <div className={styles.settingGroup}>
                    <label className={styles.settingLabel}>Saturation</label>
                    <div className={styles.settingControl}>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={filterSettings.saturation}
                        onChange={(e) =>
                          handleFilterSettingChange(
                            "saturation",
                            Number(e.target.value)
                          )
                        }
                        className={styles.settingSlider}
                      />
                      <span className={styles.settingValue}>
                        {filterSettings.saturation}%
                      </span>
                    </div>
                  </div>

                  <div className={styles.settingGroup}>
                    <label className={styles.settingLabel}>Hue Shift</label>
                    <div className={styles.settingControl}>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={filterSettings.hue}
                        onChange={(e) =>
                          handleFilterSettingChange(
                            "hue",
                            Number(e.target.value)
                          )
                        }
                        className={styles.settingSlider}
                      />
                      <span className={styles.settingValue}>
                        {filterSettings.hue}°
                      </span>
                    </div>
                  </div>

                  <div className={styles.settingGroup}>
                    <label className={styles.settingLabel}>Blur</label>
                    <div className={styles.settingControl}>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={filterSettings.blur}
                        onChange={(e) =>
                          handleFilterSettingChange(
                            "blur",
                            Number(e.target.value)
                          )
                        }
                        className={styles.settingSlider}
                      />
                      <span className={styles.settingValue}>
                        {filterSettings.blur}px
                      </span>
                    </div>
                  </div>

                  <div className={styles.settingGroup}>
                    <label className={styles.settingLabel}>Opacity</label>
                    <div className={styles.settingControl}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filterSettings.opacity}
                        onChange={(e) =>
                          handleFilterSettingChange(
                            "opacity",
                            Number(e.target.value)
                          )
                        }
                        className={styles.settingSlider}
                      />
                      <span className={styles.settingValue}>
                        {filterSettings.opacity}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleStyleClick}
            className={`${styles.menu} ${styleActive ? styles.active : ""}`}
          >
            <Paintbrush
              size={20}
              fill={styleActive ? "#969b7aff" : "#132029ff"}
            />
            STYLE TRANSFER
          </button>

          {styleActive && (
            <>
              <p className={styles.modeDescription}>
                Applies the visual aesthetic of a selected reference artwork or
                image style to the entire video. Alters color, texture, and
                stroke patterns frame-by-frame.
              </p>
              <button
                className={styles.previewBtn}
                onClick={() => {
                  onStyleTransfer(style);
                }}
              >
                <Play size={14} />
                Process
              </button>

              <div className={styles.styleGrid}>
                <button
                  onClick={() => setStyle(0)}
                  className={`${styles.noStyle} ${
                    style === 0 ? styles.noStyleactive : ""
                  }`}
                >
                  <Undo2 size={16} color="#132029ff" />
                  NONE
                </button>
                {styleSrc.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setStyle(i + 1)}
                    className={`${styles.styleImg} ${
                      style === i + 1 ? styles.styleImgactive : ""
                    }`}
                  >
                    <img src={src} alt={`Art Style ${i + 1}`} />
                  </button>
                ))}
              </div>
            </>
          )}
        </ul>
      </section>

      {/* Auto-Detect Clickable Overlay */}
      <ClickableBox
        isActive={isClickActive}
        onCancel={handleClickCancel}
        onClickAt={handleObjectClick}
        videoElement={getVideoElement()}
      />
    </>
  );
};

export default VideoSidebar;
