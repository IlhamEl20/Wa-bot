import express from "express";
import puppeteer from "puppeteer";
import Queue from "bull";
import PQueue from "p-queue";
import { Cluster } from "puppeteer-cluster";
import fs from "fs";

const app = express();
const PORT = 3000;
let browser, page;
let messageList = [];
const messageQueue = [];

const recipientNumber = "6281279407408"; // Nomor yang salah
const messageText = "hi ni pesan 2";
const encodedMessage = encodeURIComponent(messageText);

const urls = [
  `https://web.whatsapp.com/send?phone=${recipientNumber}&text=${encodedMessage}`, // Nomor salah
  `https://web.whatsapp.com/send?phone=${recipientNumber}&text=${encodedMessage}`, // Nomor benar 2
];

app.use(express.json());

const cluster = await Cluster.launch({
  concurrency: Cluster.CONCURRENCY_PAGE,
  maxConcurrency: 1,
  monitor: true,
  puppeteerOptions: {
    headless: true,
    defaultViewport: false,
    userDataDir: "./userData",
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
await cluster.task(async ({ page, data: url }) => {
  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    await page.goto(url);

    await page.waitForSelector(
      "#app > div > span:nth-child(3) > div > span > div > div > div > div",
      { timeout: 500 }
    );
    await page.waitForSelector(
      "#app > div > span:nth-child(3) > div > span > div > div > div > div > div",
      { timeout: 500 }
    );

    await page.waitForSelector("._ak1r");

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Misalnya tunggu 8 detik

    await page.keyboard.press("Enter");

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Misalnya tunggu 8 detik

    return { status: "success", message: "Message sent successfully" };
    // }
  } catch (error) {
    return { status: "error", message: error.message };
  }
});
for (const url of urls) {
  await cluster.queue(url);
}

await cluster.idle();
await cluster.close();
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
