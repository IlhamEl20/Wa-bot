import { Cluster } from "puppeteer-cluster";
import { addUrlsToQueue } from "../componen/cluster.js";

class BroadCast {
  async Store(req, res) {
    const { messages } = req.body;
    // console.log(messages);
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid input. 'messages' should be an array.",
      });
    }

    try {
      const results = await addUrlsToQueue(messages);
      res.json({ status: "success", results });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
}
export default new BroadCast();
