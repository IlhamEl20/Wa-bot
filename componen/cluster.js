import { Cluster } from "puppeteer-cluster";

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
        "#app > div > span:nth-child(3) > div > span > div > div > div > div"
      );
      await page.waitForSelector(
        "#app > div > span:nth-child(3) > div > span > div > div > div > div > div"
      );

      await page.waitForSelector("._ak1r");

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      await page.keyboard.press("Enter");

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      return {
        status: "success",
        message: `Message sent to ${nomor} successfully`,
      };
    } catch (error) {
      return { status: "error", message: error.message };
    }
  });
};

export const addUrlsToQueue = async (messages) => {
  //   console.log(messages);
  const results = [];
  for (const msg of messages) {
    const { nomor, text } = msg;
    const encodedText = encodeURIComponent(text);
    const url = `https://web.whatsapp.com/send?phone=${nomor}&text=${encodedText}`;

    const result = await cluster.queue(url);

    results.push({ nomor, result });
  }
  await cluster.idle();
  await cluster.close();

  return results;
};
