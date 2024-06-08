import express from "express";
import OneSend from "../controllers/OneSend.js";
import rateLimit from "express-rate-limit";
import Broadcast from "../controllers/Broadcast.js";

const router = express.Router();

// Limit per end point
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1, // Limit each IP to 1 request per minute
  message: {
    status: "error",
    message: "Too many requests to send messages, please try again later.",
  },
});
/**
 * @swagger
 * tags:
 *   name: WhatsApp Notifications
 *   description: Endpoints for sending WhatsApp notifications
 */
/**
 * @swagger
 * /send-message:
 *   post:
 *     summary: Send a message to a single recipient
 *     tags: [WhatsApp Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               recipient:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Message sent successfully
 *       '400':
 *         description: Bad request
 *       '429':
 *         description: Too many requests
 */
router.post("/send-message", messageLimiter, OneSend.store);

/**
 * @swagger
 * /broadcast:
 *   post:
 *     summary: Broadcast a message to multiple recipients
 *     tags: [WhatsApp Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipientNumbers:
 *                 type: array
 *                 items:
 *                   type: string
 *               messageText:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Message broadcasted successfully
 *       '400':
 *         description: Bad request
 *       '429':
 *         description: Too many requests
 */
router.post("/broadcast", messageLimiter, Broadcast.Store);

export default router;
