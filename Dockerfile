# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Expose port (if your script uses a server, adjust accordingly)
EXPOSE 5000

# Command to run your script
CMD ["npm", "start"]
