import { Cluster } from "puppeteer-cluster";
import PhoneID from "../libraries/FromatPhone.js";
import logger from "../libraries/logger.js";

let cluster;

export const initializeCluster = async () => {
  cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 1,
    monitor: true,
    puppeteerOptions: {
      headless: true,
      defaultViewport: false,
      userDataDir: "./userData",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  cluster.on("taskerror", (err, data, willRetry) => {
    if (willRetry) {
      console.warn(
        `Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`
      );
    } else {
      console.error(`Failed to crawl ${data}: ${err.message}`);
    }
  });

  await cluster.task(async ({ page, data: { recipient, url } }) => {
    try {
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      );
      await page.goto(url);

      const isValidUser = await page.waitForSelector("._ak1r", {
        timeout: 10000,
      });
      if (!isValidUser) {
        throw new Error("Nomor WhatsApp tidak valid atau tidak terdaftar");
      }

      console.log(`Sending message to ${recipient}`);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      await page.keyboard.press("Enter");

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      return {
        status: "success",
        message: `Message sent to ${recipient} successfully`,
      };
    } catch (error) {
      console.error(`Error sending message to ${recipient}: ${error.message}`);
      return {
        status: "error",
        message: `Failed to send message to ${recipient}: ${error.message}`,
      };
    }
  });
};

export const addUrlsToQueue = async (messages) => {
  //   console.log(messages);
  const results = [];
  for (const msg of messages) {
    let { recipient, message } = msg;
    if (
      !recipient ||
      !message ||
      recipient.trim() === "" ||
      message.trim() === ""
    ) {
      results.push({
        recipient,
        result: "Error: recipient or message is missing or empty",
      });
      continue;
    }
    recipient = PhoneID(recipient);
    const encodedText = encodeURIComponent(message);
    const url = `https://web.whatsapp.com/send?phone=${recipient}&text=${encodedText}`;

    // results.push({ recipient, message, result })
    const result = await cluster.execute({ recipient, url });
    if (result.message.includes("Failed to send message to")) {
      results.push({
        recipient,
        status: "Gagal mengirim pesan karena no WA tidak terdaftar",
      });
      logger.error(`Failed to send message`, {
        sentStatus: "failed",
        recipient: recipient,
        message: message,
        error: "Gagal mengirim pesan karena no WA tidak terdaftar",
      });
    } else {
      results.push({ recipient, status: result.message });
      logger.info(`Success to send message`, {
        sentStatus: "sent",
        recipient: recipient,
        message: message,
      });
    }
  }
  await cluster.idle();
  await cluster.close();

  return results;
};
