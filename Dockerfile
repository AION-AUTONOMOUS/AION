FROM node:24-bookworm

WORKDIR /app

COPY package*.json ./
RUN node --version && command -v node
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production

CMD ["node", "railway-aion-server.js"]
