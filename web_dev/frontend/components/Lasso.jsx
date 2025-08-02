import React, { useRef, useEffect, useState, useCallback } from "react";
import { X, Check, RotateCcw } from "lucide-react";
import styles from "./Lasso.module.css";

const LassoCanvas = ({
  isActive,
  brushSize,
  feathering,
  onSelectionComplete,
  onCancel,
  videoElement,
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [completedPaths, setCompletedPaths] = useState([]);
  const [canvasRect, setCanvasRect] = useState(null);

  // Update canvas size when video element changes
  useEffect(() => {
    if (videoElement && canvasRef.current) {
      const rect = videoElement.getBoundingClientRect();
      setCanvasRect(rect);

      const canvas = canvasRef.current;
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Position canvas over video
      canvas.style.left = `${rect.left}px`;
      canvas.style.top = `${rect.top}px`;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }
  }, [videoElement, isActive]);

  // Get mouse position relative to canvas
  const getMousePos = useCallback(
    (e) => {
      if (!canvasRef.current || !canvasRect) return { x: 0, y: 0 };

      const rect = canvasRef.current.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    [canvasRect]
  );

  // Draw the lasso path
  const drawPath = useCallback((ctx, path, isComplete = false) => {
    if (path.length < 2) return;

    ctx.save();

    // Set up drawing style
    ctx.strokeStyle = isComplete ? "#00cc66" : "#0066cc";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash(isComplete ? [] : [5, 5]);

    // Draw the path
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);

    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }

    if (isComplete) {
      ctx.closePath();
      ctx.fillStyle = "rgba(0, 204, 102, 0.1)";
      ctx.fill();
    }

    ctx.stroke();
    ctx.restore();
  }, []);

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw completed paths
    completedPaths.forEach((path) => drawPath(ctx, path, true));

    // Draw current path
    if (currentPath.length > 0) {
      drawPath(ctx, currentPath, false);
    }
  }, [currentPath, completedPaths, drawPath]);

  // Handle mouse events
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;

    const handleMouseDown = (e) => {
      e.preventDefault();
      setIsDrawing(true);
      const pos = getMousePos(e);
      setCurrentPath([pos]);
    };

    const handleMouseMove = (e) => {
      if (!isDrawing) return;
      e.preventDefault();

      const pos = getMousePos(e);
      setCurrentPath((prev) => [...prev, pos]);
    };

    const handleMouseUp = (e) => {
      if (!isDrawing) return;
      e.preventDefault();

      setIsDrawing(false);

      if (currentPath.length > 3) {
        setCompletedPaths((prev) => [...prev, currentPath]);
      }

      setCurrentPath([]);
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [isActive, isDrawing, currentPath, getMousePos]);

  // Redraw when paths change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleClear = () => {
    setCompletedPaths([]);
    setCurrentPath([]);
  };

  const handleComplete = () => {
    if (completedPaths.length > 0) {
      // Combine all paths into one selection
      const allPoints = completedPaths.flat();
      onSelectionComplete(allPoints);
    }
    handleClear();
  };

  const handleCancel = () => {
    handleClear();
    onCancel();
  };

  if (!isActive) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className={styles.lassoCanvas}
        style={{
          cursor: `crosshair`,
          pointerEvents: isActive ? "auto" : "none",
        }}
      />

      {isActive && (
        <div className={styles.lassoControls}>
          <div className={styles.brushIndicator}>
            <div
              className={styles.brushPreview}
              style={{
                width: `${brushSize}px`,
                height: `${brushSize}px`,
                filter: `blur(${feathering}px)`,
              }}
            />
            <span className={styles.brushSize}>{brushSize}px</span>
          </div>

          <div className={styles.actionButtons}>
            <button
              className={`${styles.actionBtn} ${styles.clearBtn}`}
              onClick={handleClear}
              disabled={completedPaths.length === 0}
            >
              <RotateCcw size={16} />
              Clear
            </button>
            <button
              className={`${styles.actionBtn} ${styles.cancelBtn}`}
              onClick={handleCancel}
            >
              <X size={16} />
              Cancel
            </button>
            <button
              className={`${styles.actionBtn} ${styles.completeBtn}`}
              onClick={handleComplete}
              disabled={completedPaths.length === 0}
            >
              <Check size={16} />
              Apply Selection
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default LassoCanvas;
