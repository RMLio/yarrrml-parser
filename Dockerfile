FROM node:12-alpine

WORKDIR /app

RUN npm i -g @rmlio/yarrrml-parser

ENTRYPOINT ["yarrrml-parser"]
CMD ["-h"]
