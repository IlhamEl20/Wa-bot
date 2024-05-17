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
const messageText = "pesan1 ni";
const encodedMessage = encodeURIComponent(messageText);

const urls = [
  `https://web.whatsapp.com/send?phone=${recipientNumber}&text=${encodedMessage}`, // Nomor salah
  `https://web.whatsapp.com/send?phone=${recipientNumber}&text=${encodedMessage}`, // Nomor benar 2
];
console.log(urls);

// (async () => {
//   browser = await puppeteer.launch({
//     headless: false,
//     userDataDir: "./userData",
//   });
//   page = await browser.newPage();

//   const sessionFile = "./userData/Session.json";
//   const sessionExists = fs.existsSync(sessionFile);

//   if (sessionExists) {
//     const sessionData = fs.readFileSync(sessionFile);
//     const session = JSON.parse(sessionData);
//     await page.evaluateOnNewDocument((session) => {
//       localStorage.setItem("WABrowserId", session.WABrowserId);
//       localStorage.setItem("WASecretBundle", session.WASecretBundle);
//       localStorage.setItem("WAToken1", session.WAToken1);
//       localStorage.setItem("WAToken2", session.WAToken2);
//     }, session);
//   } else {
//     await page.goto("https://web.whatsapp.com");
//     console.log("Scan the QR code to login");
//   }

//   browser.on("disconnected", () => {
//     const session = {
//       WABrowserId: localStorage.getItem("WABrowserId"),
//       WASecretBundle: localStorage.getItem("WASecretBundle"),
//       WAToken1: localStorage.getItem("WAToken1"),
//       WAToken2: localStorage.getItem("WAToken2"),
//     };
//     fs.writeFileSync(sessionFile, JSON.stringify(session));
//   });
// })();

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
    // await page.waitForSelector(".xuk3077"); // Menunggu tombol muncul
    // await new Promise((resolve) => setTimeout(resolve, 2000)); // Misalnya tunggu 8 detik

    // const button = await page.click(".xuk3077 > button:nth-child(1)"); // Klik tombol
    // await new Promise((resolve) => setTimeout(resolve, 2000)); // Misalnya tunggu 8 detik

    // if (!button) {
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
