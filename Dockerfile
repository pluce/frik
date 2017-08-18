FROM node:alpine

RUN mkdir -p /usr/src/app

ADD . /usr/src/app

WORKDIR /usr/src/app

RUN npm install --production

EXPOSE 8080
CMD [ "npm", "start" ]