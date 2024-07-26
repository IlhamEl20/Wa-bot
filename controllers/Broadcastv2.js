import { Cluster } from "puppeteer-cluster";
import { addUrlsToQueue } from "../component/cluster.js";
import PQueue from "p-queue";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

// Extend dayjs with the necessary plugins
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone to WIB (Western Indonesian Time)
const WIB = "Asia/Jakarta";

let BroadCastList = [];
const broadcastStatus = {}; // Object to store the status of broadcasts
const messageQueue = new PQueue({ concurrency: 1 });

class BroadCastV2 {
  async Store(req, res) {
    const { recipients, messageText, scheduledTime } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid input. 'recipients' should be a non-empty array.",
      });
    }

    if (!messageText || typeof messageText !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Invalid input. 'messageText' should be a non-empty string.",
      });
    }

    const messageLengthInBytes = Buffer.byteLength(messageText, "utf-8");
    if (messageLengthInBytes > 500) {
      return res.status(400).json({
        status: "error",
        message: "Message cannot exceed 500 characters",
      });
    }

    // Validate scheduledTime
    let scheduleDate;
    if (scheduledTime === "now") {
      scheduleDate = dayjs().tz(WIB);
    } else {
      scheduleDate = dayjs(scheduledTime);
      if (!scheduleDate.isValid()) {
        return res.status(400).json({
          status: "error",
          message:
            "Invalid input. 'scheduledTime' should be 'now' or a valid date-time string.",
        });
      }
    }

    const idBroadcast = uuidv4(); // Generate a unique ID for the broadcast
    const messages = recipients.map(({ name, number }) => ({
      recipient: { name, number },
      message: messageText,
    }));

    BroadCastList.push({
      idBroadcast,
      messages,
      scheduledTime: scheduleDate.format(), // Store the scheduled time as a formatted string
    });
    broadcastStatus[idBroadcast] = {
      status: "queued",
      messages,
      scheduledTime: scheduleDate.format(), // Initialize status with the formatted string
    }; // Initialize status
    console.log(JSON.stringify(BroadCastList, null, 2));

    // Respond immediately with the broadcast ID and input details
    res.json({
      status: "success",
      idBroadcast,
      recipients,
      messageText,
      scheduledTime: scheduleDate.format(), // Respond with the original input format
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

  // Function to check and process scheduled broadcasts
  checkScheduledBroadcasts() {
    const now = dayjs().tz(WIB);

    for (const broadcast of BroadCastList) {
      if (
        dayjs(broadcast.scheduledTime).tz(WIB).isBefore(now) ||
        dayjs(broadcast.scheduledTime).tz(WIB).isSame(now)
      ) {
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
    }
  }
}

const broadcastv2 = new BroadCastV2();

// Schedule the check function to run periodically (e.g., every minute)
setInterval(() => {
  broadcastv2.checkScheduledBroadcasts();
}, 60000); // 60000 milliseconds = 1 minute

export default broadcastv2;
