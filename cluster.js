// server.js
import express from "express";
import { Cluster } from "puppeteer-cluster";
import CustomConcurrency from "./CustomConcurrency.js"; // Import the custom concurrency

const app = express();
const PORT = 3000;

app.use(express.json());

app.post("/send-messages", async (req, res) => {
  const { recipientNumbers, messageText } = req.body;

  // Initialize Puppeteer cluster with custom concurrency
  const cluster = await Cluster.launch({
    concurrency: CustomConcurrency,
    maxConcurrency: 4, // Adjust based on your system's capability
    monitor: true,
    puppeteerOptions: {
      headless: false,
    },
  });

  // Define the task to send messages
  await cluster.task(async ({ page, data: { recipientNumber, message } }) => {
    try {
      // Navigate to WhatsApp Web
      await page.goto("https://web.whatsapp.com");

      // Wait for the user to scan QR code
      await page.waitForSelector("._3j8Pd");

      // Construct the WhatsApp URL with recipient number and message
      const encodedMessage = encodeURIComponent(message);
      const url = `https://web.whatsapp.com/send?phone=${recipientNumber}&text=${encodedMessage}`;

      // Open the chat with the recipient
      await page.goto(url);

      // Wait for selectors and send message
      await page.waitForSelector(
        "#app > div > span:nth-child(3) > div > span > div > div > div > div"
      );
      await page.waitForSelector(
        "#app > div > span:nth-child(3) > div > span > div > div > div > div > div"
      );
      await page.waitForSelector("._ak1r");
      await page.keyboard.press("Enter");

      return { status: "success", message: "Message sent successfully" };
    } catch (error) {
      return { status: "error", message: error.message };
    }
  });

  // Queue tasks for each recipient number
  recipientNumbers.forEach((recipientNumber) => {
    cluster.queue({ recipientNumber, message: messageText });
  });

  // Wait for all tasks to complete
  await cluster.idle();
  await cluster.close();

  res.json({ status: "success", message: "Messages sent successfully" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
