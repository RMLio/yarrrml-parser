FROM node:12-alpine

WORKDIR /app

ADD . .

RUN npm install -g .

ENTRYPOINT ["yarrrml-parser"]
CMD ["-h"]
