import { Cluster } from "puppeteer-cluster";
import PhoneID from "../libraries/FromatPhone.js";
import logger from "../libraries/logger.js";
import { timeout } from "puppeteer";

let cluster;

export const initializeCluster = async () => {
  cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 1,
    monitor: true,
    timeout: 180000, // Set timeout for cluster (3 minutes)
    puppeteerOptions: {
      timeout: 80000,
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
      // Set default timeout for all operations on this page
      const defaultTimeout = parseInt(process.env.DEFAULT_TIMEOUT) || 80000; // Default 60 seconds
      page.setDefaultTimeout(defaultTimeout);
      page.setDefaultNavigationTimeout(defaultTimeout);
      // console.log(page.getDefaultTimeout());
      // console.log(`Default Timeout: ${page._timeoutSettings._defaultTimeout}`);
      // console.log(
      //   `Default Navigation Timeout: ${page._timeoutSettings._defaultNavigationTimeout}`
      // );
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      );
      await page.goto(url);

      const qrCodeSelector =
        "#app > div > div.landing-wrapper > div.landing-window > div.landing-main > div > div > div._ak96 > div";
      const qrCodeElement = await page.$(qrCodeSelector);

      if (qrCodeElement) {
        throw new Error("WA WEB dalam keadaan belum login");
      }

      const maxRetries = 3; // Number of retries
      const retryDelay = 5000; // Delay between retries in milliseconds (5 seconds)
      let isValidUser = null;

      for (let i = 0; i < maxRetries; i++) {
        try {
          isValidUser = await page.waitForSelector("._ak1r", {
            timeout: 16000,
          });
          if (isValidUser) {
            break; // Break the loop if the selector is found
          }
        } catch (err) {
          console.log(`Attempt ${i + 1} failed. Retrying...`);
          if (i < maxRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay)); // Wait before retrying
          } else {
            throw new Error(
              "Selector '._ak1r' not found after maximum retries"
            );
          }
        }
      }

      // const isValidUser = await page.waitForSelector("._ak1r", {
      //   timeout: 16000,
      // });

      // if (!isValidUser) {
      //   throw new Error("Nomor WhatsApp tidak valid atau tidak terdaftar");
      // }

      const minDelay = parseInt(process.env.MIN_DELAY) || 20000;
      const maxDelay = parseInt(process.env.MAX_DELAY) || 40000;
      const delay =
        Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
      console.log(
        `Menunggu selama ${
          delay / 1000
        } detik sebelum mengirim pesan berikutnya...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));

      if (!page.isClosed()) {
        await page.keyboard.press("Enter");
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

        return {
          status: "success",
          message: `Message sent to ${recipient.number} successfully`,
        };
      } else {
        throw new Error("Page has been closed unexpectedly.");
      }
    } catch (error) {
      console.log(error);
      console.log("Error in cluster task:", error.message);
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

    const formattedNumber = await PhoneID(number);
    const encodedText = encodeURIComponent(message);
    const url = `https://web.whatsapp.com/send?phone=${formattedNumber}&text=${encodedText}`;

    // results.push({ recipient, message, result })
    const result = await cluster.execute({
      recipient: { name, number: formattedNumber },
      url,
    });
    console.log(result);
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
    }
    if (
      result.message.includes(
        "Selector '._ak1r' not found after maximum retries"
      )
    ) {
      results.push({
        recipient,
        status: "Gagal mengirim pesan karena no WA tidak terdaftar",
      });
      logger.error(`Failed to send message`, {
        sentStatus: "failed",
        recipient: recipient,
        message: message,
        error:
          "Gagal mengirim pesan karena no WA tidak terdaftar, saat 3x pengiriman",
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
