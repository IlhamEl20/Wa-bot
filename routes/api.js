import express from "express";
import OneSend from "../controllers/OneSend.js";
import rateLimit from "express-rate-limit";
import Broadcast from "../controllers/Broadcast.js";
const router = express.Router();
// Limit per end point
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 10, // Limit each IP to 10 requests per person
  message: {
    status: "error",
    message: "Too many requests to send messages, please try again later.",
  },
});

// one send message
router.post("/send-message", messageLimiter, OneSend.store);

// broadcast
router.post("/broadcast", messageLimiter, Broadcast.Store);
export default router;
