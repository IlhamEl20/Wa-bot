const puppeteer = require("puppeteer");

let page;
let browser;
const recipient = "6281279407408";
const messageText = "hi cantik";

// Function to add delay
const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

(async () => {
  browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    userDataDir: "./userdata",
  });
  page = await browser.newPage();

  await page.goto("https://web.whatsapp.com");

  try {
    // Set user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );

    // Wait for the page to load and check if the login screen is present
    const loginSelector =
      "#app > div > div.landing-wrapper > div.landing-window > div.landing-main > div > div > div._ak96 > div";
    const isLoggedIn = await page
      .waitForSelector(loginSelector, { timeout: 5000 })
      .then(() => false)
      .catch(() => true);

    if (!isLoggedIn) {
      console.error({
        status: "error",
        message: "User is not logged in to WhatsApp Web",
      });
      await browser.close();
      return;
    }

    // Go to the WhatsApp chat with the specified phone number
    await page.goto(`https://web.whatsapp.com/send?phone=${recipient}`);

    // Wait for the message input field to appear
    await page.waitForSelector("._ak1r", { timeout: 10000 });

    console.log({ status: "success", message: "Form mengetik ditemukan" });
    // Type the message with a delay between each character
    await page.type(
      "._ak1l > div:nth-child(1) > div:nth-child(1)",
      messageText,
      { delay: 500 }
    );
    console.log({ status: "success", message: "Sedangkan mengetik" });

    // Add a delay before pressing "Enter"
    await delay(1000);

    // Press "Enter" to send the message
    await page.keyboard.press("Enter");

    // Wait for a few seconds to ensure the message is sent
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log({ status: "success", message: "Message sent successfully" });
  } catch (error) {
    if (
      error.message.includes("Waiting for selector `._ak1r` failed: timeout")
    ) {
      console.error({ status: "error", message: "Nomor Tidak Valid" });
    } else {
      console.error({ status: "error", message: error.message });
    }
  } finally {
    await browser.close();
  }
})();
