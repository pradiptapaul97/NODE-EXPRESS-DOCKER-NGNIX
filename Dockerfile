# Use official Node.js 18 on lightweight Alpine Linux as the base image
FROM node:18-alpine

# Set /app as the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json into the container first (for layer caching)
COPY package*.json ./

# Install all dependencies defined in package.json
RUN npm install

# Copy the application source code into the container
COPY server.js .

# Command to run when the container starts
CMD ["node", "server.js"]
