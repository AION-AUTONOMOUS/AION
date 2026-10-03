FROM node:24-bookworm

WORKDIR /app

COPY package*.json ./
RUN node --version && command -v node && test -x /usr/local/bin/node
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production

CMD ["/usr/local/bin/node", "railway-aion-server.js"]
