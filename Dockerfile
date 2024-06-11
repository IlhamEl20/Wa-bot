FROM node:18-slim

# Set working directory
WORKDIR /app

# Install Chrome and other dependencies required by Puppeteer
RUN apt-get update \
    && apt-get install -y wget gnupg vim \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy all files and folders from the current directory to /app in the container
COPY . /app
RUN chmod +x /app/npmStart.sh
# Install npm dependencies
RUN npm install

# Default command to run in the Docker container
CMD ["./npmStart.sh"]

