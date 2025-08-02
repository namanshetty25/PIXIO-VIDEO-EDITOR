import { useState, useRef, useMemo, useEffect } from "react";
import { Player } from "@remotion/player";
import { Sequence, Video } from "remotion";
import styles from "./Generate.module.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import toast, { Toaster } from "react-hot-toast";
import { Sparkles as WandSparkles, Download } from "lucide-react";

const Generate = () => {
  const playerRef = useRef(null);
  const [genText, setGenText] = useState("");
  const [gif, setGif] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const Composition = () => {
    return (
      <div>
        {gif && (
          <Sequence key={gif.id} from={gif.start} durationInFrames={64}>
            <Video src={gif.src} />
          </Sequence>
        )}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    if (genText === "") {
      e.preventDefault();
      toast.error("No prompt entered", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#b882f7",
        },
      });
    } else {
      e.preventDefault();
      setIsGenerating(true);
      const prompt = e.target.prompt.value;
      console.log("Prompt:", prompt);
      const token = localStorage.getItem("token");
      try {
        const response = await fetch("http://localhost:3000/gif/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ prompt }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Server error");
        }

        setGif({
          id: 1,
          start: 0,
          src: data.video.video_url,
        });
      } catch (err) {
        console.error(err);
        setIsGenerating(false);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleExport = async (gif) => {
    try {
      setIsExporting(true);
      const res = await fetch("http://localhost:3000/gif/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gif }),
      });
      console.log("HI");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "exported_gif.mp4";
      a.click();
    } catch (e) {
      console.error(e);
      toast.error("Exporting Failed", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#b882f7",
        },
      });
      setIsExporting(false);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className={styles.main}>
        <Sidebar />
        <section className={styles.container}>
          <div className={styles.textBox}>
            <form
              onSubmit={handleSubmit}
              className={isGenerating ? styles.submitting : ""}
            >
              <input
                placeholder="What GIF would you like to generate?"
                type="text"
                value={genText}
                name="prompt"
                onChange={(e) => setGenText(e.target.value)}
                disabled={isGenerating}
              />
              <button type="submit" disabled={isGenerating}>
                <WandSparkles size={18} />
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            </form>
          </div>

          <button
            className={`${styles.exportButton} ${
              isExporting ? styles.activeExport : ""
            }`}
            onClick={() => {
              if (gif) {
                handleExport(gif);
              } else {
                toast.error("No GIF generated.", {
                  style: {
                    borderRadius: "10px",
                    background: "#333",
                    color: "#b882f7",
                  },
                });
              }
            }}
          >
            <Download size={16} />
            {isExporting ? "EXPORTING" : "EXPORT GIF"}
          </button>

          <div className={styles.editedVid}>
            <Player
              ref={playerRef}
              component={Composition}
              durationInFrames={64}
              compositionWidth={256}
              compositionHeight={256}
              controls
              fps={30}
              className={styles.player}
              inputProps={{}}
              style={{ height: "512px", width: "512px" }}
            />
          </div>

          <p className={styles.statusText}>
            {gif
              ? "Your GIF is ready for export!"
              : "Enter a prompt above to generate your GIF"}
          </p>
        </section>
      </div>
      <Toaster position="bottom-right" reverseOrder={false} />
    </>
  );
};

export default Generate;
