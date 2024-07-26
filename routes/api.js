import express from "express";
import OneSend from "../controllers/OneSend.js";
import rateLimit from "express-rate-limit";
import Broadcast from "../controllers/Broadcast.js";
import broadcastv2 from "../controllers/Broadcastv2.js";

const router = express.Router();

// Limit per end point
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 2 request per minute
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
 * tags:
 *   name: WhatsApp Notifications V2
 *   description: Endpoints for sending WhatsApp notifications with scheduled
 */

// /**
//  *
//  * @swagger
//  * /send-message:
//  *   post:
//  *     summary: Send a message to a single recipient
//  *     tags: [WhatsApp Notifications]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               message:
//  *                 type: string
//  *               recipient:
//  *                 type: string
//  *     responses:
//  *       '200':
//  *         description: Message sent successfully
//  *       '400':
//  *         description: Bad request
//  *       '429':
//  *         description: Too many requests
//  */
// router.post("/send-message", messageLimiter, OneSend.store);

// /**
//  * @swagger
//  * /message-status/{messageId}:
//  *   get:
//  *     summary: Check the status of Send a message to a single recipient
//  *     tags: [WhatsApp Notifications]
//  *     parameters:
//  *       - in: path
//  *         name: messageId
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: The ID of the message
//  *     responses:
//  *       '200':
//  *         description: Message sent successfully
//  *       '400':
//  *         description: Bad request
//  *       '429':
//  *         description: Too many requests
//  */
// router.get("/message-status/:messageId", (req, res) =>
//   OneSend.checkStatus(req, res)
// );

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
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     number:
 *                       type: string
 *               messageText:
 *                 type: string
 *             required:
 *               - recipients
 *               - messageText
 *     responses:
 *       '200':
 *         description: Message broadcasted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 idBroadcast:
 *                   type: string
 *                 recipients:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       number:
 *                         type: string
 *                 messageText:
 *                   type: string
 *       '400':
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       '429':
 *         description: Too many requests
 */
router.post("/broadcast", messageLimiter, Broadcast.Store);

/**
 * @swagger
 * /broadcast-status/{idBroadcast}:
 *   get:
 *     summary: Check the status of Broadcast
 *     tags: [WhatsApp Notifications]
 *     parameters:
 *       - in: path
 *         name: idBroadcast
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the message
 *     responses:
 *       '200':
 *         description: Message sent successfully
 *       '400':
 *         description: Bad request
 *       '429':
 *         description: Too many requests
 */
router.get("/broadcast-status/:idBroadcast", (req, res) =>
  Broadcast.checkStatus(req, res)
);
/**
 * @swagger
 * /v2/broadcast:
 *   post:
 *     summary: Broadcast a message to multiple recipients
 *     tags: [WhatsApp Notifications V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     number:
 *                       type: string
 *               messageText:
 *                 type: string
 *               scheduledTime:
 *                 type: string
 *                 format: date-time
 *                 description: Time the message should be sent, in WIB (ISO 8601 format)
 *             required:
 *               - recipients
 *               - messageText
 *               - scheduledTime
 *     responses:
 *       '200':
 *         description: Message broadcasted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 idBroadcast:
 *                   type: string
 *                 recipients:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       number:
 *                         type: string
 *                 messageText:
 *                   type: string
 *                 scheduledTime:
 *                   type: string
 *                   format: date-time
 *                   description: Time the message should be sent, in WIB (ISO 8601 format)
 *       '400':
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       '429':
 *         description: Too many requests
 */
router.post("/v2/broadcast", messageLimiter, broadcastv2.Store);

/**
 * @swagger
 * /v2/broadcast-status/{idBroadcast}:
 *   get:
 *     summary: Check the status of Broadcast
 *     tags: [WhatsApp Notifications V2]
 *     parameters:
 *       - in: path
 *         name: idBroadcast
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the message
 *     responses:
 *       '200':
 *         description: Message sent successfully
 *       '400':
 *         description: Bad request
 *       '429':
 *         description: Too many requests
 */
router.get("/v2/broadcast-status/:idBroadcast", (req, res) =>
  broadcastv2.checkStatus(req, res)
);
export default router;
