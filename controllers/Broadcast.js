import { Cluster } from "puppeteer-cluster";
import { addUrlsToQueue } from "../component/cluster.js";
import PQueue from "p-queue";

let BroadCastList = [];
const messageQueue = new PQueue({ concurrency: 1 });
class BroadCast {
  async Store(req, res) {
    const { recipientNumbers, messageText } = req.body;
    // console.log(messages);
    if (
      !recipientNumbers ||
      !Array.isArray(recipientNumbers) ||
      recipientNumbers.length === 0
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Invalid input. 'recipientNumbers' should be a non-empty array.",
      });
    }

    // Validasi messageText
    if (!messageText || typeof messageText !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Invalid input. 'messageText' should be a non-empty string.",
      });
    }
    const messages = recipientNumbers.map((recipient) => ({
      recipient,
      message: messageText,
    }));

    BroadCastList.push({ messages });
    console.log(BroadCastList);

    // Process the messages in the queue
    messageQueue.add(async () => {
      const { messages } = BroadCastList.shift();
      try {
        const results = await addUrlsToQueue(messages);
        res.json({ status: "success", message: messageText, results });
      } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
      }
    });
  }
}
export default new BroadCast();
