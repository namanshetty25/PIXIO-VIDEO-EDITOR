import express from "express";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import authMiddleware from "../middlewares/auth.middleware.js";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import os from "os";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

const gifRouter = express.Router();
const prisma = new PrismaClient();
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

gifRouter.post("/generate", authMiddleware, async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing or prompt" });
  }

  console.log("HEYHEY");
  try {
    const formData = new URLSearchParams();
    formData.append("prompt", JSON.stringify(prompt));

    try {
      console.log("Sending to ML with GIF prompt:", prompt);
      const mlRes = await fetch(
        "https://261b9b87cd95.ngrok-free.app/generate",
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (!mlRes.ok) {
        const errText = await mlRes.text();
        console.error("ML Server Error Body:", errText);
        return res
          .status(404)
          .json({ error: `Server responded with ${mlRes.status}` });
      }

      const stream = Readable.from(mlRes.body);
      let uploadFinished = false;
      const cloudinaryStream = cloudinary.uploader.upload_stream(
        { folder: `user${req.user.userId}`, resource_type: "video" },
        async (error, result) => {
          if (uploadFinished) return;
          uploadFinished = true;

          if (error) {
            console.error("Cloudinary upload error:", error);
            return res
              .status(500)
              .json({ success: false, error: error.message });
          }

          try {
            const newGIF = await prisma.gif.create({
              data: {
                video_url: result.secure_url,
                video_name: prompt,
                user_id: req.user.userId,
              },
            });

            console.log("Created GIF:", newGIF);
            return res.status(200).json({ success: true, video: newGIF });
          } catch (dbErr) {
            console.error("Database error:", dbErr);
            return res
              .status(500)
              .json({ success: false, error: "Database error" });
          }
        }
      );

      stream.pipe(cloudinaryStream);
    } catch (error) {
      console.error("Request failed:", error.message);
      return res.status(500).json({ error: `Request failed` });
    }
  } catch (error) {
    console.error("ML processing error:", error.stack || error);

    res.status(500).json({ error: "Failed to process video" });
  }
});

// Set the path to the static FFmpeg binary
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfmpegPath(ffmpegStatic);

gifRouter.post("/export", async (req, res) => {
  let tmpDir;

  try {
    const gif = req.body.gif;

    if (!gif || !gif.src) {
      return res.status(400).json({ error: "Invalid gif data" });
    }

    tmpDir = path.join(os.tmpdir(), `export-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    console.log("Created temp directory:", tmpDir);

    const response = await fetch(gif.src);
    if (!response.ok) {
      throw new Error(`Failed to fetch gif: ${response.statusText}`);
    }

    const inputPath = path.join(tmpDir, "input.mp4");
    const fileStream = fs.createWriteStream(inputPath);

    await new Promise((resolve, reject) => {
      const nodeStream = Readable.fromWeb(response.body);
      nodeStream.pipe(fileStream);
      nodeStream.on("error", reject);
      fileStream.on("error", reject);
      fileStream.on("finish", resolve);
    });

    console.log("Downloaded to:", inputPath);

    const outputPath = path.join(tmpDir, "output.mp4");

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(["-c:v libx264", "-preset veryfast"])
        .output(outputPath)
        .on("start", (cmd) => console.log("FFmpeg started:", cmd))
        .on("end", () => {
          console.log("FFmpeg finished");
          resolve();
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          reject(new Error(`FFmpeg failed: ${err.message}`));
        })
        .run();
    });

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      throw new Error("Output video is missing or empty");
    }

    const stats = fs.statSync(outputPath);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", 'attachment; filename="exported.mp4"');
    res.setHeader("Content-Length", stats.size);

    const stream = fs.createReadStream(outputPath);

    stream.on("end", () => {
      setTimeout(() => {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch (err) {
          console.error("Cleanup error:", err);
        }
      }, 1000);
    });

    stream.on("error", (err) => {
      console.error("Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Streaming failed" });
      }
    });

    stream.pipe(res);
  } catch (error) {
    console.error("Export error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "Export failed" });
    }
    if (tmpDir) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.error("Cleanup after error failed:", cleanupErr);
      }
    }
  }
});

export default gifRouter;
