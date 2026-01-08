# Use Node.js as base
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy package.json files for both client and server
COPY package*.json ./

RUN npm i && npm run build

EXPOSE 3000 

# Start both using a simple shell command
CMD sh -c "npm run dev"
