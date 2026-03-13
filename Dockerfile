FROM node:20-alpine

# Install iputils for ping support
RUN apk add --no-cache iputils

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

# Run as non-root but ping needs cap_net_raw
USER node

CMD ["node", "src/server.js"]
