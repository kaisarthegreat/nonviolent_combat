FROM node:20-alpine

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy application source
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server accessible from host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
