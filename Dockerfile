# Use an official Node runtime as a parent image
FROM node:14

# Install Ghostscript
RUN apt-get update && apt-get install -y ghostscript

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose the port the app runs on
EXPOSE 9000

# Define the command to run the app
CMD ["node", "index.js"]
