import { useRef, useEffect, useCallback } from "react";

const ClickableBox = ({ isActive, videoElement, onClickAt, onCancel }) => {
  const overlayRef = useRef(null);
  useEffect(() => {
    if (!videoElement || !overlayRef.current || !isActive) return;

    const overlay = overlayRef.current;

    const updatePosition = () => {
      const rect = videoElement.getBoundingClientRect();

      requestAnimationFrame(() => {
        overlay.style.position = "fixed";
        overlay.style.left = `${rect.left}px`;
        overlay.style.top = `${rect.top}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;
        overlay.style.zIndex = "1000";
      });
    };

    updatePosition();

    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(videoElement);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [videoElement, isActive]);

  const handleClick = useCallback(
    (e) => {
      if (!overlayRef.current || !videoElement) return;

      const overlayRect = overlayRef.current.getBoundingClientRect();
      const videoRect = videoElement.getBoundingClientRect();

      const relativeX = (e.clientX - overlayRect.left) / overlayRect.width;
      const relativeY = (e.clientY - overlayRect.top) / overlayRect.height;

      const coordinates = {
        x: Math.round(relativeX * videoElement.videoWidth),
        y: Math.round(relativeY * videoElement.videoHeight),
      };

      onClickAt?.(coordinates);
    },
    [onClickAt, videoElement]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isActive) {
        onCancel?.();
      }
    };

    if (isActive) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isActive, onCancel]);

  if (!isActive || !videoElement) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleClick}
      style={{
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        border: "2px dashed #60a5fa",
        cursor: "crosshair",
        backdropFilter: "blur(1px)",
        transition: "all 0.2s",
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = "rgba(59, 130, 246, 0.2)";
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
      }}
    >
      <div
        style={{
          color: "white",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(4px)",
          textAlign: "center",
        }}
      >
        Click to capture object
        <div style={{ fontSize: "12px", color: "#d1d5db", marginTop: "4px" }}>
          Press ESC to cancel
        </div>
      </div>
    </div>
  );
};

export default ClickableBox;
