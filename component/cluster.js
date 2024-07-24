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

      const qrCodeSelector =
        "#app > div > div.landing-wrapper > div.landing-window > div.landing-main > div > div > div._ak96 > div";
      const qrCodeElement = await page.$(qrCodeSelector); // Use page.$() to check for the element without throwing an error

      if (qrCodeElement) {
        throw new Error("WA WEB dalam keadaan belum login");
      }

      const isValidUser = await page.waitForSelector("._ak1r", {
        timeout: 8000,
      });

      if (!isValidUser) {
        throw new Error("Nomor WhatsApp tidak valid atau tidak terdaftar");
      }
      // Buat delay acak antara 15-35 detik
      const delay = Math.floor(Math.random() * 20000) + 15000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      // console.log(`Sending message to ${recipient}`);
      await page.keyboard.press("Enter");

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      return {
        status: "success",
        message: `Message sent to ${recipient.number} successfully`,
      };
    } catch (error) {
      console.log("line62", error);
      return {
        status: "error",
        message: `${error.message}`,
      };
    }
  });
};

export const addUrlsToQueue = async (messages) => {
  const results = [];
  for (const msg of messages) {
    let { recipient, message } = msg;
    const { name, number } = recipient;

    if (
      !name ||
      !number ||
      !message ||
      number.trim() === "" ||
      message.trim() === ""
    ) {
      results.push({
        recipient: { name, number },
        result: "Error: recipient name, number or message is missing or empty",
      });
      continue;
    }

    const formattedNumber = PhoneID(number);
    const encodedText = encodeURIComponent(message);
    const url = `https://web.whatsapp.com/send?phone=${formattedNumber}&text=${encodedText}`;

    // results.push({ recipient, message, result })
    const result = await cluster.execute({
      recipient: { name, number: formattedNumber },
      url,
    });
    if (result.message.includes("Waiting for selector `._ak1r` failed")) {
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
        message: result.message,
      });
    }
  }
  await cluster.idle();
  await cluster.close();

  return results;
};
