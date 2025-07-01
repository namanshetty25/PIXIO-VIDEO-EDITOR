import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
// import base64url from "base64url";
// import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import authMiddleware from "../middlewares/auth.middleware.js";

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET_KEY;
const userRouter = Router();
const prisma = new PrismaClient();

userRouter.post("/signup", async (req, res) => {
  const username = req.body["username"];
  const email = req.body["email"];
  const password = req.body["password"];
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.users.create({
      data: {
        username: username,
        email: email,
        password: hashedPassword,
      },
    });
    res.status(201).json({ message: "User added" });
  } catch (e) {
    console.error(e);
  }
});

userRouter.put("/modifyUser", authMiddleware, async (req, res) => {
  try {
    const { id, username, email } = req.body;

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (id !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (username) {
      const existingUsername = await prisma.users.findUnique({
        where: { username },
      });
      if (existingUsername && existingUsername.id !== Number(id)) {
        return res.status(400).json({ error: "Username is already in use" });
      }
    }

    if (email) {
      const existingEmail = await prisma.users.findUnique({ where: { email } });
      if (existingEmail && existingEmail.id !== Number(id)) {
        return res.status(400).json({ error: "Email is already in use" });
      }
    }

    const updatedData = {
      ...(username && { username }),
      ...(email && { email }),
    };

    if (Object.keys(updatedData).length === 0) {
      return res
        .status(400)
        .json({ error: "No valid fields provided for update." });
    }

    const updatedUser = await prisma.users.update({
      where: { id: Number(id) },
      data: updatedData,
    });

    res.json({ message: "User updated successfully", updatedUser });
  } catch (error) {
    console.error("Error updating user: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

userRouter.post("/login", async (req, res) => {
  const email = req.body["email"];
  const password = req.body["password"];
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.users.findUnique({
    where: { email: email },
  });
  if (!user) {
    return res.status(401).json({ message: "User doesn't exist" });
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: "Incorrect password" });
  }
  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
    },
    SECRET_KEY,
    {
      expiresIn: "1h",
    }
  );

  res.json({ message: "Login successful", token });
});

userRouter.get("/profile", authMiddleware, async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized", token });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await prisma.users.findUnique({
      where: { username: decoded.username, email: decoded.email },
    });
    if (user.id !== req.user.userId) {
      res.json({ error: "Access Denied" });
    }
    res.json(JSON.parse(JSON.stringify({ user: user, message: "User found" })));
  } catch (e) {
    console.error(e);
  }
});

export default userRouter;
