import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET_KEY;

async function authMiddleware(req, res, next) {
  try {
    console.log("IN AUTH MIDDLEWARE");
    const authHeaders = req.headers.authorization;
    if (!authHeaders || !authHeaders.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Invalid token sent" });
    } else {
      const decoded = jwt.verify(authHeaders.split(" ")[1], SECRET_KEY);
      req.user = decoded;
      console.log("AUTH MIDDLEWARE SENT: ", req.user);

      next();
    }
  } catch (e) {
    console.log(e);
    return res.status(401).json({ message: e.message });
  }
}

export default authMiddleware;
