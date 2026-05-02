# 24 es la versión de node, alpine es una imagen ligera de linux, y 3.23 es la versión de alpine
FROM node:24-alpine3.23

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3004