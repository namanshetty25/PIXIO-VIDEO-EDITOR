import express from "express";
import cookieParser from "cookie-parser";
import userRouter from "./routers/userRouter.js";
import videoRouter from "./routers/videoRouter.js";
import cors from "cors";

const app = express();
const port = 3000;
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "100mb" }));
app.use("/user", userRouter);
app.use("/video", videoRouter);

app.listen(port, () => {
  console.log(`Server connected on port ${port}...`);
});
