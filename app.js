import express from "express";
import "dotenv/config";
import apiRouter from "./routes/api.js";
import { initializePuppeteer } from "./component/sendMessage.js";
import rateLimit from "express-rate-limit";
import { initializeCluster } from "./component/cluster.js";
import swaggerSpec from "./swagger.js";
import swaggerUi from "swagger-ui-express";
import ipLogger from "./libraries/loggerIP.js";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// const running =
//   process.env.RUNNING === "1" ? initializePuppeteer : initializeCluster();

app.set("trust proxy", process.env.TRUST_PROXY.split(","));

// limit all request
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 100 requests
  message: {
    status: "error",
    message: "Too many requests, please try again later.",
  },
});
app.use(limiter);
//one send one
// initializePuppeteer();

// //broadcast
initializeCluster();
// panggi puppeteer
// (async () => {
//   try {
//     await running();
//   } catch (error) {
//     console.error("Error executing the function:", error);
//   }
// })();

// Use app.all to log IP and accessed endpoint for all routes
app.all(["/broadcast", "/broadcast-status*"], (req, res, next) => {
  console.log("Logging middleware hit for:", req.originalUrl); // Debug log
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const endpoint = req.originalUrl;
  const method = req.method;
  const payload = req.body;
  ipLogger.info(
    `IP: ${ip} accessed Endpoint: ${endpoint} with Method: ${method} Payload: ${JSON.stringify(
      payload
    )}`
  );
  next();
});
// Route to send message
app.use("/", apiRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Fungsi untuk mengirim pesan menggunakan Puppeteer
app.use((req, res) => {
  res.status(404).json({ message: "404 NOT FOUND" });
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
