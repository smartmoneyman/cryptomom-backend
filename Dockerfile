FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY index.js ./
COPY src ./src

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "index.js"]
