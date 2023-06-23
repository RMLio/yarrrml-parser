FROM node:18-alpine

WORKDIR /app

ADD . .

RUN npm ci

ENTRYPOINT ["node", "/app/bin/parser.js"]
CMD ["-h"]
