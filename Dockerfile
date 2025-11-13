# Use official Node.js image with Chromium pre-installed
FROM ghcr.io/puppeteer/puppeteer:23.11.1

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
