import express from "express";
import Busboy from "busboy";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import authMiddleware from "../middlewares/auth.middleware.js";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import os from "os";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const videoRouter = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

videoRouter.post("/new-project", authMiddleware, async (req, res) => {
  try {
    console.log("IN NEW PROJECT");
    const { project_name } = req.body;
    const user_id = req.user.userId;

    if (!user_id || !project_name) {
      return res.status(400).json({ error: "Missing user_id or project_name" });
    }

    const newProject = await prisma.projects.create({
      data: {
        user_id: parseInt(user_id),
        name: project_name,
      },
    });
    console.log("NEW PROJECT", newProject);
    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: newProject,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create project",
    });
  }
});

videoRouter.post("/upload", authMiddleware, (req, res) => {
  console.log("IN UPLOAD");
  const busboy = Busboy({ headers: req.headers });
  const user_id = parseInt(req.user.userId);
  console.log("REQ", req);
  const project_id = parseInt(req.query.project_id);

  if (!user_id || !project_id) {
    return res.status(400).json({ error: "Missing user_id or project_id" });
  }

  let uploadFinished = false;

  let uploadHandled = false;

  busboy.on("file", (fieldname, fileStream, filename, encoding, mimetype) => {
    if (uploadHandled) return;
    uploadHandled = true;

    console.log("Uploading:", filename);

    const cloudStream = cloudinary.uploader.upload_stream(
      {
        folder: `user${user_id}`,
        resource_type: "video",
      },
      async (error, result) => {
        if (uploadFinished) return;
        uploadFinished = true;

        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ success: false, error: error.message });
        }

        try {
          const videoData = {
            project_id,
            video_url: result.secure_url,
            video_name: filename.filename,
            user_id,
          };
          console.log("VIDEO DATA", videoData);
          console.log("Saving video to DB:", videoData);

          const newVideo = await prisma.videos.create({ data: videoData });

          console.log("Created video:", newVideo);
          return res.status(200).json({ success: true, video: newVideo });
        } catch (dbErr) {
          console.error("Database error:", dbErr);
          return res
            .status(500)
            .json({ success: false, error: "Database error" });
        }
      }
    );

    fileStream.pipe(cloudStream);
  });

  busboy.on("finish", () => {
    if (!uploadHandled) {
      res.status(400).json({ error: "No video file uploaded" });
    }
  });

  req.pipe(busboy);
});

videoRouter.post("/auto-removal", authMiddleware, async (req, res) => {
  const { video_id } = req.body;

  if (!video_id) {
    return res.status(400).json({ error: "Missing video_id" });
  }

  try {
    const video = await prisma.videos.findUnique({
      where: { id: parseInt(video_id) },
    });

    if (!video || !video.video_url) {
      return res.status(404).json({ error: "Video not found" });
    }

    const videoUrl = video.video_url;

    const formData = new URLSearchParams();
    formData.append("video_url", videoUrl);

    try {
      console.log("Sending to ML with video URL:", videoUrl);
      const response = await fetch(
        "https://3ed499eb22e3.ngrok-free.app/process",
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("ML Server Error Body:", errText);
        return res
          .status(404)
          .json({ error: `Server responded with ${response.status}` });
      }
      // res.setHeader("Content-Type", "video/mp4");
      // res.setHeader("Content-Disposition", 'inline; filename="removed.mp4"');
      const stream = Readable.from(response.body);
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
            const updatedVideo = await prisma.videos.update({
              where: { id: parseInt(video_id) },
              data: { video_url: result.secure_url },
            });

            console.log("Created video:", updatedVideo);
            return res.status(200).json({ success: true, video: updatedVideo });
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

videoRouter.post("/click-removal", authMiddleware, async (req, res) => {
  try {
    const { video_id, x_coord, y_coord, frame } = req.body;

    console.log(video_id, x_coord, y_coord, frame);
    if (!video_id || !x_coord || !y_coord) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const video = await prisma.videos.findUnique({
      where: { id: parseInt(video_id) },
    });

    if (!video || !video.video_url) {
      return res.status(404).json({ error: "Video not found" });
    }

    const formData = new URLSearchParams();
    formData.append("video_url", video.video_url);
    formData.append("x", x_coord);
    formData.append("y", y_coord);
    formData.append("frame", frame);

    console.log("SENT TO ML MODEL:", video.video_url);

    const mlRes = await fetch("https://1131068c5808.ngrok-free.app/remove", {
      method: "POST",

      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!mlRes.ok || !mlRes.body) {
      const errText = await mlRes.text();
      console.error("ML error response:", errText);
      return res.status(500).json({ error: "ML processing failed" });
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
          return res.status(500).json({ success: false, error: error.message });
        }

        try {
          const updatedVideo = await prisma.videos.update({
            where: { id: parseInt(video_id) },
            data: { video_url: result.secure_url },
          });

          console.log("Updated video with click-removal result:", updatedVideo);
          return res.status(200).json({ success: true, video: updatedVideo });
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
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

videoRouter.post("/denoise", authMiddleware, async (req, res) => {
  const { video_id, volume, gen_sub } = req.body;

  if (!video_id) {
    return res.status(400).json({ error: "Missing video_id" });
  }

  try {
    const video = await prisma.videos.findUnique({
      where: { id: parseInt(video_id) },
    });

    if (!video || !video.video_url) {
      return res.status(404).json({ error: "Video not found" });
    }

    const formData = new URLSearchParams();
    formData.append("video_url", video.video_url);
    formData.append("volume", volume || "50");
    formData.append("gen_sub", gen_sub ? "true" : "false");

    const mlServerURL = "https://eec0ecfd2a0e.ngrok-free.app/denoise";
    const mlRes = await fetch(mlServerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!mlRes.ok || !mlRes.body) {
      console.log("ml ba response is", mlRes);
      const errText = await mlRes.text();
      console.error("ML error response:", errText);
      return res.status(500).json({ error: "ML processing failed" });
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
          return res.status(500).json({ success: false, error: error.message });
        }

        try {
          const updatedVideo = await prisma.videos.update({
            where: { id: parseInt(video_id) },
            data: { video_url: result.secure_url },
          });

          console.log("Updated video with denoised result:", updatedVideo);
          return res.status(200).json({ success: true, video: updatedVideo });
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
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

videoRouter.post("/stylize", authMiddleware, async (req, res) => {
  const { video_id, style_id } = req.body;

  console.log(video_id, style_id);
  if (!video_id || !style_id) {
    return res.status(400).json({ error: "Missing video_id or style_id" });
  }

  try {
    const video = await prisma.videos.findUnique({
      where: { id: parseInt(video_id) },
    });

    if (!video || !video.video_url) {
      return res.status(404).json({ error: "Video not found." });
    }

    console.log("video found");
    const formData = new URLSearchParams();
    formData.append("video_url", video.video_url);
    formData.append("style_num", parseInt(style_id).toString());
    console.log("form data: ", formData);
    const mlRes = await fetch("https://3e3807be25fa.ngrok-free.app/stylize/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!mlRes.ok || !mlRes.body) {
      const errText = await mlRes.text();
      console.error("ML error response:", errText);
      return res.status(500).json({ error: "ML processing failed." });
    }

    let uploadFinished = false;
    const stream = Readable.from(mlRes.body);

    console.log("ML response content-type:", mlRes.headers.get("content-type"));
    console.log(mlRes.body);
    const cloudinaryStream = cloudinary.uploader.upload_stream(
      { folder: `user${req.user.userId}`, resource_type: "video" },
      async (error, result) => {
        if (uploadFinished) return;
        uploadFinished = true;

        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ success: false, error: error.message });
        }

        try {
          const updatedVideo = await prisma.videos.update({
            where: { id: parseInt(video_id) },
            data: { video_url: result.secure_url },
          });

          console.log("Updated video with stylized result:", updatedVideo);
          return res.status(200).json({ success: true, video: updatedVideo });
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
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

videoRouter.post("/superres", authMiddleware, async (req, res) => {
  const { video_id } = req.body;

  console.log(video_id);
  if (!video_id) {
    return res.status(400).json({ error: "Missing video_id or style_id" });
  }

  try {
    const video = await prisma.videos.findUnique({
      where: { id: parseInt(video_id) },
    });

    if (!video || !video.video_url) {
      return res.status(404).json({ error: "Video not found." });
    }

    console.log("video found");
    const formData = new URLSearchParams();
    formData.append("video_url", video.video_url);

    console.log("form data: ", formData);
    const mlRes = await fetch("https://9b7b93417ea7.ngrok-free.app/run/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!mlRes.ok || !mlRes.body) {
      const errText = await mlRes.text();
      console.error("ML error response:", errText);
      return res.status(500).json({ error: "ML processing failed." });
    }

    let uploadFinished = false;
    const stream = Readable.from(mlRes.body);

    console.log("ML response content-type:", mlRes.headers.get("content-type"));
    console.log(mlRes.body);
    const cloudinaryStream = cloudinary.uploader.upload_stream(
      { folder: `user${req.user.userId}`, resource_type: "video" },
      async (error, result) => {
        if (uploadFinished) return;
        uploadFinished = true;

        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ success: false, error: error.message });
        }

        try {
          const updatedVideo = await prisma.videos.update({
            where: { id: parseInt(video_id) },
            data: { video_url: result.secure_url },
          });

          console.log("Updated video with upscaled result:", updatedVideo);
          return res.status(200).json({ success: true, video: updatedVideo });
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
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

videoRouter.post("/bgchange", authMiddleware, async (req, res) => {
  const { video_id, bg_num } = req.body;

  if (!video_id || !bg_num) {
    return res.status(400).json({ error: "Missing video_id or bg_num" });
  }

  try {
    const video = await prisma.videos.findUnique({
      where: { id: parseInt(video_id) },
    });

    if (!video || !video.video_url) {
      return res.status(404).json({ error: "Video not found." });
    }

    const endpoint = `https://2f9c40641780.ngrok-free.app/bgchange?video_url=${
      video.video_url
    }&bg_number=${bg_num.toString()}`;

    const mlRes = await fetch(endpoint, { method: "POST" });

    if (!mlRes.ok || !mlRes.body) {
      const errText = await mlRes.text();
      console.error("ML error response:", errText);
      return res.status(500).json({ error: "ML processing failed." });
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
          return res.status(500).json({ success: false, error: error.message });
        }

        try {
          const updatedVideo = await prisma.videos.update({
            where: { id: parseInt(video_id) },
            data: { video_url: result.secure_url },
          });

          return res.status(200).json({ success: true, video: updatedVideo });
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
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Set the path to the static FFmpeg binary
ffmpeg.setFfmpegPath(ffmpegStatic);

videoRouter.post("/export", async (req, res) => {
  let tmpDir;

  try {
    const clips = req.body.clips;

    if (!clips || !Array.isArray(clips) || clips.length === 0) {
      return res.status(400).json({ error: "Invalid clips data" });
    }
    console.log("clips array is: ", clips);

    tmpDir = path.join(os.tmpdir(), `export-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    console.log("Created temp directory:", tmpDir);

    const downloadedPaths = await Promise.all(
      clips.map(async (clip, i) => {
        try {
          const response = await fetch(clip.src);

          if (!response.ok) {
            throw new Error(
              `Failed to fetch clip ${i}: ${response.statusText}`
            );
          }

          const filePath = path.join(tmpDir, `clip${i}.mp4`);
          const fileStream = fs.createWriteStream(filePath);
          console.log("All downloaded!");

          await new Promise((resolve, reject) => {
            const nodeStream = Readable.fromWeb(response.body);
            nodeStream.pipe(fileStream);
            nodeStream.on("error", reject);
            fileStream.on("error", reject);
            fileStream.on("finish", resolve);
          });
          console.log("file path returned: ", filePath);
          return filePath;
        } catch (error) {
          throw new Error(`Failed to download clip ${i}: ${error.message}`);
        }
      })
    );

    const concatListPath = path.join(tmpDir, "concat.txt");

    // Convert paths to forward slashes for FFmpeg compatibility on Windows
    const concatContent = downloadedPaths
      .map((p) => {
        // Convert Windows backslashes to forward slashes and escape single quotes
        const normalizedPath = p.replace(/\\/g, "/").replace(/'/g, "'\\''");
        return `file '${normalizedPath}'`;
      })
      .join("\n");

    fs.writeFileSync(concatListPath, concatContent);
    console.log("Created concat file:", concatListPath);
    console.log("Concat file content:\n", concatContent);

    // ffmpeg concat with timeout and better error handling
    const outputPath = path.join(tmpDir, "output.mp4");

    if (!fs.existsSync(concatListPath)) {
      throw new Error(`Concat file not found: ${concatListPath}`);
    }

    // Verify all input files exist
    for (const filePath of downloadedPaths) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Input file not found: ${filePath}`);
      }
    }

    await new Promise((resolve, reject) => {
      const command = ffmpeg()
        .input(concatListPath)
        .inputOptions(["-f", "concat", "-safe", "0"])
        .outputOptions(["-c", "copy"])
        .output(outputPath)
        .on("start", (commandLine) => {
          console.log("Spawned FFmpeg with command: " + commandLine);
        })
        .on("end", () => {
          console.log("FFmpeg processing completed");
          resolve();
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          reject(new Error(`FFmpeg processing failed: ${err.message}`));
        })
        .on("progress", (progress) => {
          console.log(`Processing: ${progress.percent}% done`);
        });

      // 5min timeout to prevent hanging
      const timeout = setTimeout(() => {
        command.kill("SIGKILL");
        reject(new Error("FFmpeg processing timed out"));
      }, 300000);

      command.on("end", () => clearTimeout(timeout));
      command.on("error", () => clearTimeout(timeout));

      command.run();
    });

    if (!fs.existsSync(outputPath)) {
      throw new Error("Output file was not created");
    }

    const stats = fs.statSync(outputPath);
    if (stats.size === 0) {
      throw new Error("Output file is empty");
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="exported_video.mp4"'
    );
    res.setHeader("Content-Length", stats.size);

    const stream = fs.createReadStream(outputPath);

    stream.on("error", (err) => {
      console.error("Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream video file" });
      }
    });

    stream.on("end", () => {
      // Clean up temporary files after streaming
      setTimeout(() => {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }
      }, 1000);
    });

    stream.pipe(res);
  } catch (error) {
    console.error("Export error:", error);

    // Clean up on error
    if (tmpDir) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }

    if (!res.headersSent) {
      res.status(500).json({
        error: "Video export failed",
        message: error.message,
      });
    }
  }
});

export default videoRouter;
