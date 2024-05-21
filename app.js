import express from "express";
import "dotenv/config";
import apiRouter from "./routes/api.js";
import fs from "fs";
import { initializePuppeteer } from "./component/sendMessage.js";
import rateLimit from "express-rate-limit";
import { initializeCluster } from "./component/cluster.js";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// limit all request
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests
  message: {
    status: "error",
    message: "Too many requests, please try again later.",
  },
});
app.use(limiter);

//one send one
initializePuppeteer();

//broadcast
// initializeCluster();

// Route to send message
app.use("/", apiRouter);
// Fungsi untuk mengirim pesan menggunakan Puppeteer
app.use((req, res) => {
  res.status(404).json({ message: "404 NOT FOUND" });
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
