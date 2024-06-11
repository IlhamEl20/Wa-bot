import express from "express";
import "dotenv/config";
import apiRouter from "./routes/api.js";
import { initializePuppeteer } from "./component/sendMessage.js";
import rateLimit from "express-rate-limit";
import { initializeCluster } from "./component/cluster.js";
import swaggerSpec from "./swagger.js";
import swaggerUi from "swagger-ui-express";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
// const running =
//   process.env.RUNNING === "1" ? initializePuppeteer : initializeCluster();
// app.set("trust proxy", true);

app.set("trust proxy", [
  "loopback",
  "linklocal",
  "uniquelocal",
  "192.168.0.255",
]);
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

// //broadcast
// initializeCluster();
// (async () => {
//   try {
//     await running();
//   } catch (error) {
//     console.error("Error executing the function:", error);
//   }
// })();
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
