import { ConcurrencyImplementation } from "puppeteer-cluster";

class CustomConcurrency extends ConcurrencyImplementation {
  constructor(cluster) {
    super(cluster);
    this.maxConcurrency = 4;
  }

  async init() {
    // Initialize any resources here if needed
  }

  async close() {
    // Clean up any resources here if needed
  }

  async workerInstance(perBrowserOptions) {
    const puppeteer = this.cluster.puppeteer;
    const options = Object.assign({}, this.cluster.options, perBrowserOptions);

    // Ensure each worker has its own userDataDir
    options.userDataDir = `./userData`;

    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    return {
      browser,
      page,
    };
  }

  async freeWorkerInstance({ browser, page }) {
    if (page) await page.close();
    if (browser) await browser.close();
  }

  async jobInstance() {
    const { page, data, taskFunction } = this.cluster.queue.shift();
    await taskFunction({ page, data });
  }
}

module.exports = CustomConcurrency;
