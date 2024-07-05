import { Cluster } from "puppeteer-cluster";
import { addUrlsToQueue } from "../component/cluster.js";
import PQueue from "p-queue";
import { v4 as uuidv4 } from "uuid";

let BroadCastList = [];
const broadcastStatus = {}; // Object to store the status of broadcasts
const messageQueue = new PQueue({ concurrency: 1 });

class BroadCast {
  async Store(req, res) {
    const { recipients, messageText } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid input. 'recipients' should be a non-empty array.",
      });
    }

    // Validate messageText
    if (!messageText || typeof messageText !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Invalid input. 'messageText' should be a non-empty string.",
      });
    }
    const messageLengthInBytes = Buffer.byteLength(messageText, "utf-8");
    if (messageLengthInBytes > 500) {
      // Jika panjang message dalam byte melebihi 500 byte, kirim respons dengan pesan error
      return res.status(400).json({
        status: "error",
        message: "Message cannot exceed 500 character",
      });
    }
    const idBroadcast = uuidv4(); // Generate a unique ID for the broadcast
    const messages = recipients.map(({ name, number }) => ({
      recipient: { name, number },
      message: messageText,
    }));

    BroadCastList.push({ idBroadcast, messages });
    broadcastStatus[idBroadcast] = { status: "queued", messages }; // Initialize status
    console.log(JSON.stringify(BroadCastList, null, 2));

    // Respond immediately with the broadcast ID and input details
    res.json({
      status: "success",
      idBroadcast,
      recipients,
      messageText,
    });

    // Process the messages in the queue asynchronously
    messageQueue.add(async () => {
      const { idBroadcast, messages } = BroadCastList.shift();
      broadcastStatus[idBroadcast].status = "processing";

      try {
        const results = await addUrlsToQueue(messages);
        broadcastStatus[idBroadcast].status = "completed";
        broadcastStatus[idBroadcast].results = results;
      } catch (error) {
        broadcastStatus[idBroadcast].status = "failed";
        broadcastStatus[idBroadcast].error = error.message;
      }
    });
  }

  async checkStatus(req, res) {
    const { idBroadcast } = req.params;
    const status = broadcastStatus[idBroadcast];

    if (status) {
      res.json({
        status: "success",
        broadcastStatus: status,
      });
    } else {
      res.status(404).json({
        status: "error",
        message: "Broadcast not found",
      });
    }
  }
}

export default new BroadCast();
