import express from "express";
import Busboy from "busboy";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import authMiddleware from "../middlewares/auth.middleware.js";
import { Readable } from "stream";
const prisma = new PrismaClient();
const videoRouter = express.Router();
import fs from "fs";
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
    console.log(" NEW PROJECT", newProject);
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

  let uploadHandled = false; // prevents multiple .on("file") triggers

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
videoRouter.post("/edited-upload", authMiddleware, (req, res) => {
  console.log("IN EDITED UPLOAD");

  const busboy = Busboy({ headers: req.headers });
  const user_id = parseInt(req.user.userId);
  const project_id = parseInt(req.query.project_id);
  const video_id = parseInt(req.query.video_id);

  if (!user_id || !project_id) {
    return res.status(400).json({ error: "Missing user_id or project_id" });
  }

  let uploadFinished = false;
  let uploadHandled = false;

  busboy.on("file", (fieldname, fileStream, fileInfo) => {
    if (uploadHandled) return;
    uploadHandled = true;

    const { filename, encoding, mimeType } = fileInfo;

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
            edited_url: result.secure_url,
            video_id,
          };

          console.log("Saving edited video to DB:", videoData);

          const newVideo = await prisma.edited.create({ data: videoData });

          return res.status(200).json({ success: true, editedVideo: newVideo });
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
      return res.status(400).json({ error: "No video file uploaded" });
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
        "https://4bc3-35-197-18-55.ngrok-free.app/process/",
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
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", 'inline; filename="processed.mp4"');
      const stream = Readable.from(response.body);
      console.log(JSON.stringify(response));
      stream.pipe(res);
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

    // Example: Fetch video URL from DB using Prisma or any other ORM
    const video = await prisma.videos.findUnique({
      where: { id: video_id },
    });

    if (!video || !video.video_url) {
      return res.status(404).json({ error: "Video not found." });
    }

    // Prepare form data for FastAPI
    const formData = new URLSearchParams();
    formData.append("video_url", video.video_url);
    formData.append("x", x_coord);
    formData.append("y", y_coord);
    formData.append("frame", frame);

    console.log("SENT TO ML MODEL ", video.video_url);
    // Send POST request to FastAPI
    const mlRes = await fetch(
      "https://50fd-35-185-240-43.ngrok-free.app/remove/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    if (!mlRes.ok) {
      console.log(mlRes);
      const errText = await mlRes.text();
      console.error("ML error response:", errText);
      return res.status(500).json({ error: "ML processing failed." });
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", "inline; filename=denoised.mp4");

    const stream = Readable.from(mlRes.body);
    stream.pipe(res);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

videoRouter.post("/denoise", authMiddleware, async (req, res) => {
  const { video_url, volume, gen_sub } = req.body;

  if (!video_url) {
    return res.status(400).json({ error: "Missing video_url" });
  }

  try {
    const mlServerURL = "https://bf75-34-171-76-72.ngrok-free.app/denoise";
    const formData = new URLSearchParams();
    formData.append("video_url", video_url);
    formData.append("volume", volume || "50");
    formData.append("gen_sub", gen_sub ? "true" : "false");

    const mlRes = await fetch(mlServerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!mlRes.ok) {
      const errText = await mlRes.text();
      console.error("ML error response:", errText);
      return res.status(500).send("ML processing failed.");
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", "inline; filename=denoised.mp4");

    const stream = Readable.from(mlRes.body);
    stream.pipe(res);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

videoRouter.post("/stylize", authMiddleware, async (req, res) => {
  const { video_id, style_id } = req.body;

  // Example: Fetch video URL from DB using Prisma or any other ORM
  const video = await prisma.videos.findUnique({
    where: { id: video_id },
  });

  if (!video || !video.video_url) {
    return res.status(404).json({ error: "Video not found." });
  }
  const video_url = video.video_url;

  const formData = new URLSearchParams();
  formData.append("video_url", video_url);
  formData.append("style_num", parseInt(style_id).toString());

  try {
    console.log(
      "Sending request to ML server for stylization with params",
      video_url,
      style_id
    );
    const mlRes = await fetch(
      "https://6d50-34-87-185-237.ngrok-free.app/stylize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    if (!mlRes.ok) {
      const errText = await mlRes.text();
      console.error("ML error response:", errText);
      return res.status(500).send("ML processing failed.");
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", "inline; filename=stylized.mp4");
    console.log("RESPONSE RECIEVED 1");
    const stream = Readable.from(mlRes.body);
    console.log("RESPONSE RECIEVED 2");
    stream.pipe(res);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default videoRouter;
