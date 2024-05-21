import fs from "fs";
import puppeteer from "puppeteer";
let browser;
let page;

export async function initializePuppeteer() {
  browser = await puppeteer.launch({
    headless: true, // Set headless menjadi false untuk melihat jendela browser
    userDataDir: "./userData", // Lokasi penyimpanan data pengguna (termasuk sesi)
  });
  page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
  // Cek apakah sudah ada sesi yang tersimpan
  const sessionFile = "./userData/Session.json";
  const sessionExists = fs.existsSync(sessionFile);

  // Jika ada sesi yang tersimpan, gunakan sesi tersebut
  if (sessionExists) {
    const sessionData = fs.readFileSync(sessionFile);
    const session = JSON.parse(sessionData);
    await page.evaluateOnNewDocument((session) => {
      localStorage.setItem("WABrowserId", session.WABrowserId);
      localStorage.setItem("WASecretBundle", session.WASecretBundle);
      localStorage.setItem("WAToken1", session.WAToken1);
      localStorage.setItem("WAToken2", session.WAToken2);
    }, session);
    await page.goto("https://web.whatsapp.com");
  } else {
    // Jika tidak ada sesi yang tersimpan, buka WhatsApp Web
    await page.goto("https://web.whatsapp.com");
    console.log("Scan the QR code to login");
  }
}

export async function sendMessage(recipient, message) {
  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    await page.goto(`https://web.whatsapp.com/send?phone=${recipient}`);

    // await page.waitForSelector(
    //   "#app > div > span:nth-child(3) > div > span > div > div > div > div"
    // );
    // await page.waitForSelector(
    //   "#app > div > span:nth-child(3) > div > span > div > div > div > div > div"
    // );
    await page.waitForSelector("._ak1r", { timeout: 10000 });

    await page.type("._ak1l > div:nth-child(1) > div:nth-child(1)", message);
    await page.keyboard.press("Enter");

    await new Promise((resolve) => setTimeout(resolve, 3000));

    return { status: "success", message: "Message sent successfully" };
  } catch (error) {
    if (
      error.message ===
      "Waiting for selector `._ak1r` failed: Waiting failed: 15000ms exceeded"
    ) {
      return { status: "error", message: "Nomor Tidak Valid" };
    }
    return { status: "error", message: error.message };
  }
}
